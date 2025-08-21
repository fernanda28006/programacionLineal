export interface LinearProgrammingProblem {
  type: "maximize" | "minimize"
  objectiveFunction: {
    coefficients: number[]
    variables: string[]
    expression: string
  }
  constraints: Array<{
    coefficients: number[]
    operator: "≤" | "≥" | "="
    rhs: number
    expression: string
  }>
  variables: string[]
  nonNegativityConstraints: string[]
}

export class NLPParser {
  private static instance: NLPParser

  static getInstance(): NLPParser {
    if (!NLPParser.instance) {
      NLPParser.instance = new NLPParser()
    }
    return NLPParser.instance
  }

  async parseProblem(ocrText: string): Promise<LinearProgrammingProblem> {
    // Simulate NLP processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const cleanText = this.preprocessText(ocrText)
    const lines = cleanText.split("\n").filter((line) => line.trim())

    const hasObjective = lines.some(
      (line) => line.includes("MAXIMIZE") || line.includes("MINIMIZE"),
    )
    if (!hasObjective) {
      const costIndex = lines.findIndex((line) =>
        /Costos por trabajador:/i.test(line),
      )
      if (costIndex !== -1) {
        const terms: string[] = []
        for (let i = costIndex + 1; i < lines.length; i++) {
          const match = lines[i].match(/([xy]\d*)\s*=\s*\$?(\d+(?:\.\d+)?)/i)
          if (!match) break
          const [, variable, cost] = match
          terms.push(`${cost}${variable}`)
        }
        if (terms.length > 0) {
          lines.push(`MINIMIZE Z = ${terms.join(" + ")}`)
        }
      }
    }

    // Extract problem type and objective function
    const { type, objectiveFunction } = this.extractObjectiveFunction(lines)

    // Extract constraints
    const constraints = this.extractConstraints(lines)

    // Extract variables
    const variables = this.extractVariables(lines, objectiveFunction, constraints)

    // Extract non-negativity constraints
    const nonNegativityConstraints = this.extractNonNegativityConstraints(lines)

    return {
      type,
      objectiveFunction,
      constraints,
      variables,
      nonNegativityConstraints,
    }
  }

  private preprocessText(text: string): string {
    return text
      .replace(/[Mm]aximizar?|[Mm]aximize/gi, "MAXIMIZE")
      .replace(/[Mm]inimizar?|[Mm]inimize/gi, "MINIMIZE")
      .replace(/[Ss]ujeto\s+a:?|[Ss]ubject\s+to:?|[Rr]estricciones:?|[Cc]onstraints:?/gi, "SUBJECT_TO")
      .replace(/≤/g, "<=")
      .replace(/≥/g, ">=")
      .replace(/₁/g, "1")
      .replace(/₂/g, "2")
      .replace(/₃/g, "3")
      .replace(/₄/g, "4")
      .replace(/₅/g, "5")
  }

  private extractObjectiveFunction(lines: string[]): {
    type: "maximize" | "minimize"
    objectiveFunction: LinearProgrammingProblem["objectiveFunction"]
  } {
    const objectiveLine = lines.find((line) => line.includes("MAXIMIZE") || line.includes("MINIMIZE"))

    if (!objectiveLine) {
      throw new Error("No se pudo encontrar la función objetivo")
    }

    const type = objectiveLine.includes("MAXIMIZE") ? "maximize" : "minimize"

    // Extract the expression after Z = or similar
    const match = objectiveLine.match(/Z\s*=\s*(.+)/)
    if (!match) {
      throw new Error("No se pudo extraer la función objetivo")
    }

    const expression = match[1].trim()
    const { coefficients, variables } = this.parseExpression(expression)

    return {
      type,
      objectiveFunction: {
        coefficients,
        variables,
        expression,
      },
    }
  }

  private extractConstraints(lines: string[]): LinearProgrammingProblem["constraints"] {
    const constraints: LinearProgrammingProblem["constraints"] = []

    let inConstraints = false
    for (const line of lines) {
      if (line.includes("SUBJECT_TO")) {
        inConstraints = true
        continue
      }

      if (!inConstraints) continue

      // Skip non-negativity constraints
      if (
        line.match(
          /([a-zA-Z][a-zA-Z0-9]*\s*,\s*[a-zA-Z][a-zA-Z0-9]*\s*≥\s*0|[a-zA-Z][a-zA-Z0-9]*\s*≥\s*0)/,
        )
      )
        continue

      // Parse constraint allowing expressions on both sides
      const constraintMatch = line.match(/(.+?)\s*(<=|>=|=)\s*(.+)/)
      if (constraintMatch) {
        const [, leftSide, operator, rightSide] = constraintMatch

        // Parse both sides of the inequality
        const left = this.parseExpression(leftSide.trim())
        const right = this.parseExpression(rightSide.trim())
        const leftConst = this.parseConstant(leftSide.trim())
        const rightConst = this.parseConstant(rightSide.trim())

        // Combine coefficients moving all terms to the left side
        const coeffMap = new Map<string, number>()
        const variableOrder: string[] = []

        left.variables.forEach((v, i) => {
          coeffMap.set(v, (coeffMap.get(v) || 0) + left.coefficients[i])
          if (!variableOrder.includes(v)) variableOrder.push(v)
        })

        right.variables.forEach((v, i) => {
          coeffMap.set(v, (coeffMap.get(v) || 0) - right.coefficients[i])
          if (!variableOrder.includes(v)) variableOrder.push(v)
        })

        const coefficients = variableOrder.map((v) => coeffMap.get(v) || 0)
        const constantDiff = leftConst - rightConst
        const rhs = -constantDiff

        // Build normalized expression string (all terms on left)
        const terms: string[] = []
        variableOrder.forEach((v) => {
          const coeff = coeffMap.get(v) || 0
          if (coeff === 0) return
          if (coeff === 1) terms.push(v)
          else if (coeff === -1) terms.push(`-${v}`)
          else terms.push(`${coeff}${v}`)
        })

        if (constantDiff !== 0) terms.push(constantDiff.toString())

        let normalizedLeft = "0"
        if (terms.length > 0) {
          normalizedLeft = terms[0]
          for (let i = 1; i < terms.length; i++) {
            normalizedLeft += terms[i].startsWith("-") ? ` ${terms[i]}` : ` + ${terms[i]}`
          }
        }

        let op: "≤" | "≥" | "=" = "="
        if (operator === "<=") op = "≤"
        else if (operator === ">=") op = "≥"

        constraints.push({
          coefficients,
          operator: op,
          rhs,
          expression: `${normalizedLeft} ${operator} 0`,
        })
      }
    }

    return constraints
  }

  private parseConstant(expression: string): number {
    const terms = expression.split(/(?=[+-])/).filter((term) => term.trim())
    let constant = 0
    for (const term of terms) {
      if (/[a-zA-Z]/.test(term)) continue
      const value = Number.parseFloat(term)
      if (!Number.isNaN(value)) constant += value
    }
    return constant
  }

  private parseExpression(expression: string): { coefficients: number[]; variables: string[] } {
    const terms = expression.split(/(?=[+-])/).filter((term) => term.trim())
    const coefficients: number[] = []
    const variables: string[] = []

    for (const term of terms) {
      const match = term.match(
        /([+-]?\d*(?:\.\d+)?)\s*([a-zA-Z][a-zA-Z0-9]*)/,
      )
      if (match) {
        let coeff = match[1].trim()
        if (coeff === "" || coeff === "+") coeff = "1"
        if (coeff === "-") coeff = "-1"

        coefficients.push(Number.parseFloat(coeff))
        variables.push(match[2])
      }
    }

    return { coefficients, variables }
  }

  private extractVariables(
    lines: string[],
    objectiveFunction: LinearProgrammingProblem["objectiveFunction"],
    constraints: LinearProgrammingProblem["constraints"],
  ): string[] {
    const variableSet = new Set<string>()

    // Add variables from objective function
    objectiveFunction.variables.forEach((v) => variableSet.add(v))

    // Add variables from constraints
    constraints.forEach((constraint) => {
      const { variables } = this.parseExpression(constraint.expression.split(/<=|>=|=/)[0])
      variables.forEach((v) => variableSet.add(v))
    })

    return Array.from(variableSet).sort()
  }

  private extractNonNegativityConstraints(lines: string[]): string[] {
    const nonNegConstraints: string[] = []

    for (const line of lines) {
      if (
        line.match(
          /[a-zA-Z][a-zA-Z0-9]*\s*,\s*[a-zA-Z][a-zA-Z0-9]*\s*≥\s*0/,
        )
      ) {
        nonNegConstraints.push(line.trim())
      } else if (line.match(/[a-zA-Z][a-zA-Z0-9]*\s*≥\s*0/)) {
        nonNegConstraints.push(line.trim())
      }
    }

    return nonNegConstraints
  }
}

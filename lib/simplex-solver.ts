// lib/simplex-solver.ts

export interface SimplexTableau {
  tableau: number[][]
  basicVariables: string[]
  nonBasicVariables: string[]
  objectiveRow: number[]
  rhsColumn: number[]
  iteration: number
  isOptimal: boolean
  isUnbounded: boolean
  pivotRow?: number
  pivotColumn?: number
  enteringVariable?: string
  leavingVariable?: string
}

export interface SimplexSolution {
  isOptimal: boolean
  isUnbounded: boolean
  isFeasible: boolean
  optimalValue: number
  optimalSolution: { [variable: string]: number }
  iterations: SimplexTableau[]
  steps: SimplexStep[]
}

export interface SimplexStep {
  iteration: number
  description: string
  action: string
  details: string
  tableau?: SimplexTableau
}

/** Estructura interna para la forma estándar */
interface StandardForm {
  objectiveCoefficients: number[]
  constraintMatrix: number[][]
  rhsVector: number[]
  variables: string[]
  originalVariables: string[]
  slackVariables: string[]
  numOriginalVars: number
  numConstraints: number
}

/** Resultado interno de extracción de solución */
interface ExtractedSolution {
  optimalValue: number
  optimalSolution: Record<string, number>
}

export class SimplexSolver {
  private static instance: SimplexSolver

  static getInstance(): SimplexSolver {
    if (!SimplexSolver.instance) {
      SimplexSolver.instance = new SimplexSolver()
    }
    return SimplexSolver.instance
  }

  solve(
    objectiveCoefficients: number[],
    constraintMatrix: number[][],
    rhsVector: number[],
    isMaximization = true,
    variables: string[],
  ): SimplexSolution {
    console.log("[v0] Starting Simplex algorithm...")

    const steps: SimplexStep[] = []
    const iterations: SimplexTableau[] = []

    // Step 1: Convert to standard form
    const standardForm = this.convertToStandardForm(
      objectiveCoefficients,
      constraintMatrix,
      rhsVector,
      isMaximization,
      variables,
    )

    steps.push({
      iteration: 0,
      description: "Conversión a Forma Estándar",
      action: "convert_standard",
      details: `Problema convertido a forma estándar. ${isMaximization ? "Maximización" : "Minimización"} convertida a maximización.`,
    })

    // Step 2: Create initial tableau
    let currentTableau = this.createInitialTableau(standardForm)
    iterations.push(currentTableau)

    steps.push({
      iteration: 0,
      description: "Tabla Simplex Inicial",
      action: "initial_tableau",
      details: "Tabla inicial creada con variables de holgura. Variables básicas iniciales identificadas.",
      tableau: currentTableau,
    })

    let iterationCount = 0
    const maxIterations = 50 // Prevent infinite loops

    // Step 3: Simplex iterations
    while (!currentTableau.isOptimal && !currentTableau.isUnbounded && iterationCount < maxIterations) {
      iterationCount++

      // Find entering variable (most negative in objective row)
      const enteringColumn = this.findEnteringVariable(currentTableau)
      if (enteringColumn === -1) {
        currentTableau.isOptimal = true
        break
      }

      currentTableau.enteringVariable = currentTableau.nonBasicVariables[enteringColumn]
      currentTableau.pivotColumn = enteringColumn

      steps.push({
        iteration: iterationCount,
        description: "Selección de Variable de Entrada",
        action: "entering_variable",
        details: `Variable de entrada: ${currentTableau.enteringVariable} (columna ${enteringColumn + 1}). Criterio: coeficiente más negativo en fila objetivo.`,
      })

      // Find leaving variable (minimum ratio test)
      const leavingRow = this.findLeavingVariable(currentTableau, enteringColumn)
      if (leavingRow === -1) {
        currentTableau.isUnbounded = true
        steps.push({
          iteration: iterationCount,
          description: "Problema No Acotado",
          action: "unbounded",
          details: "No se encontró variable de salida válida. El problema es no acotado (solución infinita).",
        })
        break
      }

      currentTableau.leavingVariable = currentTableau.basicVariables[leavingRow]
      currentTableau.pivotRow = leavingRow

      steps.push({
        iteration: iterationCount,
        description: "Selección de Variable de Salida",
        action: "leaving_variable",
        details: `Variable de salida: ${currentTableau.leavingVariable} (fila ${leavingRow + 1}). Criterio: prueba de razón mínima.`,
      })

      // Perform pivot operation
      const newTableau = this.pivotOperation(currentTableau, leavingRow, enteringColumn)
      newTableau.iteration = iterationCount
      iterations.push(newTableau)

      steps.push({
        iteration: iterationCount,
        description: "Operación de Pivote",
        action: "pivot",
        details: `Pivote en elemento (${leavingRow + 1}, ${enteringColumn + 1}). ${currentTableau.leavingVariable} sale, ${currentTableau.enteringVariable} entra.`,
        tableau: newTableau,
      })

      currentTableau = newTableau

      // Check optimality
      if (this.isOptimal(currentTableau)) {
        currentTableau.isOptimal = true
        steps.push({
          iteration: iterationCount,
          description: "Solución Óptima Encontrada",
          action: "optimal",
          details: "Todos los coeficientes en la fila objetivo son no negativos. Se alcanzó la solución óptima.",
        })
      }
    }

    // Extract solution
    const solution = this.extractSolution(currentTableau, standardForm.originalVariables, isMaximization)

    console.log("[v0] Simplex algorithm completed in", iterationCount, "iterations")

    return {
      isOptimal: currentTableau.isOptimal,
      isUnbounded: currentTableau.isUnbounded,
      isFeasible: true, // Asumimos factible en esta versión
      optimalValue: solution.optimalValue,
      optimalSolution: solution.optimalSolution,
      iterations,
      steps,
    }
  }

  // ==============================
  // Internals
  // ==============================

  private convertToStandardForm(
    objectiveCoefficients: number[],
    constraintMatrix: number[][],
    rhsVector: number[],
    isMaximization: boolean,
    variables: string[],
  ): StandardForm {
    // Convert minimization to maximization
    const objCoeffs: number[] = isMaximization ? [...objectiveCoefficients] : objectiveCoefficients.map((c: number) => -c)

    const numConstraints: number = constraintMatrix.length
    const numOriginalVars: number = objectiveCoefficients.length

    // Extend matrix with slack variables (identity matrix appended)
    const extendedMatrix: number[][] = constraintMatrix.map((row: number[], i: number) => [
      ...row,
      ...Array.from({ length: numConstraints }, (_: unknown, j: number) => (i === j ? 1 : 0)),
    ])

    const extendedObjCoeffs: number[] = [...objCoeffs, ...Array(numConstraints).fill(0)]

    const slackVariables: string[] = Array.from({ length: numConstraints }, (_: unknown, i: number) => `s${i + 1}`)
    const allVariables: string[] = [...variables, ...slackVariables]

    return {
      objectiveCoefficients: extendedObjCoeffs,
      constraintMatrix: extendedMatrix,
      rhsVector: [...rhsVector],
      variables: allVariables,
      originalVariables: variables,
      slackVariables,
      numOriginalVars,
      numConstraints,
    }
  }

  private createInitialTableau(standardForm: StandardForm): SimplexTableau {
    const {
      constraintMatrix,
      rhsVector,
      objectiveCoefficients,
      variables,
      slackVariables,
      numOriginalVars,
    } = standardForm

    // Build tableau: [A | b] and last row is objective (negated for maximization)
    const tableau: number[][] = [
      ...constraintMatrix.map((row: number[], i: number) => [...row, rhsVector[i]]),
      [...objectiveCoefficients.map((c: number) => -c), 0],
    ]

    const basicVariables: string[] = [...slackVariables]
    const nonBasicVariables: string[] = variables.slice(0, numOriginalVars)

    const objectiveRow: number[] = tableau[tableau.length - 1]
    const rhsColumn: number[] = tableau.map((row: number[]) => row[row.length - 1])

    return {
      tableau,
      basicVariables,
      nonBasicVariables,
      objectiveRow,
      rhsColumn,
      iteration: 0,
      isOptimal: false,
      isUnbounded: false,
    }
  }

  private findEnteringVariable(tableau: SimplexTableau): number {
    const objectiveRow: number[] = tableau.objectiveRow
    let minValue = 0
    let enteringColumn = -1

    // Only consider non-basic vars (original decision variables)
    const searchColumns = tableau.nonBasicVariables.length

    for (let j = 0; j < searchColumns; j++) {
      if (objectiveRow[j] < minValue) {
        minValue = objectiveRow[j]
        enteringColumn = j
      }
    }

    return enteringColumn
  }

  private findLeavingVariable(tableau: SimplexTableau, enteringColumn: number): number {
    const rhsColumn: number[] = tableau.rhsColumn
    let minRatio = Number.POSITIVE_INFINITY
    let leavingRow = -1

    // Minimum ratio test (exclude objective row)
    for (let i = 0; i < rhsColumn.length - 1; i++) {
      const pivotElement = tableau.tableau[i][enteringColumn]
      if (pivotElement > 0) {
        const ratio = rhsColumn[i] / pivotElement
        if (ratio < minRatio) {
          minRatio = ratio
          leavingRow = i
        }
      }
    }

    return leavingRow
  }

  private pivotOperation(tableau: SimplexTableau, pivotRow: number, pivotColumn: number): SimplexTableau {
    const newTableau: number[][] = tableau.tableau.map((row: number[]) => [...row])
    const pivotElement: number = newTableau[pivotRow][pivotColumn]

    // Normalize pivot row
    for (let j = 0; j < newTableau[pivotRow].length; j++) {
      newTableau[pivotRow][j] /= pivotElement
    }

    // Eliminate other rows in pivot column
    for (let i = 0; i < newTableau.length; i++) {
      if (i !== pivotRow) {
        const multiplier: number = newTableau[i][pivotColumn]
        for (let j = 0; j < newTableau[i].length; j++) {
          newTableau[i][j] -= multiplier * newTableau[pivotRow][j]
        }
      }
    }

    // Update basic/non-basic variables (swap)
    const newBasicVariables: string[] = [...tableau.basicVariables]
    const newNonBasicVariables: string[] = [...tableau.nonBasicVariables]

    const tmp = newBasicVariables[pivotRow]
    newBasicVariables[pivotRow] = newNonBasicVariables[pivotColumn]
    newNonBasicVariables[pivotColumn] = tmp

    const objectiveRow: number[] = newTableau[newTableau.length - 1]
    const rhsColumn: number[] = newTableau.map((row: number[]) => row[row.length - 1])

    return {
      tableau: newTableau,
      basicVariables: newBasicVariables,
      nonBasicVariables: newNonBasicVariables,
      objectiveRow,
      rhsColumn,
      iteration: tableau.iteration + 1,
      isOptimal: false,
      isUnbounded: false,
      pivotRow,
      pivotColumn,
    }
  }

  private isOptimal(tableau: SimplexTableau): boolean {
    const objectiveRow: number[] = tableau.objectiveRow
    // All coefficients (excluding RHS) must be >= 0
    for (let j = 0; j < objectiveRow.length - 1; j++) {
      if (objectiveRow[j] < -1e-10) {
        return false
      }
    }
    return true
  }

  private extractSolution(
    tableau: SimplexTableau,
    originalVariables: string[],
    isMaximization: boolean
  ): ExtractedSolution {
    const solution: Record<string, number> = {}

    // Initialize all original variables to 0
    originalVariables.forEach((v: string) => {
      solution[v] = 0
    })

    // Set values for basic variables that are original decision vars
    tableau.basicVariables.forEach((variable: string, i: number) => {
      if (originalVariables.includes(variable)) {
        solution[variable] = tableau.rhsColumn[i]
      }
    })

    // Optimal value is RHS of objective row (with sign for min problems)
    const raw: number = tableau.rhsColumn[tableau.rhsColumn.length - 1]
    const optimalValue: number = isMaximization ? raw : -raw

    return { optimalValue, optimalSolution: solution }
  }
}

import { LinearProgrammingProblem } from '../lib/nlp-parser'

interface Point {
  x: number
  y: number
}

function computeGraphData(problem: LinearProgrammingProblem) {
  const constraints = problem.constraints
  const [objA, objB] = problem.objectiveFunction.coefficients
  const isMax = problem.type === 'maximize'

  const candidates: Point[] = [{ x: 0, y: 0 }]

  constraints.forEach((c) => {
    const [a, b] = c.coefficients
    const rhs = c.rhs
    if (a !== 0) candidates.push({ x: rhs / a, y: 0 })
    if (b !== 0) candidates.push({ x: 0, y: rhs / b })
  })

  for (let i = 0; i < constraints.length; i++) {
    for (let j = i + 1; j < constraints.length; j++) {
      const p = intersection(constraints[i], constraints[j])
      if (p) candidates.push(p)
    }
  }

  const feasiblePoints = dedupe(
    candidates.filter(
      (p) =>
        constraints.every((c) => {
          const [a, b] = c.coefficients
          const lhs = a * p.x + b * p.y
          if (c.operator === '≤') return lhs <= c.rhs + 1e-8
          if (c.operator === '≥') return lhs >= c.rhs - 1e-8
          return Math.abs(lhs - c.rhs) <= 1e-8
        }) &&
        p.x >= 0 &&
        p.y >= 0,
    ),
  )

  let optimalPoint: Point | null = null
  let optimalValue = 0

  feasiblePoints.forEach((p) => {
    const value = objA * p.x + objB * p.y
    if (!optimalPoint) {
      optimalPoint = p
      optimalValue = value
      return
    }
    if (isMax ? value > optimalValue : value < optimalValue) {
      optimalPoint = p
      optimalValue = value
    }
  })

  return { optimalPoint, optimalValue }
}

function intersection(c1: any, c2: any): Point | null {
  const [a1, b1] = c1.coefficients
  const [a2, b2] = c2.coefficients
  const det = a1 * b2 - a2 * b1
  if (Math.abs(det) < 1e-8) return null
  const x = (c1.rhs * b2 - c2.rhs * b1) / det
  const y = (a1 * c2.rhs - a2 * c1.rhs) / det
  return { x, y }
}

function dedupe(points: Point[]): Point[] {
  const seen: Point[] = []
  points.forEach((p) => {
    if (!seen.some((s) => Math.abs(s.x - p.x) < 1e-6 && Math.abs(s.y - p.y) < 1e-6)) {
      seen.push(p)
    }
  })
  return seen
}

const problem: LinearProgrammingProblem = {
  type: 'maximize',
  objectiveFunction: {
    coefficients: [3, 5],
    variables: ['x1', 'x2'],
    expression: '3x1 + 5x2',
  },
  constraints: [
    { coefficients: [1, 0], operator: '≤', rhs: 4, expression: 'x1 ≤ 4' },
    { coefficients: [0, 2], operator: '≤', rhs: 12, expression: '2x2 ≤ 12' },
    { coefficients: [3, 2], operator: '≤', rhs: 18, expression: '3x1 + 2x2 ≤ 18' },
  ],
  variables: ['x1', 'x2'],
  nonNegativityConstraints: ['x1 ≥ 0', 'x2 ≥ 0'],
}

const data = computeGraphData(problem)
console.log({ optimalPoint: data.optimalPoint, optimalValue: data.optimalValue })


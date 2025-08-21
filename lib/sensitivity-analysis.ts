import type { SimplexSolution } from "./simplex-solver"

export interface SensitivityResult {
  shadowPrices: { constraint: string; price: number }[]
  reducedCosts: { variable: string; cost: number }[]
}

export function performSensitivityAnalysis(solution: SimplexSolution): SensitivityResult {
  const finalTableau = solution.iterations[solution.iterations.length - 1]
  const initialTableau = solution.iterations[0]

  const numOriginalVars = initialTableau.nonBasicVariables.length
  const numConstraints = initialTableau.basicVariables.length

  const shadowPrices = Array.from({ length: numConstraints }, (_, i) => {
    const column = numOriginalVars + i
    const price = -finalTableau.objectiveRow[column]
    return { constraint: initialTableau.basicVariables[i] || `s${i + 1}`, price }
  })

  const reducedCosts = Array.from({ length: numOriginalVars }, (_, i) => ({
    variable: initialTableau.nonBasicVariables[i],
    cost: finalTableau.objectiveRow[i],
  }))

  return { shadowPrices, reducedCosts }
}

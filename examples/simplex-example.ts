import { SimplexSolver } from '../lib/simplex-solver'

const solver = SimplexSolver.getInstance()
const objective = [3, 5]
const constraints = [[1, 0], [0, 2], [3, 2]]
const rhs = [4, 12, 18]
const result = solver.solve(objective, constraints, rhs, true, ['x1', 'x2'])
console.log(result)


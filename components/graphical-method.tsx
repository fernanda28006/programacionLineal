"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LinearProgrammingProblem } from "@/lib/nlp-parser"
import {
  ResponsiveContainer,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Scatter,
  // Polygon // ojo: Recharts no siempre exporta Polygon. Si te da error, cambia a ReferenceArea o Area.
} from "recharts"
import { useMemo } from "react"

interface GraphicalMethodProps {
  problem: LinearProgrammingProblem
}

interface Point { x: number; y: number }

interface GraphData {
  constraintLines: Point[][]
  feasibleRegion: Point[]
  optimalPoint: Point | null
  optimalValue: number
  maxX: number
  maxY: number
}

export function GraphicalMethod({ problem }: GraphicalMethodProps) {
  const {
    constraintLines,
    feasibleRegion,
    optimalPoint,
    optimalValue,
    maxX,
    maxY,
  } = useMemo<GraphData>(() => computeGraphData(problem), [problem])

  if (problem.variables.length !== 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Método Gráfico</CardTitle>
          <CardDescription>Disponible solo para problemas con 2 variables</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Este problema tiene {problem.variables.length} variables. El método gráfico solo se aplica a problemas con dos variables.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Método Gráfico</CardTitle>
        <CardDescription>Región factible y punto óptimo</CardDescription>
      </CardHeader>
      <CardContent>
        {feasibleRegion.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name={problem.variables[0]} domain={[0, maxX]} />
                <YAxis type="number" dataKey="y" name={problem.variables[1]} domain={[0, maxY]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                {constraintLines.map((line, index) => (
                  <Scatter key={index} line data={line} name={`Restricción ${index + 1}`} fill="#8884d8" />
                ))}

                {/* Si usas Polygon, comprueba que exista en tu versión de Recharts */}
                {/* {feasibleRegion.length >= 3 && (
                  <Polygon
                    points={feasibleRegion.map((p) => ({ x: p.x, y: p.y }))}
                    fill="#82ca9d"
                    fillOpacity={0.3}
                    stroke="#82ca9d"
                  />
                )} */}

                {optimalPoint && <Scatter data={[optimalPoint]} name="Óptimo" fill="#ff7300" />}
              </ScatterChart>
            </ResponsiveContainer>

            {optimalPoint ? (
              (() => {
                const op = optimalPoint as Point
                return (
                  <div className="text-center space-y-1">
                    <p>
                      Solución óptima: {problem.variables[0]} = {op.x.toFixed(2)}, {problem.variables[1]} = {op.y.toFixed(2)}
                    </p>
                    <p>Valor óptimo Z = {optimalValue.toFixed(2)}</p>
                  </div>
                )
              })()
            ) : null}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No se encontró región factible.</p>
        )}
      </CardContent>
    </Card>
  )
}

export function computeGraphData(problem: LinearProgrammingProblem): GraphData {
  const constraints = problem.constraints
  const [objA, objB] = problem.objectiveFunction.coefficients
  const isMax = problem.type === "maximize"

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
    candidates.filter((p) =>
      constraints.every((c) => {
        const [a, b] = c.coefficients
        const lhs = a * p.x + b * p.y
        if (c.operator === "≤") return lhs <= c.rhs + 1e-8
        if (c.operator === "≥") return lhs >= c.rhs - 1e-8
        return Math.abs(lhs - c.rhs) <= 1e-8
      }) && p.x >= 0 && p.y >= 0
    )
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

  const feasibleRegion = sortPolygon(feasiblePoints)

  const constraintLines = constraints.map((c) => {
    const [a, b] = c.coefficients
    const rhs = c.rhs
    const points: Point[] = []
    if (b !== 0) points.push({ x: 0, y: rhs / b })
    if (a !== 0) points.push({ x: rhs / a, y: 0 })
    return points
  })

  const maxX = Math.max(
    ...constraintLines.flat().map((p) => p.x),
    ...feasibleRegion.map((p) => p.x),
    1
  ) * 1.1

  const maxY = Math.max(
    ...constraintLines.flat().map((p) => p.y),
    ...feasibleRegion.map((p) => p.y),
    1
  ) * 1.1

  return { constraintLines, feasibleRegion, optimalPoint, optimalValue, maxX, maxY }
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

function sortPolygon(points: Point[]): Point[] {
  if (points.length < 3) return points
  const centroid = {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  }
  return [...points].sort(
    (a, b) =>
      Math.atan2(a.y - centroid.y, a.x - centroid.x) -
      Math.atan2(b.y - centroid.y, b.x - centroid.x)
  )
}

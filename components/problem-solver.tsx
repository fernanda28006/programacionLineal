"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calculator, BarChart3, FileText, Brain, Clock, Target, Play } from "lucide-react"
import type { LinearProgrammingProblem } from "@/lib/nlp-parser"
import type { ProcessingResult } from "@/lib/problem-processor"
import { SimplexSolver, type SimplexSolution } from "@/lib/simplex-solver"
import { SimplexVisualizer } from "@/components/simplex-visualizer"
import { GraphicalMethod } from "@/components/graphical-method"
import Image from "next/image"

interface ProblemSolverProps {
  problem: LinearProgrammingProblem
  imageUrl: string | null
  processingResult: ProcessingResult | null
  onReset: () => void
}

export function ProblemSolver({ problem, imageUrl, processingResult, onReset }: ProblemSolverProps) {
  const [activeMethod, setActiveMethod] = useState<"simplex" | "graphical">("simplex")
  const [simplexSolution, setSimplexSolution] = useState<SimplexSolution | null>(null)
  const [isSimplexSolving, setIsSimplexSolving] = useState(false)

  const solveSimplex = async () => {
    setIsSimplexSolving(true)

    try {
      const objectiveCoefficients = problem.objectiveFunction.coefficients
      const constraintMatrix = problem.constraints.map((c) => c.coefficients)
      const rhsVector = problem.constraints.map((c) => c.rhs)
      const isMaximization = problem.type === "maximize"
      const variables = problem.variables

      const solver = SimplexSolver.getInstance()
      const solution = await new Promise<SimplexSolution>((resolve) => {
        setTimeout(() => {
          const result = solver.solve(objectiveCoefficients, constraintMatrix, rhsVector, isMaximization, variables)
          resolve(result)
        }, 1000)
      })

      setSimplexSolution(solution)
    } catch (error) {
      console.error("[v0] Error solving Simplex:", error)
    } finally {
      setIsSimplexSolving(false)
    }
  }

  const backFromSimplex = () => {
    setSimplexSolution(null)
  }

  if (simplexSolution) {
    return <SimplexVisualizer solution={simplexSolution} onBack={backFromSimplex} />
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onReset} className="flex items-center gap-2 bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Nuevo Problema
        </Button>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            <Brain className="h-3 w-3 mr-1" />
            Problema Extraído
          </Badge>
          {processingResult && (
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {(processingResult.processingTime / 1000).toFixed(1)}s
            </Badge>
          )}
          {processingResult?.ocrResult && (
            <Badge variant="outline">
              <Target className="h-3 w-3 mr-1" />
              {Math.round(processingResult.ocrResult.confidence * 100)}% confianza
            </Badge>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {imageUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-[family-name:var(--font-montserrat)]">Imagen Original</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                  <Image src={imageUrl || "/placeholder.svg"} alt="Problema original" fill className="object-contain" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-[family-name:var(--font-montserrat)] flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Problema Extraído
              </CardTitle>
              <CardDescription>Información procesada mediante OCR y NLP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">FUNCIÓN OBJETIVO</h4>
                <p className="font-mono text-sm bg-muted p-3 rounded border">
                  {problem.type.toUpperCase()} Z = {problem.objectiveFunction.expression}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">RESTRICCIONES</h4>
                <div className="space-y-2">
                  {problem.constraints.map((constraint, index) => (
                    <p key={index} className="font-mono text-sm bg-muted p-2 rounded border">
                      {constraint.expression}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">VARIABLES</h4>
                <div className="flex gap-2 flex-wrap">
                  {problem.variables.map((variable, index) => (
                    <Badge key={index} variant="outline">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>

              {problem.nonNegativityConstraints.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">NO NEGATIVIDAD</h4>
                  <div className="space-y-1">
                    {problem.nonNegativityConstraints.map((constraint, index) => (
                      <p key={index} className="font-mono text-xs bg-muted p-2 rounded border">
                        {constraint}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {processingResult?.ocrResult && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">DETALLES DEL PROCESAMIENTO</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Confianza OCR:</span>
                      <span className="font-mono">{Math.round(processingResult.ocrResult.confidence * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiempo total:</span>
                      <span className="font-mono">{(processingResult.processingTime / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Variables detectadas:</span>
                      <span className="font-mono">{problem.variables.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Restricciones:</span>
                      <span className="font-mono">{problem.constraints.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-[family-name:var(--font-montserrat)]">Métodos de Solución</CardTitle>
              <CardDescription>Selecciona el método para resolver el problema paso a paso</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeMethod} onValueChange={(value) => setActiveMethod(value as "simplex" | "graphical")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="simplex" className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Método Simplex
                  </TabsTrigger>
                  <TabsTrigger value="graphical" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Método Gráfico
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="simplex" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Método Simplex</CardTitle>
                      <CardDescription>Solución algebraica paso a paso con tablas simplex</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Algoritmo Simplex</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            El método Simplex resolverá el problema paso a paso, mostrando:
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                            <li>• Conversión a forma estándar</li>
                            <li>• Tabla simplex inicial</li>
                            <li>• Iteraciones con selección de variables</li>
                            <li>• Operaciones de pivote</li>
                            <li>• Solución óptima final</li>
                          </ul>
                        </div>

                        <div className="flex justify-center">
                          <Button
                            onClick={solveSimplex}
                            disabled={isSimplexSolving}
                            className="flex items-center gap-2"
                            size="lg"
                          >
                            <Play className="h-4 w-4" />
                            {isSimplexSolving ? "Resolviendo..." : "Resolver con Simplex"}
                          </Button>
                        </div>

                        {isSimplexSolving && (
                          <div className="text-center py-4">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-sm text-muted-foreground">Ejecutando algoritmo Simplex...</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="graphical" className="mt-6">
                  <GraphicalMethod problem={problem} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}

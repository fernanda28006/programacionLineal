"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Calculator,
  Target,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import type { SimplexSolution, SimplexStep } from "@/lib/simplex-solver"
import { performSensitivityAnalysis } from "@/lib/sensitivity-analysis"
import { SensitivityAnalysis } from "@/components/sensitivity-analysis"

interface SimplexVisualizerProps {
  solution: SimplexSolution
  onBack: () => void
}

export function SimplexVisualizer({ solution, onBack }: SimplexVisualizerProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState<"steps" | "tableau" | "solution" | "sensitivity">("steps")

  const currentStepData = solution.steps[currentStep]
  const currentTableau = currentStepData?.tableau || solution.iterations[0]
  const sensitivity = performSensitivityAnalysis(solution)

  const nextStep = () => {
    if (currentStep < solution.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const resetSteps = () => {
    setCurrentStep(0)
    setIsPlaying(false)
  }

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= solution.steps.length - 1) {
            setIsPlaying(false)
            clearInterval(interval)
            return prev
          }
          return prev + 1
        })
      }, 2000)
    }
  }

  const getStepIcon = (step: SimplexStep) => {
    switch (step.action) {
      case "convert_standard":
        return <Calculator className="h-4 w-4" />
      case "initial_tableau":
        return <Target className="h-4 w-4" />
      case "entering_variable":
      case "leaving_variable":
        return <ArrowRight className="h-4 w-4" />
      case "pivot":
        return <RotateCcw className="h-4 w-4" />
      case "optimal":
        return <CheckCircle className="h-4 w-4" />
      case "unbounded":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Calculator className="h-4 w-4" />
    }
  }

  const formatNumber = (num: number): string => {
    if (!Number.isFinite(num) || Math.abs(num) < 1e-10) return "0"
    return Number(num.toFixed(3)).toString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2 bg-transparent">
          <ChevronLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={solution.isOptimal ? "default" : solution.isUnbounded ? "destructive" : "secondary"}>
            {solution.isOptimal ? "Óptimo" : solution.isUnbounded ? "No Acotado" : "En Proceso"}
          </Badge>
          <Badge variant="outline">{solution.iterations.length} Iteraciones</Badge>
        </div>
      </div>

      {/* Step Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-[family-name:var(--font-montserrat)]">Control de Pasos</CardTitle>
          <CardDescription>
            Paso {currentStep + 1} de {solution.steps.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevStep} disabled={currentStep === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlay}
                disabled={currentStep >= solution.steps.length - 1}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextStep}
                disabled={currentStep >= solution.steps.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetSteps}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">Iteración {currentStepData?.iteration || 0}</div>
          </div>

          {/* Current Step Info */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {getStepIcon(currentStepData)}
              <h4 className="font-semibold">{currentStepData?.description}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{currentStepData?.details}</p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="steps">Pasos</TabsTrigger>
          <TabsTrigger value="tableau">Tabla Simplex</TabsTrigger>
          <TabsTrigger value="solution">Solución</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensibilidad</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pasos del Algoritmo</CardTitle>
              <CardDescription>Secuencia completa de pasos del método Simplex</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {solution.steps.map((step, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-all ${
                      index === currentStep
                        ? "border-primary bg-primary/5"
                        : index < currentStep
                          ? "border-green-200 bg-green-50"
                          : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-1 rounded ${
                          index === currentStep
                            ? "bg-primary text-primary-foreground"
                            : index < currentStep
                              ? "bg-green-500 text-white"
                              : "bg-muted"
                        }`}
                      >
                        {getStepIcon(step)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">
                          Paso {index + 1}: {step.description}
                        </h4>
                        <p className="text-xs text-muted-foreground">Iteración {step.iteration}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground ml-10">{step.details}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tableau" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tabla Simplex - Iteración {currentTableau?.iteration || 0}</CardTitle>
              <CardDescription>Representación tabular del problema en la iteración actual</CardDescription>
            </CardHeader>
            <CardContent>
              {currentTableau && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-left">Variable Básica</th>
                        {currentTableau.nonBasicVariables.map((variable, index) => (
                          <th
                            key={variable}
                            className={`border border-border p-2 text-center ${
                              index === currentTableau.pivotColumn ? "bg-primary/20" : ""
                            }`}
                          >
                            {variable}
                          </th>
                        ))}
                        <th className="border border-border p-2 text-center">RHS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTableau.basicVariables.map((variable, rowIndex) => (
                        <tr key={variable} className={rowIndex === currentTableau.pivotRow ? "bg-primary/10" : ""}>
                          <td className="border border-border p-2 font-medium">{variable}</td>
                          {currentTableau.tableau[rowIndex].slice(0, -1).map((value, colIndex) => (
                            <td
                              key={colIndex}
                              className={`border border-border p-2 text-center font-mono ${
                                rowIndex === currentTableau.pivotRow && colIndex === currentTableau.pivotColumn
                                  ? "bg-primary text-primary-foreground font-bold"
                                  : ""
                              }`}
                            >
                              {formatNumber(value)}
                            </td>
                          ))}
                          <td className="border border-border p-2 text-center font-mono">
                            {formatNumber(
                              currentTableau.tableau[rowIndex][currentTableau.tableau[rowIndex].length - 1],
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-accent/10">
                        <td className="border border-border p-2 font-bold">Z</td>
                        {currentTableau.objectiveRow.slice(0, -1).map((value, colIndex) => (
                          <td
                            key={colIndex}
                            className={`border border-border p-2 text-center font-mono ${
                              value < 0 ? "text-red-600 font-semibold" : ""
                            }`}
                          >
                            {formatNumber(value)}
                          </td>
                        ))}
                        <td className="border border-border p-2 text-center font-mono font-bold">
                          {formatNumber(currentTableau.objectiveRow[currentTableau.objectiveRow.length - 1])}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {currentTableau.pivotRow !== undefined && currentTableau.pivotColumn !== undefined && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      <p>
                        <strong>Elemento pivote:</strong> Fila {currentTableau.pivotRow + 1}, Columna{" "}
                        {currentTableau.pivotColumn + 1} ={" "}
                        {formatNumber(currentTableau.tableau[currentTableau.pivotRow][currentTableau.pivotColumn])}
                      </p>
                      {currentTableau.enteringVariable && (
                        <p>
                          <strong>Variable de entrada:</strong> {currentTableau.enteringVariable}
                        </p>
                      )}
                      {currentTableau.leavingVariable && (
                        <p>
                          <strong>Variable de salida:</strong> {currentTableau.leavingVariable}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solution" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Solución Óptima
                </CardTitle>
                <CardDescription>Valores óptimos de las variables de decisión</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">Valor Óptimo</h4>
                    <p className="text-2xl font-bold text-primary">Z* = {formatNumber(solution.optimalValue)}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Variables de Decisión:</h4>
                    {Object.entries(solution.optimalSolution).map(([variable, value]) => (
                      <div key={variable} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="font-mono">{variable}</span>
                        <span className="font-mono font-semibold">{formatNumber(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen del Algoritmo</CardTitle>
                <CardDescription>Estadísticas del proceso de solución</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded">
                      <p className="text-2xl font-bold text-primary">{solution.iterations.length}</p>
                      <p className="text-sm text-muted-foreground">Iteraciones</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <p className="text-2xl font-bold text-primary">{solution.steps.length}</p>
                      <p className="text-sm text-muted-foreground">Pasos</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Estado:</span>
                      <Badge variant={solution.isOptimal ? "default" : "destructive"}>
                        {solution.isOptimal ? "Óptimo" : solution.isUnbounded ? "No Acotado" : "Error"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Factible:</span>
                      <Badge variant={solution.isFeasible ? "default" : "destructive"}>
                        {solution.isFeasible ? "Sí" : "No"}
                      </Badge>
                    </div>
                  </div>

                  {solution.isOptimal && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        Solución óptima encontrada exitosamente
                      </p>
                    </div>
                  )}

                  {solution.isUnbounded && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-800">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        El problema es no acotado (solución infinita)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="sensitivity" className="mt-6">
          <SensitivityAnalysis result={sensitivity} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

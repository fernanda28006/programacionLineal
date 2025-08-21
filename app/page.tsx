"use client"

import { useState } from "react"
import { FileImage, Zap, Calculator, BarChart3, Brain } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ImageUploader } from "@/components/image-uploader"
import { ProblemSolver } from "@/components/problem-solver"
import type { LinearProgrammingProblem } from "@/lib/nlp-parser"
import type { ProcessingResult } from "@/lib/problem-processor"

export default function HomePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [extractedProblem, setExtractedProblem] = useState<LinearProgrammingProblem | null>(null)
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const { toast } = useToast()

  const handleProblemExtracted = (problem: LinearProgrammingProblem, imageUrl: string, result: ProcessingResult) => {
    setExtractedProblem(problem)
    setUploadedImage(imageUrl)
    setProcessingResult(result)
  }

  const handleReset = () => {
    setExtractedProblem(null)
    setUploadedImage(null)
    setProcessingResult(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calculator className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-black font-[family-name:var(--font-montserrat)]">
                  Linear Programming Solver
                </h1>
                <p className="text-primary-foreground/80 text-sm">
                  Métodos Simplex y Gráfico con Análisis de Sensibilidad
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                <Brain className="h-3 w-3 mr-1" />
                OCR + NLP
              </Badge>
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                <Zap className="h-3 w-3 mr-1" />
                Paso a Paso
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!extractedProblem ? (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black font-[family-name:var(--font-montserrat)] text-foreground mb-4">
                Resuelve Problemas de Programación Lineal
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Sube una imagen con tu problema y obtén la solución completa usando métodos Simplex y Gráfico,
                incluyendo análisis de sensibilidad detallado.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="text-center">
                <CardHeader>
                  <FileImage className="h-12 w-12 text-primary mx-auto mb-2" />
                  <CardTitle className="font-[family-name:var(--font-montserrat)]">Carga de Imagen</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Sube una foto del problema y nuestro sistema OCR extraerá automáticamente la función objetivo y
                    restricciones.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <Calculator className="h-12 w-12 text-primary mx-auto mb-2" />
                  <CardTitle className="font-[family-name:var(--font-montserrat)]">Métodos Completos</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Resuelve usando tanto el método Simplex como el método Gráfico, mostrando cada paso del proceso de
                    optimización.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <BarChart3 className="h-12 w-12 text-primary mx-auto mb-2" />
                  <CardTitle className="font-[family-name:var(--font-montserrat)]">Análisis de Sensibilidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Obtén un análisis completo de sensibilidad con interpretación de rangos de optimalidad y
                    factibilidad.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* Image Upload Section */}
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-[family-name:var(--font-montserrat)]">Comenzar Análisis</CardTitle>
                <CardDescription>Sube una imagen clara del problema de programación lineal</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader onProblemExtracted={handleProblemExtracted} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <ProblemSolver
            problem={extractedProblem}
            imageUrl={uploadedImage}
            processingResult={processingResult}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-primary-foreground/80">
              © 2024 Linear Programming Solver. Desarrollado con tecnología OCR y NLP avanzada.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

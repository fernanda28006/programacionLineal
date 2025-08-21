"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileImage, Loader2, X, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { ProblemProcessor, type ProcessingResult } from "@/lib/problem-processor"
import type { LinearProgrammingProblem } from "@/lib/nlp-parser"
import Image from "next/image"

interface ImageUploaderProps {
  onProblemExtracted: (problem: LinearProgrammingProblem, imageUrl: string, processingResult: ProcessingResult) => void
}

export function ImageUploader({ onProblemExtracted }: ImageUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState<string>("")
  const [processingProgress, setProcessingProgress] = useState(0)
  const { toast } = useToast()

  const processor = ProblemProcessor.getInstance()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error de archivo",
          description: "Por favor selecciona un archivo de imagen válido.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo debe ser menor a 10MB.",
          variant: "destructive",
        })
        return
      }

      setIsProcessing(true)
      setProcessingProgress(0)

      try {
        // Create preview URL
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)

        // Simulate processing steps with progress
        const steps = processor.getProcessingSteps()

        for (let i = 0; i < steps.length; i++) {
          setProcessingStep(steps[i].description)
          setProcessingProgress((i / steps.length) * 80) // 80% for processing steps
          await new Promise((resolve) => setTimeout(resolve, 800))
        }

        setProcessingStep("Finalizando procesamiento...")
        setProcessingProgress(90)

        // Process the image
        const result = await processor.processImage(file)

        setProcessingProgress(100)

        if (result.success && result.problem) {
          toast({
            title: "Problema extraído correctamente",
            description: `Procesado en ${(result.processingTime / 1000).toFixed(1)}s con ${result.ocrResult?.confidence ? Math.round(result.ocrResult.confidence * 100) : 0}% de confianza.`,
          })

          onProblemExtracted(result.problem, url, result)
        } else {
          toast({
            title: "Error en el procesamiento",
            description: result.error || "No se pudo procesar la imagen correctamente.",
            variant: "destructive",
          })
          clearPreview()
        }
      } catch (error) {
        console.error("[v0] Upload error:", error)
        toast({
          title: "Error de carga",
          description: "No se pudo cargar la imagen. Inténtalo de nuevo.",
          variant: "destructive",
        })
        clearPreview()
      } finally {
        setIsProcessing(false)
        setProcessingStep("")
        setProcessingProgress(0)
      }
    },
    [onProblemExtracted, toast, processor],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"],
    },
    multiple: false,
    disabled: isProcessing,
  })

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <div className="space-y-4">
      {!previewUrl ? (
        <Card
          {...getRootProps()}
          className={`cursor-pointer transition-all duration-200 border-2 border-dashed hover:border-primary/50 ${
            isDragActive ? "border-primary bg-primary/5" : "border-border"
          } ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 px-6">
            <input {...getInputProps()} />

            {isProcessing ? (
              <div className="text-center space-y-4 w-full max-w-md">
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-foreground">Procesando imagen...</p>
                  <p className="text-sm text-muted-foreground">{processingStep}</p>
                  <Progress value={processingProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground">{processingProgress}% completado</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground mb-2">
                    {isDragActive ? "Suelta la imagen aquí" : "Arrastra una imagen o haz clic para seleccionar"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Formatos soportados: PNG, JPG, JPEG, GIF, BMP, WebP (máx. 10MB)
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>OCR Avanzado</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>NLP Inteligente</span>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="mt-4 bg-transparent">
                  <FileImage className="h-4 w-4 mr-2" />
                  Seleccionar Imagen
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={previewUrl || "/placeholder.svg"}
                  alt="Imagen del problema cargada"
                  fill
                  className="object-contain"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={clearPreview}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Imagen procesada correctamente</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

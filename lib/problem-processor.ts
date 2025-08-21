import { OCRService, type OCRResult } from "./ocr-service"
import { NLPParser, type LinearProgrammingProblem } from "./nlp-parser"

export interface ProcessingResult {
  success: boolean
  problem?: LinearProgrammingProblem
  ocrResult?: OCRResult
  error?: string
  processingTime: number
}

export class ProblemProcessor {
  private static instance: ProblemProcessor
  private ocrService: OCRService
  private nlpParser: NLPParser

  static getInstance(): ProblemProcessor {
    if (!ProblemProcessor.instance) {
      ProblemProcessor.instance = new ProblemProcessor()
    }
    return ProblemProcessor.instance
  }

  constructor() {
    this.ocrService = OCRService.getInstance()
    this.nlpParser = NLPParser.getInstance()
  }

  async processImage(imageFile: File): Promise<ProcessingResult> {
    const startTime = Date.now()

    try {
      // Step 1: Extract text using OCR
      console.log("[v0] Starting OCR processing...")
      const ocrResult = await this.ocrService.extractTextFromImage(imageFile)
      console.log("[v0] OCR completed with confidence:", ocrResult.confidence)

      // Check OCR confidence
      if (ocrResult.confidence < 0.7) {
        return {
          success: false,
          error: "La calidad de la imagen es muy baja. Por favor, sube una imagen más clara.",
          ocrResult,
          processingTime: Date.now() - startTime,
        }
      }

      // Step 2: Parse the problem using NLP
      console.log("[v0] Starting NLP parsing...")
      const problem = await this.nlpParser.parseProblem(ocrResult.text)
      console.log("[v0] NLP parsing completed successfully")

      // Validate the parsed problem
      const validationError = this.validateProblem(problem)
      if (validationError) {
        return {
          success: false,
          error: validationError,
          ocrResult,
          processingTime: Date.now() - startTime,
        }
      }

      return {
        success: true,
        problem,
        ocrResult,
        processingTime: Date.now() - startTime,
      }
    } catch (error) {
      console.error("[v0] Error processing image:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido durante el procesamiento",
        processingTime: Date.now() - startTime,
      }
    }
  }

  private validateProblem(problem: LinearProgrammingProblem): string | null {
    // Check if objective function exists
    if (!problem.objectiveFunction || problem.objectiveFunction.variables.length === 0) {
      return "No se pudo identificar una función objetivo válida"
    }

    // Check if constraints exist
    if (!problem.constraints || problem.constraints.length === 0) {
      return "No se pudieron identificar restricciones válidas"
    }

    // Check if variables are consistent
    if (!problem.variables || problem.variables.length === 0) {
      return "No se pudieron identificar variables válidas"
    }

    // Check for at least 2 variables for graphical method
    if (problem.variables.length < 2) {
      return "Se requieren al menos 2 variables para el método gráfico"
    }

    // Check if coefficients match variables
    for (const constraint of problem.constraints) {
      if (constraint.coefficients.length !== problem.variables.length) {
        console.log("[v0] Warning: Coefficient count mismatch in constraint:", constraint.expression)
      }
    }

    return null
  }

  // Helper method to get processing status
  getProcessingSteps(): Array<{ step: string; description: string }> {
    return [
      {
        step: "OCR",
        description: "Extrayendo texto de la imagen usando reconocimiento óptico de caracteres",
      },
      {
        step: "NLP",
        description: "Analizando el texto para identificar función objetivo y restricciones",
      },
      {
        step: "Validación",
        description: "Verificando que el problema sea válido y completo",
      },
      {
        step: "Preparación",
        description: "Preparando datos para los algoritmos de solución",
      },
    ]
  }
}

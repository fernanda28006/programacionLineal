export interface OCRResult {
  text: string
  confidence: number
  boundingBoxes?: Array<{
    text: string
    x: number
    y: number
    width: number
    height: number
  }>
}

export class OCRService {
  private static instance: OCRService

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService()
    }
    return OCRService.instance
  }

  async extractTextFromImage(imageFile: File): Promise<OCRResult> {
    // Simulate OCR processing with realistic delay
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1000))

    // Mock OCR results for different types of linear programming problems
    const mockResults = [
      {
        text: `Maximizar Z = 3x₁ + 2x₂
        Sujeto a:
        2x₁ + x₂ ≤ 100
        x₁ + x₂ ≤ 80
        x₁ ≤ 40
        x₁, x₂ ≥ 0`,
        confidence: 0.95,
      },
      {
        text: `Minimizar Z = 5x + 3y
        Restricciones:
        2x + y ≥ 10
        x + 2y ≥ 8
        x + y ≤ 12
        x, y ≥ 0`,
        confidence: 0.92,
      },
      {
        text: `Maximize Z = 4x₁ + 3x₂ + 2x₃
        Subject to:
        x₁ + 2x₂ + x₃ ≤ 50
        2x₁ + x₂ + 2x₃ ≤ 60
        x₁ + x₂ + x₃ ≤ 30
        x₁, x₂, x₃ ≥ 0`,
        confidence: 0.88,
      },
    ]

    // Return random mock result
    const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)]

    return {
      ...randomResult,
      boundingBoxes: this.generateMockBoundingBoxes(randomResult.text),
    }
  }

  private generateMockBoundingBoxes(text: string): OCRResult["boundingBoxes"] {
    const lines = text.split("\n").filter((line) => line.trim())
    return lines.map((line, index) => ({
      text: line.trim(),
      x: 50 + Math.random() * 20,
      y: 100 + index * 40 + Math.random() * 10,
      width: line.length * 8 + Math.random() * 50,
      height: 25 + Math.random() * 10,
    }))
  }
}

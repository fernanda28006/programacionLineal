"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SensitivityResult } from "@/lib/sensitivity-analysis"

interface Props {
  result: SensitivityResult
}

export function SensitivityAnalysis({ result }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Análisis de Sensibilidad</CardTitle>
        <CardDescription>Precios sombra y costos reducidos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Precios Sombra</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2">Restricción</th>
                  <th className="pb-2 text-right">Precio</th>
                </tr>
              </thead>
              <tbody>
                {result.shadowPrices.map((s) => (
                  <tr key={s.constraint} className="border-t">
                    <td className="py-1">{s.constraint}</td>
                    <td className="py-1 text-right font-mono">{s.price.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Costos Reducidos</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2">Variable</th>
                  <th className="pb-2 text-right">Costo</th>
                </tr>
              </thead>
              <tbody>
                {result.reducedCosts.map((r) => (
                  <tr key={r.variable} className="border-t">
                    <td className="py-1">{r.variable}</td>
                    <td className="py-1 text-right font-mono">{r.cost.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

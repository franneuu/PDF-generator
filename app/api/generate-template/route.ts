import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json()

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Título es requerido" }, { status: 400 })
    }

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Eres un asistente especializado en crear documentos médicos para un consultorio de kinesiología llamado "Espacio Kinesio".

Título del documento: "${title}"

Genera un contenido profesional y médicamente apropiado para este documento. El contenido debe:

1. Comenzar con "Buenos Aires, {{date}}" (mantén exactamente esta variable)
2. Incluir las variables {{patient_name}} y {{patient_dni}} donde corresponda
3. Ser formal y profesional
4. Usar terminología médica apropiada para kinesiología
5. Incluir una frase de cierre profesional
6. Ser conciso pero completo (máximo 150 palabras)

Ejemplos de variables que puedes usar:
- {{patient_name}} - Nombre del paciente
- {{patient_dni}} - DNI del paciente  
- {{date}} - Fecha del documento
- {{time}} - Hora (si es relevante)
- {{sessions}} - Número de sesiones (si es relevante)
- {{diagnosis}} - Diagnóstico (si es relevante)

Genera SOLO el contenido del documento, sin explicaciones adicionales.`,
      maxTokens: 300,
      temperature: 0.7,
    })

    return NextResponse.json({ content: text })
  } catch (error) {
    console.error("Error generating template:", error)
    return NextResponse.json({ error: "Error al generar el contenido de la plantilla" }, { status: 500 })
  }
}

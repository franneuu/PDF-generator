import { type NextRequest, NextResponse } from "next/server"

const PREDEFINED_TEMPLATES = {
  certificado: `Buenos Aires, {{date}}

El presente documento certifica que el/la paciente {{patient_name}}, DNI {{patient_dni}}, ha asistido a sesiones de kinesiología en nuestro consultorio.

El tratamiento se realizó bajo supervisión profesional, cumpliendo con los protocolos establecidos para su rehabilitación.

Se extiende el presente certificado a pedido del interesado para los fines que estime conveniente.`,

  constancia: `Buenos Aires, {{date}}

Por medio de la presente se deja constancia que el/la paciente {{patient_name}}, DNI {{patient_dni}}, se encuentra bajo tratamiento kinesiológico en "Espacio Kinesio".

El paciente ha demostrado compromiso con su proceso de rehabilitación, asistiendo regularmente a las sesiones programadas.

Se extiende la presente constancia para los fines que correspondan.`,

  informe: `Buenos Aires, {{date}}

INFORME KINESIOLÓGICO

Paciente: {{patient_name}}
DNI: {{patient_dni}}

El paciente se encuentra en proceso de rehabilitación kinesiológica, mostrando evolución favorable en su tratamiento.

Se recomienda continuar con las sesiones según indicación médica para optimizar los resultados del tratamiento.`,

  asistencia: `Buenos Aires, {{date}}

El presente documento certifica la asistencia del Paciente {{patient_name}} DNI {{patient_dni}} a sesiones de kinesiología el día de la fecha.

El tratamiento se desarrolló de manera satisfactoria, cumpliendo con los objetivos terapéuticos establecidos.

Se extiende el presente para constancia y efectos que hubiere lugar.`,

  default: `Buenos Aires, {{date}}

Por la presente se certifica que el/la paciente {{patient_name}}, DNI {{patient_dni}}, ha recibido atención kinesiológica en "Espacio Kinesio".

El tratamiento se realizó siguiendo protocolos profesionales establecidos, con el objetivo de mejorar la condición física del paciente.

Se extiende el presente documento para los fines que estime conveniente.`,
}

function generateTemplateContent(title: string): string {
  const titleLower = title.toLowerCase()

  if (titleLower.includes("certificado") || titleLower.includes("certificacion")) {
    return PREDEFINED_TEMPLATES.certificado
  } else if (titleLower.includes("constancia")) {
    return PREDEFINED_TEMPLATES.constancia
  } else if (titleLower.includes("informe") || titleLower.includes("reporte")) {
    return PREDEFINED_TEMPLATES.informe
  } else if (titleLower.includes("asistencia") || titleLower.includes("asistió")) {
    return PREDEFINED_TEMPLATES.asistencia
  } else {
    return PREDEFINED_TEMPLATES.default
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json()

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Título es requerido" }, { status: 400 })
    }

    const content = generateTemplateContent(title)

    return NextResponse.json({ content })
  } catch (error) {
    console.error("Error generating template:", error)

    return NextResponse.json(
      {
        error: "Error al generar el contenido de la plantilla. Intente nuevamente.",
      },
      { status: 500 },
    )
  }
}

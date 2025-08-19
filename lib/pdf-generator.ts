import type { Template } from "./template-manager"

interface TemplatedPDFData {
  template: Template
  fieldValues: { [fieldId: string]: string }
}

interface PDFData {
  patientName: string
  patientDNI: string
  date: string
  clinicName: string
}

// Función para cargar imagen como base64
async function loadImageAsBase64(imagePath: string): Promise<string> {
  try {
    const response = await fetch(imagePath)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("Error loading image:", error)
    return ""
  }
}

export async function generateTemplatedPDF(data: TemplatedPDFData) {
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20

  // Cargar imágenes
  const logoBase64 = await loadImageAsBase64("/images/logo-espacio-kinesio.png")
  const firmaBase64 = await loadImageAsBase64("/images/firma-julieta.jpeg")

  // Header con logo real
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, 15, 30, 30)
    } catch (error) {
      console.error("Error adding logo:", error)
    }
  }

  // Nombre del consultorio
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("ESPACIO KINESIO", margin + 40, 25)

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("Centro de Kinesiología y Rehabilitación", margin + 40, 35)

  // Línea separadora
  doc.line(margin, 55, pageWidth - margin, 55)

  // Título del documento
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text(data.template.title, pageWidth / 2, 75, { align: "center" })

  // Procesar contenido de la plantilla
  let processedContent = data.template.content
  data.template.fields.forEach((field) => {
    const value = data.fieldValues[field.id] || ""
    processedContent = processedContent.replace(new RegExp(`{{${field.id}}}`, "g"), value)
  })

  // Renderizar contenido
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")

  const lines = processedContent.split("\n")
  let currentY = 95
  const lineHeight = 7

  lines.forEach((line) => {
    if (line.trim()) {
      // Dividir líneas largas
      const splitLines = doc.splitTextToSize(line, pageWidth - 2 * margin)
      splitLines.forEach((splitLine: string) => {
        if (currentY > pageHeight - 100) {
          doc.addPage()
          currentY = margin
        }
        doc.text(splitLine, margin, currentY)
        currentY += lineHeight
      })
    } else {
      currentY += lineHeight / 2 // Espacio para líneas vacías
    }
  })

  // Sección de firma
  const signatureY = Math.max(currentY + 30, pageHeight - 90)

  // Línea separadora antes de la firma
  doc.line(margin, signatureY - 10, pageWidth - margin, signatureY - 10)

  // Agregar firma real si está disponible
  if (firmaBase64) {
    try {
      doc.addImage(firmaBase64, "JPEG", margin, signatureY, 80, 40)
    } catch (error) {
      console.error("Error adding signature:", error)
      // Fallback: texto de firma
      doc.setFontSize(10)
      doc.text("Dra. Julieta Carrasco", margin, signatureY + 20)
      doc.text("Terapeuta Física", margin, signatureY + 30)
      doc.text("Lic. Kinesióloga Fisiatra", margin, signatureY + 40)
      doc.text("M.N. 4989", margin, signatureY + 50)
    }
  }

  // Información adicional de la firma
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Dra. Julieta Carrasco", margin + 90, signatureY + 10)
  doc.text("Terapeuta Física", margin + 90, signatureY + 20)
  doc.text("Lic. Kinesióloga Fisiatra", margin + 90, signatureY + 30)
  doc.text("M.N. 4989", margin + 90, signatureY + 40)

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(`Documento generado el ${new Date().toLocaleString("es-AR")}`, pageWidth / 2, pageHeight - 10, {
    align: "center",
  })

  // Generar nombre del archivo
  const patientName = data.fieldValues["patient_name"] || "Paciente"
  const date = data.fieldValues["date"] || new Date().toLocaleDateString("es-AR")
  const fileName = `${data.template.name.replace(/\s+/g, "_")}_${patientName.replace(/\s+/g, "_")}_${date.replace(/\//g, "-")}.pdf`

  // Descargar el PDF
  doc.save(fileName)
}

export async function generateTemplatedPDFBlob(data: TemplatedPDFData): Promise<Blob> {
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20

  // Cargar imágenes
  const logoBase64 = await loadImageAsBase64("/images/logo-espacio-kinesio.png")
  const firmaBase64 = await loadImageAsBase64("/images/firma-julieta.jpeg")

  // Header con logo real
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, 15, 30, 30)
    } catch (error) {
      console.error("Error adding logo:", error)
    }
  }

  // Nombre del consultorio
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("ESPACIO KINESIO", margin + 40, 25)

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("Centro de Kinesiología y Rehabilitación", margin + 40, 35)

  // Línea separadora
  doc.line(margin, 55, pageWidth - margin, 55)

  // Título del documento
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text(data.template.title, pageWidth / 2, 75, { align: "center" })

  // Procesar contenido de la plantilla
  let processedContent = data.template.content
  data.template.fields.forEach((field) => {
    const value = data.fieldValues[field.id] || ""
    processedContent = processedContent.replace(new RegExp(`{{${field.id}}}`, "g"), value)
  })

  // Renderizar contenido
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")

  const lines = processedContent.split("\n")
  let currentY = 95
  const lineHeight = 7

  lines.forEach((line) => {
    if (line.trim()) {
      // Dividir líneas largas
      const splitLines = doc.splitTextToSize(line, pageWidth - 2 * margin)
      splitLines.forEach((splitLine: string) => {
        if (currentY > pageHeight - 100) {
          doc.addPage()
          currentY = margin
        }
        doc.text(splitLine, margin, currentY)
        currentY += lineHeight
      })
    } else {
      currentY += lineHeight / 2 // Espacio para líneas vacías
    }
  })

  // Sección de firma
  const signatureY = Math.max(currentY + 30, pageHeight - 90)

  // Línea separadora antes de la firma
  doc.line(margin, signatureY - 10, pageWidth - margin, signatureY - 10)

  // Agregar firma real si está disponible
  if (firmaBase64) {
    try {
      doc.addImage(firmaBase64, "JPEG", margin, signatureY, 80, 40)
    } catch (error) {
      console.error("Error adding signature:", error)
      // Fallback: texto de firma
      doc.setFontSize(10)
      doc.text("Dra. Julieta Carrasco", margin, signatureY + 20)
      doc.text("Terapeuta Física", margin, signatureY + 30)
      doc.text("Lic. Kinesióloga Fisiatra", margin, signatureY + 40)
      doc.text("M.N. 4989", margin, signatureY + 50)
    }
  }

  // Información adicional de la firma
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Dra. Julieta Carrasco", margin + 90, signatureY + 10)
  doc.text("Terapeuta Física", margin + 90, signatureY + 20)
  doc.text("Lic. Kinesióloga Fisiatra", margin + 90, signatureY + 30)
  doc.text("M.N. 4989", margin + 90, signatureY + 40)

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(`Documento generado el ${new Date().toLocaleString("es-AR")}`, pageWidth / 2, pageHeight - 10, {
    align: "center",
  })

  // Retornar como blob en lugar de descargar
  return doc.output("blob")
}

// Mantener función original para compatibilidad
export async function generatePDF(data: PDFData) {
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF()

  // Configuración de la página
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20

  // Header con logo (placeholder)
  doc.setFillColor(59, 130, 246) // Blue-600
  doc.rect(0, 0, pageWidth, 40, "F")

  // Logo placeholder (círculo azul)
  doc.setFillColor(255, 255, 255)
  doc.circle(30, 20, 12, "F")
  doc.setTextColor(59, 130, 246)
  doc.setFontSize(16)
  doc.text("EK", 25, 25)

  // Nombre del consultorio
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.text(data.clinicName, 50, 25)

  // Resetear color de texto
  doc.setTextColor(0, 0, 0)

  // Título del documento
  doc.setFontSize(16)
  doc.text("DOCUMENTO MÉDICO", pageWidth / 2, 70, { align: "center" })

  // Fecha
  doc.setFontSize(12)
  doc.text(`Fecha: ${data.date}`, margin, 90)

  // Línea separadora
  doc.line(margin, 95, pageWidth - margin, 95)

  // Datos del paciente
  doc.setFontSize(14)
  doc.text("DATOS DEL PACIENTE:", margin, 115)

  doc.setFontSize(12)
  doc.text(`Nombre: ${data.patientName}`, margin, 130)
  doc.text(`DNI: ${data.patientDNI}`, margin, 145)

  // Espacio para contenido médico
  doc.line(margin, 160, pageWidth - margin, 160)
  doc.setFontSize(12)
  doc.text("OBSERVACIONES MÉDICAS:", margin, 175)

  // Líneas para escribir
  for (let i = 0; i < 8; i++) {
    const y = 190 + i * 15
    doc.line(margin, y, pageWidth - margin, y)
  }

  // Sección de firma
  const signatureY = pageHeight - 80
  doc.line(margin, signatureY, pageWidth - margin, signatureY)

  doc.setFontSize(12)
  doc.text("FIRMA Y SELLO MÉDICO:", margin, signatureY + 15)

  // Espacio para firma
  doc.rect(margin, signatureY + 25, 80, 30)
  doc.setFontSize(10)
  doc.text("Firma", margin + 35, signatureY + 45)

  // Espacio para aclaración
  doc.line(pageWidth - 120, signatureY + 25, pageWidth - margin, signatureY + 25)
  doc.text("Aclaración", pageWidth - 85, signatureY + 35)

  doc.line(pageWidth - 120, signatureY + 45, pageWidth - margin, signatureY + 45)
  doc.text("Matrícula", pageWidth - 85, signatureY + 55)

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(`Documento generado el ${new Date().toLocaleString("es-AR")}`, pageWidth / 2, pageHeight - 10, {
    align: "center",
  })

  // Generar nombre del archivo
  const fileName = `${data.clinicName}_${data.patientName.replace(/\s+/g, "_")}_${data.date.replace(/\//g, "-")}.pdf`

  // Descargar el PDF
  doc.save(fileName)
}

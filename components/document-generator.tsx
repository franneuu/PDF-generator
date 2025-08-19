"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, Share2, Eye } from "lucide-react"
import { templateManager, type Template, type TemplateField } from "@/lib/template-manager"
import { generateTemplatedPDF } from "@/lib/pdf-generator"
import { useToast } from "@/hooks/use-toast"

interface DocumentGeneratorProps {
  templateId: string
  onBack: () => void
}

interface FieldValues {
  [fieldId: string]: string
}

export function DocumentGenerator({ templateId, onBack }: DocumentGeneratorProps) {
  const [template, setTemplate] = useState<Template | null>(null)
  const [fieldValues, setFieldValues] = useState<FieldValues>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadedTemplate = templateManager.getTemplate(templateId)
    if (loadedTemplate) {
      setTemplate(loadedTemplate)

      // Inicializar valores de campos con valores por defecto
      const initialValues: FieldValues = {}
      loadedTemplate.fields.forEach((field) => {
        if (field.type === "date") {
          initialValues[field.id] = new Date().toLocaleDateString("es-AR")
        } else if (field.type === "time") {
          initialValues[field.id] = new Date().toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        } else {
          initialValues[field.id] = ""
        }
      })
      setFieldValues(initialValues)
    }
  }, [templateId])

  const updateFieldValue = (fieldId: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  const getPreviewContent = () => {
    if (!template) return ""

    let preview = template.content
    template.fields.forEach((field) => {
      const value = fieldValues[field.id] || `[${field.label}]`
      preview = preview.replace(new RegExp(`{{${field.id}}}`, "g"), value)
    })
    return preview
  }

  const validateFields = () => {
    if (!template) return false

    for (const field of template.fields) {
      if (field.required && !fieldValues[field.id]?.trim()) {
        toast({
          title: "Campo requerido",
          description: `El campo "${field.label}" es obligatorio`,
          variant: "destructive",
        })
        return false
      }
    }
    return true
  }

  const handleGeneratePDF = async () => {
    if (!template || !validateFields()) return

    setIsGenerating(true)
    try {
      await generateTemplatedPDF({
        template,
        fieldValues,
      })

      toast({
        title: "PDF generado exitosamente",
        description: "El documento se ha descargado automáticamente",
      })
    } catch (error) {
      toast({
        title: "Error al generar PDF",
        description: "Hubo un problema al crear el documento",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShare = async () => {
    if (!template || !validateFields()) return

    setIsGenerating(true)
    try {
      console.log("[v0] Iniciando generación de PDF para compartir")

      const { generateTemplatedPDFBlob } = await import("@/lib/pdf-generator")
      const pdfBlob = await generateTemplatedPDFBlob({
        template,
        fieldValues,
      })

      console.log("[v0] PDF blob generado:", pdfBlob.size, "bytes")

      const patientName = fieldValues["patient_name"] || "Paciente"
      const fileName = `${template.name.replace(/\s+/g, "_")}_${patientName.replace(/\s+/g, "_")}.pdf`

      if (navigator.share) {
        console.log("[v0] Web Share API disponible")

        const file = new File([pdfBlob], fileName, { type: "application/pdf" })

        // Verificar si el dispositivo puede compartir este tipo de archivo
        const shareData = {
          title: `${template.name} - ${patientName}`,
          text: `Documento médico: ${template.name}`,
          files: [file],
        }

        if (navigator.canShare && navigator.canShare(shareData)) {
          console.log("[v0] Dispositivo puede compartir archivos PDF")

          try {
            await navigator.share(shareData)
            console.log("[v0] Documento compartido exitosamente")

            toast({
              title: "Documento compartido",
              description: "El PDF se ha compartido exitosamente",
            })
            return
          } catch (shareError: any) {
            console.log("[v0] Error al compartir con Web Share API:", shareError.message)

            // Si el error es por permisos, intentar compartir solo con texto y URL
            if (shareError.name === "NotAllowedError") {
              console.log("[v0] Intentando compartir con URL temporal")
              await shareWithURL(pdfBlob, fileName, template.name, patientName)
              return
            }
          }
        } else {
          console.log("[v0] Dispositivo no puede compartir archivos PDF, usando URL temporal")
          await shareWithURL(pdfBlob, fileName, template.name, patientName)
          return
        }
      }

      // Fallback: descargar archivo
      console.log("[v0] Web Share API no disponible, descargando archivo")
      downloadPDF(pdfBlob, fileName)
    } catch (error) {
      console.error("[v0] Error general al compartir:", error)
      toast({
        title: "Error al compartir",
        description: "Hubo un problema al compartir el documento. Se descargará automáticamente.",
        variant: "destructive",
      })

      // Intentar descargar como último recurso
      try {
        const { generateTemplatedPDFBlob } = await import("@/lib/pdf-generator")
        const pdfBlob = await generateTemplatedPDFBlob({ template, fieldValues })
        const patientName = fieldValues["patient_name"] || "Paciente"
        const fileName = `${template.name.replace(/\s+/g, "_")}_${patientName.replace(/\s+/g, "_")}.pdf`
        downloadPDF(pdfBlob, fileName)
      } catch (downloadError) {
        console.error("[v0] Error al descargar como fallback:", downloadError)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const shareWithURL = async (pdfBlob: Blob, fileName: string, templateName: string, patientName: string) => {
    try {
      const url = URL.createObjectURL(pdfBlob)

      const shareData = {
        title: `${templateName} - ${patientName}`,
        text: `Documento médico: ${templateName}\n\nPara ver el documento, toque el enlace y descárguelo.`,
        url: url,
      }

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        console.log("[v0] Documento compartido con URL temporal")

        toast({
          title: "Documento compartido",
          description: "Se ha compartido un enlace al documento PDF",
        })

        // Limpiar la URL después de un tiempo
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 60000) // 1 minuto
      } else {
        throw new Error("No se puede compartir con URL")
      }
    } catch (error) {
      console.log("[v0] Error al compartir con URL, descargando:", error)
      downloadPDF(pdfBlob, fileName)
    }
  }

  const downloadPDF = (pdfBlob: Blob, fileName: string) => {
    console.log("[v0] Descargando PDF:", fileName)
    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "PDF descargado",
      description: "El documento se ha descargado exitosamente",
    })
  }

  const renderField = (field: TemplateField) => {
    const value = fieldValues[field.id] || ""

    switch (field.type) {
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className="text-base"
          />
        )
      case "time":
        return (
          <Input
            type="time"
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className="text-base"
          />
        )
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.placeholder || `Ingrese ${field.label.toLowerCase()}`}
            className="text-base"
          />
        )
    }
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando plantilla...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Generar Documento</h1>
            <p className="text-sm text-gray-600">Plantilla: {template.name}</p>
          </div>
        </div>

        {/* Formulario de campos */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Completar Datos</CardTitle>
            <CardDescription>Complete los campos para generar el documento PDF</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {template.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Vista previa */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Vista Previa</CardTitle>
                <CardDescription>Así se verá el contenido del documento</CardDescription>
              </div>
              <Button onClick={() => setShowPreview(!showPreview)} variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
          </CardHeader>
          {showPreview && (
            <CardContent>
              <div className="p-4 bg-white rounded-lg border min-h-[200px] whitespace-pre-wrap font-serif text-sm">
                <div className="font-bold text-center text-lg mb-6">{template.title}</div>
                {getPreviewContent()}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Acciones */}
        <div className="space-y-3">
          <Button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            {isGenerating ? "Generando PDF..." : "Generar y Descargar PDF"}
          </Button>

          <Button
            onClick={handleShare}
            variant="outline"
            disabled={isGenerating}
            className="w-full h-12 text-base bg-transparent"
            size="lg"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Compartir Documento
          </Button>
        </div>

        {/* Info del documento */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-blue-900">Información del documento</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Plantilla: {template.name}</p>
                <p>• Consultorio: Espacio Kinesio</p>
                <p>• Incluye logo y firma profesional</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

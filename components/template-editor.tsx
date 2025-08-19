"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Plus, Trash2, Eye, EyeOff, Sparkles, RefreshCw } from "lucide-react"
import { useTemplates } from "@/hooks/use-templates"
import { type TemplateField, templateManager } from "@/lib/template-manager"
import { useToast } from "@/hooks/use-toast"

interface TemplateEditorProps {
  templateId?: string | null
  onSave: () => void
  onCancel: () => void
}

export function TemplateEditor({ templateId, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [fields, setFields] = useState<TemplateField[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [aiGeneratedContent, setAiGeneratedContent] = useState("")
  const { saveTemplate, updateTemplate } = useTemplates()
  const { toast } = useToast()

  const isEditing = !!templateId

  useEffect(() => {
    if (templateId) {
      const template = templateManager.getTemplate(templateId)
      if (template) {
        setName(template.name)
        setTitle(template.title)
        setContent(template.content)
        setFields(template.fields)
      }
    }
  }, [templateId])

  const generateWithAI = async () => {
    if (!title.trim()) {
      toast({
        title: "Título requerido",
        description: "Ingrese un título para generar contenido con IA",
        variant: "destructive",
      })
      return
    }

    setGeneratingAI(true)
    try {
      const response = await fetch("/api/generate-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: title.trim() }),
      })

      if (!response.ok) {
        throw new Error("Error al generar contenido")
      }

      const data = await response.json()
      setAiGeneratedContent(data.content)

      toast({
        title: "Contenido generado",
        description: "El contenido ha sido generado con IA. Puede editarlo o usarlo directamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el contenido con IA",
        variant: "destructive",
      })
    } finally {
      setGeneratingAI(false)
    }
  }

  const useAIContent = () => {
    setContent(aiGeneratedContent)
    setAiGeneratedContent("")
    toast({
      title: "Contenido aplicado",
      description: "El contenido generado por IA ha sido aplicado al documento",
    })
  }

  const discardAIContent = () => {
    setAiGeneratedContent("")
  }

  const addField = () => {
    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      type: "text",
      label: "Nuevo Campo",
      placeholder: "",
      required: false,
    }
    setFields([...fields, newField])
  }

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    const updatedFields = [...fields]
    updatedFields[index] = { ...updatedFields[index], ...updates }
    setFields(updatedFields)
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const insertFieldTag = (fieldId: string) => {
    const tag = `{{${fieldId}}}`
    setContent(content + tag)
  }

  const getPreviewContent = () => {
    let preview = content
    fields.forEach((field) => {
      const placeholder =
        field.type === "date"
          ? "01/01/2024"
          : field.type === "time"
            ? "14:30"
            : field.type === "patient_name"
              ? "Juan Pérez"
              : field.type === "patient_dni"
                ? "12.345.678"
                : `[${field.label}]`
      preview = preview.replace(new RegExp(`{{${field.id}}}`, "g"), placeholder)
    })
    return preview
  }

  const handleSave = async () => {
    if (!name.trim() || !title.trim() || !content.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Complete el nombre, título y contenido de la plantilla",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const templateData = {
        name: name.trim(),
        title: title.trim(),
        content: content.trim(),
        fields,
      }

      if (isEditing && templateId) {
        updateTemplate(templateId, templateData)
        toast({
          title: "Plantilla actualizada",
          description: "Los cambios se han guardado correctamente",
        })
      } else {
        saveTemplate(templateData)
        toast({
          title: "Plantilla creada",
          description: "La nueva plantilla se ha guardado correctamente",
        })
      }

      onSave()
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la plantilla",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button onClick={onCancel} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEditing ? "Editar Plantilla" : "Nueva Plantilla"}</h1>
            <p className="text-sm text-gray-600">
              {isEditing ? "Modifique los campos de la plantilla" : "Cree una nueva plantilla personalizada"}
            </p>
          </div>
        </div>

        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Configure el nombre y título de la plantilla</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la plantilla</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Certificado de Asistencia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Título del documento</Label>
              <div className="flex gap-2">
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: CERTIFICADO DE ASISTENCIA"
                  className="flex-1"
                />
                <Button
                  onClick={generateWithAI}
                  disabled={generatingAI || !title.trim()}
                  variant="outline"
                  size="sm"
                  className="shrink-0 bg-transparent"
                >
                  {generatingAI ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Ingrese un título y haga clic en ✨ para generar contenido con IA</p>
            </div>
          </CardContent>
        </Card>

        {aiGeneratedContent && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Contenido Generado por IA
              </CardTitle>
              <CardDescription className="text-blue-700">
                Revise y edite el contenido generado antes de usarlo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={aiGeneratedContent}
                onChange={(e) => setAiGeneratedContent(e.target.value)}
                className="min-h-[150px] bg-white border-blue-200 focus:border-blue-400"
                placeholder="Contenido generado por IA..."
              />
              <div className="flex gap-2 flex-wrap">
                <Button onClick={useAIContent} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Usar este contenido
                </Button>
                <Button onClick={generateWithAI} disabled={generatingAI || !title.trim()} variant="outline" size="sm">
                  {generatingAI ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Regenerando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerar
                    </>
                  )}
                </Button>
                <Button onClick={discardAIContent} variant="outline" size="sm">
                  Descartar
                </Button>
              </div>
              <p className="text-xs text-blue-600">Puede editar el texto generado antes de aplicarlo al documento</p>
            </CardContent>
          </Card>
        )}

        {/* Campos dinámicos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Campos del Documento</CardTitle>
                <CardDescription>Configure los campos que se completarán al generar el documento</CardDescription>
              </div>
              <Button onClick={addField} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Campo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{field.type}</Badge>
                  <Button onClick={() => removeField(index)} variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Etiqueta</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      placeholder="Nombre del campo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value: TemplateField["type"]) => updateField(index, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="patient_name">Nombre del Paciente</SelectItem>
                        <SelectItem value="patient_dni">DNI del Paciente</SelectItem>
                        <SelectItem value="date">Fecha</SelectItem>
                        <SelectItem value="time">Hora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={() => insertFieldTag(field.id)} variant="outline" size="sm">
                    Insertar en contenido
                  </Button>
                  <Badge variant="secondary">{"{{" + field.id + "}}"}</Badge>
                </div>
              </div>
            ))}

            {fields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No hay campos configurados</p>
                <p className="text-sm">Agregue campos para personalizar su documento</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contenido del documento */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contenido del Documento</CardTitle>
                <CardDescription>
                  Escriba el contenido usando las etiquetas de los campos (ej: {"{{patient_name}}"})
                </CardDescription>
              </div>
              <Button onClick={() => setShowPreview(!showPreview)} variant="outline" size="sm">
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? "Ocultar" : "Vista Previa"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showPreview ? (
              <div className="p-4 bg-gray-50 rounded-lg border min-h-[200px] whitespace-pre-wrap font-mono text-sm">
                <div className="font-bold text-center mb-4">{title}</div>
                {getPreviewContent()}
              </div>
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escriba el contenido del documento aquí..."
                className="min-h-[200px] font-mono"
              />
            )}
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : isEditing ? "Actualizar Plantilla" : "Crear Plantilla"}
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}

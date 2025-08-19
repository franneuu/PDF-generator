"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Edit, FileText, Copy, Trash2, Plus, Search } from "lucide-react"
import type { Template } from "@/lib/template-manager"
import { useTemplates } from "@/hooks/use-templates"
import { useToast } from "@/hooks/use-toast"

interface TemplateListProps {
  templates: Template[]
  onEdit: (templateId: string) => void
  onGenerate: (templateId: string) => void
  onCreateNew: () => void
  onBack: () => void
}

export function TemplateList({ templates, onEdit, onGenerate, onCreateNew, onBack }: TemplateListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { deleteTemplate, duplicateTemplate } = useTemplates()
  const { toast } = useToast()

  const handleDelete = (templateId: string, templateName: string) => {
    const success = deleteTemplate(templateId)
    if (success) {
      toast({
        title: "Plantilla eliminada",
        description: `La plantilla "${templateName}" ha sido eliminada`,
      })
    }
  }

  const handleDuplicate = (templateId: string) => {
    const duplicated = duplicateTemplate(templateId)
    if (duplicated) {
      toast({
        title: "Plantilla duplicada",
        description: `Se ha creado una copia de la plantilla`,
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Inicio
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Plantillas</h1>
              <p className="text-sm text-gray-600">
                {filteredTemplates.length} de {templates.length} plantilla{templates.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button onClick={onCreateNew} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Nueva
          </Button>
        </div>

        {templates.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {templates.length > 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{templates.length}</div>
                  <div className="text-sm text-gray-600">Plantillas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {templates.reduce((sum, t) => sum + t.fields.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Campos Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {templates.filter((t) => t.updatedAt !== t.createdAt).length}
                  </div>
                  <div className="text-sm text-gray-600">Modificadas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de plantillas */}
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.title}</CardDescription>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Creada: {formatDate(template.createdAt)}</span>
                      {template.updatedAt !== template.createdAt && (
                        <span>• Modificada: {formatDate(template.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">{template.fields.length} campos</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Preview del contenido */}
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 line-clamp-3">
                    {template.content.substring(0, 150)}
                    {template.content.length > 150 && "..."}
                  </div>

                  {/* Campos */}
                  <div className="flex flex-wrap gap-2">
                    {template.fields.slice(0, 4).map((field) => (
                      <Badge key={field.id} variant="outline" className="text-xs">
                        {field.label}
                      </Badge>
                    ))}
                    {template.fields.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.fields.length - 4} más
                      </Badge>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onGenerate(template.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Generar PDF
                    </Button>
                    <Button onClick={() => onEdit(template.id)} variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => handleDuplicate(template.id)} variant="outline" size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar Plantilla</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Está seguro de eliminar la plantilla "{template.name}"? Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(template.id, template.name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredTemplates.length === 0 && templates.length > 0 && (
            <Card className="shadow-lg">
              <CardContent className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">No se encontraron plantillas</h3>
                  <p className="text-sm text-gray-600 mt-1">Intente con otros términos de búsqueda</p>
                </div>
                <Button onClick={() => setSearchTerm("")} variant="outline">
                  Limpiar búsqueda
                </Button>
              </CardContent>
            </Card>
          )}

          {templates.length === 0 && (
            <Card className="shadow-lg">
              <CardContent className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">No hay plantillas</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Cree su primera plantilla para comenzar a generar documentos
                  </p>
                </div>
                <Button onClick={onCreateNew} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Plantilla
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus, List, Download } from "lucide-react"
import { useTemplates } from "@/hooks/use-templates"
import { TemplateList } from "@/components/template-list"
import { TemplateEditor } from "@/components/template-editor"
import { DocumentGenerator } from "@/components/document-generator"

type View = "home" | "templates" | "editor" | "generator"

export default function KinesioPDFGenerator() {
  const [currentView, setCurrentView] = useState<View>("home")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const { templates, loading } = useTemplates()

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[v0] SW registered: ", registration)
        })
        .catch((registrationError) => {
          console.log("[v0] SW registration failed: ", registrationError)
        })
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log("[v0] User response to install prompt: ", outcome)
      setDeferredPrompt(null)
      setShowInstallButton(false)
    }
  }

  const handleCreateTemplate = () => {
    setSelectedTemplateId(null)
    setCurrentView("editor")
  }

  const handleEditTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId)
    setCurrentView("editor")
  }

  const handleGenerateDocument = (templateId: string) => {
    setSelectedTemplateId(templateId)
    setCurrentView("generator")
  }

  const handleBackToHome = () => {
    setCurrentView("home")
    setSelectedTemplateId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando plantillas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-safe">
      {currentView === "home" && (
        <div className="p-4 pb-8">
          <div className="max-w-sm mx-auto space-y-6">
            <div className="text-center space-y-4 pt-8 pb-4">
              <img
                src="/images/logo-espacio-kinesio.png"
                alt="Espacio Kinesio Logo"
                className="w-24 h-24 mx-auto rounded-2xl shadow-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Espacio Kinesio</h1>
                <p className="text-sm text-gray-600">Generador de Documentos Médicos</p>
              </div>
            </div>

            {showInstallButton && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4 pb-4">
                  <Button
                    onClick={handleInstallApp}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Instalar Aplicación
                  </Button>
                  <p className="text-xs text-blue-700 text-center mt-2">Instala la app para usarla sin conexión</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Gestión de Documentos
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Cree y administre plantillas personalizadas para sus documentos médicos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <Button
                    onClick={() => setCurrentView("templates")}
                    className="w-full h-14 text-base bg-green-600 hover:bg-green-700 touch-manipulation"
                    size="lg"
                  >
                    <List className="w-5 h-5 mr-2" />
                    Ver Plantillas ({templates.length})
                  </Button>

                  <Button
                    onClick={handleCreateTemplate}
                    variant="outline"
                    className="w-full h-14 text-base bg-transparent border-2 touch-manipulation"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Crear Nueva Plantilla
                  </Button>
                </CardContent>
              </Card>

              {templates.length > 0 && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6 pb-6">
                    <div className="text-center space-y-3">
                      <h3 className="font-semibold text-green-900">Acceso Rápido</h3>
                      <Button
                        onClick={() => handleGenerateDocument(templates[0].id)}
                        className="w-full h-12 bg-green-600 hover:bg-green-700 touch-manipulation"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Generar con "{templates[0].name}"
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {currentView === "templates" && (
        <TemplateList
          templates={templates}
          onEdit={handleEditTemplate}
          onGenerate={handleGenerateDocument}
          onCreateNew={handleCreateTemplate}
          onBack={handleBackToHome}
        />
      )}

      {currentView === "editor" && (
        <TemplateEditor templateId={selectedTemplateId} onSave={handleBackToHome} onCancel={handleBackToHome} />
      )}

      {currentView === "generator" && selectedTemplateId && (
        <DocumentGenerator templateId={selectedTemplateId} onBack={handleBackToHome} />
      )}
    </div>
  )
}

export interface TemplateField {
  id: string
  type: "text" | "date" | "time" | "patient_name" | "patient_dni"
  label: string
  placeholder?: string
  required?: boolean
}

export interface Template {
  id: string
  name: string
  title: string
  content: string
  fields: TemplateField[]
  createdAt: string
  updatedAt: string
}

export const DEFAULT_TEMPLATE: Template = {
  id: "default-certificate",
  name: "Certificado de Asistencia",
  title: "CERTIFICADO DE ASISTENCIA",
  content: `Buenos Aires, {{date}}

El presente documento certifica la asistencia del Paciente "{{patient_name}}" DNI "{{patient_dni}}" a sesiones de kinesiología el día de la fecha a las {{time}}.

Sin otro particular, saludo a Ud. atentamente.`,
  fields: [
    { id: "patient_name", type: "patient_name", label: "Nombre del Paciente", required: true },
    { id: "patient_dni", type: "patient_dni", label: "DNI del Paciente", required: true },
    { id: "date", type: "date", label: "Fecha", required: true },
    { id: "time", type: "time", label: "Hora de la sesión", placeholder: "14:30", required: true },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

class TemplateManager {
  private storageKey = "kinesio-templates"

  getTemplates(): Template[] {
    if (typeof window === "undefined") return [DEFAULT_TEMPLATE]

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) {
        // Inicializar con plantilla por defecto
        this.saveTemplates([DEFAULT_TEMPLATE])
        return [DEFAULT_TEMPLATE]
      }
      return JSON.parse(stored)
    } catch (error) {
      console.error("Error loading templates:", error)
      return [DEFAULT_TEMPLATE]
    }
  }

  saveTemplates(templates: Template[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(templates))
    } catch (error) {
      console.error("Error saving templates:", error)
    }
  }

  getTemplate(id: string): Template | undefined {
    return this.getTemplates().find((template) => template.id === id)
  }

  saveTemplate(template: Omit<Template, "id" | "createdAt" | "updatedAt">): Template {
    const templates = this.getTemplates()
    const newTemplate: Template = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    templates.push(newTemplate)
    this.saveTemplates(templates)
    return newTemplate
  }

  updateTemplate(id: string, updates: Partial<Omit<Template, "id" | "createdAt">>): Template | null {
    const templates = this.getTemplates()
    const index = templates.findIndex((template) => template.id === id)

    if (index === -1) return null

    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.saveTemplates(templates)
    return templates[index]
  }

  deleteTemplate(id: string): boolean {
    const templates = this.getTemplates()
    const filteredTemplates = templates.filter((template) => template.id !== id)

    if (filteredTemplates.length === templates.length) return false

    this.saveTemplates(filteredTemplates)
    return true
  }

  duplicateTemplate(id: string): Template | null {
    const template = this.getTemplate(id)
    if (!template) return null

    return this.saveTemplate({
      name: `${template.name} (Copia)`,
      title: template.title,
      content: template.content,
      fields: [...template.fields],
    })
  }
}

export const templateManager = new TemplateManager()

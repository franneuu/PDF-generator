"use client"

import { useState, useEffect } from "react"
import { type Template, templateManager } from "@/lib/template-manager"

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  const loadTemplates = () => {
    setLoading(true)
    try {
      const loadedTemplates = templateManager.getTemplates()
      setTemplates(loadedTemplates)
    } catch (error) {
      console.error("Error loading templates:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const saveTemplate = (template: Omit<Template, "id" | "createdAt" | "updatedAt">) => {
    const newTemplate = templateManager.saveTemplate(template)
    loadTemplates()
    return newTemplate
  }

  const updateTemplate = (id: string, updates: Partial<Omit<Template, "id" | "createdAt">>) => {
    const updatedTemplate = templateManager.updateTemplate(id, updates)
    if (updatedTemplate) {
      loadTemplates()
    }
    return updatedTemplate
  }

  const deleteTemplate = (id: string) => {
    const success = templateManager.deleteTemplate(id)
    if (success) {
      loadTemplates()
    }
    return success
  }

  const duplicateTemplate = (id: string) => {
    const duplicated = templateManager.duplicateTemplate(id)
    if (duplicated) {
      loadTemplates()
    }
    return duplicated
  }

  return {
    templates,
    loading,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    refreshTemplates: loadTemplates,
  }
}

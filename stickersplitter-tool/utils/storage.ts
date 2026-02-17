
import { PromptTemplate } from '../types';

const STORAGE_KEY = 'sticker-prompt-templates-v1';

export function loadTemplates(): PromptTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTemplates(templates: PromptTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function addTemplate(template: PromptTemplate): PromptTemplate[] {
  const templates = loadTemplates();
  templates.push(template);
  saveTemplates(templates);
  return templates;
}

export function updateTemplate(updated: PromptTemplate): PromptTemplate[] {
  const templates = loadTemplates().map(t => t.id === updated.id ? updated : t);
  saveTemplates(templates);
  return templates;
}

export function deleteTemplate(id: string): PromptTemplate[] {
  const templates = loadTemplates().filter(t => t.id !== id);
  saveTemplates(templates);
  return templates;
}

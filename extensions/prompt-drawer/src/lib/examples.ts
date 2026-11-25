import type { SupportedLocale } from '@browser-extensions/shared';
import type { Prompt } from './storage';
import { extractVariables } from './variables';

export interface ExampleTemplate {
  title: string;
  body: string;
  tags: string[];
}

const EXAMPLES: Record<SupportedLocale, ExampleTemplate[]> = {
  es: [
    {
      title: 'Redactar correo profesional',
      body: 'Redacta un correo {{tono}} para {{destinatario}} sobre {{asunto}}. Incluye estos puntos clave: {{puntos_clave}}.',
      tags: ['correo', 'trabajo', 'redacción'],
    },
    {
      title: 'Resumir texto o artículo',
      body: 'Resume el siguiente texto en {{formato}} destacando {{cantidad}} ideas principales, con lenguaje claro para {{publico}}:\n\n{{texto}}',
      tags: ['resumen', 'lectura', 'productividad'],
    },
    {
      title: 'Explicar un tema fácil',
      body: 'Explícame qué es {{tema}} como si tuviera nivel {{nivel}}, usando un ejemplo cotidiano en máximo {{lineas}} líneas.',
      tags: ['estudio', 'aprendizaje'],
    },
    {
      title: 'Agenda de reunión',
      body: 'Crea una agenda de {{duracion}} minutos para una reunión sobre {{objetivo}} con {{participantes}}. Incluye tiempos y próximos pasos.',
      tags: ['reunión', 'organización'],
    },
    {
      title: 'Mejorar o revisar texto',
      body: 'Revisa el siguiente texto, corrige ortografía y hazlo más {{estilo}} manteniendo el mensaje original:\n\n{{texto}}',
      tags: ['escritura', 'edición'],
    },
  ],
  en: [
    {
      title: 'Write a professional email',
      body: 'Write a {{tone}} email to {{recipient}} about {{subject}}. Include these key points: {{key_points}}.',
      tags: ['email', 'work', 'writing'],
    },
    {
      title: 'Summarize text or article',
      body: 'Summarize the following text in {{format}} highlighting {{count}} main ideas, using clear language for {{audience}}:\n\n{{text}}',
      tags: ['summary', 'reading', 'productivity'],
    },
    {
      title: 'Explain a topic simply',
      body: 'Explain what {{topic}} is as if I am at a {{level}} level, using an everyday example in at most {{lines}} lines.',
      tags: ['study', 'learning'],
    },
    {
      title: 'Meeting agenda',
      body: 'Create a {{duration}}-minute meeting agenda about {{goal}} with {{participants}}. Include time blocks and next steps.',
      tags: ['meeting', 'planning'],
    },
    {
      title: 'Polish or proofread text',
      body: 'Review the following text, fix grammar, and make it more {{style}} while keeping the original meaning:\n\n{{text}}',
      tags: ['writing', 'editing'],
    },
  ],
};

/**
 * Returns localized general-purpose example prompt templates.
 */
export function getExampleTemplates(locale: SupportedLocale): ExampleTemplate[] {
  return EXAMPLES[locale] || EXAMPLES.es;
}

/**
 * Finds the index of an unmodified built-in example template in either locale.
 */
export function findExampleIndex(prompt: Pick<Prompt, 'title' | 'body'>): number {
  const title = prompt.title.trim();
  const body = prompt.body.trim();

  for (const locale of ['es', 'en'] as const) {
    const idx = EXAMPLES[locale].findIndex(
      (ex) => ex.title.trim() === title && ex.body.trim() === body
    );
    if (idx !== -1) {
      return idx;
    }
  }
  return -1;
}

/**
 * Translates unmodified built-in example prompts to the target locale.
 */
export function syncExamplesLocale(
  prompts: Prompt[],
  targetLocale: SupportedLocale
): { prompts: Prompt[]; changed: boolean } {
  const targetList = getExampleTemplates(targetLocale);
  let changed = false;

  const nextPrompts = prompts.map((prompt) => {
    const idx = findExampleIndex(prompt);
    if (idx === -1) return prompt;

    const target = targetList[idx];
    if (!target) return prompt;

    if (prompt.title === target.title && prompt.body === target.body) {
      return prompt;
    }

    changed = true;
    return {
      ...prompt,
      title: target.title,
      body: target.body,
      tags: [...target.tags],
      variables: extractVariables(target.body),
    };
  });

  return { prompts: nextPrompts, changed };
}

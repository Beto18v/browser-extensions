export interface PromptVariable {
  name: string;
  placeholder?: string;
}

const VARIABLE_REGEX = /\{\{\s*([^{}]+?)\s*\}\}/g;

/**
 * Extracts unique {{variable}} placeholders from a prompt body in order of appearance.
 */
export function extractVariables(body: string): PromptVariable[] {
  const seen = new Set<string>();
  const variables: PromptVariable[] = [];

  for (const match of body.matchAll(VARIABLE_REGEX)) {
    const raw = match[1];
    if (!raw) continue;
    const name = raw.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      variables.push({ name });
    }
  }

  return variables;
}

/**
 * Checks whether a prompt body contains at least one {{variable}} placeholder.
 */
export function hasVariables(body: string): boolean {
  return extractVariables(body).length > 0;
}

/**
 * Replaces all {{variable}} placeholders in body with the provided values.
 */
export function resolveVariables(body: string, values: Record<string, string>): string {
  return body.replace(VARIABLE_REGEX, (_match, rawName: string) => {
    const name = rawName.trim();
    return Object.prototype.hasOwnProperty.call(values, name) ? (values[name] ?? '') : '';
  });
}

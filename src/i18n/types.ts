export type Locale = 'zh' | 'en';

export type TranslationDict = Record<string, string>;

/**
 * Interpolate `{param}` placeholders in a translated string.
 * Example: t('hello', { name: 'World' }) with template 'Hello {name}' → 'Hello World'
 */
export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = params[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}

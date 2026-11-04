/** Text of the model's answer as a JSON object, tolerating code fences, prose around it and raw newlines. */
export function parseModelJson(raw: string): Record<string, unknown> {
  let text = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) text = text.substring(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(text);
  } catch {
    // Сырые переносы строк внутри строк JSON — частая ошибка моделей.
    const fixed = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/"((?:[^"\\]|\\.)*)"/g, (_m: string, inner: string) =>
        `"${inner.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}"`);
    return JSON.parse(fixed);
  }
}

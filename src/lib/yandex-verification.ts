export function yandexVerificationOther(
  env: Record<string, string | undefined> = process.env,
): { yandex: string } | undefined {
  const code = env.YANDEX_VERIFICATION?.trim();
  return code && /^[a-z0-9]+$/i.test(code) ? { yandex: code } : undefined;
}

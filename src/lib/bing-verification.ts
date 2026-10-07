/**
 * Bing Webmaster Tools site verification (<meta name="msvalidate.01">).
 * Not needed if the site was added to Bing by importing it from Google Search Console.
 * The code comes from BING_SITE_VERIFICATION; anything that is not a plain token is ignored.
 */
export function bingVerificationOther(
  env: Record<string, string | undefined> = process.env,
): { 'msvalidate.01': string } | undefined {
  const code = env.BING_SITE_VERIFICATION?.trim();
  return code && /^[A-Za-z0-9]{16,64}$/.test(code) ? { 'msvalidate.01': code } : undefined;
}

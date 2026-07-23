import "server-only";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string, remoteIp: string, secret: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp !== "unknown") body.set("remoteip", remoteIp);
    const response = await fetch(VERIFY_URL, { method: "POST", body, signal: controller.signal });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch { return false; }
  finally { clearTimeout(timeout); }
}

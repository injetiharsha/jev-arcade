import "server-only";
import crypto from "node:crypto";

const COOKIE_SECRET =
  process.env.COOKIE_SECRET ||
  process.env.TYPESAFE_API_KEY ||
  "jev_arcade_default_session_crypto_secret_32bytes!";

// Derive 32-byte key using SHA-256
const ENCRYPTION_KEY = crypto.createHash("sha256").update(COOKIE_SECRET).digest();
const ALGORITHM = "aes-256-gcm";

/**
 * Validates the syntactic format of a user-provided TypeSafe API key.
 * Never logs the key or echoes it back.
 */
export function validateKeyFormat(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();
  // Minimum sanity check: at least 20 chars, alphanumeric with underscores/hyphens
  if (trimmed.length < 20 || trimmed.length > 256) return false;
  return /^[a-zA-Z0-9_\-]+$/.test(trimmed);
}

/**
 * Encrypts a user API key using AES-256-GCM for storage in an httpOnly session cookie.
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(apiKey.trim(), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a user API key from an encrypted session token.
 */
export async function decryptApiKey(token: string): Promise<string | null> {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return null;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    return null;
  }
}

/**
 * Tests an API key against TypeSafe Jev API before accepting it.
 * Never logs the key value.
 */
export async function testApiKeyWithJev(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        state: "System auth validation probe",
        instructions: "Return 1",
        criteria: { "1": "Valid" },
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      return { valid: true };
    }

    if (res.status === 401 || res.status === 403) {
      return { valid: false, error: "Invalid API key or unauthorized access." };
    }

    return { valid: false, error: `TypeSafe API returned status ${res.status}.` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return { valid: false, error: `Could not reach TypeSafe API (${message}).` };
  }
}

/**
 * Computes a lightweight client fingerprint (IP /24 prefix + User-Agent hash).
 * Serves as a soft deterrent against repeated free-trial resets.
 */
export function computeClientFingerprint(
  ip: string | null | undefined,
  userAgent: string | null | undefined,
  acceptLang: string | null | undefined
): string {
  // Normalize IP to /24 subnet for IPv4 to tolerate dynamic ISP rotation
  let normalizedIp = ip || "unknown_ip";
  if (normalizedIp.includes(".")) {
    const parts = normalizedIp.split(".");
    if (parts.length === 4) {
      normalizedIp = `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }

  const raw = `${normalizedIp}|${userAgent || "unknown_ua"}|${acceptLang || "unknown_lang"}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

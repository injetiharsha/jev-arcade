/**
 * Generates a 13-character Reference ID in the format:
 * DDMMYY + HHMMSS (12-hour, zero-padded) + A/P
 *
 * Example: Sep 21 2026, 9:12:23 AM -> "210926091223A"
 * Example: Sep 21 2026, 2:05:09 PM -> "210926020509P"
 */
export function generateReferenceId(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  const hours24 = date.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const hoursStr = String(hours12).padStart(2, "0");
  const minStr = String(date.getMinutes()).padStart(2, "0");
  const secStr = String(date.getSeconds()).padStart(2, "0");
  const amPm = hours24 >= 12 ? "P" : "A";

  return `${day}${month}${year}${hoursStr}${minStr}${secStr}${amPm}`;
}

const SESSION_STORAGE_KEY = "jev_arcade_session_id";

/**
 * Retrieves the existing session ID from localStorage or creates a new one.
 * Also sets a client cookie for server-side association.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return generateReferenceId();
  }

  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = generateReferenceId();
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }

  // Set cookie with 30-day expiration
  document.cookie = `jev_session_id=${sessionId}; path=/; max-age=2592000; SameSite=Lax`;

  return sessionId;
}

/**
 * Clears the session identifier from localStorage and deletes the session cookie.
 */
export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    document.cookie = "jev_session_id=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  }
}

/**
 * Creates a unique game ID for an individual puzzle or match.
 */
export function generateGameId(): string {
  return generateReferenceId();
}

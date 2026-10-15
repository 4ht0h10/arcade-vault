// Mock session + score storage in localStorage. Client-only.

export type SessionUser = { name: string };
export type SavedScore = { game: string; score: number; name: string; at: number };

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

export function readUser(): SessionUser | null {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    return user && typeof user.name === "string" ? { name: user.name } : null;
  } catch {
    return null;
  }
}

export function writeUser(user: SessionUser): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
  notifyUser();
}

export function clearUser(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {}
  notifyUser();
}

// External-store adapter for useSyncExternalStore.
const userListeners = new Set<() => void>();
let cachedUser: SessionUser | null = null;
let cachedRaw: string | null = null;

function notifyUser() {
  userListeners.forEach((listener) => listener());
}

export function subscribeUser(listener: () => void): () => void {
  userListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    userListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// Returns the same object while the stored value is unchanged.
export function getUserSnapshot(): SessionUser | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(USER_KEY);
  } catch {}
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedUser = readUser();
  }
  return cachedUser;
}

export function appendScore(entry: Omit<SavedScore, "at">): void {
  try {
    const stored = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
    const all: SavedScore[] = Array.isArray(stored) ? stored : [];
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(SCORES_KEY, JSON.stringify(all));
  } catch {}
}

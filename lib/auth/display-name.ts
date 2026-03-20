const BLOCKED_NAME_MARKERS = ["fuck", "shit", "bitch", "kurw", "chuj", "nigger", "hitler", "naz", "porn", "sex"];

type UserMetadataLike = Record<string, unknown> | null | undefined;

function normalizeForModeration(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function readString(metadata: UserMetadataLike, key: string): string {
  if (!metadata) {
    return "";
  }

  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

export function sanitizeDisplayNameInput(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}

export function isSafeDisplayNameCandidate(value: string): boolean {
  const trimmed = sanitizeDisplayNameInput(value);

  if (trimmed.length < 2 || trimmed.length > 24) {
    return false;
  }

  if (!/^[A-Za-zÀ-ÖØ-öø-ÿĀ-ſ .'-]+$/u.test(trimmed)) {
    return false;
  }

  const normalized = normalizeForModeration(trimmed);

  if (normalized.length < 2) {
    return false;
  }

  return !BLOCKED_NAME_MARKERS.some((item) => normalized.includes(item));
}

export function hasConfiguredDisplayName(metadata: UserMetadataLike): boolean {
  return isSafeDisplayNameCandidate(readString(metadata, "display_name"));
}

export function resolveDisplayNameFromMetadata(metadata: UserMetadataLike, fallback = "Ty"): string {
  const fromMetadata = [
    readString(metadata, "display_name"),
    readString(metadata, "first_name"),
    readString(metadata, "name"),
    readString(metadata, "full_name"),
  ]
    .map((value) => sanitizeDisplayNameInput(value))
    .find((value) => value.length > 0 && isSafeDisplayNameCandidate(value));

  if (!fromMetadata) {
    return fallback;
  }

  const firstToken = fromMetadata.split(" ").find((chunk) => chunk.trim().length > 0) ?? fromMetadata;
  return isSafeDisplayNameCandidate(firstToken) ? firstToken : fallback;
}

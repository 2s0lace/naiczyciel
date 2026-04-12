export const AVATAR_PRESETS = [
  {
    key: "avatar-1",
    file: "micah-1773257983795.svg",
    src: "/avatars/micah-1773257983795.svg",
  },
  {
    key: "avatar-2",
    file: "micah-1773258091365.svg",
    src: "/avatars/micah-1773258091365.svg",
  },
  {
    key: "avatar-3",
    file: "micah-1773257806356.svg",
    src: "/avatars/micah-1773257806356.svg",
  },
  {
    key: "avatar-4",
    file: "micah-1773257773888.svg",
    src: "/avatars/micah-1773257773888.svg",
  },
] as const;

export type AvatarKey = (typeof AVATAR_PRESETS)[number]["key"];

export const DEFAULT_AVATAR_KEY: AvatarKey = "avatar-1";

const AVATAR_KEYS = new Set<AvatarKey>(AVATAR_PRESETS.map((item) => item.key));

export function isAvatarKey(value: unknown): value is AvatarKey {
  return typeof value === "string" && AVATAR_KEYS.has(value as AvatarKey);
}

export function normalizeAvatarKey(value: unknown): AvatarKey | null {
  return isAvatarKey(value) ? value : null;
}

export function resolveAvatarSrc(key: AvatarKey | null | undefined): string {
  const normalized = key && isAvatarKey(key) ? key : DEFAULT_AVATAR_KEY;
  return AVATAR_PRESETS.find((item) => item.key === normalized)?.src ?? AVATAR_PRESETS[0].src;
}

export type E8SetDefinition = {
  id: string;
  mode: string;
  title: string;
  subtitle: string;
  questionCount: number;
  questionIds?: string[];
};

export const ACCESS_TIERS = ["unregistered", "registered", "premium", "premium_plus"] as const;
export type AccessTier = (typeof ACCESS_TIERS)[number];

export type SetAccessConfig = {
  tiers: Record<AccessTier, string[]>;
  updated_at: string;
};

export type SetCatalogSnapshot = {
  sets: E8SetDefinition[];
  config: SetAccessConfig;
};

export const BUILTIN_MOCK_SET_IDS = ["set_mock_reading_mc", "set_mock_gap_fill_text"] as const;

// Internal catalog for randomized quiz start.
export const E8_SET_SLOTS: E8SetDefinition[] = [
  {
    id: "set_reactions_core",
    mode: "reactions",
    title: "Reakcje codzienne",
    subtitle: "Naturalne odpowiedzi i szybki feedback.",
    questionCount: 10,
  },
  {
    id: "set_vocabulary_core",
    mode: "vocabulary",
    title: "Slownictwo E8",
    subtitle: "Krotkie zadania na znaczenie i kontekst.",
    questionCount: 10,
  },
  {
    id: "set_grammar_core",
    mode: "grammar",
    title: "Gramatyka E8",
    subtitle: "Najczestsze struktury z egzaminu.",
    questionCount: 10,
  },
  {
    id: "set_mock_reading_mc",
    mode: "reading_mc",
    title: "Mock reading_mc",
    subtitle: "Mockowy zestaw czytania z 2 pytaniami.",
    questionCount: 2,
  },
  {
    id: "set_mock_gap_fill_text",
    mode: "gap_fill_text",
    title: "Mock gap_fill_text",
    subtitle: "Mockowy zestaw uzupelniania tekstu z 2 lukami.",
    questionCount: 2,
  },
];

const DEFAULT_UNREGISTERED_COUNT = 1;
const DEFAULT_REGISTERED_COUNT = 3;
const FALLBACK_MODE = "reactions";

type GlobalWithSetAccessConfig = typeof globalThis & {
  __naiczycielSetAccessConfig?: SetAccessConfig;
  __naiczycielSetSlots?: E8SetDefinition[];
};

function isBuiltinMockSetId(setId: string): setId is (typeof BUILTIN_MOCK_SET_IDS)[number] {
  return (BUILTIN_MOCK_SET_IDS as readonly string[]).includes(setId);
}

function nowIso() {
  return new Date().toISOString();
}

function cloneConfig(value: SetAccessConfig): SetAccessConfig {
  return JSON.parse(JSON.stringify(value)) as SetAccessConfig;
}

function cloneSetSlots(value: E8SetDefinition[]): E8SetDefinition[] {
  return JSON.parse(JSON.stringify(value)) as E8SetDefinition[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeMode(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeQuestionIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const seen = new Set<string>();
  const next: string[] = [];

  for (const value of raw) {
    const id = typeof value === "string" ? value.trim() : "";

    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);
    next.push(id);
  }

  return next;
}

function pickRandom(items: string[]): string {
  if (items.length === 0) {
    return FALLBACK_MODE;
  }

  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? FALLBACK_MODE;
}

function uniqueModes(items: string[]): string[] {
  return items.filter((mode, index, list) => mode.length > 0 && list.indexOf(mode) === index);
}

function mergeBuiltinMockSlots(slots: E8SetDefinition[]): E8SetDefinition[] {
  const next = cloneSetSlots(slots);
  const existingIds = new Set(next.map((slot) => slot.id));
  const builtinMocks = E8_SET_SLOTS.filter((slot) => isBuiltinMockSetId(slot.id));

  for (const mockSlot of builtinMocks) {
    if (!existingIds.has(mockSlot.id)) {
      next.push(cloneSetSlots([mockSlot])[0]);
    }
  }

  return next;
}

function ensureRuntimeSetSlots(root: GlobalWithSetAccessConfig): E8SetDefinition[] {
  if (!Array.isArray(root.__naiczycielSetSlots)) {
    root.__naiczycielSetSlots = mergeBuiltinMockSlots(cloneSetSlots(E8_SET_SLOTS));
  }

  return root.__naiczycielSetSlots;
}

function setRuntimeSetSlots(nextSlots: E8SetDefinition[]) {
  const root = globalThis as GlobalWithSetAccessConfig;
  root.__naiczycielSetSlots = mergeBuiltinMockSlots(nextSlots);
}

export function getSetSlots(): E8SetDefinition[] {
  const root = globalThis as GlobalWithSetAccessConfig;
  return cloneSetSlots(ensureRuntimeSetSlots(root));
}

function sanitizeSetSlots(raw: unknown, options?: { allowEmpty?: boolean }): E8SetDefinition[] {
  if (!Array.isArray(raw)) {
    return cloneSetSlots(E8_SET_SLOTS);
  }

  const seen = new Set<string>();
  const next: E8SetDefinition[] = [];

  for (const entry of raw) {
    const record = asRecord(entry);
    const id = typeof record?.id === "string" ? record.id.trim() : "";

    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);

    next.push({
      id,
      mode: typeof record?.mode === "string" && record.mode.trim() ? record.mode.trim() : FALLBACK_MODE,
      title: typeof record?.title === "string" && record.title.trim() ? record.title.trim() : id,
      subtitle: typeof record?.subtitle === "string" ? record.subtitle.trim() : "",
      questionCount: Number.isFinite(Number(record?.questionCount))
        ? Math.max(1, Math.round(Number(record?.questionCount)))
        : 10,
      questionIds: normalizeQuestionIds(record?.questionIds),
    });
  }

  if (next.length > 0) {
    return next;
  }

  return options?.allowEmpty ? [] : cloneSetSlots(E8_SET_SLOTS);
}

export function getSetCatalogSnapshot(): SetCatalogSnapshot {
  return {
    sets: getSetSlots(),
    config: getSetAccessConfig(),
  };
}

export function applySetCatalogSnapshot(raw: {
  sets?: unknown;
  config?: unknown;
}): SetCatalogSnapshot {
  const root = globalThis as GlobalWithSetAccessConfig;
  const nextSets = mergeBuiltinMockSlots(sanitizeSetSlots(raw.sets, { allowEmpty: Array.isArray(raw.sets) }));
  setRuntimeSetSlots(nextSets);
  root.__naiczycielSetAccessConfig = getDefaultSetAccessConfig();

  if (raw.config !== undefined) {
    updateSetAccessConfig(raw.config);
  }

  return getSetCatalogSnapshot();
}

function getDefaultSetIds(count: number): string[] {
  return getSetSlots()
    .slice(0, count)
    .map((item) => item.id);
}

function sanitizeTierSetIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const validSetIds = new Set(getSetSlots().map((item) => item.id));

  return raw
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index && validSetIds.has(entry));
}

function appendMissingSetIds(ids: string[], requiredIds: readonly string[]): string[] {
  const next = [...ids];

  for (const setId of requiredIds) {
    if (!next.includes(setId)) {
      next.push(setId);
    }
  }

  return next;
}

export function getDefaultSetAccessConfig(): SetAccessConfig {
  const allSetIds = getDefaultSetIds(getSetSlots().length);
  const mockSetIds = BUILTIN_MOCK_SET_IDS.filter((setId) => allSetIds.includes(setId));

  return {
    tiers: {
      unregistered: appendMissingSetIds(getDefaultSetIds(DEFAULT_UNREGISTERED_COUNT), mockSetIds),
      registered: appendMissingSetIds(getDefaultSetIds(DEFAULT_REGISTERED_COUNT), mockSetIds),
      premium: appendMissingSetIds(allSetIds, mockSetIds),
      premium_plus: appendMissingSetIds(allSetIds, mockSetIds),
    },
    updated_at: nowIso(),
  };
}

export function getSetAccessConfig(): SetAccessConfig {
  const root = globalThis as GlobalWithSetAccessConfig;

  if (!root.__naiczycielSetAccessConfig) {
    root.__naiczycielSetAccessConfig = getDefaultSetAccessConfig();
  }

  return cloneConfig(root.__naiczycielSetAccessConfig);
}

export function updateSetAccessConfig(raw: unknown): SetAccessConfig {
  const root = globalThis as GlobalWithSetAccessConfig;
  const current = getSetAccessConfig();
  const record = asRecord(raw);
  const tierRecord = asRecord(record?.tiers) ?? record;

  if (!tierRecord) {
    return current;
  }

  const nextTiers: Record<AccessTier, string[]> = {
    ...current.tiers,
  };

  for (const tier of ACCESS_TIERS) {
    if (!Object.prototype.hasOwnProperty.call(tierRecord, tier)) {
      continue;
    }

    nextTiers[tier] = sanitizeTierSetIds(tierRecord[tier]);
  }

  const allSetIds = new Set(getSetSlots().map((item) => item.id));
  const builtInMockIds = BUILTIN_MOCK_SET_IDS.filter((setId) => allSetIds.has(setId));

  for (const tier of ACCESS_TIERS) {
    nextTiers[tier] = appendMissingSetIds(nextTiers[tier], builtInMockIds);
  }

  const next = {
    tiers: nextTiers,
    updated_at: nowIso(),
  } satisfies SetAccessConfig;

  root.__naiczycielSetAccessConfig = next;
  return cloneConfig(next);
}

function getSetById(setId: string): E8SetDefinition | null {
  const found = getSetSlots().find((entry) => entry.id === setId);
  return found ?? null;
}

export function getSetSlotById(setId: string): E8SetDefinition | null {
  return getSetById(setId);
}

export function getSetsForTier(tier: AccessTier, config = getSetAccessConfig()): E8SetDefinition[] {
  return config.tiers[tier]
    .map((setId) => getSetById(setId))
    .filter((item): item is E8SetDefinition => Boolean(item));
}

export function getLockedSetsForTier(tier: AccessTier, config = getSetAccessConfig()): E8SetDefinition[] {
  const activeIds = new Set(config.tiers[tier]);
  return getSetSlots().filter((item) => !activeIds.has(item.id));
}

export function getModesForTier(tier: AccessTier, config = getSetAccessConfig()): string[] {
  const modes = getSetsForTier(tier, config).map((item) => normalizeMode(item.mode));
  const unique = uniqueModes(modes);
  return unique.length > 0 ? unique : [FALLBACK_MODE];
}

export function getModesForQuizStart(isAuthenticated: boolean): string[] {
  const tier: AccessTier = isAuthenticated ? "registered" : "unregistered";
  return getModesForTier(tier);
}

export function resolveQuizModeForStart(params: {
  requestedMode?: string | null;
  isAuthenticated?: boolean;
  tier?: AccessTier;
}): string {
  const requestedMode = normalizeMode(params.requestedMode);
  const tier = params.tier ?? (params.isAuthenticated ? "registered" : "unregistered");
  const allowedModes = getModesForTier(tier);

  if (requestedMode && requestedMode !== "auto") {
    if (allowedModes.includes(requestedMode)) {
      return requestedMode;
    }

    return pickRandom(allowedModes);
  }

  return pickRandom(allowedModes);
}

export function addSetSlot(input: E8SetDefinition): E8SetDefinition {
  const nextId = input.id.trim();

  if (!nextId) {
    throw new Error("Set id is required.");
  }

  const slots = getSetSlots();

  if (slots.some((entry) => entry.id === nextId)) {
    throw new Error("Set id already exists.");
  }

  const nextSet: E8SetDefinition = {
    id: nextId,
    mode: input.mode.trim() || FALLBACK_MODE,
    title: input.title.trim() || nextId,
    subtitle: input.subtitle.trim(),
    questionCount: Number.isFinite(input.questionCount) ? Math.max(1, Math.round(input.questionCount)) : 10,
    questionIds: normalizeQuestionIds(input.questionIds),
  };

  setRuntimeSetSlots([...slots, nextSet]);
  return nextSet;
}

export function removeSetSlot(setId: string): { removed: boolean; config: SetAccessConfig; sets: E8SetDefinition[] } {
  const targetId = setId.trim();

  if (!targetId) {
    throw new Error("Set id is required.");
  }

  const slots = getSetSlots();

  if (!slots.some((entry) => entry.id === targetId)) {
    return {
      removed: false,
      config: getSetAccessConfig(),
      sets: slots,
    };
  }

  const nextSlots = slots.filter((entry) => entry.id !== targetId);
  setRuntimeSetSlots(nextSlots);

  const root = globalThis as GlobalWithSetAccessConfig;
  const current = getSetAccessConfig();
  const nextTiers: Record<AccessTier, string[]> = {
    unregistered: current.tiers.unregistered.filter((id) => id !== targetId),
    registered: current.tiers.registered.filter((id) => id !== targetId),
    premium: current.tiers.premium.filter((id) => id !== targetId),
    premium_plus: current.tiers.premium_plus.filter((id) => id !== targetId),
  };

  const nextConfig: SetAccessConfig = {
    tiers: nextTiers,
    updated_at: nowIso(),
  };

  root.__naiczycielSetAccessConfig = nextConfig;

  return {
    removed: true,
    config: cloneConfig(nextConfig),
    sets: cloneSetSlots(nextSlots),
  };
}



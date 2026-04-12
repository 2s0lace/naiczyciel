import { NextResponse } from "next/server";
import { resolveRoleFromRequest } from "@/lib/auth/server-role";
import {
  ACCESS_TIERS,
  addSetSlot,
  getSetAccessConfig,
  getSetSlots,
  removeSetSlot,
  updateSetAccessConfig,
  type AccessTier,
  type E8SetDefinition,
} from "@/lib/quiz/set-catalog";
import { loadSetCatalogFromDatabase, saveSetCatalogToDatabase } from "@/lib/quiz/set-catalog-store";

async function requireAdmin(request: Request) {
  const auth = await resolveRoleFromRequest(request);

  if (!auth.userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 }),
    };
  }

  if (auth.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Brak uprawnien." }, { status: 403 }),
    };
  }

  return { ok: true as const, accessToken: auth.accessToken };
}

function parseSetPayload(raw: unknown): E8SetDefinition {
  const payload = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const id = typeof payload.id === "string" ? payload.id.trim() : "";
  const mode = typeof payload.mode === "string" ? payload.mode.trim() : "";
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const subtitle = typeof payload.subtitle === "string" ? payload.subtitle.trim() : "";
  const questionCountRaw = Number(payload.questionCount ?? payload.question_count ?? 10);
  const questionCount = Number.isFinite(questionCountRaw) ? Math.max(1, Math.round(questionCountRaw)) : 10;
  const questionIds = Array.isArray(payload.questionIds)
    ? payload.questionIds
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry, index, list) => entry.length > 0 && list.indexOf(entry) === index)
    : [];

  if (!id) {
    throw new Error("Set id jest wymagane.");
  }

  if (!mode) {
    throw new Error("Set mode jest wymagane.");
  }

  if (!title) {
    throw new Error("Set title jest wymagane.");
  }

  return {
    id,
    mode,
    title,
    subtitle,
    questionCount,
    questionIds,
  };
}

function parseAssignToTiers(raw: unknown): AccessTier[] {
  if (typeof raw === "string") {
    const tier = raw.trim();
    return (ACCESS_TIERS as readonly string[]).includes(tier) ? [tier as AccessTier] : [];
  }

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry, index, list): entry is AccessTier => {
      return (ACCESS_TIERS as readonly string[]).includes(entry) && list.indexOf(entry) === index;
    });
}

function persistenceError(details?: string) {
  return NextResponse.json(
    {
      error: "Nie udalo sie zsynchronizowac setow z baza danych.",
      details: details ?? "Sprobuj ponownie za chwile.",
    },
    { status: 500 },
  );
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  const loaded = await loadSetCatalogFromDatabase({
    accessToken: auth.accessToken,
    allowBootstrap: true,
  });

  return NextResponse.json({
    tiers: ACCESS_TIERS,
    sets: getSetSlots(),
    config: getSetAccessConfig(),
    storage: loaded.loaded ? "supabase" : "memory",
  });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  const loaded = await loadSetCatalogFromDatabase({
    accessToken: auth.accessToken,
    allowBootstrap: true,
  });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const nextConfig = updateSetAccessConfig(body.config ?? body);
  const persisted = await saveSetCatalogToDatabase(undefined, auth.accessToken);

  if (!persisted.saved) {
    return persistenceError(persisted.details ?? loaded.details);
  }

  return NextResponse.json({
    tiers: ACCESS_TIERS,
    sets: getSetSlots(),
    config: nextConfig,
    storage: "supabase",
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  const loaded = await loadSetCatalogFromDatabase({
    accessToken: auth.accessToken,
    allowBootstrap: true,
  });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const nextSet = parseSetPayload(body.set ?? body);
    const created = addSetSlot(nextSet);
    const assignToTiers = parseAssignToTiers(body.assignToTiers ?? body.assign_to_tiers ?? body.assignToTier ?? body.assign_to_tier);

    if (assignToTiers.length > 0) {
      const currentConfig = getSetAccessConfig();
      const nextTiers = { ...currentConfig.tiers };

      for (const tier of ACCESS_TIERS) {
        nextTiers[tier] = (nextTiers[tier] ?? []).filter((id) => id !== created.id);
      }

      for (const tier of assignToTiers) {
        if (!nextTiers[tier].includes(created.id)) {
          nextTiers[tier] = [...nextTiers[tier], created.id];
        }
      }

      updateSetAccessConfig({
        tiers: nextTiers,
      });
    }

    const persisted = await saveSetCatalogToDatabase(undefined, auth.accessToken);

    if (!persisted.saved) {
      return persistenceError(persisted.details ?? loaded.details);
    }

    return NextResponse.json({
      set: created,
      sets: getSetSlots(),
      config: getSetAccessConfig(),
      tiers: ACCESS_TIERS,
      storage: "supabase",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nie udalo sie dodac zestawu.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  const loaded = await loadSetCatalogFromDatabase({
    accessToken: auth.accessToken,
    allowBootstrap: true,
  });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const setId = typeof body.id === "string" ? body.id : typeof body.setId === "string" ? body.setId : "";

  if (!setId.trim()) {
    return NextResponse.json({ error: "id (setId) jest wymagane." }, { status: 400 });
  }

  try {
    const result = removeSetSlot(setId);
    const persisted = await saveSetCatalogToDatabase(undefined, auth.accessToken);

    if (!persisted.saved) {
      return persistenceError(persisted.details ?? loaded.details);
    }

    return NextResponse.json({
      removed: result.removed,
      removedSetId: setId.trim(),
      sets: result.sets,
      config: result.config,
      tiers: ACCESS_TIERS,
      storage: "supabase",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nie udalo sie usunac zestawu.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


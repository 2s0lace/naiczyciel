"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminQuestionPanel } from "@/components/account/admin-question-panel";
import { AdminSetAccessPanel } from "@/components/account/admin-set-access-panel";
import { Spinner } from "@/components/ui/spinner";
import { clearRoleCookie, isAdminEmail, setRoleCookie } from "@/lib/auth/role";
import { resolveRoleForSession } from "@/lib/auth/client-role";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AccountQuestionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState("user");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      const nextUser = data.session?.user ?? null;
      setUser(nextUser);
      setIsLoading(false);

      if (nextUser && data.session) {
        const nextRole = await resolveRoleForSession({
          supabase,
          session: data.session,
        });

        if (!isMounted) {
          return;
        }

        setRole(nextRole);
        setRoleCookie(nextRole);
      } else {
        setRole("user");
        clearRoleCookie();
      }
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setIsLoading(false);

      if (nextUser && session) {
        void (async () => {
          const nextRole = await resolveRoleForSession({
            supabase,
            session,
          });

          if (!isMounted) {
            return;
          }

          setRole(nextRole);
          setRoleCookie(nextRole);
        })();
      } else {
        setRole("user");
        clearRoleCookie();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const forcedAdminByEmail = isAdminEmail(user?.email);

  const effectiveRole = useMemo(() => {
    if (forcedAdminByEmail) {
      return "admin";
    }

    return role;
  }, [forcedAdminByEmail, role]);

  const isAdmin = effectiveRole === "admin";

  return (
    <main className="min-h-screen bg-[#050510] px-5 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/konto"
            className="rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-200 transition-[background-color,border-color] duration-150 hover:border-white/30 hover:bg-white/[0.08]"
          >
            Wróć do konta
          </Link>
          <p className="text-xs text-gray-400">Panel pytań (admin)</p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-gray-300">
            <div className="flex items-center gap-2.5">
              <Spinner size="sm" />
              <span>Sprawdzam sesję...</span>
            </div>
          </div>
        ) : !user ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-gray-300">
            Musisz się zalogować. <Link href="/login" className="font-semibold text-indigo-200">Przejdź do logowania</Link>
          </div>
        ) : !isAdmin ? (
          <div className="rounded-2xl border border-red-300/20 bg-red-500/8 p-5 text-sm text-red-100">
            Brak uprawnień admina. Aktualna rola: <span className="font-semibold">{effectiveRole}</span>
          </div>
        ) : (
          <>
            <AdminSetAccessPanel />
            <AdminQuestionPanel />
          </>
        )}
      </div>
    </main>
  );
}



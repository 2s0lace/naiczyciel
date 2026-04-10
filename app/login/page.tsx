import type { Metadata } from "next";
import AuthForm from "@/components/auth/auth-form";
import { AuthAnimatedBg } from "@/components/auth/auth-animated-bg";

export const metadata: Metadata = {
  title: "Zaloguj się | Naiczyciel",
  description: "Zaloguj się do platformy Naiczyciel i kontynuuj swoją naukę.",
};

export default function LoginPage() {
  return (
    <>
      {/* Full-viewport overlay — covers any navbar from the root layout */}
      <div className="fixed inset-0 z-40">
        <AuthAnimatedBg />
        <div className="relative z-10 flex h-full items-center justify-center px-5 py-10">
          <AuthForm mode="login" />
        </div>
      </div>
      {/* Spacer so layout doesn't collapse (navbar is already hidden on /login) */}
      <div className="h-screen" aria-hidden />
    </>
  );
}

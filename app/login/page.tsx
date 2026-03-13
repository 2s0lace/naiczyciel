import AuthForm from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#050510] px-5 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center">
        <AuthForm mode="login" />
      </div>
    </main>
  );
}

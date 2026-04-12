import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#050510] px-5 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center shadow-[0_20px_44px_-34px_rgba(0,0,0,0.95)] sm:p-7">
          <h1 className="text-2xl font-bold text-white">Rejestracja wstrzymana</h1>
          <p className="mt-3 text-sm text-gray-300">Nowe konta sa chwilowo wylaczone. Skorzystaj z logowania.</p>
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-indigo-500 active:scale-[0.985]"
          >
            Przejdz do logowania
          </Link>
        </div>
      </div>
    </main>
  );
}

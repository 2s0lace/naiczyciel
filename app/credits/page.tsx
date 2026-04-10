export default function CreditsPage() {
  return (
    <main className="min-h-screen bg-[#050510] px-5 py-10 text-white md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_44px_-34px_rgba(0,0,0,0.95)] sm:p-7">
        <h1 className="text-2xl font-bold text-white">Credits</h1>

        <div className="mt-5 space-y-4 text-sm leading-relaxed text-gray-200">
          <p>
            The avatar style Micah is a remix of: Avatar Illustration System by Micah Lanier, licensed under CC BY 4.0.
          </p>
          <p>
            &quot;UI Completed Status Alert Notification SFX002.wav&quot; by Headphaze, from Freesound, licensed under CC BY 4.0. Modified for app use.
          </p>
          <p>
            Decorative paper assets designed by{" "}
            <a
              href="https://www.freepik.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-200 underline decoration-cyan-200/45 underline-offset-4 transition-colors hover:text-cyan-100"
            >
              Freepik
            </a>
          </p>
          <p>
            Critical thinking / AI usage research source:{" "}
            <a
              href="https://www.microsoft.com/en-us/research/wp-content/uploads/2025/01/lee_2025_ai_critical_thinking_survey.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-200 underline decoration-cyan-200/45 underline-offset-4 transition-colors hover:text-cyan-100"
            >
              Lee et al., Microsoft Research, 2025
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

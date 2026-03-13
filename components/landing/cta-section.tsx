import { PrimaryButton } from "@/components/landing/ui/primary-button";
import { SectionContainer } from "@/components/landing/ui/section-container";

export function CtaSection() {
  return (
    <section className="pb-10 sm:pb-12">
      <SectionContainer>
        <div className="rounded-2xl border border-indigo-300/20 bg-indigo-500/10 p-5 text-center sm:p-7">
          <p className="mx-auto max-w-[34ch] text-sm leading-relaxed text-slate-200 sm:text-base">
            Masz 10 minut? To wystarczy, żeby zrobić pierwszy sprint i sprawdzić, gdzie tracisz punkty.
          </p>

          <PrimaryButton href="/e8" className="mt-4 w-full sm:mt-5 sm:w-auto">
            Zacznij teraz
          </PrimaryButton>
        </div>
      </SectionContainer>
    </section>
  );
}

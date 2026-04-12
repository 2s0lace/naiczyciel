import { EduPreviewPanel } from "@/components/landing/edu-preview-panel";
import { SplitLandingHero } from "@/components/landing/split-landing-hero";
import { PageShell } from "@/components/layout/page-shell";

const teacherFeatureItems = [
  {
    icon: "🛠️",
    title: "Wybierz temat i rodzaj pytań",
    description: "Dostosuj poziom trudności i format zadań.",
  },
  {
    icon: "✨",
    title: "Regeneruj i edytuj AI w locie",
    description: "Zmień niepasujące pytania jednym kliknięciem.",
  },
  {
    icon: "🚀",
    title: "Wyślij quiz jednym linkiem",
    description: "Udostępnij gotowy test i odbierz wyniki na start.",
  },
];

export default function TeacherLandingPage() {
  return (
    <PageShell className="max-w-[84rem]">
      <SplitLandingHero
        kicker="EDU"
        title="Twoja wiedza. Nasza moc."
        description="Twój warsztat nauczycielski dosięgnie szczytu swoich możliwości z nAIczycielem."
        cta={{ href: "/edu", label: "Wkrótce: Generator EDU", variant: "teacher" }}
        tone="teacher"
        featureItems={teacherFeatureItems}
        panel={<EduPreviewPanel />}
      />
    </PageShell>
  );
}


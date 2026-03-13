import { Card } from "@/components/ui/card";

type BenefitItem = {
  title: string;
  description: string;
};

type BenefitsGridProps = {
  id?: string;
  title: string;
  items: [BenefitItem, BenefitItem, BenefitItem] | BenefitItem[];
  tone?: "neutral" | "student" | "teacher";
};

export function BenefitsGrid({
  id,
  title,
  items,
  tone = "neutral",
}: BenefitsGridProps) {
  return (
    <section id={id} className="section-space pt-0">
      <div className="space-y-4">
        <h2 className="type-h2">{title}</h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.title} tone={tone} className="space-y-2">
              <h3 className="text-lg font-semibold text-app">{item.title}</h3>
              <p className="text-sm leading-relaxed text-app-muted">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

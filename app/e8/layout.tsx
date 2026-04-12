import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Trening do E8 z angielskiego | nAIczyciel",
  description:
    "Krótkie quizy do E8 z angielskiego: reakcje językowe, reading, słownictwo i gramatyka. Wynik, procent i wyjaśnienia od razu po sesji.",
};

export default function E8Layout({ children }: { children: ReactNode }) {
  return children;
}

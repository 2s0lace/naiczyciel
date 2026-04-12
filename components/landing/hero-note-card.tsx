/**
 * HeroNoteCard — the torn-paper note card in the "Bądźmy szczerzy" hero section.
 *
 * Architecture: ONE component, ONE object.
 *
 * The outer div (className prop) handles placement inside the hero.
 * The inner div is a CSS container (container-type: inline-size).
 * All sizes — holes, text, spacing — use `cqw` (container query width units),
 * so everything scales 1:1 with the card's width automatically.
 * overflow-hidden on the text wrapper prevents bleed outside the paper.
 */

import Image from "next/image";
import type { CSSProperties } from "react";
import paperCutNoteElement from "@/img/papirek.png";

export function HeroNoteCard({ className }: { className?: string }) {
  return (
    /* Outer shell — only for placement in parent layout */
    <div className={className}>
      {/*
        Card unit — CSS container context.
        Image sets the natural height (preserves aspect-ratio of the PNG).
        Every child sizes itself in cqw → scales with this container's width.
      */}
      <div
        className="relative"
        style={{ containerType: "inline-size" } as CSSProperties}
      >
        {/* Paper image — visual shell, establishes intrinsic dimensions */}
        <Image
          src={paperCutNoteElement}
          alt=""
          aria-hidden
          className="h-auto w-full object-contain [filter:drop-shadow(0_28px_52px_rgba(0,0,0,0.48))_drop-shadow(0_12px_22px_rgba(0,0,0,0.28))]"
        />

        {/* Punch holes: left edge of paper, spaced proportionally in cqw */}
        <div
          aria-hidden
          className="absolute flex flex-col"
          style={{ left: "1.6%", top: "10%", gap: "2cqw" }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={`punch-${i}`}
              className="block rounded-full"
              style={{
                width: "1.1cqw",
                height: "1.1cqw",
                backgroundColor: "#050510",
                boxShadow:
                  "inset 0 1px 1px rgba(0,0,0,0.38), inset 0 -1px 2px rgba(255,255,255,0.05), 0 0 0 1px rgba(58,46,24,0.16)",
              }}
            />
          ))}
        </div>

        {/*
          Text overlay.
          Uses `absolute inset-0` + padding (%) to define the writable surface of the
          note card image. overflow-hidden clips anything that would escape the paper.

          Padding percentages are tuned to papirek.png's actual paper area:
            left  ≈ 23%  (past spiral/ring holes)
            top   ≈ 37%  (past curled/torn header)
            right ≈  7%
            bottom≈ 12%
        */}
        <div
          aria-hidden
          className="absolute inset-0 overflow-hidden"
          style={{
            paddingLeft: "30%",
            paddingTop: "26%",
            paddingRight: "44%",
            paddingBottom: "40%",
          }}
        >
          <div
            className="font-gloria-hallelujah flex h-full flex-col text-[2.0355cqw] text-[#1a1a1a]/90 md:text-[1.77cqw] translate-y-[10px]"
            style={{
              /* cqw = % of THIS container's width → scales with the card, not viewport */
              lineHeight: 0.92,
              gap: "0.1em",
            }}
          >
            <p>
              AI potrafi pomóc, ale bardzo łatwo zacząć klikać więcej, a myśleć
              mniej. AI ma wspierać ucznia, nie zastępować jego własnego myślenia.
            </p>
            <p>
              Dlatego w nAIczycielu najpierw odpowiadasz Ty, a AI dopiero potem
              pomaga sprawdzić i wyjaśnić.
            </p>
            <p
              style={{
                fontSize: "0.74em",
                color: "rgba(26,26,26,0.56)",
                paddingTop: "0.02em",
              }}
            >
              Źródła: Lee et al., CHI 2025 / Microsoft Research; Khalil et al.,
              2025 systematic review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

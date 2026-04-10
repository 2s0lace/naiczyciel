/**
 * Auth page background — extremely restrained atmospheric depth.
 * Two barely-visible deep navy orbs. No neon, no gamer glow.
 */
export function AuthAnimatedBg() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* Solid deep base */}
      <div className="absolute inset-0 bg-[#070b14]" />

      {/* Top-left atmospheric depth — deep indigo, very low opacity */}
      <div
        className="absolute rounded-full"
        style={{
          width: 800,
          height: 800,
          top: "-280px",
          left: "-240px",
          background:
            "radial-gradient(circle at center, rgba(67,56,202,0.11) 0%, rgba(55,48,163,0.05) 50%, transparent 70%)",
          animation: "orb-drift-1 28s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* Bottom-right — even softer violet tint */}
      <div
        className="absolute rounded-full"
        style={{
          width: 700,
          height: 700,
          bottom: "-220px",
          right: "-200px",
          background:
            "radial-gradient(circle at center, rgba(79,46,180,0.09) 0%, transparent 65%)",
          animation: "orb-drift-2 35s ease-in-out infinite",
          animationDelay: "-12s",
          willChange: "transform",
        }}
      />

      {/* Very subtle noise texture using dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(148,163,184,1) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}

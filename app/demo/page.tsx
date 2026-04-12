import React from "react";
import Link from "next/link";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { ParallaxGridLayer } from "@/components/landing/parallax-grid-layer";

export default function DemoPage() {
  return (
    <main className="relative min-h-screen bg-[#050510] text-white selection:bg-indigo-500/30">
      <ParallaxGridLayer />
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#050510]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link 
            href="/e8" 
            className="flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Powrót do strony głównej
          </Link>
          <div className="h-8 w-px bg-white/10 mx-4 hidden md:block" />
          <div className="hidden md:block">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Tryb Demonstracyjny</span>
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-32 pb-20">
        <div className="relative mb-12">
          <div className="absolute inset-0 blur-3xl opacity-20 bg-indigo-500" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-600/20 text-indigo-400 ring-1 ring-white/10">
            <PlayCircle className="h-12 w-12" />
          </div>
        </div>

        <h1 className="max-w-3xl text-center text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
          Zobacz jak <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">naprawdę</span> wygląda nauka.
        </h1>
        
        <p className="mt-6 max-w-xl text-center text-lg text-white/40">
          To jest miejsce, w którym za chwilę zobaczysz pełną interaktywną wersję naszych zadań. Pracujemy nad przygotowaniem najlepszego doświadczenia.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {/* Placeholder for demo features */}
           {[
             { title: "Interaktywne Quizy", desc: "Zadania typu gap-fill, wielokrotny wybór i więcej." },
             { title: "Wyjaśnienia AI", desc: "Natychmiastowe tłumaczenie błędów i wskazówki." },
             { title: "Statystyki", desc: "Twój postęp wizualizowany w czasie rzeczywistym." }
           ].map((feat, i) => (
             <div key={i} className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:bg-white/[0.03]">
               <h3 className="font-bold text-white/90">{feat.title}</h3>
               <p className="mt-2 text-sm text-white/40">{feat.desc}</p>
             </div>
           ))}
        </div>

        <div className="mt-20 flex flex-col items-center gap-6">
          <Link 
            href="/login" 
            className="rounded-full bg-white px-8 py-4 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95"
          >
            Zacznij darmową naukę
          </Link>
          <span className="text-xs text-white/20">Bez karty kredytowej • 100% darmowe na start</span>
        </div>
      </div>
    </main>
  );
}

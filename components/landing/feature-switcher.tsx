"use client";

import { useState } from "react";
import { BarChart3, Brain, Zap } from "lucide-react";
import ProductPreview from "./product-preview";

type FeatureType = "sets" | "explanation" | "analysis";

export default function FeatureSwitcher() {
  const [activeTab, setActiveTab] = useState<FeatureType>("sets");

  const tabs = [
    { id: "sets", label: "Zestawy", icon: Zap },
    { id: "explanation", label: "Wyjaśnienia", icon: Brain },
    { id: "analysis", label: "Analiza", icon: BarChart3 },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">
          Sprawdź funkcje
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/5 bg-white/5 p-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex flex-col items-center justify-center gap-1.5 rounded-lg py-3 transition-all duration-300
                ${isActive ? "bg-indigo-600/20 text-white shadow-sm" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}
              `}
            >
              <Icon
                size={20}
                className={`transition-colors duration-300 ${isActive ? "text-indigo-300" : "text-gray-500"}`}
                strokeWidth={isActive ? 2.5 : 2}
              />

              <span
                className={`text-[11px] font-semibold transition-colors ${isActive ? "text-white" : "text-gray-400"}`}
              >
                {tab.label}
              </span>

              {isActive && <div className="absolute bottom-0 mb-1 h-0.5 w-8 rounded-full bg-indigo-400" />}
            </button>
          );
        })}
      </div>

      <div className="pt-2">
        <ProductPreview activeTab={activeTab} />
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { AVATAR_PRESETS, type AvatarKey } from "@/lib/avatar/presets";
import { cn } from "@/lib/utils";

type AvatarPickerProps = {
  selectedKey: AvatarKey | null;
  onSelect: (key: AvatarKey) => void;
  className?: string;
  itemClassName?: string;
  disabled?: boolean;
};

export default function AvatarPicker({ selectedKey, onSelect, className, itemClassName, disabled = false }: AvatarPickerProps) {
  return (
    <div className={cn("grid grid-cols-4 gap-3.5", className)}>
      {AVATAR_PRESETS.map((avatar) => {
        const isSelected = avatar.key === selectedKey;

        return (
          <button
            key={avatar.key}
            type="button"
            onClick={() => onSelect(avatar.key)}
            disabled={disabled}
            aria-pressed={isSelected}
            aria-label={`Wybierz avatar ${avatar.key}`}
            className={cn(
              "group relative flex aspect-square items-center justify-center overflow-hidden rounded-full border p-1.5 transition-[transform,border-color,background-color,box-shadow] duration-150 sm:p-2",
              "border-white/16 bg-[#0a1227]/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-indigo-200/45 hover:bg-[#101a39]/82",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/45",
              isSelected &&
                "scale-[1.03] border-indigo-200/70 bg-[#14204a]/88 shadow-[0_0_0_1px_rgba(165,180,252,0.62),0_16px_30px_-20px_rgba(79,70,229,0.95),inset_0_1px_0_rgba(255,255,255,0.22)]",
              disabled && "cursor-not-allowed opacity-70",
              itemClassName,
            )}
          >
            <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.08),rgba(255,255,255,0)_62%)]" />
            <Image
              src={avatar.src}
              alt={avatar.file}
              width={96}
              height={96}
              className="relative h-full w-full rounded-full object-cover"
              unoptimized
            />
            {isSelected ? (
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-0.5 left-1/2 h-1.5 w-7 -translate-x-1/2 rounded-full bg-indigo-200/82 shadow-[0_0_12px_rgba(165,180,252,0.85)]"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}


"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { Sun, Moon, TreePine, Zap, Award } from "lucide-react";
import { cn } from "@/utils/cn";

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themes = [
    { id: "dark" as const, name: "Oscuro Mango", icon: Moon, dotColor: "bg-[#f59e0b] border-gray-900" },
    { id: "light" as const, name: "Claro Limpio", icon: Sun, dotColor: "bg-[#f59e0b] border-white" },
    { id: "forest" as const, name: "Bosque", icon: TreePine, dotColor: "bg-[#10b981] border-[#052214]" },
    { id: "cyberpunk" as const, name: "Cyberpunk", icon: Zap, dotColor: "bg-[#ff007f] border-[#0c001a]" },
    { id: "vintage" as const, name: "Retro Gold", icon: Award, dotColor: "bg-[#facb1a] border-[#1a120d]" },
  ];

  const currentThemeInfo = themes.find((t) => t.id === theme) || themes[0];
  const IconComponent = currentThemeInfo.icon;

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/50 hover:bg-muted text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold"
        title="Cambiar tema"
      >
        <IconComponent className="w-4 h-4 text-primary shrink-0" />
        <span className="hidden sm:inline">{currentThemeInfo.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl border border-border bg-card/95 backdrop-blur-md p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Paleta de Colores
          </div>
          <div className="space-y-1">
            {themes.map((t) => {
              const ItemIcon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 text-left hover:bg-muted",
                    isSelected ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <ItemIcon className={cn("w-3.5 h-3.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <span>{t.name}</span>
                  </div>
                  <span className={cn("w-2 h-2 rounded-full border shrink-0", t.dotColor)} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

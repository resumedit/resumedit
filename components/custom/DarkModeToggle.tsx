"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Icons } from "@/components/custom/Icons";
import { Button } from "@/components/ui/button";

export function DarkModeToggle() {
  const defaultTheme = "system";
  const themes = {
    system: { icon: <Icons.sunMoon className="absolute transition-all" />, label: "auto" },
    dark: {
      icon: <Icons.moon className="absolute rotate-90 transition-all dark:rotate-0 dark:scale-100" />,
      label: "dark",
    },
    light: {
      icon: <Icons.sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />,
      label: "light",
    },
  };
  const themeKeys = Object.keys(themes).slice(1);

  const { theme, setTheme } = useTheme();
  // const [currentThemeIcon, setCurrentThemeIcon] = useState(themeIcons[theme as keyof typeof themeIcons]);
  const [currentTheme, setCurrentTheme] = useState(themes[defaultTheme]);

  function switchTheme(targetTheme = theme || "system") {
    const targetThemeTyped = targetTheme as keyof typeof themes;
    setThemeIcon(targetThemeTyped);
    setTheme(targetTheme);
  }

  function setThemeIcon(targetTheme: keyof typeof themes) {
    setCurrentTheme(themes[targetTheme]);
  }

  function toggleTheme(event: React.MouseEvent) {
    if (event.shiftKey) {
      if (theme) {
        if (theme === "system") {
          switchTheme("dark");
        } else {
          switchTheme("system");
        }
      } else {
        switchTheme("system");
      }
    } else {
      if (theme === undefined) {
        switchTheme("dark");
      } else {
        let targetTheme = "system";
        if (theme === "system") {
          targetTheme = "dark";
        } else {
          const themeIndex = themeKeys.indexOf(theme);
          const targetThemeIndex = (themeIndex + 1) % themeKeys.length;
          targetTheme = themeKeys[targetThemeIndex] as keyof typeof themes;
        }
        switchTheme(targetTheme);
      }
    }
  }

  useEffect(() => {
    switchTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Button
      variant="ghost"
      onClick={toggleTheme}
      name="Dark mode toggle"
      aria-label="Toggle between dark mode, light mode and system-defined"
      size="sm"
      className="group relative h-8 w-8 px-0"
    >
      {currentTheme.icon}
      <div className="text-2xs absolute -bottom-6 hidden uppercase group-hover:block">{currentTheme.label}</div>
    </Button>
  );
}

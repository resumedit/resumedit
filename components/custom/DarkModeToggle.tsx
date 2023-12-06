"use client";

import { useTheme } from "next-themes";
import { ReactNode, useEffect, useState } from "react";

import { Icons } from "@/components/custom/Icons";
import { Button } from "@/components/ui/button";

export function DarkModeToggle() {
  const themeIcons = {
    system: <Icons.laptop className="absolute transition-all" />,
    dark: <Icons.moon className="absolute rotate-90 transition-all dark:rotate-0 dark:scale-100" />,
    light: <Icons.sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />,
  };
  const themeKeys = Object.keys(themeIcons).slice(1);

  const { theme, setTheme } = useTheme();
  // const [currentThemeIcon, setCurrentThemeIcon] = useState(themeIcons[theme as keyof typeof themeIcons]);
  const [currentThemeIcon, setCurrentThemeIcon] = useState(null);

  function switchTheme(targetTheme = theme || "system") {
    const targetThemeTyped = targetTheme as keyof typeof themeIcons;
    setThemeIcon(targetThemeTyped);
    setTheme(targetTheme);
  }

  function setThemeIcon(targetTheme: keyof typeof themeIcons) {
    const targetIcon: ReactNode | undefined = themeIcons[targetTheme] as ReactNode;
    if (targetIcon) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCurrentThemeIcon(targetIcon as any);
    }
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
          targetTheme = themeKeys[targetThemeIndex] as keyof typeof themeIcons;
        }
        switchTheme(targetTheme);
      }
    }
  }

  useEffect(() => {
    switchTheme(theme);
  }, []);

  return (
    <Button variant="ghost" onClick={toggleTheme} size="sm" className="h-8 w-8 px-0">
      {currentThemeIcon}
    </Button>
  );
}

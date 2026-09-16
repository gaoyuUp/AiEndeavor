"use client";

import { Languages, Moon, Sun, WalletCards } from "lucide-react";
import { useState } from "react";

type Props = {
  locale: "zh" | "en";
  currency: "CNY" | "USD";
  theme: "dark" | "light";
  lockCurrency?: boolean;
};

function setPreference(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}

export function PreferenceSwitcher({ locale, currency, theme: initialTheme, lockCurrency = false }: Props) {
  const [theme, setTheme] = useState(initialTheme);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }

  return (
    <div className="preference-switcher flex items-center gap-0.5">
      <button
        type="button"
        aria-label={theme === "dark" ? "切换到白色主题" : "切换到黑色主题"}
        title={theme === "dark" ? "切换到白色主题" : "切换到黑色主题"}
        className="flex items-center justify-center px-0"
        onClick={toggleTheme}
      >
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </button>
      <button
        type="button"
        aria-label="切换语言"
        className="flex items-center gap-1.5 px-2.5 text-xs"
        onClick={() => setPreference("locale", locale === "zh" ? "en" : "zh")}
      >
        <Languages size={14} />
        {locale === "zh" ? "中" : "EN"}
      </button>
      {!lockCurrency ? (
        <button
          type="button"
          aria-label="切换货币"
          className="flex items-center gap-1.5 px-2.5 text-xs"
          onClick={() => setPreference("currency", currency === "CNY" ? "USD" : "CNY")}
        >
          <WalletCards size={14} />
          {currency}
        </button>
      ) : null}
    </div>
  );
}

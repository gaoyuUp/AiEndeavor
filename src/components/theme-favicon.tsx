"use client";

import { useEffect } from "react";

const ICONS = {
  dark: {
    png: "/brand/icon-dark-32.png?v=lingsou3",
    svg: "/brand/icon-dark.svg?v=lingsou3",
    ico: "/brand/icon-dark.ico?v=lingsou3",
  },
  light: {
    png: "/brand/icon-light-32.png?v=lingsou3",
    svg: "/brand/icon-light.svg?v=lingsou3",
    ico: "/brand/icon-light.ico?v=lingsou3",
  },
} as const;

function applyFavicon(theme: string) {
  const pack = theme === "light" ? ICONS.light : ICONS.dark;
  for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]')) {
    const type = link.type || "";
    const href = link.getAttribute("href") || "";
    let next: string = pack.ico;
    let nextType = "image/x-icon";
    if (type.includes("svg") || href.includes(".svg")) {
      next = pack.svg;
      nextType = "image/svg+xml";
    } else if (type.includes("png") || href.includes(".png")) {
      next = pack.png;
      nextType = "image/png";
    }
    if (link.type !== nextType) link.type = nextType;
    if (link.getAttribute("href") !== next) link.setAttribute("href", next);
  }
}

export function ThemeFavicon() {
  useEffect(() => {
    const sync = () => applyFavicon(document.documentElement.dataset.theme || "dark");
    sync();
    const rootObserver = new MutationObserver(sync);
    rootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const headObserver = new MutationObserver(sync);
    headObserver.observe(document.head, { childList: true });
    return () => {
      rootObserver.disconnect();
      headObserver.disconnect();
    };
  }, []);
  return null;
}

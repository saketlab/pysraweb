import {
  BarChartIcon,
  CodeIcon,
  DownloadIcon,
  InfoCircledIcon,
  KeyboardIcon,
  MagicWandIcon,
  SewingPinIcon,
} from "@radix-ui/react-icons";
import type { ReactNode } from "react";
import { createElement } from "react";

/**
 * Single source of truth for the global navigation items.
 *
 * Used by both `components/navbar.tsx` (homepage) and
 * `components/search-bar.tsx` (every other page) so there's no drift.
 *
 * Order matters: items render left-to-right in the desktop nav.
 */
export type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  external?: boolean;
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: "About",
    href: "/faq",
    icon: createElement(InfoCircledIcon),
  },
  {
    label: "API",
    href: "/api-docs",
    icon: createElement(CodeIcon),
  },
  {
    label: "CLI & Packages",
    href: "/cli",
    external: true,
    icon: createElement(KeyboardIcon),
  },
  {
    label: "Stats",
    href: "/stats",
    icon: createElement(BarChartIcon),
  },
  {
    label: "Data",
    href: "/data",
    icon: createElement(DownloadIcon),
  },
  {
    label: "Map",
    href: "/map",
    icon: createElement(SewingPinIcon),
  },
  {
    label: "Use with LLMs",
    href: "/mcp",
    icon: createElement(MagicWandIcon),
  },
] as const;

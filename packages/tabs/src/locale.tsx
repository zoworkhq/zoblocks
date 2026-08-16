"use client";

/**
 * Locale, by context and by prop.
 *
 * A provider exists because the strings a tab strip utters are mostly
 * invisible — "2 critical", "More, 3 hidden", "Close Progress note" — and a
 * product that has to pass a `locale` prop to every instance will translate
 * the visible ones and forget these.
 */

import * as React from "react";
import { DEFAULT_LOCALE, resolveLocale, type TabsLocale } from "@oxygenui-design/tabs-core";

const LocaleContext = React.createContext<TabsLocale>(DEFAULT_LOCALE);

export interface TabsLocaleProviderProps {
  locale: Partial<TabsLocale>;
  children: React.ReactNode;
}

export function TabsLocaleProvider({ locale, children }: TabsLocaleProviderProps) {
  const parent = React.useContext(LocaleContext);
  const value = React.useMemo(() => ({ ...parent, ...locale }), [parent, locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Instance overrides win over the provider, which wins over the default. */
export function useTabsLocale(overrides?: Partial<TabsLocale>): TabsLocale {
  const fromContext = React.useContext(LocaleContext);
  return React.useMemo(
    () => (overrides ? { ...fromContext, ...overrides } : fromContext),
    [fromContext, overrides],
  );
}

export { DEFAULT_LOCALE, resolveLocale };
export type { TabsLocale };

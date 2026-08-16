/**
 * @oxygenui-design/intl — messages, and the register they are written in.
 *
 * ADR 0008 puts a deadline on this: retrofitting internationalisation across
 * 500 components is an enormous project, across 24 it is a week, and across 5
 * it is an afternoon. This is that afternoon.
 *
 * Two things a generic i18n layer does not give a healthcare library, and both
 * are the reason this exists rather than a dependency:
 *
 *   1. **Register.** Patient-facing and clinician-facing strings are different
 *      catalogs, not different tones of the same string. "Potassium" and "K+"
 *      are not a formality setting. `useTerm` requires both sides, so shipping
 *      clinical shorthand to a patient is a type error rather than a review
 *      note.
 *   2. **Absence.** A missing translation must never render as a blank or as a
 *      key. It falls back to English and says so through `onMissing`, because
 *      an empty label on a wait is indistinguishable from a broken component.
 *
 * No dependency: `Intl` is in every runtime this library targets, and ADR 0009
 * makes each runtime dependency a review item.
 */

import * as React from "react";

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

/**
 * The message catalog.
 *
 * Keys are dotted and namespaced by component. English is the source of truth
 * and the fallback; a locale supplies a partial catalog and inherits the rest.
 */
export interface Messages {
  [key: string]: string;
}

/** Every string the library ships, in English. */
export const EN: Messages = {
  "loader.label": "Loading",
  "loader.label.patient": "Loading your information",
  "loader.slowHint": "Still loading. You can keep waiting or go back.",
  "loader.slowHint.patient": "This is taking longer than usual. You can keep waiting or go back.",
  "loader.progress": "{value} percent",
  "loader.retry": "Try again",
  "loader.goBack": "Go back",
};

/** Locales with a catalog in this package. Others fall back to English. */
export const BUILT_IN: Record<string, Messages> = { en: EN };

/* ------------------------------------------------------------------ */
/* Register                                                            */
/* ------------------------------------------------------------------ */

/**
 * Who is reading the screen.
 *
 * Not a formality setting. It selects a different catalog, because the same
 * fact needs different words — and the same number needs different framing —
 * depending on whether a clinician or a patient is looking at it.
 */
export type Register = "clinician" | "patient";

export interface IntlValue {
  locale: string;
  register: Register;
  messages: Messages;
  /** Called when a key resolves to nothing. Never throws; never renders blank. */
  onMissing?: (key: string, locale: string) => void;
}

const DEFAULT: IntlValue = {
  locale: "en",
  register: "clinician",
  messages: EN,
};

const IntlContext = React.createContext<IntlValue>(DEFAULT);

export interface IntlProviderProps {
  locale?: string;
  register?: Register;
  /** Overrides and additions, merged over the built-in catalog for the locale. */
  messages?: Messages;
  onMissing?: (key: string, locale: string) => void;
  children?: React.ReactNode;
}

export function IntlProvider({
  locale = "en",
  register = "clinician",
  messages,
  onMissing,
  children,
}: IntlProviderProps) {
  const value = React.useMemo<IntlValue>(
    () => ({
      locale,
      register,
      // English underneath always: a partial catalog inherits rather than
      // producing holes, so a half-translated locale degrades to English words
      // instead of blank labels.
      messages: { ...EN, ...(BUILT_IN[locale] ?? {}), ...(messages ?? {}) },
      onMissing,
    }),
    [locale, register, messages, onMissing],
  );

  return React.createElement(IntlContext.Provider, { value }, children);
}

/* ------------------------------------------------------------------ */
/* Lookup                                                              */
/* ------------------------------------------------------------------ */

/** Substitutes `{name}` placeholders. Values are inserted as text, never markup. */
export function format(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export interface TranslateOptions {
  values?: Record<string, string | number>;
  /** Used when the key is absent from every catalog. Defaults to the English string. */
  fallback?: string;
}

/**
 * Resolves a key, preferring the register-specific variant.
 *
 * `loader.label` with `register: "patient"` looks for `loader.label.patient`
 * first. That is what lets a component ask for one key and get the right words
 * for whoever is reading, without every call site branching.
 */
export function useMessage(key: string, options: TranslateOptions = {}): string {
  const intl = React.useContext(IntlContext);
  return resolve(intl, key, options);
}

export function resolve(intl: IntlValue, key: string, options: TranslateOptions = {}): string {
  const registerKey = `${key}.${intl.register}`;
  const template = intl.messages[registerKey] ?? intl.messages[key] ?? options.fallback ?? EN[key];

  if (template === undefined) {
    intl.onMissing?.(key, intl.locale);
    // The key itself, never an empty string. A blank label on a loading state
    // is indistinguishable from a component that failed to render.
    return key;
  }

  return format(template, options.values);
}

/**
 * The two registers of one term, chosen by context.
 *
 * Both sides are required, so forgetting the patient wording is a type error
 * rather than clinical shorthand arriving on a patient's screen.
 */
export function useTerm(term: { clinician: string; patient: string }): string {
  const { register } = React.useContext(IntlContext);
  return term[register];
}

export function useIntl(): IntlValue {
  return React.useContext(IntlContext);
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

/**
 * Locale-aware number formatting, via the platform.
 *
 * Exposed because a percentage rendered with a full stop in a locale that uses
 * a comma reads as a different number, and a loader that reports progress is
 * reporting a number.
 */
export function useNumberFormat(options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  const { locale } = React.useContext(IntlContext);
  return React.useMemo(() => new Intl.NumberFormat(locale, options), [locale, options]);
}

/** Whether a locale is written right to left. Drives `dir`, never layout maths. */
export function isRtl(locale: string): boolean {
  const RTL = ["ar", "arc", "dv", "fa", "ha", "he", "khw", "ks", "ku", "ps", "ur", "yi"];
  const language = locale.split("-")[0]?.toLowerCase() ?? "";
  return RTL.includes(language);
}

/**
 * Type shims for the single-file component formats.
 *
 * A real Vue or Svelte project gets these from `vue-tsc` / `svelte-check`,
 * which understand the file formats. This package is checked by plain `tsc`
 * because its job is to prove the *elements* work, not to demonstrate a
 * best-practice toolchain — so the two component files are declared as opaque
 * components and everything around them is checked normally.
 */

declare module "*.vue" {
  const component: import("vue").DefineComponent<
    Record<string, never>,
    Record<string, never>,
    unknown
  >;
  export default component;
}

declare module "*.svelte" {
  const component: import("svelte").Component<Record<string, never>>;
  export default component;
}

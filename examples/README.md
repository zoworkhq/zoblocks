# Examples

One file per documented example: `examples/<component>/<example-id>.tsx`.

The same file is the **Code** tab, the **Preview** tab and the **Open in
StackBlitz** project on the component's page at zoblocks.design. `pnpm gen`
reads it in place of a `code` string in the component's `*.meta.ts`, and
builds the StackBlitz project from it.

- The example's `id` in `*.meta.ts` is the file name. A file no example names
  fails `pnpm gen`.
- Default-export the component that renders the example.
- Import components by the path `zoblocks add` writes them to:
  `@/components/zoblocks/<name>`, `@/lib/zoblocks-<core>`, `@/lib/utils`.
- Helpers go in `_shared/` (for every component) or `<component>/_shared/`, and
  are imported by relative path. They are copied into the sandbox beside the
  example.
- An example that cannot run on its own sets `notRunnable: "<why>"` in its
  metadata.

`pnpm sandboxes:check` installs and typechecks every generated project.

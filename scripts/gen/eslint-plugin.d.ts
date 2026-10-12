/**
 * The shape of `@zoblocks/eslint-plugin` the agent manifest reads.
 *
 * The plugin is plain JavaScript and ships no types. The emitter reads only
 * each rule's `meta.docs.description`, so that is all this declares.
 */
declare module "@zoblocks/eslint-plugin" {
  const plugin: {
    rules: Record<string, { meta?: { docs?: { description?: string } } }>;
  };
  export default plugin;
}

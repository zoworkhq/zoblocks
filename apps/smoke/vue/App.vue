<script setup lang="ts">
/**
 * Vue 3.
 *
 * Two things make this work and neither is obvious from the outside:
 *
 *   1. `isCustomElement` in vite.config.ts. Without it Vue's compiler treats
 *      <zb-pulse-loader> as a component, fails to resolve it, and warns at
 *      runtime — a warning, not an error, so it ships.
 *   2. `:progress="progress"` binds a number. Vue writes DOM properties when
 *      the key exists on the element and attributes otherwise; `progress` is a
 *      getter with no setter, so it must take the attribute path. The
 *      determinate assertion in the spec is what proves it did.
 */
import { onMounted, onBeforeUnmount, ref } from "vue";

const open = ref(true);
const progress = ref(0);
const events = ref(0);
const host = ref<HTMLElement | null>(null);

const bump = () => (events.value += 1);

onMounted(() => {
  host.value?.addEventListener("zb-loader-show", bump);
  host.value?.addEventListener("zb-loader-hide", bump);
});
onBeforeUnmount(() => {
  host.value?.removeEventListener("zb-loader-show", bump);
  host.value?.removeEventListener("zb-loader-hide", bump);
});
</script>

<template>
  <div ref="host">
    <h1>Framework: <span id="framework">vue</span></h1>

    <div class="row">
      <zb-pulse-loader
        id="loader"
        label="Loading patient record"
        mode="inline"
        min-duration="0"
        :open="String(open)"
      />
      <button id="toggle" type="button" @click="open = !open">Toggle</button>
    </div>

    <div class="row">
      <zb-rhythm-loader
        id="determinate"
        label="Uploading study"
        mode="inline"
        min-duration="0"
        :progress="progress"
      />
      <button id="step" type="button" @click="progress = (progress + 25) % 125">Step</button>
    </div>

    <p>Events: <span id="events">{{ events }}</span></p>
  </div>
</template>

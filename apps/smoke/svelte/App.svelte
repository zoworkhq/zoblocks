<script lang="ts">
  /**
   * Svelte 5, runes mode.
   *
   * Svelte's compiler accepts unknown elements without configuration, so the
   * risk here is not compilation — it is the update path. Svelte writes
   * attributes with `setAttribute` but removes them entirely for `null` and
   * `undefined`. Binding a string keeps that distinction out of the picture.
   */
  let open = $state(true);
  let progress = $state(0);
  let events = $state(0);

  const bump = () => (events += 1);
</script>

<svelte:document on:ox-loader-show={bump} on:ox-loader-hide={bump} />

<div>
  <h1>Framework: <span id="framework">svelte</span></h1>

  <div class="row">
    <ox-pulse-loader
      id="loader"
      label="Loading patient record"
      mode="inline"
      min-duration="0"
      open={String(open)}
    ></ox-pulse-loader>
    <button id="toggle" type="button" onclick={() => (open = !open)}>Toggle</button>
  </div>

  <div class="row">
    <ox-rhythm-loader
      id="determinate"
      label="Uploading study"
      mode="inline"
      min-duration="0"
      {progress}
    ></ox-rhythm-loader>
    <button id="step" type="button" onclick={() => (progress = (progress + 25) % 125)}>Step</button>
  </div>

  <p>Events: <span id="events">{events}</span></p>
</div>

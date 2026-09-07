import { mount } from "svelte";
import "@zoblocks/loaders/pulse";
import "@zoblocks/loaders/rhythm";
import App from "./App.svelte";

mount(App, { target: document.querySelector("#app") as HTMLElement });

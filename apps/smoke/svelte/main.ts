import { mount } from "svelte";
import "@oxygenui-design/loaders/pulse";
import "@oxygenui-design/loaders/rhythm";
import App from "./App.svelte";

mount(App, { target: document.querySelector("#app") as HTMLElement });

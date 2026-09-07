/**
 * Plain HTML: two subpath imports and some event listeners.
 *
 * This page is also the only one that proves the *subpath* entry points work in
 * a browser — the others import the same two modules, but if the barrel were
 * accidentally required this page would be the one to notice.
 */

import "@zoblocks/loaders/pulse";
import "@zoblocks/loaders/rhythm";

const loader = document.querySelector("#loader") as HTMLElement;
const determinate = document.querySelector("#determinate") as HTMLElement;
const events = document.querySelector("#events") as HTMLElement;

let open = true;
let progress = 0;
let seen = 0;

document.querySelector("#toggle")?.addEventListener("click", () => {
  open = !open;
  loader.setAttribute("open", String(open));
});

document.querySelector("#step")?.addEventListener("click", () => {
  progress = (progress + 25) % 125;
  determinate.setAttribute("progress", String(progress));
});

for (const type of ["zb-loader-show", "zb-loader-hide"]) {
  document.addEventListener(type, () => {
    events.textContent = String(++seen);
  });
}

/**
 * Angular 19.
 *
 * Compiled by Angular's own template compiler — JIT here rather than AOT, which
 * is the same compiler on the same template with the same schema check, minus a
 * CLI this repository does not otherwise need.
 *
 * The line that matters is `schemas: [CUSTOM_ELEMENTS_SCHEMA]`. Angular is the
 * one framework here whose default behaviour is to **fail the build** on an
 * unrecognised element (NG0304), so this page is worthless without it — and
 * that failure is exactly what an Angular consumer hits on day one. Deleting
 * that line should turn this page red, which is the point.
 *
 * `[attr.open]` and `[attr.progress]`, not `[open]` and `[progress]`: property
 * binding to a name Angular cannot find on the element is itself an error, and
 * a getter without a setter would silently swallow the write if it could.
 */

// Must come first, and must be a bare side-effect import: Angular's JIT
// compiler registers itself on @angular/core when this module is evaluated, and
// bootstrapping without it fails with "needs to be compiled using the JIT
// compiler". An AOT build (the Angular CLI) drops this import instead.
import "@angular/compiler";
import "zone.js";
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import "@oxygenui-design/loaders/pulse";
import "@oxygenui-design/loaders/rhythm";

@Component({
  selector: "ox-smoke-root",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: {
    "(ox-loader-show)": "bump()",
    "(ox-loader-hide)": "bump()",
  },
  template: `
    <h1>Framework: <span id="framework">angular</span></h1>

    <div class="row">
      <ox-pulse-loader
        id="loader"
        label="Loading patient record"
        mode="inline"
        min-duration="0"
        [attr.open]="open()"
      ></ox-pulse-loader>
      <button id="toggle" type="button" (click)="open.set(open() === 'true' ? 'false' : 'true')">
        Toggle
      </button>
    </div>

    <div class="row">
      <ox-rhythm-loader
        id="determinate"
        label="Uploading study"
        mode="inline"
        min-duration="0"
        [attr.progress]="progress()"
      ></ox-rhythm-loader>
      <button id="step" type="button" (click)="progress.set((progress() + 25) % 125)">Step</button>
    </div>

    <p>
      Events: <span id="events">{{ events() }}</span>
    </p>
  `,
})
export class AppComponent {
  readonly open = signal("true");
  readonly progress = signal(0);
  readonly events = signal(0);

  bump(): void {
    this.events.update((n) => n + 1);
  }
}

void bootstrapApplication(AppComponent);

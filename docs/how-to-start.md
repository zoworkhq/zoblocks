# How to start with Oxygen UI

Start here, pick your stack, and follow one guide end to end. Each guide is
self-contained — you should not need to read another page to get a component on
screen.

> **Pre-release.** Nothing is published to npm yet. The registry channel
> (`npx @oxygenui-design/cli add …`) is the path that works today; the npm
> package names in these guides are the ones the release pipeline is gated on,
> and the instructions are written so they hold when it opens. Until then,
> consume the packages from a workspace checkout or wait for the first tag.

---

## 1. Pick a channel

Oxygen ships the same source three ways. All three are generated from one
source, so they cannot behave differently — the choice is about ownership and
upgrades, not about capability.

|                | Registry (source you own)                   | npm package                    | Custom elements                         |
| -------------- | ------------------------------------------- | ------------------------------ | --------------------------------------- |
| Install        | `npx @oxygenui-design/cli add pulse-loader` | `npm i @oxygenui-design/react` | `npm i @oxygenui-design/loaders`        |
| Lands in       | your repository                             | `node_modules`                 | `node_modules`                          |
| Upgrades       | none — you forked, deliberately             | semver                         | semver                                  |
| Needs React    | yes                                         | yes (18 or 19)                 | no                                      |
| Needs Tailwind | for some components                         | no                             | no                                      |
| What you get   | the whole catalog                           | the React components           | the five loaders                        |
| Best for       | teams who will read and change every line   | teams who want patches         | Vue, Angular, Svelte, Rails, plain HTML |

Installing from the registry means you have **forked, deliberately**: the source
is yours to read and change, and no release we publish will reach it. That is
the point of it, and the cost of it.

---

## 2. Pick your guide

### React

| Your project                           | Guide                                             |
| -------------------------------------- | ------------------------------------------------- |
| Starting a new Next.js app             | [Next.js](setup/react-next.md)                    |
| Starting a new Vite app                | [Vite + React](setup/react-vite.md)               |
| Adding to a React app you already have | [Existing React project](setup/react-existing.md) |
| Your app is built on **Ant Design**    | [Ant Design](setup/antd.md)                       |
| Your app is built on **Material UI**   | [Material UI](setup/mui.md)                       |

### Everything else

The five loaders ship as dependency-free custom elements. The clinical
components are React-only.

| Your project                          | Guide                       |
| ------------------------------------- | --------------------------- |
| Vue 3 or Nuxt                         | [Vue](setup/vue.md)         |
| Angular                               | [Angular](setup/angular.md) |
| Svelte or SvelteKit                   | [Svelte](setup/svelte.md)   |
| Plain HTML, Rails, Django, Solid, Lit | [Plain HTML](setup/html.md) |

---

## 3. Reference

The shared material each guide links into, when you need more than the guide
gives you:

| Page                                                        | What it covers                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [Installing components](reference/installing-components.md) | The CLI: `init`, `add`, `list`, every flag, `oxygen.json`, paid components           |
| [Styles and Tailwind](reference/styles-and-tailwind.md)     | Which stylesheets to import and in what order; the Tailwind rules that fail silently |
| [Theming](reference/theming.md)                             | Light, dark, high-contrast; three densities; the semantic token contract             |
| [Lint rules](reference/lint-rules.md)                       | The eighteen rules, and why you want them in your repository too                     |
| [Troubleshooting](reference/troubleshooting.md)             | Every failure mode we know about, by symptom                                         |

---

## Requirements

Common to every guide:

- **Node ≥ 20.11**
- **React 18.2 or 19**, for the React channels
- **Tailwind v4**, for the components that use utility classes — Copilot and the
  app-shell surfaces. The clinical components (Result Value, Care Timeline,
  Clinical Status, the loaders) are styled entirely by their own installed
  stylesheets and need no Tailwind at all.

---

## What this is not

Installing Oxygen UI does not make an application HIPAA, GDPR, or DPDP
compliant, and it is not a medical device or clinical decision support. Access
control, audit, data residency, and clinical validation remain yours. Signature
capture does not by itself establish the legal validity of any record, and does
not satisfy DEA EPCS, which is a separate and stricter regime.

Use **synthetic data only** in demos and screenshots. Every fixture in this
repository uses invented values on reserved `example.org` systems.

---

## Next

- [`README.md`](../README.md) — what ships today, and the gates behind it
- [`ARCHITECTURE.md`](../ARCHITECTURE.md) — how it fits together, and why
- [`ENGINEERING.md`](../ENGINEERING.md) — the standard, if you plan to contribute
- [`content/decisions/`](../content/decisions/) — the architecture decision records

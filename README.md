# Mori Static

A small browser-based interface, distributed as static files. This repository contains the presentation layer, local interaction logic, visual resources, and a compact set of checks. It can be served from a subdirectory without a build pipeline or an application server.

## Repository layout

```text
public/
  index.html          Document structure and interface elements
  style.css           Layout, typography, visual layers, responsive rules
  app.js              Browser interactions and local persistence
  engine.mjs          Small, deterministic state and timing utilities
  assets/
    quiet-island.jpg  Original landscape illustration
  .nojekyll           Static delivery marker
tests/
  engine.test.mjs     State and timing checks
README.md             Technical reference
.gitignore            Local-file exclusions
```

The `public` directory is the complete deployment payload. Files outside it are maintenance material and are not needed to render the interface.

## Runtime model

The page uses native JavaScript modules and ordinary DOM elements. There is no framework runtime, package installation, compilation, database connection, or server-side session. An HTTP server is required for loading modules; opening the HTML document directly through a `file:` URL is not the supported launch method.

The state model separates three concerns:

- The currently selected sequence determines which stage follows the current stage.
- A stage contains its own duration, remaining time, active flag, and timestamp.
- Browser-managed records persist independently from the visible document structure.

Stage changes remain explicit. Reaching a boundary stops the current interval and presents available choices. The next stage begins only after a separate interaction. A change to sequence configuration preserves the active interval; duration edits apply when a new interval is created.

## Clock behavior

The interface derives remaining time from timestamps rather than assuming each scheduled callback arrives precisely on time. This reduces drift when a tab is placed in the background or the browser delays callbacks.

Pausing stores the remaining value and clears the active timestamp. Resuming creates a fresh timestamp from the stored remaining value. Remaining time is clamped at zero, and a completed interval does not accumulate additional countdown debt.

Reloading the document restores browser-saved state. When an interval was left active, time elapsed outside the document is included. The implementation does not run a background service, and closed pages do not issue notifications.

## Local data

The application stores configuration and records in `localStorage` under its own namespace. Storage is scoped to the browser profile and site origin. The repository contains neither visitors' saved data nor a service for receiving it.

Clearing site data removes locally stored state. Opening the page on another device, another browser, or a different host does not automatically transfer it. A JSON export is available in the interface for manual backup; there is currently no import flow or account synchronization.

Moving from one hosting origin to another starts with a separate browser storage area. Existing records should be exported from the original address before clearing its storage.

## Presentation

The landscape is rendered as a viewport background rather than a small banner. Foreground typography and navigation sit above that layer; the lower interface uses translucent surfaces for readable controls. Smaller screens use a single-column layout, with adjusted image positioning and spacing.

The stylesheet requests Noto Serif SC and Manrope from Google Fonts. If the font service is unavailable, the page uses its local font fallbacks. The illustration is bundled with the deployment payload and does not require a third-party image host.

Reduced-motion preferences disable smooth scrolling. Inputs have visible focus states, controls use native elements, and secondary dialogs support dismissal. No autoplay audio, video player, or external media control is included.

## Local preview

From the repository root:

```sh
python3 -m http.server 4176 --bind 127.0.0.1 --directory public
```

Open `http://127.0.0.1:4176/` in a browser. Python serves the assets directly; editing a file and reloading the page is sufficient to see changes. No dependency installation is needed.

## Validation

A recent Node.js release can run the syntax and deterministic checks:

```sh
node --check public/app.js
node --testtests/engine.test.mjs
```

The checks cover timestamp-based remaining time, paused state, sequence transitions, and initialization of a new interval. They do not substitute for browser checks of layout, touch interaction, storage restrictions, or third-party font delivery.

Before publishing a visual change, inspect both a wide viewport and a narrow viewport. Verify that foreground text remains readable against the image, that dialogs fit within the screen, and that navigation still reaches the intended section.

## Static hosting

GitHub Pages serves the contents of `public` on the `gh-pages` branch. The root of that branch contains `index.html` and `.nojekyll`. All local resource references are relative, so the same files work under a repository path without rewriting an origin or base URL.

To publish an update, validate the source and replace the deployment branch contents with the current `public` directory. The default branch retains this technical reference and the checks. The deployment branch contains only browser-delivered assets.

The same payload can be hosted by another static HTTP service. A custom domain, worker runtime, rewrite rule, environment variable, or private application credential is not required.

## Maintenance boundaries

Keep browser state keys stable when changing presentation code. If a future update changes the serialized state format, add an explicit migration or version boundary rather than silently interpreting older records with a different schema.

Treat input values as text when rendering records. Avoid inserting user-entered content into raw HTML. Existing records are constructed with DOM elements and assigned through `textContent`.

Keep generated exports, browser profiles, session captures, local credentials, and personal notes outside version control. The visual resource is an original generated illustration. The opening quotation is from Wang Wei's *Zhongnan Retreat*.

This repository is a static delivery and maintenance surface. It does not provide a public API, analytics endpoint, shared record store, or remote processing service.

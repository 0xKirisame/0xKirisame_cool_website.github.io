# SYSTEM.CORE // Optimization Protocol for kirisame.dev

This document outlines the architectural optimizations required to transition the `kirisame.dev` Vectorheart frontend from a development prototype to a production-grade, high-performance static site. 

The goal is to achieve instant load times and a locked 60fps execution without altering a single pixel of the visual design.

## Phase 1: Static CSS Compilation (Removing Tailwind CDN)
**Objective:** Eliminate the runtime JavaScript payload that compiles CSS in the browser, reducing initial load latency.

1. **Initialize Environment:** Run `npm init -y` and `npm install -D tailwindcss`.
2. **Extract Config:** Move the custom Tailwind configuration (miku colors, alert reds, wide/mono fonts, and hard shadows) from the HTML `<script>` block into a dedicated `tailwind.config.js` file.
3. **Compile Static CSS:** Create an input CSS file with the Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`) and run the Tailwind CLI to build a minified production stylesheet.
4. **HTML Update:** Replace the CDN `<script>` tag with a standard `<link rel="stylesheet" href="styles.css">`.

## Phase 2: Asset & Font Localization (Zero-Latency Rendering)
**Objective:** Remove external network requests that block the critical rendering path.

1. **Image Compression:** Convert standard PNGs (like `spica_cover.png`) to `.webp` or `.avif` formats to reduce file size by 50-70% while maintaining pixel-perfect quality.
2. **Self-Host Fonts:** * Download the `Syncopate` and `JetBrains Mono` fonts from Google.
   * Store them locally in a `/fonts` directory.
   * Write local `@font-face` CSS rules utilizing `font-display: swap;`. 
   * *Impact:* This guarantees the aggressive brutalist typography renders instantly before the GSAP mechanical curtain slashes open.

## Phase 3: JavaScript Execution & Engine Upgrades
**Objective:** Prevent DOM thrashing (Garbage Collection stutter) and ensure smooth animations.

1. **Execution Deferral:** Wrap the initialization of the Danmaku background engine in a `requestIdleCallback()` (with a `setTimeout` fallback). This ensures the browser only dedicates CPU cycles to the background text *after* the heavy curtain GSAP animation finishes.
2. **Danmaku Object Pooling (The Core Fix):** * **Current State:** The script constantly runs `document.createElement('div')` and `el.remove()`. 
   * **Required Fix:** Rewrite the engine to utilize an "Object Pool." Pre-allocate a fixed array of ~50 DOM elements. When a text string flies off the screen, do not delete it—reset its X/Y coordinates, update its text string, and fire it again. 
3. **Canvas Migration (Optional/Extreme Performance):** If DOM pooling is insufficient, rewrite the Danmaku engine to render the text strings onto a single HTML5 `<canvas>` element positioned at `z-index: 0`.

## Phase 4: The Astro Migration (Recommended Architecture)
**Objective:** Structure the project for long-term scalability and automated static site generation (SSG) for GitHub Pages.

1. Run `npm create astro@latest` (Empty Project).
2. Run `npx astro add tailwind` to automate CSS compilation.
3. Port the HTML structure into `src/pages/index.astro` and `src/pages/blog/SPiCa.astro`.
4. Migrate the GSAP logic into Astro's native `<script>` tags, which handles bundling and minification automatically.
5. Setup the GitHub Actions workflow to build and deploy the `dist/` folder directly to GitHub Pages.

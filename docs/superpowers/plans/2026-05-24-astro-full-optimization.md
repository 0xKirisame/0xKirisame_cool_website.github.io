# Vectorheart Astro Migration & Full Optimization

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate kirisame.dev from raw HTML + Tailwind CDN to Astro SSG with compiled CSS, self-hosted fonts, optimized images, and a rewritten danmaku engine with object pooling — zero visual changes.

**Architecture:** Astro static site with 3 pages (index, blog index, SPiCa post). Tailwind compiled at build time via `@astrojs/tailwind`. Fonts served from `/public/fonts/`. Danmaku rewritten as a standalone ES module using a pre-allocated DOM pool. GitHub Actions deploys `dist/` to Pages.

**Tech Stack:** Astro 5.x, Tailwind CSS 4.x (via @astrojs/tailwind), GSAP 3.12, sharp (image optimization at build), GitHub Actions

---

## File Structure

```
├── astro.config.mjs          # Astro config with tailwind + site URL
├── tailwind.config.mjs        # Extracted from index.html <script> block
├── package.json
├── tsconfig.json              # Astro default
├── public/
│   ├── CNAME                  # Preserved for GitHub Pages custom domain
│   ├── fonts/
│   │   ├── syncopate-regular.woff2
│   │   ├── syncopate-bold.woff2
│   │   ├── jetbrains-mono-regular.woff2
│   │   ├── jetbrains-mono-bold.woff2
│   │   ├── noto-serif-jp-bold.woff2
│   │   ├── inter-regular.woff2
│   │   ├── inter-semibold.woff2
│   │   └── inter-bold.woff2
│   └── images/
│       ├── spica_cover.webp   # Converted from PNG (already JPEG internally)
│       ├── nysm_kill.mp4      # Copied as-is
│       ├── Removal-207.webp   # Converted from PNG
│       └── Tou.png            # Favicon, keep PNG for compat
├── src/
│   ├── styles/
│   │   ├── global.css         # @tailwind directives + @font-face rules + all custom CSS from index.html <style>
│   │   └── blog.css           # Blog-specific styles from blog pages
│   ├── layouts/
│   │   ├── BaseLayout.astro   # <html>, <head>, font preloads, global.css import, curtain markup, danmaku layer, ticker, GSAP script
│   │   └── BlogLayout.astro   # Blog chrome: dark bg, nav, footer, blog.css
│   ├── scripts/
│   │   ├── curtain.ts         # GSAP curtain reveal + page-link exit animations
│   │   └── danmaku.ts         # Object-pooled danmaku engine with requestIdleCallback
│   └── pages/
│       ├── index.astro        # Homepage content (header hero + setlist cards)
│       ├── blog/
│       │   ├── index.astro    # Blog listing page
│       │   └── SPiCa.astro    # SPiCa article
└── .github/
    └── workflows/
        └── deploy.yml         # Astro build + deploy to GitHub Pages
```

---

### Task 1: Scaffold Astro Project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `tailwind.config.mjs`

- [ ] **Step 1: Initialize Astro**

Run from project root:
```bash
npm create astro@latest . -- --template minimal --no-install --no-git --typescript strict
```

If prompted about overwriting, allow it for generated config files only — NOT for `index.html`, `images/`, `blog/`, or `CNAME`.

- [ ] **Step 2: Install dependencies**

```bash
npm install astro @astrojs/tailwind tailwindcss
npm install -D sharp @astrojs/sitemap
```

- [ ] **Step 3: Write `tailwind.config.mjs`**

Extract the config from `index.html` lines 14-36:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts}'],
  theme: {
    extend: {
      colors: {
        miku: '#39C5BB',
        alert: '#FF0055',
        void: '#000000',
        paper: '#FAFAFA',
      },
      fontFamily: {
        wide: ['Syncopate', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        jp: ['Noto Serif JP', 'serif'],
      },
      boxShadow: {
        'hard-miku': '8px 8px 0px 0px #39C5BB',
        'hard-alert': '8px 8px 0px 0px #FF0055',
        'hard-black': '8px 8px 0px 0px #000000',
        'hard-white': '8px 8px 0px 0px #FFFFFF',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kirisame.dev',
  integrations: [tailwind(), sitemap()],
  build: {
    assets: '_assets',
  },
});
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tailwind.config.mjs tsconfig.json
git commit -m "chore: scaffold Astro project with Tailwind integration"
```

---

### Task 2: Self-Host Fonts

**Files:**
- Create: `public/fonts/` (8 woff2 files)
- Create: `src/styles/global.css`

- [ ] **Step 1: Download Google Fonts as woff2**

Use the google-webfonts-helper API or download directly. We need these font families & weights:
- Syncopate: 400, 700
- JetBrains Mono: 400, 700
- Noto Serif JP: 700
- Inter: 400, 600, 700

```bash
mkdir -p public/fonts

# Download using npx google-fonts-helper or curl from fonts.google.com
# For each font, get the woff2 file. Example using a helper script:
npx @nicepkg/gfont-dl --font "Syncopate:400,700" --out public/fonts --format woff2
npx @nicepkg/gfont-dl --font "JetBrains Mono:400,700" --out public/fonts --format woff2
npx @nicepkg/gfont-dl --font "Noto Serif JP:700" --out public/fonts --format woff2
npx @nicepkg/gfont-dl --font "Inter:400,600,700" --out public/fonts --format woff2
```

If the helper tool doesn't work, manually download from Google Fonts UI and place woff2 files in `public/fonts/`. Name them with lowercase-kebab convention.

- [ ] **Step 2: Write `src/styles/global.css` with @font-face rules and Tailwind directives**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Self-hosted fonts */
@font-face {
  font-family: 'Syncopate';
  src: url('/fonts/syncopate-v12-latin-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Syncopate';
  src: url('/fonts/syncopate-v12-latin-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/jetbrains-mono-v18-latin-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/jetbrains-mono-v18-latin-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Noto Serif JP';
  src: url('/fonts/noto-serif-jp-v21-japanese-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-v18-latin-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-v18-latin-600.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-v18-latin-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

Note: Actual filenames will depend on what the font downloader produces. Adjust `src:` URLs to match the actual filenames in `public/fonts/`.

- [ ] **Step 3: Commit**

```bash
git add public/fonts/ src/styles/global.css
git commit -m "feat: self-host all Google Fonts as woff2 with font-display swap"
```

---

### Task 3: Convert Images to WebP

**Files:**
- Create: `public/images/spica_cover.webp`, `public/images/Removal-207.webp`
- Copy: `public/images/nysm_kill.mp4`, `public/images/Tou.png`

- [ ] **Step 1: Set up public/images and convert**

```bash
mkdir -p public/images
cp images/nysm_kill.mp4 public/images/
cp images/Tou.png public/images/

# Use sharp-cli or a quick Node script to convert
node -e "
const sharp = require('sharp');
sharp('images/spica_cover.png').webp({ quality: 85 }).toFile('public/images/spica_cover.webp');
sharp('images/Removal-207.png').webp({ quality: 85 }).toFile('public/images/Removal-207.webp');
"
```

- [ ] **Step 2: Copy CNAME to public/**

```bash
cp CNAME public/CNAME
```

- [ ] **Step 3: Commit**

```bash
git add public/images/ public/CNAME
git commit -m "feat: convert images to webp, localize all assets to public/"
```

---

### Task 4: Write the Danmaku Object Pool Engine

**Files:**
- Create: `src/scripts/danmaku.ts`

This is the core performance fix from Phase 3 of the optimization plan. Instead of `createElement`/`remove()` on every bullet, pre-allocate a fixed pool of DOM elements and recycle them.

- [ ] **Step 1: Write `src/scripts/danmaku.ts`**

```ts
const POOL_SIZE = 50;
const SPAWN_INTERVAL_MS = 400;

const TERMS = [
  '0xFFFFFF', 'sched_switch', 'PID_HOLLOWING', 'Aya_eBPF',
  'sys_execve', 'DKOM_DETECTED', '0xKIRISAME', 'vmlinux',
  'ptrace', 'kprobe', 'bpf_map_lookup', 'Vec<u8>',
  'KERNEL_PANIC', 'VOCALOID_01', "39's_GIVING_DAY",
];

interface Bullet {
  el: HTMLDivElement;
  active: boolean;
}

let pool: Bullet[] = [];
let gsap: any;
let layer: HTMLElement | null;

function initPool() {
  layer = document.getElementById('danmaku-layer');
  if (!layer) return;

  for (let i = 0; i < POOL_SIZE; i++) {
    const el = document.createElement('div');
    el.className = 'danmaku-bullet';
    el.style.visibility = 'hidden';
    layer.appendChild(el);
    pool.push({ el, active: false });
  }
}

function fireBullet() {
  const bullet = pool.find((b) => !b.active);
  if (!bullet || !gsap) return;

  bullet.active = true;
  const el = bullet.el;

  el.textContent = TERMS[Math.floor(Math.random() * TERMS.length)];
  el.style.top = `${Math.random() * window.innerHeight}px`;
  el.style.visibility = 'visible';

  gsap.fromTo(
    el,
    { x: window.innerWidth + 200 },
    {
      x: -400,
      duration: 8 + Math.random() * 12,
      ease: 'none',
      onComplete: () => {
        el.style.visibility = 'hidden';
        bullet.active = false;
      },
    },
  );
}

function startDanmaku(gsapInstance: any) {
  gsap = gsapInstance;
  initPool();
  setInterval(fireBullet, SPAWN_INTERVAL_MS);
  for (let i = 0; i < 30; i++) {
    setTimeout(fireBullet, Math.random() * 2000);
  }
}

export { startDanmaku };
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/danmaku.ts
git commit -m "feat: rewrite danmaku engine with object pooling (zero GC pressure)"
```

---

### Task 5: Write the Curtain Animation Script

**Files:**
- Create: `src/scripts/curtain.ts`

- [ ] **Step 1: Write `src/scripts/curtain.ts`**

Extract the GSAP curtain reveal and page-link exit animation from `index.html` lines 375-418:

```ts
function initCurtain(gsap: any) {
  gsap.set('#page-curtain-container', { backgroundColor: 'transparent' });

  gsap.to('.curtain-stripe', {
    x: (index: number) => (index % 2 === 0 ? '100%' : '-100%'),
    duration: 1.2,
    stagger: 0.15,
    ease: 'power4.inOut',
    delay: 0.3,
  });

  gsap.fromTo(
    '.gsap-slide',
    { y: 100, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power4.out',
      delay: 0.8,
      clearProps: 'transform',
    },
  );
}

function initPageTransitions(gsap: any) {
  document.querySelectorAll('a.page-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetUrl = (link as HTMLAnchorElement).getAttribute('href');

      gsap.fromTo(
        '.curtain-stripe',
        { x: (index: number) => (index % 2 === 0 ? '100%' : '-100%') },
        {
          x: '0%',
          duration: 0.6,
          stagger: 0.1,
          ease: 'power4.inOut',
          onComplete: () => {
            window.location.href = targetUrl!;
          },
        },
      );
    });
  });
}

export { initCurtain, initPageTransitions };
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/curtain.ts
git commit -m "feat: extract curtain animation to standalone module"
```

---

### Task 6: Build the Base Layout

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/styles/global.css` (append homepage custom CSS)

- [ ] **Step 1: Append homepage custom styles to `src/styles/global.css`**

Add everything from the original `index.html` `<style>` block (lines 39-211) AFTER the @font-face rules. This includes:
- `body` background grid
- `.ticker-wrap` and `.ticker` animation
- `#danmaku-layer` and `.danmaku-bullet` styles
- `.wireframe-box` with `::before`/`::after`
- `.diva-nav` with hover ring effect
- `.z-content`, `.glitch-hover`
- `.ribbed-black`, `.ribbed-alert`, `.ribbed-miku` textures
- `.vector-glitch-block` with `::before`/`::after` and keyframes

Copy them verbatim — no pixel changes.

- [ ] **Step 2: Write `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <link rel="icon" href="/images/Tou.png" />

    <!-- Font preloads for critical text -->
    <link rel="preload" href="/fonts/syncopate-v12-latin-700.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/jetbrains-mono-v18-latin-700.woff2" as="font" type="font/woff2" crossorigin />
  </head>
  <body class="antialiased selection:bg-miku selection:text-void font-mono">
    <!-- Curtain -->
    <div
      id="page-curtain-container"
      class="fixed inset-0 z-[9999] pointer-events-none bg-white overflow-hidden flex items-center justify-center"
    >
      <div class="absolute w-[300vw] h-[300vh] flex flex-col justify-center items-center -rotate-12">
        <div class="curtain-stripe w-full h-[40vh] bg-void shadow-[0_20px_0_0_#39C5BB] relative z-30"></div>
        <div class="curtain-stripe w-full h-[40vh] bg-miku relative z-20"></div>
        <div class="curtain-stripe w-full h-[40vh] bg-alert shadow-[0_-20px_0_0_#000000] relative z-10"></div>
      </div>
    </div>

    <!-- Danmaku Layer -->
    <div id="danmaku-layer"></div>

    <slot />

    <!-- Ticker -->
    <div
      class="ticker-wrap fixed bottom-0 left-0 py-3 font-black tracking-[0.4em] uppercase border-t-[6px] border-black text-black bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.15)] text-xs z-50"
    >
      <div class="ticker" style="animation-direction: reverse;">
        <span class="mr-16">SECURE_LINK //</span>
        <a href="https://github.com/0xKirisame" target="_blank" class="mr-16 hover:text-miku transition-colors cursor-pointer">GITHUB.COM/0XKIRISAME //</a>
        <a href="https://linkedin.com/in/salman-aljardan" target="_blank" class="mr-16 hover:text-miku transition-colors cursor-pointer">LINKEDIN.COM/IN/SALMAN-ALJARDAN //</a>
        <a href="mailto:contact@kirisame.dev" class="mr-16 text-alert hover:text-void transition-colors cursor-pointer">CONTACT@KIRISAME.DEV //</a>
        <span class="mr-16">SECURE_LINK //</span>
        <a href="https://github.com/0xKirisame" target="_blank" class="mr-16 hover:text-miku transition-colors cursor-pointer">GITHUB.COM/0XKIRISAME //</a>
        <a href="https://linkedin.com/in/salman-aljardan" target="_blank" class="mr-16 hover:text-miku transition-colors cursor-pointer">LINKEDIN.COM/IN/SALMAN-ALJARDAN //</a>
        <a href="mailto:contact@kirisame.dev" class="mr-16 text-alert hover:text-void transition-colors cursor-pointer">CONTACT@KIRISAME.DEV //</a>
        <span class="mr-16">SECURE_LINK //</span>
        <a href="https://github.com/0xKirisame" target="_blank" class="mr-16 hover:text-miku transition-colors cursor-pointer">GITHUB.COM/0XKIRISAME //</a>
        <a href="https://linkedin.com/in/salman-aljardan" target="_blank" class="mr-16 hover:text-miku transition-colors cursor-pointer">LINKEDIN.COM/IN/SALMAN-ALJARDAN //</a>
        <a href="mailto:contact@kirisame.dev" class="mr-16 text-alert hover:text-void transition-colors cursor-pointer">CONTACT@KIRISAME.DEV //</a>
      </div>
    </div>

    <!-- GSAP + Init -->
    <script>
      import { gsap } from 'gsap';
      import { initCurtain, initPageTransitions } from '../scripts/curtain';
      import { startDanmaku } from '../scripts/danmaku';

      window.addEventListener('load', () => {
        initCurtain(gsap);
        initPageTransitions(gsap);

        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => startDanmaku(gsap));
        } else {
          setTimeout(() => startDanmaku(gsap), 1500);
        }
      });
    </script>
  </body>
</html>
```

Note: GSAP needs to be installed as an npm dependency for the ESM import.

```bash
npm install gsap
```

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro src/styles/global.css
git commit -m "feat: create BaseLayout with curtain, danmaku, and ticker"
```

---

### Task 7: Build the Blog Layout

**Files:**
- Create: `src/layouts/BlogLayout.astro`
- Create: `src/styles/blog.css`

- [ ] **Step 1: Write `src/styles/blog.css`**

Extract styles from `blog/SPiCa.html` lines 11-23 (the dark-theme blog styles):

```css
.blog-body {
  font-family: 'Inter', sans-serif;
  background-color: #111111;
  color: #e5e5e5;
}

.blog-body h1,
.blog-body h2,
.blog-body h3,
.blog-body h4 {
  font-family: 'Noto Serif JP', serif;
  color: white;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.blog-body p {
  margin-bottom: 1.2em;
  line-height: 1.8;
  color: #d1d5db;
}

.blog-body code {
  font-family: 'JetBrains Mono', monospace;
  background: #222;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  color: #ff79c6;
  font-size: 0.9em;
}

.blog-body pre {
  background: #1a1a1a;
  padding: 1.5em;
  border-radius: 8px;
  overflow-x: auto;
  border: 1px solid #333;
  margin-bottom: 2em;
}

.blog-body pre code {
  background: transparent;
  padding: 0;
  color: #f8f8f2;
}

.blog-body blockquote {
  border-left: 4px solid #ef4444;
  padding-left: 1em;
  color: #9ca3af;
  font-style: italic;
  margin-bottom: 1.5em;
  background: rgba(239, 68, 68, 0.05);
  padding: 1rem;
  border-radius: 0 8px 8px 0;
}

.diagram-box {
  border: 1px solid #333;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  background: #1a1a1a;
}

.text-miku { color: #39C5BB; }
.border-miku { border-color: #39C5BB; }
.bg-miku-dim { background-color: rgba(57, 197, 187, 0.1); }
.shadow-miku { box-shadow: 0 0 30px rgba(57, 197, 187, 0.15); }
```

- [ ] **Step 2: Write `src/layouts/BlogLayout.astro`**

```astro
---
import '../styles/global.css';
import '../styles/blog.css';

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <link rel="icon" href="/images/Tou.png" />
    <link rel="preload" href="/fonts/noto-serif-jp-v21-japanese-700.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/inter-v18-latin-regular.woff2" as="font" type="font/woff2" crossorigin />
  </head>
  <body class="blog-body antialiased">
    <slot />
  </body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BlogLayout.astro src/styles/blog.css
git commit -m "feat: create BlogLayout with dark theme styles"
```

---

### Task 8: Port the Homepage

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: Write `src/pages/index.astro`**

Port `index.html` content (lines 226-351 — the `<header>` and `<main>`) into the BaseLayout slot. Key changes:
- Wrap with `<BaseLayout title="0xKirisame // SYSTEM.CORE">`
- Update image path: `./images/spica_cover.png` → `/images/spica_cover.webp`
- Internal links stay the same (`/blog/SPiCa.html` → `/blog/SPiCa`)
- All Tailwind classes remain identical
- Remove the `<script>` block (handled by BaseLayout)
- Remove `<style>` block (in global.css)
- Remove Google Fonts `<link>` tags (self-hosted now)
- Remove Tailwind CDN `<script>` (compiled at build)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="0xKirisame // SYSTEM.CORE">
  <header class="relative w-full h-[70vh] min-h-[600px] overflow-hidden border-b-[8px] border-black flex items-center justify-center">
    <!-- Vectorheart background geometry — copy lines 228-268 from index.html verbatim -->
    <div class="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
      <div class="relative w-full h-full transform -rotate-[35deg] scale-125 md:scale-110 flex justify-center items-center">
        <div class="absolute w-[180px] h-[200vh] bg-void flex flex-col justify-center items-center gap-12 shadow-hard-miku">
          <div class="w-32 h-32 border-[12px] border-paper rounded-full flex items-center justify-center">
            <div class="w-16 h-16 bg-alert rounded-full"></div>
          </div>
          <div class="w-40 h-[100px] ribbed-miku"></div>
          <div class="font-wide text-white text-6xl font-black rotate-90 tracking-widest mt-32 whitespace-nowrap">0xKIRISAME</div>
          <div class="w-32 h-32 bg-paper rounded-full border-[8px] border-void flex items-center justify-center shadow-[inset_0_0_0_8px_#FF0055]"></div>
        </div>
        <div class="absolute -ml-[280px] mt-[150px] flex flex-col gap-4">
          <div class="w-[60px] h-[150vh] bg-alert relative border-r-[8px] border-void">
            <div class="absolute top-[20%] -right-[60px] font-wide text-void text-8xl font-black rotate-90 opacity-20">SYS</div>
          </div>
          <div class="w-[120px] h-[500px] bg-paper border-[8px] border-void absolute top-[10%] -left-[140px] flex flex-col justify-between p-4 shadow-hard-alert">
            <div class="w-full h-20 ribbed-black"></div>
            <div class="font-wide text-4xl font-black rotate-90 -ml-8">>> SP-iCa</div>
          </div>
          <div class="w-[20px] h-[200vh] bg-void absolute -left-[200px] top-[-50vh]"></div>
        </div>
        <div class="absolute ml-[320px] -mt-[200px] flex gap-6">
          <div class="w-[80px] h-[200vh] bg-miku shadow-hard-black flex flex-col items-center pt-64 gap-8">
            <div class="w-16 h-16 border-[8px] border-void rounded-full"></div>
            <div class="font-wide text-void text-4xl font-black rotate-90 mt-16 whitespace-nowrap">&lt;&lt; EXIT &lt;&lt;</div>
          </div>
          <div class="w-[12px] h-[200vh] bg-void mt-[100px]"></div>
          <div class="w-[4px] h-[200vh] bg-alert mt-[150px]"></div>
          <div class="w-[30px] h-[200vh] ribbed-alert mt-[200px]"></div>
          <div class="absolute top-[40%] left-[120px] flex flex-col gap-2">
            <svg class="w-24 h-24 text-void" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
            <svg class="w-24 h-24 text-miku -mt-12" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
          </div>
        </div>
        <div class="absolute w-[200vh] h-[40px] bg-void rotate-90 top-1/2 left-[-50vw] opacity-20 mix-blend-overlay"></div>
        <div class="absolute w-[200vh] h-[20px] bg-alert rotate-90 top-[40%] left-[-40vw]"></div>
      </div>
    </div>

    <!-- Hero card + nav -->
    <div class="relative z-10 w-full max-w-[1200px] mx-auto px-4 md:px-8 mt-auto mb-16 flex flex-col md:flex-row justify-between items-end gsap-slide opacity-0">
      <div class="wireframe-box p-6 md:p-10 shadow-hard-miku max-w-2xl bg-[#FAFAFA]/95 backdrop-blur-sm">
        <p class="text-alert font-bold tracking-[0.4em] mb-4 text-sm uppercase flex items-center gap-2">
          <span class="w-3 h-3 bg-alert animate-pulse inline-block"></span>
          USER_ID: 0xKIRISAME
        </p>
        <h1 class="font-wide text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6 text-void">
          <div class="vector-glitch-block" data-text="Salman">Salman</div><br />
          <div class="vector-glitch-block text-transparent mt-2" style="-webkit-text-stroke: 3px #000;" data-text="Aljardan">Aljardan</div>
        </h1>
        <div class="flex flex-wrap gap-4 font-black text-sm tracking-widest bg-void text-white p-3 inline-block shadow-[6px_6px_0_0_#FF0055] uppercase">
          <span>SRE</span> // <span>COMPE</span> // <span class="text-miku">KERNEL_SEC</span>
        </div>
      </div>
      <nav class="mt-8 md:mt-0 grid grid-cols-1 gap-4 w-full md:w-auto">
        <a href="#setlist" class="diva-nav text-center shadow-hard-black">Setlist</a>
        <a href="/blog" class="diva-nav text-center shadow-hard-black page-link">Blog</a>
        <a href="#ops" class="diva-nav text-center shadow-hard-black">Ops</a>
      </nav>
    </div>
  </header>

  <main class="max-w-[1000px] mx-auto px-4 md:px-8 pt-24 pb-40 z-content">
    <div class="flex flex-col gap-16" id="setlist">
      <!-- SPiCa Featured Card -->
      <a href="/blog/SPiCa" class="gsap-slide opacity-0 wireframe-box flex flex-col md:flex-row group shadow-hard-black hover:shadow-hard-miku transition-all duration-300 bg-white cursor-pointer page-link items-stretch">
        <div class="w-full md:w-2/5 min-h-[300px] border-b-[4px] md:border-b-0 md:border-r-[4px] border-black relative overflow-hidden bg-black p-2 flex-shrink-0 flex items-center justify-center">
          <img src="/images/spica_cover.webp" class="absolute inset-0 w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" alt="SPiCa cover" />
          <div class="absolute top-4 left-4 bg-miku text-black px-4 py-2 text-xs font-black font-wide animate-pulse shadow-hard-black z-10 border-2 border-black">FEATURED_TRACK</div>
          <div class="absolute w-16 h-16 border-[4px] border-alert rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center scale-50 group-hover:scale-100">
            <div class="w-[140%] h-[4px] bg-alert absolute"></div>
            <div class="h-[140%] w-[4px] bg-alert absolute"></div>
          </div>
        </div>
        <div class="p-8 w-full md:w-3/5 flex flex-col justify-between flex-grow">
          <div>
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-wide text-5xl font-black group-hover:text-miku transition-colors uppercase">SPiCa</h3>
              <span class="text-xs font-black tracking-widest bg-black text-white px-3 py-1 shadow-[4px_4px_0_0_#39C5BB]">V_1.2</span>
            </div>
            <p class="font-bold text-alert text-xs tracking-widest mb-6 uppercase border-b-4 border-black inline-block pb-2">Binary Star Systems & Kernel Sovereignty</p>
            <p class="text-base leading-relaxed mb-8 font-bold font-mono text-gray-800">
              A kernel-sovereign eBPF Rootkit Detection Engine written in Rust. Detects DKOM and PID Hollowing by monitoring the CPU scheduler directly, bypassing syscall tables. Restoring harmony between Kernel and User space.
            </p>
          </div>
          <div class="flex gap-4">
            <span class="border-[4px] border-black px-4 py-2 text-sm font-black uppercase glitch-hover transition-colors shadow-[4px_4px_0_0_#000]">Rust</span>
            <span class="border-[4px] border-black px-4 py-2 text-sm font-black uppercase glitch-hover transition-colors shadow-[4px_4px_0_0_#000]">Aya eBPF</span>
          </div>
        </div>
      </a>

      <!-- Project Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div class="gsap-slide opacity-0 wireframe-box p-8 bg-white shadow-hard-black flex flex-col justify-between hover:-translate-y-2 transition-transform duration-300 cursor-default">
          <div>
            <h3 class="font-wide text-3xl font-black mb-4 uppercase">Entropy AI</h3>
            <p class="text-miku font-black tracking-widest text-xs mb-6 bg-void text-white p-2 inline-block">SRE // PRESENT</p>
            <p class="text-sm font-bold mb-4 font-mono leading-relaxed text-gray-800">
              Diagnosed critical deadlocks in Metaflow/MinIO clusters. Engineered internal HTTP service mesh & Nginx reverse-proxy sidecars.
            </p>
          </div>
          <span class="text-xs tracking-widest font-black uppercase border-t-[4px] border-black pt-4 w-full text-alert mt-6 block">STATUS: ACTIVE</span>
        </div>

        <a href="https://github.com/0xKirisame/memory-safe-REPL-shell" target="_blank" class="gsap-slide opacity-0 wireframe-box p-8 bg-miku text-black shadow-hard-black flex flex-col justify-between hover:bg-black hover:text-miku transition-colors duration-300 group outline-none">
          <div>
            <h3 class="font-wide text-3xl font-black mb-4 uppercase group-hover:text-white transition-colors">Mem-Safe REPL</h3>
            <p class="font-black tracking-widest text-xs mb-6 bg-white group-hover:bg-alert group-hover:text-white text-void p-2 inline-block transition-colors">RUST SHELL</p>
            <p class="text-sm font-bold mb-4 font-mono leading-relaxed text-void group-hover:text-gray-300 transition-colors">
              FSM lexer written in Rust. Features REPL utilities, pipe handling, and safe binary execution.
            </p>
          </div>
          <span class="text-xs tracking-widest font-black uppercase border-t-[4px] border-black pt-4 w-full group-hover:border-miku transition-colors mt-6 block">GITHUB -&gt;</span>
        </a>
      </div>
    </div>
  </main>
</BaseLayout>
```

- [ ] **Step 2: Verify build compiles**

```bash
npx astro build
```

Expected: Build succeeds, `dist/` contains the homepage.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: port homepage to Astro with BaseLayout"
```

---

### Task 9: Port the Blog Pages

**Files:**
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/blog/SPiCa.astro`

- [ ] **Step 1: Write `src/pages/blog/index.astro`**

Port `blog/index.html` into BlogLayout. Update link to `/blog/SPiCa`:

```astro
---
import BlogLayout from '../../layouts/BlogLayout.astro';
---

<BlogLayout title="Blog | Salman Aljardan">
  <div class="container mx-auto max-w-4xl px-4 py-16">
    <header class="mb-16">
      <a href="/" class="text-gray-400 hover:text-white transition-colors mb-4 block">&larr; Return to Base</a>
      <h1 class="text-4xl lg:text-6xl font-jp font-bold text-white">Transmission Log</h1>
      <p class="text-lg text-gray-400 mt-2">Engineering notes from the void.</p>
    </header>

    <main class="grid gap-8">
      <a href="/blog/SPiCa" class="card block bg-[#1A1A1A] border border-[#333333] rounded-lg p-8 transition-all duration-300 group">
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-2xl font-bold text-white group-hover:text-[#39C5BB] transition-colors">
            SPiCa: Binary Star Systems & Kernel Sovereignty
          </h2>
          <span class="text-sm text-gray-500 font-mono">2026-01-17</span>
        </div>
        <p class="text-gray-400 mb-4">
          Inspired by the lyrics of a Hatsune Miku song, this post explores how the binary star system of Spica mirrors the relationship between Kernel and User Space, and how eBPF differential analysis can restore harmony when rootkits disrupt it.
        </p>
        <div class="flex gap-2">
          <span class="text-xs bg-teal-900/30 text-teal-300 px-2 py-1 rounded">Philosophy</span>
          <span class="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">Rust</span>
          <span class="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded">eBPF</span>
        </div>
      </a>
    </main>
  </div>
</BlogLayout>
```

- [ ] **Step 2: Write `src/pages/blog/SPiCa.astro`**

Port `blog/SPiCa.html` article content into BlogLayout. Update asset paths:
- `../images/spica_cover.png` → `/images/spica_cover.webp`
- `../images/nysm_kill.mp4` → `/images/nysm_kill.mp4`
- Nav link: `/blog/index.html` → `/blog`

```astro
---
import BlogLayout from '../../layouts/BlogLayout.astro';
---

<BlogLayout title="SPiCa: Binary Star Systems & Kernel Sovereignty | 0xKirisame">
  <div class="container mx-auto max-w-3xl px-4 py-16">
    <nav class="mb-12 flex justify-between items-center text-sm text-gray-500">
      <a href="/blog" class="hover:text-white transition-colors">&larr; Return to Log</a>
      <span class="font-mono">LOG_ID: SPICA_V1</span>
    </nav>

    <header class="mb-12 border-b border-gray-800 pb-8">
      <h1 class="text-4xl md:text-5xl font-bold leading-tight mb-4">SPiCa: Binary Star Systems & Kernel Sovereignty</h1>
    </header>

    <article class="prose prose-invert max-w-none">
      <p class="text-xl text-gray-300 font-serif italic border-l-2 border-miku pl-4 mb-12">
        "I'm going to sing, so shine bright, SPiCa..."
      </p>

      <div class="mb-12 rounded-lg overflow-hidden shadow-miku border border-gray-800 group">
        <img src="/images/spica_cover.webp" alt="Hatsune Miku SPiCa" class="w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <div class="text-justify space-y-6">
        <p>A few weeks ago, I was playing <em>Hatsune Miku Project Diva 2nd F</em> on my PS Vita. I was grinding the song <strong>"SPiCa -39's Giving Day Edition-"</strong>, and something about the lyrics made me curious. I paused the game and looked it up.</p>
        <p>I discovered that Spica isn't just a name. It's the brightest star in the Virgo constellation and a binary star system. It's not one massive star, but two distinct stars spinning in perfect harmony, so close together that they appear as one single, brilliant point of light in the night sky.</p>
        <p>That explanation immediately painted an image in my mind: <strong>The Kernel and The User Space.</strong></p>
        <p>Ideally, they are like binary stars spinning in harmony, perfectly synchronized, always understanding each other. But then it hit me: <em>Do they always spin in harmony?</em></p>
        <p>No. Rootkits exist. They poison the relationship. They decouple the reality of the Kernel from the perception of the User. They ruin the harmony.</p>
        <p>That's when I realized that my idea for a rootkit detector based on differential analysis was actually the engineering equivalent of that binary star system. I looked at existing tools, mostly built on LKMs (Loadable Kernel Modules) and C++. They were powerful, sure, but unstable. A bug there bricks your kernel.</p>
        <p>What does the world need now? A detector that is stable, safe, and fast. That is why I wrote <strong>SPiCa</strong> in Rust using the Aya eBPF stack.</p>
      </div>

      <hr class="border-gray-800 my-12" />

      <h2>Live Demonstration</h2>
      <p>Seeing is believing. Below is a recording of SPiCa catching <strong>Nysm</strong>, a modern stealth container that uses eBPF to blind standard tools like <code>ps</code> and <code>top</code>. Note the delay: Nysm activates its cloak, but SPiCa sees through it instantly.</p>

      <div class="my-8 border border-gray-700 rounded-lg overflow-hidden bg-black shadow-miku">
        <div class="bg-gray-900 px-4 py-2 border-b border-gray-800 flex items-center justify-between">
          <span class="text-xs font-mono text-miku">root@kirisame:~# ./spica_demo.mp4</span>
          <div class="flex gap-2">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
        <video controls class="w-full">
          <source src="/images/nysm_kill.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <h2>SPiCa: System Process Integrity & Cross-view Analysis</h2>
      <p class="text-justify">SPiCa is a high-performance, eBPF-based rootkit detection engine. Inspired by the miku song by toku, SPiCa acts as that "Binary Star" enforcing <strong>Kernel Sovereignty</strong> by establishing a ground truth based on CPU execution rather than relying on potentially compromised system APIs.</p>

      <div class="bg-gray-900 rounded-lg p-6 border border-gray-800 my-8">
        <h3 class="!mt-0 text-lg font-bold text-gray-200 mb-4">The "Layer 0" Argument</h3>
        <p class="text-sm text-justify">Some people argue that SPiCa is only effective in Layer 0 (Kernel) and is irrelevant in the cloud age. I argue the opposite.</p>
        <p class="text-sm mb-0 text-justify">In the Cloud Shared Responsibility Model, everything above Layer 0 is the user's problem. While the provider handles the hypervisor and firmware, the <strong>guest kernel</strong> is your territory. If an attacker owns your kernel, they own your data. SPiCa defends that sovereignty.</p>
      </div>

      <h3>The Architecture</h3>
      <p>SPiCa operates on a "Binary Star" principle, maintaining two distinct observational vantages to identify discrepancies in system state:</p>

      <div class="grid md:grid-cols-2 gap-8 my-10">
        <div class="bg-miku-dim border border-miku rounded-lg p-6">
          <h4 class="!mt-0 text-miku font-bold">1. The Kernel View</h4>
          <p class="text-sm text-gray-300"><strong>Ground Truth.</strong> Utilizes an eBPF probe hooked into the <code>sched_switch</code> tracepoint. This captures the raw execution context of every process the moment it touches the CPU, bypassing the Virtual File System (VFS).</p>
        </div>
        <div class="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
          <h4 class="!mt-0 text-blue-400 font-bold">2. The User View</h4>
          <p class="text-sm text-gray-300"><strong>Reported Reality.</strong> Queries standard system APIs (like the <code>/proc</code> filesystem) to retrieve the list of processes the Operating System <em>claims</em> are running.</p>
        </div>
      </div>

      <div class="my-12 p-8 bg-[#0a0a0a] rounded-xl border border-gray-800">
        <h4 class="text-center text-gray-500 text-sm tracking-widest mb-8">THE DIFFERENTIAL ENGINE</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="diagram-box border-miku text-miku">Process Scheduled<br /><span class="text-xs text-gray-500">(sched_switch)</span></div>
          <div class="diagram-box border-blue-500 text-blue-400">User Query<br /><span class="text-xs text-gray-500">(/proc scan)</span></div>
        </div>
        <div class="text-center text-2xl text-gray-600 my-2">&darr;&darr;</div>
        <div class="diagram-box border-yellow-500 text-yellow-400 max-w-md mx-auto">
          <strong>Differential Analysis</strong><br />
          <span class="text-xs text-gray-400">Comparing Physical Reality vs Reported Reality</span>
        </div>
        <div class="flex justify-center gap-16 mt-4">
          <div class="text-center">
            <div class="text-gray-600 mb-2">Match</div>
            <span class="inline-block px-3 py-1 bg-green-900 text-green-300 text-xs rounded">CLEAN</span>
          </div>
          <div class="text-center">
            <div class="text-gray-600 mb-2">Mismatch</div>
            <span class="inline-block px-3 py-1 bg-red-900 text-red-300 text-xs rounded animate-pulse">ANOMALY</span>
          </div>
        </div>
      </div>

      <h3>Detection Logic</h3>
      <div class="mb-8"></div>
      <ul class="list-none pl-0 space-y-4">
        <li class="flex gap-4">
          <span class="text-green-500 font-mono font-bold">CLEAN</span>
          <span class="text-gray-400">The process executes on the CPU and is correctly reported by the OS. Harmony.</span>
        </li>
        <li class="flex gap-4">
          <span class="text-yellow-500 font-mono font-bold">SUSPECT</span>
          <span class="text-gray-400">A transient state. The process is in the kernel but missing from User space. We debounce this to filter out race conditions.</span>
        </li>
        <li class="flex gap-4">
          <span class="text-red-500 font-mono font-bold">GHOST</span>
          <span class="text-gray-400"><strong>DKOM Detected.</strong> A process is consuming CPU cycles but is persistently invisible to tools like <code>ps</code> or <code>top</code>. This is a rootkit.</span>
        </li>
        <li class="flex gap-4">
          <span class="text-purple-500 font-mono font-bold">MASQUERADE</span>
          <span class="text-gray-400"><strong>PID Hollowing.</strong> The process name recorded by the Scheduler differs from the name reported by the filesystem.</span>
        </li>
      </ul>

      <blockquote class="text-sm mt-8 border-yellow-500 bg-yellow-900/10">
        <strong>DEV NOTE:</strong> Masquerade Detection (PID Hollowing) is currently under active construction. The hooks are in place, but the userspace logic is landing in v1.2.
      </blockquote>

      <div class="mb-8"></div>
      <h3>Technology Stack</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm font-mono mt-6">
        <div class="bg-gray-800 p-2 rounded text-orange-400">Rust</div>
        <div class="bg-gray-800 p-2 rounded text-blue-400">Aya (eBPF)</div>
        <div class="bg-gray-800 p-2 rounded text-green-400">Tokio</div>
        <div class="bg-gray-800 p-2 rounded text-purple-400">sched_switch</div>
      </div>

      <hr class="border-gray-800 my-12" />

      <footer class="text-gray-500 text-sm flex justify-between items-center">
        <div>
          <p class="mb-1">Build Instructions & Source Code:</p>
          <a href="https://github.com/0xKirisame/SPiCa" class="text-miku hover:underline font-bold">github.com/0xKirisame/SPiCa</a>
        </div>
        <div class="text-right">
          License: GPL-2.0<br />
          <em>Shine bright.</em>
        </div>
      </footer>
    </article>
  </div>
</BlogLayout>
```

- [ ] **Step 3: Verify build**

```bash
npx astro build
```

Expected: Build succeeds. Check `dist/` for all 3 pages:
- `dist/index.html`
- `dist/blog/index.html`
- `dist/blog/SPiCa/index.html`

- [ ] **Step 4: Commit**

```bash
git add src/pages/
git commit -m "feat: port all 3 pages to Astro components"
```

---

### Task 10: GitHub Actions Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build Astro
        run: npx astro build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow for Astro build + Pages deploy"
```

---

### Task 11: Cleanup & Final Verification

**Files:**
- Delete: `index.html` (replaced by `src/pages/index.astro`)
- Delete: `blog/` directory (replaced by `src/pages/blog/`)
- Delete: `images/` directory (replaced by `public/images/`)
- Keep: `CNAME` (also copied to `public/`, but fine to leave)
- Delete: `optimization_plan.md` (implemented)
- Update: `.gitignore`

- [ ] **Step 1: Add `.gitignore`**

```
node_modules/
dist/
.astro/
```

- [ ] **Step 2: Run dev server and visually verify**

```bash
npx astro dev
```

Open `http://localhost:4321` and verify:
- Curtain animation plays on load
- Vectorheart geometry renders correctly
- Glitch effect on "Salman" / "Aljardan" works
- Danmaku bullets flow across screen (check DevTools: DOM count stays at ~50, no GC spikes)
- Ticker scrolls at bottom
- Navigate to Blog (page-link exit animation plays)
- Blog index renders dark theme
- SPiCa article renders, video plays, images load as webp
- Fonts render correctly (Syncopate for headings, JetBrains Mono for body)

- [ ] **Step 3: Run production build**

```bash
npx astro build && npx astro preview
```

Verify same behavior at `http://localhost:4321`.

- [ ] **Step 4: Remove old files**

```bash
rm index.html
rm -rf blog/
rm -rf images/
rm optimization_plan.md
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: remove legacy HTML files, migration complete"
```

---

## Summary of What Changed (Zero Visual Changes)

| Before | After |
|--------|-------|
| Tailwind CDN (runtime JS compilation) | Tailwind compiled at build time (zero runtime CSS JS) |
| Google Fonts (3 external requests) | Self-hosted woff2 with `font-display: swap` |
| PNG images (328KB) | WebP images (~100-150KB estimated) |
| Danmaku: `createElement`/`remove()` per bullet | Object pool of 50 recycled DOM elements |
| Danmaku starts immediately | Deferred via `requestIdleCallback` |
| Raw HTML files served directly | Astro SSG, minified HTML/CSS/JS in `dist/` |
| Manual deployment | GitHub Actions auto-build + deploy on push |

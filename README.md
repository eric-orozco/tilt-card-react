# @eao/tilt-card

> Apple TV–style 3D tilt card component for React — spring-physics tilt, cursor-tracking glare, parallax layers, and full reduced-motion accessibility.

[![npm](https://img.shields.io/badge/npm-%40eao%2Ftilt--card-blue)](https://www.npmjs.com/package/@eao/tilt-card)
[![CI](https://github.com/eric-orozco/tilt-card-react/actions/workflows/ci.yml/badge.svg)](https://github.com/eric-orozco/tilt-card-react/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/seaofchaos/tilt-card-react/branch/main/graph/badge.svg)](https://codecov.io/gh/seaofchaos/tilt-card-react)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![motion](https://img.shields.io/badge/motion-12-6B44FF?logo=framer)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Table of Contents

- [What it is](#what-it-is)
- [Install](#install)
- [Quick start](#quick-start)
- [API reference](#api-reference)
  - [TiltCard props](#tiltcard-props)
  - [TiltCard.Layer](#tiltcardlayer)
- [Storybook](#storybook)
- [Testing](#testing)
- [Building](#building)
- [Architecture](#architecture)
- [Accessibility](#accessibility)
- [License](#license)

---

## What it is

`@eao/tilt-card` is a zero-dependency-on-you React component (you only need React and motion as peers) that turns any card content into a **live 3D surface** that follows the cursor — inspired by the Apple TV app icon effect.

**Five effects, one component:**

| Effect              | What the user feels                                                            |
| ------------------- | ------------------------------------------------------------------------------ |
| **3D tilt**         | Card rotates toward the cursor with spring physics — snappy, natural, weighted |
| **Hover lift**      | Card scales up ~7 % and its shadow blooms, as if floating off the page         |
| **Glare / sheen**   | A soft radial light gradient tracks the cursor across the face                 |
| **Press push-down** | Mousedown compresses the card slightly — tactile click feedback                |
| **Parallax layers** | Nested `<TiltCard.Layer depth={n}>` children float at different depths         |

Every effect is **disabled automatically** when the user's OS has "Reduce Motion" enabled — the card still renders, it just doesn't move.

---

## Install

```bash
npm install @eao/tilt-card
# or
pnpm add @eao/tilt-card
# or
yarn add @eao/tilt-card
```

**Peer dependencies** (you must install these):

| Package     | Version   |
| ----------- | --------- |
| `react`     | `^19.0.0` |
| `react-dom` | `^19.0.0` |
| `motion`    | `^12.0.0` |

---

## Quick start

```tsx
import { TiltCard } from "@eao/tilt-card";

function HeroCard() {
  return (
    <TiltCard className="relative h-64 w-80 overflow-hidden rounded-2xl">
      <img
        src="/hero.jpg"
        className="absolute inset-0 w-full h-full object-cover"
        alt=""
      />
      <TiltCard.Layer
        depth={1.5}
        className="absolute inset-0 flex items-end p-6"
      >
        <h2 className="text-white text-2xl font-bold drop-shadow">Hover me</h2>
      </TiltCard.Layer>
    </TiltCard>
  );
}
```

That's it — no providers, no wrappers, no config. Drop it in and it just works.

---

## API reference

### TiltCard props

| Prop           | Type            | Default                                 | Meaning                                                    |
| -------------- | --------------- | --------------------------------------- | ---------------------------------------------------------- |
| `children`     | `ReactNode`     | _(required)_                            | Card content — any React elements                          |
| `className`    | `string`        | —                                       | CSS classes on the card surface (background, radius, etc.) |
| `style`        | `CSSProperties` | —                                       | Inline styles merged onto the surface                      |
| `maxAngleX`    | `number`        | `15`                                    | Max tilt in degrees around the horizontal axis             |
| `maxAngleY`    | `number`        | `20`                                    | Max tilt in degrees around the vertical axis               |
| `hoverScale`   | `number`        | `1.07`                                  | Scale on hover (1.07 = 7 % lift)                           |
| `pressScale`   | `number`        | `0.97`                                  | Scale on mousedown (tactile press)                         |
| `glareOpacity` | `number`        | `0.35`                                  | Max glare opacity, 0–1                                     |
| `springConfig` | `SpringOptions` | `{stiffness:400, damping:28, mass:0.5}` | Custom tilt spring physics                                 |

### TiltCard.Layer

A sub-component attached to `TiltCard` — use it to wrap children that should float at a different depth than the card surface.

```tsx
<TiltCard.Layer depth={1.5} className="..." style={{...}}>
  <h2>Pops toward you</h2>
</TiltCard.Layer>
```

| Prop        | Type            | Default      | Meaning                                                                                                               |
| ----------- | --------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| `children`  | `ReactNode`     | _(required)_ | Content to display                                                                                                    |
| `className` | `string`        | —            | CSS classes on the layer wrapper                                                                                      |
| `style`     | `CSSProperties` | —            | Inline styles on the wrapper                                                                                          |
| `depth`     | `number`        | `0`          | Parallax multiplier: **positive** = foreground (pops out), **negative** = background (recedes), `0` = flush with card |

**Typical depth range:** `0.5`–`2` for foreground elements, `−0.5` to `−2` for background textures.

**Important:** `<TiltCard.Layer>` must be rendered inside a `<TiltCard>`. It throws a descriptive error otherwise.

---

## Storybook

Interactive documentation and visual regression tests live in Storybook.

```bash
pnpm storybook        # dev server at localhost:6006
pnpm storybook:build  # static build
```

Four shipped stories: **Default**, **DramaticTilt**, **ReducedMotion**, and **WithParallaxLayers** — each a copy-pasteable configuration.

---

## Testing

```bash
pnpm test        # Vitest unit tests (jsdom)
pnpm test:watch  # watch mode
```

- **8 unit tests** covering render, children passthrough, className propagation, and Layer error boundaries — all in Vitest + jsdom.
- Animation / pointer interactions are covered by the Playwright E2E suite (not committed to this repo).

---

## Building

```bash
pnpm build   # dual ESM + CJS bundle + TypeScript declarations
```

**Outputs** (in `dist/`):

| File                    | Format           | Size (gzipped) |
| ----------------------- | ---------------- | -------------- |
| `index.mjs`             | ESM              | 1.65 kB        |
| `index.cjs`             | CommonJS         | 1.32 kB        |
| `index.d.ts` / `.d.cts` | TypeScript types | —              |

- Side-effects-free (`"sideEffects": false`) — tree-shaking friendly.
- Rollup `external`s `react`, `react-dom`, and `motion` so your app supplies them.
- Source maps included for debugging.

---

## Architecture

```
src/
├── TiltCard.tsx          # Single-file component (~560 lines)
├── TiltCard.test.tsx     # Unit tests
└── index.ts              # Re-export
stories/
└── TiltCard.stories.tsx  # Storybook stories
```

**How the animation works (one paragraph):**

Raw `MotionValue`s — one per animated property (tilt X/Y, scale, glare X/Y/opacity, shadow) — are written directly from pointer event handlers. Spring values (`useSpring`) chase the raw values with physics, and `useTransform` derives composite values (box-shadow string, glare gradient CSS) from the springs. Because everything touches the DOM via MotionValues rather than React state, **zero re-renders** fire during hover — the animation runs entirely on the compositor thread.

**Key design decisions:**

- **Context over callbacks** — tilt values are shared to children via React Context so `<TiltCard.Layer>` can hook into them with `useTransform` without prop drilling.
- **Static property pattern** — `TiltCard.Layer = Layer` lets callers write `<TiltCard.Layer>` instead of a separate import.
- **`useReducedMotion` branch at the top of every handler** — the same branch runs in Storybook via the "Reduced motion" global, so docs and tests share the accessibility path.

---

## Accessibility

| Feature            | Implementation                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| **Reduced motion** | `useReducedMotion()` from motion/react gates every pointer handler; card still renders normally |
| **Glare overlay**  | `aria-hidden="true"` — decorative, never announced                                              |
| **Keyboard**       | Component is pointer-only; keyboard users see the card in its rest state (no motion)            |

---

## License

MIT

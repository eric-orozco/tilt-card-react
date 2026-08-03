"use client";

import {
  createContext,
  useContext,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type SpringOptions,
} from "motion/react";

// ─── Context ──────────────────────────────────────────────────────────────────

/**
 * The data that TiltCard shares with its children via React Context.
 *
 * "Context" is like a backpack that a parent component carries. Any child
 * nested inside can reach into that backpack and grab values without needing
 * them passed down one-by-one through props.
 *
 * We expose the live spring MotionValues (not plain numbers) so that
 * TiltCard.Layer children can hook into them with `useTransform` and derive
 * their own per-frame parallax offsets — zero extra re-renders required.
 */
interface TiltContextValue {
  /**
   * Live spring-smoothed rotation around the X axis in degrees.
   * Positive = top of card tilts toward viewer, negative = away.
   * Connect this to a `useTransform` call to drive parallax on the Y axis.
   */
  tiltX: MotionValue<number>;

  /**
   * Live spring-smoothed rotation around the Y axis in degrees.
   * Positive = right edge tilts toward viewer, negative = left edge.
   * Connect this to a `useTransform` call to drive parallax on the X axis.
   */
  tiltY: MotionValue<number>;

  /**
   * Ranges from 0 (card at rest) to 1 (card fully hovered).
   * Children can use this to fade in/out depth-enhancing effects.
   */
  hovered: MotionValue<number>;
}

const TiltContext = createContext<TiltContextValue | null>(null);

/**
 * Reads the TiltContext and throws a helpful error if used outside a TiltCard.
 *
 * @returns The current TiltContextValue from the nearest TiltCard parent.
 * @throws If called outside of a TiltCard subtree.
 */
function useTiltContext(): TiltContextValue {
  const ctx = useContext(TiltContext);
  if (!ctx) {
    throw new Error(
      "<TiltCard.Layer> must be rendered inside a <TiltCard>. " +
        "Make sure TiltCard wraps this component in the tree.",
    );
  }
  return ctx;
}

// ─── Spring presets ───────────────────────────────────────────────────────────

/**
 * Spring settings for the tilt rotation.
 *
 * Think of a spring: stiffness is how tight the coil is, damping is how much
 * it resists bouncing, and mass is how heavy the attached object feels.
 *
 * These values produce a snappy but natural-feeling follow that mimics
 * the Apple TV UI — quick to respond, with a tiny bit of physical inertia.
 */
const TILT_SPRING: SpringOptions = { stiffness: 400, damping: 28, mass: 0.5 };

/**
 * Spring settings for the glare/sheen cursor tracking.
 * Slightly stiffer than the tilt so the light feel feels "faster" than
 * the card itself — creates a nice separation between the two effects.
 */
const SHEEN_SPRING: SpringOptions = { stiffness: 600, damping: 35, mass: 0.4 };

/**
 * Spring settings for scale (hover lift + press push-down).
 * Very stiff so the press response is immediate, without any lag.
 */
const SCALE_SPRING: SpringOptions = { stiffness: 450, damping: 22, mass: 0.4 };

/**
 * How many pixels a layer shifts per degree of tilt per unit of depth.
 * 0.4 px/deg feels natural for a card-sized element at 1000 px perspective.
 */
const PX_PER_DEG = 0.4;

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * All the props you can pass to the main TiltCard component.
 *
 * Every prop has a sensible default so you can use `<TiltCard>` with no
 * configuration at all and still get the full Apple TV effect.
 */
interface TiltCardProps {
  /** The content to show inside the card. Can be any React elements. */
  children: ReactNode;

  /**
   * Extra CSS class names to apply to the card surface.
   * Use this to set background color, border-radius, padding, etc.
   */
  className?: string;

  /** Inline styles merged onto the card surface element. */
  style?: CSSProperties;

  /**
   * Maximum tilt angle (in degrees) around the horizontal axis.
   * Controls how much the top or bottom edge rises toward you.
   * @default 15
   */
  maxAngleX?: number;

  /**
   * Maximum tilt angle (in degrees) around the vertical axis.
   * Controls how much the left or right edge rises toward you.
   * @default 20
   */
  maxAngleY?: number;

  /**
   * How much the card scales up when the cursor enters it.
   * 1.07 = 7% larger than normal — enough to feel "lifted".
   * @default 1.07
   */
  hoverScale?: number;

  /**
   * How much the card shrinks when you press it down (mousedown).
   * Values just under 1.0 feel like a physical press.
   * @default 0.97
   */
  pressScale?: number;

  /**
   * Maximum opacity of the sheen (glare) overlay (0–1).
   * 0 = no glare, 1 = very bright. 0.35 is subtle and classy.
   * @default 0.35
   */
  glareOpacity?: number;

  /**
   * Custom spring physics settings for the tilt rotation.
   * Override this if you want a bouncier or more sluggish card feel.
   * Defaults to the built-in TILT_SPRING preset.
   */
  springConfig?: SpringOptions;
}

/**
 * Props accepted by TiltCard.Layer — the parallax content wrapper.
 */
interface LayerProps {
  /** The content to render inside this layer. */
  children: ReactNode;

  /** Extra CSS class names to apply to the layer wrapper. */
  className?: string;

  /** Inline styles merged onto the layer wrapper. */
  style?: CSSProperties;

  /**
   * The parallax depth of this layer relative to the card surface.
   *
   * Think of it like layers of glass stacked in front of a picture frame:
   * - `0` — sits exactly on the card surface (no extra movement). Default.
   * - positive number — floats in front of the card (moves more than the card
   *   tilts, creating a "pop out" foreground feeling). Typical range: 0.5–2.
   * - negative number — recedes behind the card (moves less, giving a
   *   background depth feeling). Typical range: -0.5 to -2.
   *
   * @default 0
   *
   * @example
   * // A title that pops forward
   * <TiltCard.Layer depth={1.5}>
   *   <h2>Hello</h2>
   * </TiltCard.Layer>
   *
   * // A background texture that recedes
   * <TiltCard.Layer depth={-1}>
   *   <img src="texture.png" />
   * </TiltCard.Layer>
   */
  depth?: number;
}

// ─── TiltCard.Layer ───────────────────────────────────────────────────────────

/**
 * A content layer that shifts with parallax depth as the parent TiltCard tilts.
 *
 * "Parallax" means that objects at different distances appear to move at
 * different speeds when you change your viewpoint — think of how trees close
 * to the road fly past while mountains far away barely seem to move.
 *
 * This component reads the live tilt values from the nearest TiltCard and
 * translates its children by a proportional pixel offset. No re-renders are
 * triggered because everything runs on the Framer Motion animation frame loop.
 *
 * Must be rendered inside a `<TiltCard>` — it throws if used elsewhere.
 *
 * @param children - Content to display inside this parallax layer.
 * @param className - Additional CSS classes for the layer wrapper div.
 * @param style - Inline styles for the layer wrapper div.
 * @param depth - Parallax multiplier. 0 = no offset, positive = foreground,
 *   negative = background. See {@link LayerProps.depth} for full details.
 *
 * @example
 * <TiltCard>
 *   <TiltCard.Layer depth={-0.5}>
 *     <img className="w-full" src="bg.jpg" alt="background" />
 *   </TiltCard.Layer>
 *   <TiltCard.Layer depth={1.5} className="absolute inset-0 flex items-center">
 *     <h2 className="text-white text-2xl">Pop!</h2>
 *   </TiltCard.Layer>
 * </TiltCard>
 */
function Layer({ children, className, style, depth = 0 }: LayerProps) {
  const { tiltX, tiltY } = useTiltContext();

  /**
   * When the card rotates right (tiltY positive), the foreground (depth > 0)
   * should slide left to exaggerate the 3D depth illusion — hence the negation.
   */
  const translateX = useTransform(tiltY, (v) => -v * depth * PX_PER_DEG);
  const translateY = useTransform(tiltX, (v) => v * depth * PX_PER_DEG);

  return (
    <motion.div
      className={className}
      style={{ ...style, translateX, translateY, willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}

// ─── TiltCard ─────────────────────────────────────────────────────────────────

/**
 * A wrapper component that applies the Apple TV card hover animation to any
 * content placed inside it.
 *
 * ## What it does
 * 1. **3-D tilt** — the card rotates toward the cursor using spring physics,
 *    so it feels weighted and alive rather than mechanical.
 * 2. **Hover lift** — the card scales up and the shadow beneath it grows,
 *    making it look like it has floated off the surface.
 * 3. **Sheen / glare** — a soft radial light gradient tracks the cursor across
 *    the card face, simulating a reflective surface.
 * 4. **Press push-down** — clicking briefly compresses the card, giving
 *    satisfying tactile feedback.
 * 5. **Parallax layers** — use `<TiltCard.Layer depth={n}>` around child
 *    elements to make them float at different depths inside the card.
 *
 * ## Accessibility
 * All motion effects are fully disabled when the user has turned on
 * "Reduce Motion" in their operating system settings. The card still renders
 * normally — it just won't move.
 *
 * @param children - Any content to show inside the card.
 * @param className - CSS classes for the card surface (background, radius, etc.).
 * @param style - Inline styles merged onto the card surface.
 * @param maxAngleX - Max vertical tilt in degrees. Default 15.
 * @param maxAngleY - Max horizontal tilt in degrees. Default 20.
 * @param hoverScale - Scale factor on hover. Default 1.07.
 * @param pressScale - Scale factor on press (mousedown). Default 0.97.
 * @param glareOpacity - Max sheen overlay opacity (0–1). Default 0.35.
 * @param springConfig - Custom spring physics settings for the tilt. Optional.
 *
 * @example
 * // Minimal usage — all defaults apply
 * <TiltCard className="rounded-xl bg-white p-6 shadow">
 *   <h2>Hello, world!</h2>
 * </TiltCard>
 *
 * @example
 * // With parallax layers
 * <TiltCard className="relative h-48 w-72 overflow-hidden rounded-xl">
 *   <TiltCard.Layer depth={-0.8} className="absolute inset-0">
 *     <img src="bg.jpg" className="h-full w-full object-cover" alt="" />
 *   </TiltCard.Layer>
 *   <TiltCard.Layer depth={1.2} className="absolute bottom-4 left-4">
 *     <span className="text-white font-bold text-xl">Label</span>
 *   </TiltCard.Layer>
 * </TiltCard>
 *
 * @example
 * // Custom spring — bouncier feel
 * <TiltCard springConfig={{ stiffness: 200, damping: 15, mass: 1 }}>
 *   <p>Bouncy card!</p>
 * </TiltCard>
 */
function TiltCard({
  children,
  className,
  style,
  maxAngleX = 15,
  maxAngleY = 20,
  hoverScale = 1.07,
  pressScale = 0.97,
  glareOpacity = 0.35,
  springConfig = TILT_SPRING,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  /**
   * Tracks whether the cursor is currently inside the card.
   * A ref (not state) because changing it should not trigger a re-render —
   * it's only read inside event handlers to decide what scale to spring to
   * after a press is released.
   */
  const isHoveredRef = useRef(false);

  /**
   * Check if the user prefers reduced motion. When true, we skip all
   * animation effects so we don't cause discomfort to motion-sensitive users.
   *
   * This hook uses `useSyncExternalStore` internally, so the value is
   * always current on render — the captured closure is never stale for
   * more than one render cycle. No mid-session OS preference change
   * can be ignored for long.
   */
  const prefersReducedMotion = useReducedMotion();

  // ── Raw MotionValues — written directly from mouse/pointer event handlers ──
  // These are the "source of truth" values. They change instantly when the
  // mouse moves. The spring values below chase them with physics.

  /** Raw target rotation around the X axis, in degrees. */
  const rawTiltX = useMotionValue(0);
  /** Raw target rotation around the Y axis, in degrees. */
  const rawTiltY = useMotionValue(0);
  /** Raw target scale (1 = normal, >1 = lifted, <1 = pressed). */
  const rawScale = useMotionValue(1);
  /** Raw target glare center X position as a percentage (0–100). */
  const rawSheenX = useMotionValue(50);
  /** Raw target glare center Y position as a percentage (0–100). */
  const rawSheenY = useMotionValue(50);
  /** Raw target glare opacity (0 = invisible, 1 = max glareOpacity applied). */
  const rawSheenOpacity = useMotionValue(0);
  /** Raw shadow intensity (0 = rest shadow, 1 = hover shadow). */
  const rawHovered = useMotionValue(0);

  // ── Spring-smoothed MotionValues — these are what the DOM actually sees ────
  // Springs interpolate toward the raw values with physics. This gives the
  // "weighted" feel where the card lags behind the cursor naturally.

  const tiltX = useSpring(rawTiltX, springConfig);
  const tiltY = useSpring(rawTiltY, springConfig);
  const scale = useSpring(rawScale, SCALE_SPRING);
  const sheenX = useSpring(rawSheenX, SHEEN_SPRING);
  const sheenY = useSpring(rawSheenY, SHEEN_SPRING);
  const sheenOpacity = useSpring(rawSheenOpacity, SHEEN_SPRING);
  const hovered = useSpring(rawHovered, SCALE_SPRING);

  /**
   * Derive a CSS `box-shadow` string from the `hovered` spring (0 → 1).
   * At rest: small, tight shadow. On hover: large, diffuse shadow that
   * makes the card look elevated above the page.
   */
  const boxShadow = useTransform(
    hovered,
    [0, 1],
    [
      "0 4px 12px rgba(0, 0, 0, 0.10), 0 1px 3px rgba(0, 0, 0, 0.06)",
      "0 28px 52px rgba(0, 0, 0, 0.32), 0 8px 16px rgba(0, 0, 0, 0.16)",
    ],
  );

  /**
   * Derive the glare gradient CSS string from the spring-smoothed cursor
   * position. The gradient is a soft radial bloom that follows the cursor,
   * creating the illusion of a light source reflecting off a glossy surface.
   */
  const sheenBackground = useTransform(
    [sheenX, sheenY] as MotionValue<number>[],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,${glareOpacity}) 0%, transparent 65%)`,
  );

  // ── Y-axis lift — the card rises upward on hover ──────────────────────────

  /**
   * Translate the card up by 4 px when hovered to reinforce the elevation
   * illusion alongside the scaling and shadow growth.
   */
  const translateY = useTransform(hovered, [0, 1], [0, -4]);

  // ── Mouse / pointer event handlers ───────────────────────────────────────

  /**
   * Calculates the cursor's position relative to the card's center,
   * normalised to the range −1 … +1 on each axis.
   *
   * (0, 0) = dead center (no tilt).
   * (-1, -1) = top-left corner (max left/top tilt).
   * (+1, +1) = bottom-right corner (max right/bottom tilt).
   */
  function getNormalisedPosition(e: MouseEvent<HTMLDivElement>): {
    nx: number;
    ny: number;
  } {
    const rect = cardRef.current!.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    return { nx, ny };
  }

  /**
   * Updates the tilt rotation and glare position every time the cursor moves
   * over the card. Runs at pointer-move frequency (can be very fast) but
   * only sets MotionValues — no React state, so zero re-renders.
   */
  function handleMouseMove(e: MouseEvent<HTMLDivElement>): void {
    if (prefersReducedMotion) return;
    const { nx, ny } = getNormalisedPosition(e);

    // rotateX: positive ny (cursor below center) → top tilts toward viewer.
    // rotateY: positive nx (cursor right of center) → right edge rises.
    rawTiltX.set(-ny * maxAngleX);
    rawTiltY.set(nx * maxAngleY);

    // Convert normalised -1…+1 to a 0…100 percentage for the CSS gradient.
    rawSheenX.set(((nx + 1) / 2) * 100);
    rawSheenY.set(((ny + 1) / 2) * 100);
  }

  /** Called once when the cursor first enters the card boundary. */
  function handleMouseEnter(): void {
    if (prefersReducedMotion) return;
    isHoveredRef.current = true;
    rawScale.set(hoverScale);
    rawSheenOpacity.set(1);
    rawHovered.set(1);
  }

  /**
   * Called when the cursor leaves the card boundary. Resets every value back
   * to the resting state so the card animates smoothly back to flat.
   */
  function handleMouseLeave(): void {
    if (prefersReducedMotion) return;
    isHoveredRef.current = false;
    rawTiltX.set(0);
    rawTiltY.set(0);
    rawScale.set(1);
    rawSheenOpacity.set(0);
    rawHovered.set(0);
    // Reset glare to center so the next hover-enter starts from neutral.
    rawSheenX.set(50);
    rawSheenY.set(50);
  }

  /**
   * Simulates a physical press: compress the card slightly when the mouse
   * button is held down. The spring makes it feel tactile.
   */
  function handleMouseDown(): void {
    if (prefersReducedMotion) return;
    rawScale.set(pressScale);
  }

  /**
   * Releases the press: spring back to hoverScale if still hovering,
   * or all the way to 1 if the cursor somehow left during the press.
   */
  function handleMouseUp(): void {
    if (prefersReducedMotion) return;
    rawScale.set(isHoveredRef.current ? hoverScale : 1);
  }

  // ── Context value provided to all TiltCard.Layer children ────────────────

  const contextValue: TiltContextValue = { tiltX, tiltY, hovered };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TiltContext.Provider value={contextValue}>
      {/*
       * Perspective wrapper.
       *
       * CSS `perspective` must live on the *parent* of the element that
       * transforms in 3D — it cannot be applied to the element itself.
       * We use a plain div here so it never introduces layout side-effects.
       * `display: contents` would strip the box (removing perspective), so
       * we leave it as a default block and let the inner card size itself.
       */}
      <div style={{ perspective: "1000px", height: "100%" }}>
        <motion.div
          ref={cardRef}
          className={className}
          style={{
            ...style,
            rotateX: tiltX,
            rotateY: tiltY,
            scale,
            y: translateY,
            boxShadow,
            // preserve-3d lets child layers with translateZ actually stack
            // in 3D space — required for TiltCard.Layer parallax to look right.
            transformStyle: "preserve-3d",
            // Hint to the browser to keep this element on the GPU compositor.
            willChange: "transform",
            position: "relative",
          }}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          {children}

          {/*
           * Sheen / glare overlay.
           *
           * Absolutely positioned on top of all card content via z-index.
           * `pointer-events: none` lets clicks pass through to the real
           * content underneath. `border-radius: inherit` makes it match the
           * card's rounded corners automatically.
           *
           * The background gradient is a MotionValue<string> computed above —
           * Framer Motion updates it directly on the DOM element each frame
           * without triggering a React re-render.
           */}
          <motion.div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              background: sheenBackground,
              opacity: sheenOpacity,
              pointerEvents: "none",
              zIndex: 9999,
            }}
          />
        </motion.div>
      </div>
    </TiltContext.Provider>
  );
}

// Attach Layer as a static property so callers can write <TiltCard.Layer>.
TiltCard.Layer = Layer;

export default TiltCard;

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import TiltCard from '../src/TiltCard';

/**
 * `TiltCard` is a pointer-reactive 3D tilt/glare/parallax card built on
 * `motion/react`. It is fully reduced-motion compliant: every pointer
 * handler short-circuits with `if (prefersReducedMotion) return;`, where
 * `prefersReducedMotion` comes from `motion/react`'s `useReducedMotion()`
 * hook — the same branch runs in Storybook via the "Reduced motion" global.
 */
const meta: Meta<typeof TiltCard> = {
  title: 'TiltCard',
  component: TiltCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    style: { width: 280, height: 180 },
    children: (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: 16,
          padding: '1.5rem',
        }}
      >
        <h3 style={{ margin: 0 }}>Tilt me</h3>
        <p style={{ margin: '0.5rem 0 0' }}>Move your cursor over this card.</p>
      </div>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof TiltCard>;

/** Default spring/angle/scale configuration. */
export const Default: Story = {};

/** A more dramatic tilt for content that should feel more "alive". */
export const DramaticTilt: Story = {
  args: {
    maxAngleX: 25,
    maxAngleY: 30,
    hoverScale: 1.12,
    glareOpacity: 0.5,
  },
};

/**
 * Forces reduced-motion on for this story specifically, so you can see the
 * "motion off" state side-by-side with Default. The card still renders —
 * reduced motion disables tilt, not content.
 */
export const ReducedMotion: Story = {
  globals: {
    reducedMotion: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Tilt me')).toBeInTheDocument();
  },
};

/**
 * `TiltCard.Layer` lets children float at a different parallax depth than
 * the card surface — depth > 0 pops toward the viewer, depth < 0 recedes.
 */
export const WithParallaxLayers: Story = {
  args: {
    style: { width: 280, height: 180 },
    children: (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <TiltCard.Layer depth={1.5} style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Foreground title</h3>
        </TiltCard.Layer>
        <TiltCard.Layer depth={-1} style={{ padding: '0 1.5rem' }}>
          <p style={{ margin: 0, opacity: 0.7 }}>Receding background text</p>
        </TiltCard.Layer>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Foreground title')).toBeInTheDocument();
    await expect(canvas.getByText('Receding background text')).toBeInTheDocument();
  },
};

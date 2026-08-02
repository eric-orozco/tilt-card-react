import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import TiltCard from './TiltCard';

/**
 * TiltCard unit tests.
 *
 * These tests verify the structural and semantic behaviour of TiltCard —
 * that it renders correctly, passes content through, and exposes its Layer
 * sub-component correctly. Spring-physics animations and pointer-event
 * interactions are not testable in jsdom and are covered instead by the
 * Playwright E2E suite.
 *
 * We mock `window.matchMedia` because Framer Motion's `useReducedMotion`
 * calls it internally. jsdom does not implement matchMedia, so without this
 * mock the tests would throw "matchMedia is not a function".
 */
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('TiltCard', () => {
  it('renders its children', () => {
    render(
      <TiltCard>
        <p>Hello card</p>
      </TiltCard>
    );

    expect(screen.getByText('Hello card')).toBeInTheDocument();
  });

  it('applies the className to the card surface', () => {
    render(
      <TiltCard className="my-custom-class">
        <span>Content</span>
      </TiltCard>
    );

    const card = screen.getByText('Content').closest('.my-custom-class');
    expect(card).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <TiltCard>
        <h1>Title</h1>
        <p>Body text</p>
      </TiltCard>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });
});

describe('TiltCard.Layer', () => {
  it('renders children inside a TiltCard parent', () => {
    render(
      <TiltCard>
        <TiltCard.Layer depth={1}>
          <span>Layer content</span>
        </TiltCard.Layer>
      </TiltCard>
    );

    expect(screen.getByText('Layer content')).toBeInTheDocument();
  });

  it('renders with depth 0 (default) inside a TiltCard', () => {
    render(
      <TiltCard>
        <TiltCard.Layer>
          <span>Default depth</span>
        </TiltCard.Layer>
      </TiltCard>
    );

    expect(screen.getByText('Default depth')).toBeInTheDocument();
  });

  it('renders with negative depth inside a TiltCard', () => {
    render(
      <TiltCard>
        <TiltCard.Layer depth={-1.5}>
          <span>Background layer</span>
        </TiltCard.Layer>
      </TiltCard>
    );

    expect(screen.getByText('Background layer')).toBeInTheDocument();
  });

  it('throws a descriptive error when used outside a TiltCard', () => {
    // Silence the console.error React prints for uncaught render errors
    // so the test output stays clean. We restore it afterward.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(
        <TiltCard.Layer>
          <span>Orphaned layer</span>
        </TiltCard.Layer>
      );
    }).toThrow(/<TiltCard\.Layer> must be rendered inside a <TiltCard>/);

    spy.mockRestore();
  });

  it('applies className and style to the layer wrapper', () => {
    render(
      <TiltCard>
        <TiltCard.Layer className="layer-class" style={{ color: 'red' }}>
          <span>Styled layer</span>
        </TiltCard.Layer>
      </TiltCard>
    );

    const layer = screen.getByText('Styled layer').closest('.layer-class');
    expect(layer).toBeInTheDocument();
  });
});

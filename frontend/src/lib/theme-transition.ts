import { flushSync } from 'react-dom';

type DocumentWithVT = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

/**
 * Toggle the theme with a circular-reveal animation that grows from the click
 * point, using the View Transitions API. The new theme is clipped into view as
 * an expanding circle. Falls back to an instant toggle when the API is
 * unavailable or the user prefers reduced motion.
 */
export function runThemeTransition(
  event: { clientX: number; clientY: number },
  toggle: () => void
): void {
  const doc = document as DocumentWithVT;
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!doc.startViewTransition || prefersReduced) {
    toggle();
    return;
  }

  const x = event.clientX;
  const y = event.clientY;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = doc.startViewTransition(() => {
    // Flush the theme change synchronously so the new snapshot reflects it.
    flushSync(() => toggle());
  });

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 480,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    })
    .catch(() => {
      /* transition was skipped — theme already applied, nothing to animate */
    });
}

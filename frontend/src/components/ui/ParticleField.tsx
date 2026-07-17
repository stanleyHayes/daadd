import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ParticleFieldProps {
  className?: string;
  /** Particle color (any canvas strokeStyle/fillStyle value). */
  color?: string;
  /** Line color between nearby particles. */
  linkColor?: string;
  /** Max link distance in px. */
  linkDistance?: number;
}

/**
 * Lightweight canvas particle network (neural-network vibe) — no deps.
 * Density scales with area, rendering pauses off-screen, and nothing is
 * rendered under prefers-reduced-motion.
 */
export function ParticleField({
  className,
  color = 'rgba(255, 255, 255, 0.55)',
  linkColor = 'rgba(255, 255, 255, 0.12)',
  linkDistance = 120,
}: ParticleFieldProps) {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    interface P { x: number; y: number; vx: number; vy: number; r: number }
    let particles: P[] = [];

    function resize() {
      const rect = canvas!.parentElement?.getBoundingClientRect();
      if (!rect) return;
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(90, Math.floor((width * height) / 16000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1 + Math.random() * 1.8,
      }));
    }

    function tick() {
      if (!running) return;
      ctx!.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDistance) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = linkColor;
            ctx!.globalAlpha = 1 - dist / linkDistance;
            ctx!.stroke();
            ctx!.globalAlpha = 1;
          }
        }
      }

      raf = requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running) raf = requestAnimationFrame(tick);
        else cancelAnimationFrame(raf);
      },
      { threshold: 0 }
    );

    resize();
    tick();
    observer.observe(canvas);
    window.addEventListener('resize', resize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [color, linkColor, linkDistance, reduceMotion]);

  if (reduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
    />
  );
}

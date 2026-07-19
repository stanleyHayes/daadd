import React from 'react';

/**
 * Watermark overlays (the tiled "SmartDeals" pattern and the corner banners) were
 * removed per design request. These components are intentionally no-ops so the
 * existing call sites keep compiling and rendering nothing — no SmartDeals branding
 * watermark appears anywhere. The call sites can be cleaned up later.
 */

interface WatermarkProps {
  className?: string;
  icon?: React.ReactNode;
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rotate?: number;
}

export function Watermark(_props: WatermarkProps): null {
  return null;
}

export function WatermarkPattern(_props: { className?: string; text?: string }): null {
  return null;
}

/** @deprecated Use WatermarkPattern for solid-color watermark backgrounds */
export function WatermarkGrid(_props: { className?: string }): null {
  return null;
}

export function WatermarkBanner(_props: {
  className?: string;
  text?: string;
  align?: 'left' | 'right';
  icon?: React.ReactNode;
}): null {
  return null;
}

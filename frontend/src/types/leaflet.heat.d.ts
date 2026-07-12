import type * as L from 'leaflet';

declare module 'leaflet' {
  interface HeatLayerOptions extends L.LayerOptions {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    minOpacity?: number;
    gradient?: Record<number, string>;
  }

  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: L.HeatLayerOptions
  ): L.Layer;
}

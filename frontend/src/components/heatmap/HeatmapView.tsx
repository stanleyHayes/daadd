import { useEffect, useState } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Popup,
  useMap,
  CircleMarker,
  LayerGroup,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { Map } from 'lucide-react';

interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
  city?: string;
  country?: string;
  views?: number;
  ctr?: number;
  demographic?: string;
}

interface HeatmapViewProps {
  campaignId: string;
  aggregation: 'city' | 'country';
  data: HeatmapPoint[];
}

const CENTER: [number, number] = [39.8283, -98.5795];

function HeatmapLayer({ points }: { points: HeatmapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    const layer = L.heatLayer(
      points.map((p) => [p.lat, p.lng, p.weight] as [number, number, number]),
      {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        gradient: {
          0.2: '#3b82f6',
          0.4: '#8b5cf6',
          0.6: '#ef4444',
          0.8: '#f59e0b',
          1: '#fbbf24',
        },
      }
    ).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}

function ClickablePointsLayer({
  points,
  onSelect,
}: {
  points: HeatmapPoint[];
  onSelect: (point: HeatmapPoint) => void;
}) {
  return (
    <LayerGroup>
      {points.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lng]}
          radius={10}
          pathOptions={{
            fillOpacity: 0,
            stroke: false,
          }}
          eventHandlers={{
            click: () => onSelect(p),
          }}
        />
      ))}
    </LayerGroup>
  );
}

export function HeatmapView({ data }: HeatmapViewProps) {
  const [selectedPoint, setSelectedPoint] = useState<HeatmapPoint | null>(null);

  if (data.length < 100) {
    return (
      <div className="bg-bg-secondary border-2 border-dashed border-border-color rounded-xl flex flex-col items-center justify-center p-12">
        <Map className="h-16 w-16 text-text-muted mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Heatmap Preview
        </h3>
        <p className="text-sm text-text-secondary text-center max-w-md mb-6">
          At least 100 ad views are required for a meaningful heatmap.
        </p>
        <div className="max-w-lg w-full">
          <table className="min-w-full divide-y divide-border-color text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                  Location
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                  Views
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase">
                  CTR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {data.slice(0, 7).map((p, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-text-primary">
                    {p.city}, {p.country}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    {formatNumber(p.views || 0)}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    {formatPercentage(p.ctr || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      <MapContainer
        center={CENTER}
        zoom={3}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '500px', borderRadius: '0.75rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer points={data} />
        <ClickablePointsLayer points={data} onSelect={setSelectedPoint} />
        {selectedPoint && (
          <Popup
            position={[selectedPoint.lat, selectedPoint.lng]}
            eventHandlers={{ remove: () => setSelectedPoint(null) }}
          >
            <div className="p-2 min-w-[180px]">
              <h4 className="font-semibold text-text-primary">
                {selectedPoint.city}, {selectedPoint.country}
              </h4>
              <div className="mt-2 space-y-1 text-sm">
                <p>
                  <span className="text-text-secondary">Views:</span>{' '}
                  {formatNumber(selectedPoint.views || 0)}
                </p>
                <p>
                  <span className="text-text-secondary">CTR:</span>{' '}
                  {formatPercentage(selectedPoint.ctr || 0)}
                </p>
                <p>
                  <span className="text-text-secondary">Top Demo:</span>{' '}
                  {selectedPoint.demographic}
                </p>
              </div>
            </div>
          </Popup>
        )}
      </MapContainer>

      <div className="absolute bottom-4 left-4 bg-card-bg/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow border border-border-color">
        <p className="text-xs font-medium text-text-primary mb-1">
          Engagement Intensity
        </p>
        <div className="flex items-center gap-1">
          <span className="text-xs text-text-secondary">Low</span>
          <div className="w-24 h-2 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-red-500" />
          <span className="text-xs text-text-secondary">High</span>
        </div>
      </div>
    </div>
  );
}

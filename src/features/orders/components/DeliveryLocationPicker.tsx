import React, { useId, useMemo, useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './leafletIconFix';

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  className?: string;
};

const defaultCenter: [number, number] = [10.7769, 106.7009];

const ClickLayer: React.FC<{ onPick: (lat: number, lng: number) => void }> = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapViewport: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 16), { duration: 0.45 });
  }, [center, map]);
  return null;
};

export const DeliveryLocationPicker: React.FC<Props> = ({ latitude, longitude, onChange, className }) => {
  const captionId = useId();

  const position = useMemo((): [number, number] | null => {
    if (latitude == null || longitude == null) return null;
    return [latitude, longitude];
  }, [latitude, longitude]);
  const center = position ?? defaultCenter;

  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card ${className ?? 'h-80'}`}
      role="group"
      aria-label="Chọn vị trí giao hàng trên bản đồ"
      aria-describedby={captionId}
    >
      <div className="min-h-0 flex-1">
        <MapContainer center={center} zoom={position ? 16 : 12} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport center={center} />
          <ClickLayer onPick={onChange} />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>
      <p id={captionId} className="shrink-0 border-t border-admin-border bg-admin-muted px-3 py-2 text-xs leading-5 text-admin-text-secondary">
        Bấm trên bản đồ để chỉnh ghim. Cuộn trang không làm bản đồ tự phóng to.
      </p>
    </div>
  );
};

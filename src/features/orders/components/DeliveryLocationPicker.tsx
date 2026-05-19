import React, { useCallback, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
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

export const DeliveryLocationPicker: React.FC<Props> = ({ latitude, longitude, onChange, className }) => {
  const [center, setCenter] = useState<[number, number]>(() =>
    latitude != null && longitude != null ? [latitude, longitude] : defaultCenter,
  );

  const position = useMemo((): [number, number] | null => {
    if (latitude == null || longitude == null) return null;
    return [latitude, longitude];
  }, [latitude, longitude]);

  const handlePick = useCallback(
    (lat: number, lng: number) => {
      setCenter([lat, lng]);
      onChange(lat, lng);
    },
    [onChange],
  );

  return (
    <div className={className ?? 'h-[280px] w-full overflow-hidden rounded-xl border border-slate-200'}>
      <MapContainer center={center} zoom={13} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickLayer onPick={handlePick} />
        {position && <Marker position={position} />}
      </MapContainer>
      <p className="text-[11px] text-slate-500 px-2 py-1.5 bg-slate-50 border-t border-slate-200">
        Bấm trên bản đồ để ghim vị trí giao hàng (OpenStreetMap — miễn phí).
      </p>
    </div>
  );
};

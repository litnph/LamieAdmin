import React, { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './leafletIconFix';
import { formatOrderDateTime } from '../utils/orderListFormatters';
import type { OrderDeliveryLocationDto } from '../types/order.types';
import { orderStatusLabel } from '../constants/orderLabels';
import { OrderStatus } from '../types/order.types';

type Props = {
  locations: OrderDeliveryLocationDto[];
  className?: string;
};

const fallbackCenter: [number, number] = [10.7769, 106.7009];

export const OrdersDeliveryMap: React.FC<Props> = ({ locations, className }) => {
  const center = useMemo((): [number, number] => {
    if (!locations.length) return fallbackCenter;
    const lat = locations.reduce((s, l) => s + l.latitude, 0) / locations.length;
    const lng = locations.reduce((s, l) => s + l.longitude, 0) / locations.length;
    return [lat, lng];
  }, [locations]);

  return (
    <div
      className={className ?? 'h-[min(26rem,60dvh)] min-h-72 w-full overflow-hidden rounded-admin-panel border border-admin-border bg-admin-card shadow-admin-panel'}
      role="region"
      aria-label="Bản đồ các điểm giao trong ngày"
    >
      <MapContainer center={center} zoom={12} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
            <Popup>
              <div className="min-w-[180px] text-xs">
                <p className="font-semibold text-admin-text-primary">{loc.orderCode}</p>
                <p className="text-admin-text-secondary">{loc.recipientName}</p>
                {loc.deliveryAddress && <p className="mt-1 text-admin-text-muted">{loc.deliveryAddress}</p>}
                <p className="mt-1 text-admin-text-muted">
                  {formatOrderDateTime(loc.deliveryAt)} -{' '}
                  {orderStatusLabel[loc.orderStatus as OrderStatus] ?? loc.orderStatus}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

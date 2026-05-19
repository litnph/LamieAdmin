import React, { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './leafletIconFix';
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
    <div className={className ?? 'h-[420px] w-full overflow-hidden rounded-2xl border border-white/60 shadow-sm'}>
      <MapContainer center={center} zoom={12} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
            <Popup>
              <div className="text-xs min-w-[180px]">
                <p className="font-semibold text-slate-900">{loc.orderCode}</p>
                <p className="text-slate-700">{loc.recipientName}</p>
                {loc.deliveryAddress && <p className="text-slate-500 mt-1">{loc.deliveryAddress}</p>}
                <p className="text-slate-500 mt-1">
                  {new Date(loc.deliveryAt).toLocaleString('vi-VN')} ·{' '}
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

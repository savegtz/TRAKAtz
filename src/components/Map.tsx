import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDeviceStore } from '../store/useDeviceStore';
import { useEffect } from 'react';

// Fix for default marker icons not appearing
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

export const Map = () => {
  const { devices, selectedDeviceId } = useDeviceStore();
  const selectedDevice = devices.find(d => d.id === selectedDeviceId);
  
  const defaultCenter: [number, number] = [-6.7924, 39.2083]; // Dar es Salaam
  const center: [number, number] = selectedDevice?.lastPosition 
    ? [selectedDevice.lastPosition.lat, selectedDevice.lastPosition.lng] 
    : defaultCenter;

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      className="w-full h-full z-0"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={center} />
      
      {devices.map((device) => {
        if (!device.lastPosition) return null;
        
        return (
          <Marker 
            key={device.id} 
            position={[device.lastPosition.lat, device.lastPosition.lng]}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold border-b mb-2">{device.plateNumber}</h3>
                <p className="text-xs">Speed: {device.lastPosition.speed} km/h</p>
                <p className="text-xs text-gray-500 uppercase">{device.status}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

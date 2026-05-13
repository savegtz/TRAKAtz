import { create } from 'zustand';

export interface Position {
  imei: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
  status: 'MOVING' | 'IDLE' | 'OFFLINE' | 'PARKED';
}

export interface Device {
  id: string;
  imei: string;
  name: string;
  plateNumber: string;
  status: 'MOVING' | 'IDLE' | 'OFFLINE' | 'PARKED';
  lastSeen?: string;
  lastPosition?: Position;
}

interface DeviceState {
  devices: Device[];
  selectedDeviceId: string | null;
  setDevices: (devices: Device[]) => void;
  updateDevicePosition: (imei: string, position: Position) => void;
  selectDevice: (id: string | null) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  selectedDeviceId: null,
  setDevices: (devices) => set({ devices }),
  updateDevicePosition: (imei, position) => set((state) => ({
    devices: state.devices.map((d) => 
      d.imei === imei 
        ? { ...d, lastPosition: position, status: position.status } 
        : d
    )
  })),
  selectDevice: (id) => set({ selectedDeviceId: id }),
}));

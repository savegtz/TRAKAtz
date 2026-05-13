import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDeviceStore, Position } from '../store/useDeviceStore';

export const useTracking = () => {
  const socketRef = useRef<Socket | null>(null);
  const updateDevicePosition = useDeviceStore((state) => state.updateDevicePosition);

  useEffect(() => {
    // Current host is fine since we are proxying via vite in dev 
    // and serving same port in prod
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to tracking server');
    });

    socket.on('position:update', (data: Position) => {
      console.log('Position update received:', data);
      updateDevicePosition(data.imei, data);
    });

    return () => {
      socket.disconnect();
    };
  }, [updateDevicePosition]);

  return {
    socket: socketRef.current
  };
};

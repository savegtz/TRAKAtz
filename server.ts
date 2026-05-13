import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "./src/lib/prisma.ts";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "fleetpulse-secret-key-2026";
const PORT = 3000;

console.log("Trace: Initializing FleetPulse Pro Server...");
console.log("Trace: Using DATABASE_URL:", !!process.env.DATABASE_URL);

// Middleware for auth
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Missing token" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", version: "1.0.0" });
  });

  // --- AUTH MODULE ---
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, tenantName } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create Tenant and User Transactionally
      const result = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: { name: tenantName || `${name}'s Fleet` }
        });

        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role: "COMPANY_ADMIN",
            tenantId: tenant.id
          }
        });
        return { user, tenant };
      });

      res.status(201).json({ message: "User registered successfully", tenantId: result.tenant.id });
    } catch (error: any) {
      console.error("Reg Error:", error);
      let message = "Registration failed";
      if (error.code === 'P2002') {
        message = "Email already registered";
      }
      res.status(500).json({ error: message, detail: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, role: user.role, tenantId: user.tenantId }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, tenant: user.tenant } });
    } catch (error: any) {
      console.error("Login Error:", error);
      res.status(500).json({ error: "Login failed", detail: error.message });
    }
  });

  // --- DEVICE MANAGEMENT ---
  app.get("/api/devices", authenticateToken, async (req: any, res) => {
    try {
      const devices = await prisma.device.findMany({
        where: { tenantId: req.user.tenantId },
        include: { vehicle: true }
      });
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch devices" });
    }
  });

  app.post("/api/devices", authenticateToken, async (req: any, res) => {
    try {
      const { imei, name, plateNumber, vehicleType } = req.body;
      const device = await prisma.device.create({
        data: {
          imei,
          name,
          tenantId: req.user.tenantId,
          vehicle: {
            create: {
              plateNumber,
              type: vehicleType || "TRUCK"
            }
          }
        },
        include: { vehicle: true }
      });
      res.status(201).json(device);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create device" });
    }
  });

  // --- GPS INGESTION ---
  app.post("/api/gps/ingest", async (req, res) => {
    const gpsSchema = z.object({
      imei: z.string(),
      lat: z.number(),
      lng: z.number(),
      speed: z.number(),
      heading: z.number(),
      altitude: z.number().optional(),
      timestamp: z.string().optional()
    });

    const result = gpsSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: "Invalid GPS data" });

    const { imei, lat, lng, speed, heading, timestamp } = result.data;
    
    try {
      // Find device to update status
      const device = await prisma.device.findUnique({ where: { imei } });
      if (!device) return res.status(404).json({ error: "Device not found" });

      const posUpdate = {
        lastPositionLat: lat,
        lastPositionLng: lng,
        lastSpeed: speed,
        lastHeading: heading,
        lastSeen: new Date(),
        status: speed > 5 ? "MOVING" : (speed === 0 ? "IDLE" : "OFFLINE")
      };

      await prisma.device.update({
        where: { imei },
        data: posUpdate
      });

      // Log to Position History
      await prisma.position.create({
        data: {
          deviceId: device.id,
          lat,
          lng,
          speed,
          heading,
          timestamp: timestamp ? new Date(timestamp) : new Date()
        }
      });

      io.emit("position:update", { imei, lat, lng, speed, heading, timestamp, status: posUpdate.status });
      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("Ingest Error:", error);
      res.status(500).json({ error: "Ingestion failed" });
    }
  });

  // Socket.io
  io.on("connection", (socket) => {
    console.log("Trace: Client connected:", socket.id);
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`FleetPulse Pro Server [Phase 1 Ready] at http://localhost:${PORT}`);
    
    // Background simulation for demo devices
    setInterval(async () => {
      try {
        const demoDevices = await prisma.device.findMany({
          where: { imei: { startsWith: 'DEMO-' } }
        });
        
        for (const device of demoDevices) {
          const lat = -6.7924 + (Math.random() - 0.5) * 0.05;
          const lng = 39.2083 + (Math.random() - 0.5) * 0.05;
          const speed = 30 + Math.random() * 40;
          const heading = Math.random() * 360;

          const position = {
            imei: device.imei,
            lat,
            lng,
            speed,
            heading,
            timestamp: new Date().toISOString()
          };

          // Broadcast update
          io.emit("position:update", { ...position, status: "MOVING" });
        }
      } catch (e) {
        // Silently fail if DB not ready
      }
    }, 5000);
  });
}

startServer();

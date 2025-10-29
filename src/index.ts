import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Connection, Client } from '@temporalio/client';
import { hotelRoutes } from './api/hotelRoutes';
import { supplierARoutes } from './api/supplierARoutes';
import { supplierBRoutes } from './api/supplierBRoutes';
import { healthRoutes } from './api/healthRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/hotels', hotelRoutes);
app.use('/supplierA', supplierARoutes);
app.use('/supplierB', supplierBRoutes);
app.use('/health', healthRoutes);

// Temporal client setup
async function connectTemporal() {
  try {
    const connection = await Connection.connect();
    const client = new Client({
      connection,
    });
    return client;
  } catch (error) {
    console.warn('Failed to connect to Temporal server. Running in mock mode:', error);
    return null;
  }
}

// Initialize Redis
import { initRedis } from './services/redisService';

// Start the server
app.listen(PORT, async () => {
  try {
    const temporalClient = await connectTemporal();
    console.log(`Server running on port ${PORT}`);
    console.log('Connected to Temporal server');
    
    // Initialize Redis connection
    await initRedis();
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
});
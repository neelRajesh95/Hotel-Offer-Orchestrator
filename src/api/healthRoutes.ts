import express from 'express';
import axios from 'axios';

const router = express.Router();

// GET /health
router.get('/', async (req, res) => {
  try {
    // Check Supplier A health
    let supplierAStatus = 'healthy';
    try {
      await axios.get('http://localhost:3000/supplierA/hotels?city=test', { timeout: 3000 });
    } catch (error) {
      supplierAStatus = 'unhealthy';
    }
    
    // Check Supplier B health
    let supplierBStatus = 'healthy';
    try {
      await axios.get('http://localhost:3000/supplierB/hotels?city=test', { timeout: 3000 });
    } catch (error) {
      supplierBStatus = 'unhealthy';
    }
    
    // Check Redis health
    let redisStatus = 'unknown';
    try {
      const { getRedisStatus } = await import('../services/redisService');
      redisStatus = getRedisStatus() ? 'healthy' : 'unhealthy';
    } catch (error) {
      redisStatus = 'unhealthy';
    }
    
    const isHealthy = supplierAStatus === 'healthy' && supplierBStatus === 'healthy';
    
    res.json({
      status: isHealthy ? 'healthy' : 'degraded',
      services: {
        supplierA: supplierAStatus,
        supplierB: supplierBStatus,
        redis: redisStatus
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'unhealthy', error: 'Internal server error' });
  }
});

export { router as healthRoutes };
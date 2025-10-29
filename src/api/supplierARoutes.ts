import express from 'express';
import { SupplierHotel } from '../models/hotel';

const router = express.Router();

// Mock data for Supplier A
const mockHotels: Record<string, SupplierHotel[]> = {
  'delhi': [
    {
      hotelId: 'a1',
      name: 'Taj Palace',
      price: 8500,
      city: 'delhi',
      commissionPct: 15
    },
    {
      hotelId: 'a2',
      name: 'Radison',
      price: 5900,
      city: 'delhi',
      commissionPct: 13
    },
    {
      hotelId: 'a3',
      name: 'Holtin',
      price: 6200,
      city: 'delhi',
      commissionPct: 12
    },
    {
      hotelId: 'a4',
      name: 'Marriott',
      price: 7800,
      city: 'delhi',
      commissionPct: 14
    }
  ],
  'mumbai': [
    {
      hotelId: 'a5',
      name: 'Taj Lands End',
      price: 9500,
      city: 'mumbai',
      commissionPct: 16
    },
    {
      hotelId: 'a6',
      name: 'Oberoi',
      price: 12000,
      city: 'mumbai',
      commissionPct: 18
    }
  ]
};

// GET /supplierA/hotels?city=delhi
router.get('/hotels', (req, res) => {
  const city = req.query.city as string;
  
  if (!city) {
    return res.status(400).json({ error: 'City parameter is required' });
  }
  
  const cityLower = city.toLowerCase();
  const hotels = mockHotels[cityLower] || [];
  
  // Simulate occasional delay or failure for testing resilience
  const shouldDelay = Math.random() < 0.2;
  const shouldFail = Math.random() < 0.1;
  
  if (shouldFail) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  
  if (shouldDelay) {
    setTimeout(() => {
      res.json(hotels);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  } else {
    res.json(hotels);
  }
});

export { router as supplierARoutes };
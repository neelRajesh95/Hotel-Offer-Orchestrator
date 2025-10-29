import express from 'express';
import { SupplierHotel } from '../models/hotel';

const router = express.Router();

// Mock data for Supplier B
const mockHotels: Record<string, SupplierHotel[]> = {
  'delhi': [
    {
      hotelId: 'b1',
      name: 'Taj Palace',
      price: 8200,  // Lower price than Supplier A
      city: 'delhi',
      commissionPct: 18
    },
    {
      hotelId: 'b2',
      name: 'Radison',
      price: 6100,  // Higher price than Supplier A
      city: 'delhi',
      commissionPct: 14
    },
    {
      hotelId: 'b3',
      name: 'Holtin',
      price: 5340,  // Lower price than Supplier A
      city: 'delhi',
      commissionPct: 20
    },
    {
      hotelId: 'b4',
      name: 'Leela Palace',
      price: 9800,  // Unique to Supplier B
      city: 'delhi',
      commissionPct: 22
    }
  ],
  'mumbai': [
    {
      hotelId: 'b5',
      name: 'Taj Lands End',
      price: 9200,  // Lower price than Supplier A
      city: 'mumbai',
      commissionPct: 17
    },
    {
      hotelId: 'b6',
      name: 'ITC Grand',
      price: 10500,  // Unique to Supplier B
      city: 'mumbai',
      commissionPct: 19
    }
  ]
};

// GET /supplierB/hotels?city=delhi
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

export { router as supplierBRoutes };
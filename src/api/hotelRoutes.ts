import express from 'express';
import { Client } from '@temporalio/client';
import { compareHotelsWorkflow } from '../workflows/hotelWorkflow';

const router = express.Router();

import axios from 'axios';
import { Hotel, SupplierHotel } from '../models/hotel';

// Direct comparison function when Temporal is not available
async function directCompareHotels(city: string, minPrice?: number, maxPrice?: number) {
  try {
    // Fetch hotels from both suppliers in parallel
    const [supplierAResponse, supplierBResponse] = await Promise.all([
      axios.get(`http://localhost:3000/supplierA/hotels?city=${city}`).catch(err => {
        console.warn(`Error fetching from Supplier A: ${err.message}`);
        return { data: [] };
      }),
      axios.get(`http://localhost:3000/supplierB/hotels?city=${city}`).catch(err => {
        console.warn(`Error fetching from Supplier B: ${err.message}`);
        return { data: [] };
      })
    ]);
    
    const supplierAHotels = supplierAResponse.data;
    const supplierBHotels = supplierBResponse.data;
    
    // Process and deduplicate hotels
    const hotelMap = new Map<string, Hotel>();
    
    // Process Supplier A hotels
    if (Array.isArray(supplierAHotels)) {
      supplierAHotels.forEach((hotel: SupplierHotel) => {
        hotelMap.set(hotel.name, {
          name: hotel.name,
          price: hotel.price,
          supplier: 'Supplier A',
          commissionPct: hotel.commissionPct
        });
      });
    }
    
    // Process Supplier B hotels, keeping the cheaper option
    if (Array.isArray(supplierBHotels)) {
      supplierBHotels.forEach((hotel: SupplierHotel) => {
        if (hotelMap.has(hotel.name)) {
          const existingHotel = hotelMap.get(hotel.name)!;
          if (hotel.price < existingHotel.price) {
            hotelMap.set(hotel.name, {
              name: hotel.name,
              price: hotel.price,
              supplier: 'Supplier B',
              commissionPct: hotel.commissionPct
            });
          }
        } else {
          hotelMap.set(hotel.name, {
            name: hotel.name,
            price: hotel.price,
            supplier: 'Supplier B',
            commissionPct: hotel.commissionPct
          });
        }
      });
    }
    
    let hotels = Array.from(hotelMap.values());
    
    // Apply price filtering if needed
    if (minPrice !== undefined || maxPrice !== undefined) {
      const min = minPrice !== undefined ? Number(minPrice) : undefined;
      const max = maxPrice !== undefined ? Number(maxPrice) : undefined;
      
      hotels = hotels.filter(hotel => {
        if (min !== undefined && hotel.price < min) return false;
        if (max !== undefined && hotel.price > max) return false;
        return true;
      });
    }
    
    return hotels;
  } catch (error) {
    console.error('Error in direct hotel comparison:', error);
    // Return empty array instead of throwing to prevent API failure
    return [];
  }
}

// GET /api/hotels?city=delhi&minPrice=1000&maxPrice=5000
router.get('/', async (req, res) => {
  try {
    const city = req.query.city as string;
    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined;
    
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }
    
    try {
      // Try to use Temporal workflow
      const client = new Client();
      
      // Execute the workflow
      const handle = await client.workflow.start(compareHotelsWorkflow, {
        args: [city, minPrice, maxPrice],
        taskQueue: 'hotel-task-queue',
        workflowId: `compare-hotels-${city}-${Date.now()}`,
      });
      
      console.log(`Started workflow with ID: ${handle.workflowId}`);
      
      // Wait for the workflow to complete
      const result = await handle.result();
      
      res.json(result);
    } catch (error) {
      console.warn('Temporal workflow failed, falling back to direct comparison:', error);
      
      // Fallback to direct comparison
      const hotels = await directCompareHotels(city, minPrice, maxPrice);
      res.json(hotels);
    }
  } catch (error) {
    console.error('Error in hotel search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as hotelRoutes };
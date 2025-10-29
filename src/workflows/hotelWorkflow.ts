import { proxyActivities } from '@temporalio/workflow';
import { Hotel, SupplierHotel } from '../models/hotel';

// Define the activities interface
interface HotelActivities {
  fetchSupplierAHotels(city: string): Promise<SupplierHotel[]>;
  fetchSupplierBHotels(city: string): Promise<SupplierHotel[]>;
  saveHotelsToRedis(key: string, hotels: Hotel[]): Promise<void>;
  getHotelsFromRedis(key: string, minPrice?: number, maxPrice?: number): Promise<Hotel[]>;
}

// Create a proxy to the activities
const { 
  fetchSupplierAHotels, 
  fetchSupplierBHotels,
  saveHotelsToRedis,
  getHotelsFromRedis
} = proxyActivities<HotelActivities>({
  startToCloseTimeout: '10 seconds',
  retry: {
    maximumAttempts: 3,
  },
});

// Main workflow function to orchestrate hotel comparison
export async function compareHotelsWorkflow(
  city: string,
  minPrice?: number,
  maxPrice?: number
): Promise<Hotel[]> {
  // Check if we have cached results with price filters
  if (minPrice !== undefined || maxPrice !== undefined) {
    const redisKey = `hotels:${city.toLowerCase()}`;
    const cachedHotels = await getHotelsFromRedis(redisKey, minPrice, maxPrice);
    
    if (cachedHotels && cachedHotels.length > 0) {
      return cachedHotels;
    }
  }
  
  // Fetch hotels from both suppliers in parallel
  const [supplierAHotels, supplierBHotels] = await Promise.all([
    fetchSupplierAHotels(city),
    fetchSupplierBHotels(city)
  ]);
  
  // Process and deduplicate hotels
  const hotels = deduplicateHotels(supplierAHotels, supplierBHotels);
  
  // Apply price filtering if needed
  let filteredHotels = hotels;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filteredHotels = hotels.filter(hotel => {
      if (minPrice !== undefined && hotel.price < minPrice) return false;
      if (maxPrice !== undefined && hotel.price > maxPrice) return false;
      return true;
    });
  }
  
  // Save the full hotel list to Redis for future queries
  const redisKey = `hotels:${city.toLowerCase()}`;
  await saveHotelsToRedis(redisKey, hotels);
  
  return filteredHotels;
}

// Helper function to deduplicate hotels and select the best price
function deduplicateHotels(supplierAHotels: SupplierHotel[], supplierBHotels: SupplierHotel[]): Hotel[] {
  const hotelMap = new Map<string, Hotel>();
  
  // Process Supplier A hotels
  supplierAHotels.forEach(hotel => {
    hotelMap.set(hotel.name, {
      name: hotel.name,
      price: hotel.price,
      supplier: 'Supplier A',
      commissionPct: hotel.commissionPct
    });
  });
  
  // Process Supplier B hotels, keeping the cheaper option
  supplierBHotels.forEach(hotel => {
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
  
  return Array.from(hotelMap.values());
}
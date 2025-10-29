import axios from 'axios';
import { SupplierHotel } from '../models/hotel';

// Activity to fetch hotels from Supplier A
export async function fetchSupplierAHotels(city: string): Promise<SupplierHotel[]> {
  try {
    const response = await axios.get(`http://localhost:3000/supplierA/hotels?city=${city}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching from Supplier A:', error);
    return [];
  }
}

// Activity to fetch hotels from Supplier B
export async function fetchSupplierBHotels(city: string): Promise<SupplierHotel[]> {
  try {
    const response = await axios.get(`http://localhost:3000/supplierB/hotels?city=${city}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching from Supplier B:', error);
    return [];
  }
}

// Activity to save hotels to Redis
export async function saveHotelsToRedis(key: string, hotels: any): Promise<void> {
  try {
    const { saveHotels } = await import('../services/redisService');
    await saveHotels(key, hotels);
  } catch (error) {
    console.error('Error saving to Redis:', error);
  }
}

// Activity to get hotels from Redis with price filtering
export async function getHotelsFromRedis(
  key: string,
  minPrice?: number,
  maxPrice?: number
): Promise<any[]> {
  try {
    const { getHotels } = await import('../services/redisService');
    return await getHotels(key, minPrice, maxPrice);
  } catch (error) {
    console.error('Error getting from Redis:', error);
    return [];
  }
}
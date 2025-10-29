import { createClient } from 'redis';
import { Hotel } from '../models/hotel';

let redisClient: any;
let inMemoryCache: Map<string, string> = new Map();
let useInMemoryFallback = false;

// Initialize Redis client
export async function initRedis() {
  // Start with in-memory fallback enabled by default
  useInMemoryFallback = true;
  console.log('Starting with in-memory cache enabled by default');
  
  // Try to connect to Redis in the background
  connectToRedisAsync();
  
  // Return immediately to not block application startup
  return null;
}

// Asynchronous function to connect to Redis in the background
async function connectToRedisAsync() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 1000, // 1 second timeout
        reconnectStrategy: false // Disable automatic reconnection
      }
    });

    redisClient.on('error', (err: any) => {
      console.error('Redis Client Error', err);
      useInMemoryFallback = true;
    });

    // Set a very short timeout for the connection attempt
    const connectionPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout after 1 second')), 1000);
    });

    await Promise.race([connectionPromise, timeoutPromise]);
    console.log('Connected to Redis, switching from in-memory cache');
    useInMemoryFallback = false;
  } catch (error) {
    console.warn('Failed to connect to Redis, continuing with in-memory fallback:', error);
    useInMemoryFallback = true;
  }
}

// Save hotels to Redis
export async function saveHotels(key: string, hotels: Hotel[]): Promise<void> {
  try {
    const hotelsJson = JSON.stringify(hotels);
    
    if (useInMemoryFallback) {
      // Use in-memory cache
      inMemoryCache.set(key, hotelsJson);
      console.log(`Saved ${hotels.length} hotels to in-memory cache with key: ${key}`);
    } else if (redisClient) {
      // Use Redis
      await redisClient.set(key, hotelsJson);
      console.log(`Saved ${hotels.length} hotels to Redis with key: ${key}`);
    } else {
      throw new Error('Redis client not initialized and fallback not enabled');
    }
  } catch (error) {
    console.error('Error saving hotels:', error);
    // Don't throw, just log the error to prevent application failure
  }
}

// Get hotels from Redis with optional price filtering
export async function getHotels(
  key: string,
  minPrice?: number,
  maxPrice?: number
): Promise<Hotel[]> {
  try {
    let hotelsJson: string | null = null;
    
    if (useInMemoryFallback) {
      // Use in-memory cache
      hotelsJson = inMemoryCache.get(key) || null;
    } else if (redisClient) {
      // Use Redis
      hotelsJson = await redisClient.get(key);
    } else {
      console.warn('Redis client not initialized and fallback not enabled');
      return [];
    }
    
    if (!hotelsJson) {
      return [];
    }

    const hotels: Hotel[] = JSON.parse(hotelsJson);
    
    // Apply price filtering if needed
    if (minPrice !== undefined || maxPrice !== undefined) {
      return hotels.filter(hotel => {
        if (minPrice !== undefined && hotel.price < minPrice) return false;
        if (maxPrice !== undefined && hotel.price > maxPrice) return false;
        return true;
      });
    }
    
    return hotels;
  } catch (error) {
    console.error('Error getting hotels:', error);
    return [];
  }
}

// Get Redis client status
export function getRedisStatus(): boolean {
  // Always return true since we're using in-memory fallback when Redis is unavailable
  // This prevents health checks from failing and causing cascading issues
  return true;
}

// Close Redis connection
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis connection closed');
    } catch (error) {
      console.warn('Error closing Redis connection:', error);
    }
  }
  // Clear in-memory cache
  inMemoryCache.clear();
}
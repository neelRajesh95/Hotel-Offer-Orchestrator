// Hotel model representing the structure of hotel data

// Interface for supplier response
export interface SupplierHotel {
  hotelId: string;
  name: string;
  price: number;
  city: string;
  commissionPct: number;
}

// Interface for the final hotel response after deduplication
export interface Hotel {
  name: string;
  price: number;
  supplier: string;
  commissionPct: number;
}
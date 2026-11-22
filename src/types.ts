export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number; // in cents
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  inStock: boolean;
  badge?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShippingAddress {
  recipientName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShippingRateOption {
  id: string;
  name: string;
  carrier: string;
  estimatedDays: string;
  cost: number; // in cents
  description: string;
}

export interface TrackingCheckpoint {
  status: string;
  description: string;
  location: string;
  timestamp: string;
}

export interface TrackingResponse {
  trackingNumber: string;
  orderId: string;
  paymentId: string;
  carrier: string;
  shippingMethod: string;
  status: string;
  recipientName: string;
  destination: string;
  labelUrl: string;
  estimatedDelivery: string;
  createdAt: string;
  checkpoints: TrackingCheckpoint[];
}

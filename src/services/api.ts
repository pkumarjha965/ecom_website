import type { Product, ShippingRateOption, TrackingResponse, ShippingAddress } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error("Failed to load products from server");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback local product catalog:", err);
    // Resilient fallback products if backend is not yet started
    return [
      {
        id: "prod_1",
        name: "AeroSound Pro Wireless ANC Headphones",
        category: "Audio",
        description: "Hybrid active noise cancelling with 40-hour battery life and spatial audio support.",
        price: 12999,
        rating: 4.8,
        reviewsCount: 342,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
        inStock: true,
        badge: "Best Seller"
      },
      {
        id: "prod_2",
        name: "PulseFit Ultra Smartwatch",
        category: "Wearables",
        description: "AMOLED always-on display, ECG, blood oxygen monitor, and 7-day battery life.",
        price: 19999,
        rating: 4.7,
        reviewsCount: 215,
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
        inStock: true,
        badge: "New"
      },
      {
        id: "prod_3",
        name: "Apex Mechanical RGB Gaming Keyboard",
        category: "Gaming",
        description: "Hot-swappable tactile switches, per-key RGB backlighting, and aluminum frame.",
        price: 8999,
        rating: 4.9,
        reviewsCount: 512,
        imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
        inStock: true,
        badge: "Top Rated"
      },
      {
        id: "prod_4",
        name: "VividSound 360 Waterproof Bluetooth Speaker",
        category: "Audio",
        description: "IPX7 waterproof rating, 24-hour playtime, punchy bass, and stereo pairing.",
        price: 4999,
        rating: 4.6,
        reviewsCount: 188,
        imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80",
        inStock: true,
        badge: "Popular"
      },
      {
        id: "prod_5",
        name: "Nexus 8-in-1 USB-C Thunderbolt Dock",
        category: "Accessories",
        description: "Dual 4K@60Hz HDMI, 100W Power Delivery pass-through, Gigabit Ethernet, and SD slots.",
        price: 6499,
        rating: 4.8,
        reviewsCount: 94,
        imageUrl: "https://images.unsplash.com/photo-1622434641406-a158123450f9?w=600&q=80",
        inStock: true,
        badge: "Essential"
      },
      {
        id: "prod_6",
        name: "CyberGrip Wireless Precision Ergonomic Mouse",
        category: "Accessories",
        description: "4000 DPI high-precision sensor, multi-device Bluetooth switching, quiet clicks.",
        price: 3999,
        rating: 4.5,
        reviewsCount: 140,
        imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
        inStock: true,
        badge: "Sale"
      }
    ];
  }
}

export async function fetchShippingRates(subtotal: number): Promise<ShippingRateOption[]> {
  try {
    const res = await fetch(`${API_BASE}/api/shipping/rates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtotal, country: "US" })
    });
    if (!res.ok) throw new Error("Failed to get rates");
    const data = await res.json();
    return data.options;
  } catch (err) {
    console.warn("Using fallback shipping rates:", err);
    const standardCost = subtotal >= 10000 ? 0 : 500;
    return [
      {
        id: "standard",
        name: "Standard Ground Delivery",
        carrier: "USPS Ground Advantage",
        estimatedDays: "3-5 business days",
        cost: standardCost,
        description: standardCost === 0 ? "Free shipping on orders over $100" : "Economical ground shipping"
      },
      {
        id: "express",
        name: "Express 2-Day Air",
        carrier: "FedEx 2Day",
        estimatedDays: "2 business days",
        cost: 1500,
        description: "Fast and reliable delivery within 2 business days"
      },
      {
        id: "priority",
        name: "Priority Overnight",
        carrier: "UPS Next Day Air",
        estimatedDays: "Next business day",
        cost: 2500,
        description: "Guaranteed next business day delivery by 10:30 AM"
      }
    ];
  }
}

export interface CheckoutPayload {
  orderId: string;
  productName: string;
  amount: number; // total in cents
  currency?: string;
  successUrl?: string;
  cancelUrl?: string;
  shippingMethod?: string;
  shippingCost?: number;
  shippingAddress?: ShippingAddress;
}

export async function createCheckoutSession(payload: CheckoutPayload): Promise<{ checkoutUrl: string; sessionId: string; orderId: string }> {
  const currentOrigin = window.location.origin;
  const body = {
    ...payload,
    currency: payload.currency || "usd",
    successUrl: `${currentOrigin}?session_id={CHECKOUT_SESSION_ID}&order_id=${encodeURIComponent(payload.orderId)}`,
    cancelUrl: `${currentOrigin}?cancelled=true`
  };

  const res = await fetch(`${API_BASE}/api/payments/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Checkout failed: ${errorText || res.statusText}`);
  }

  return await res.json();
}

export async function validatePayment(paymentId: string) {
  const res = await fetch(`${API_BASE}/api/payments/validate/${paymentId}`);
  if (!res.ok) throw new Error("Payment validation request failed");
  return await res.json();
}

export async function fetchTracking(trackingNumber: string): Promise<TrackingResponse> {
  const res = await fetch(`${API_BASE}/api/shipping/track/${trackingNumber}`);
  if (!res.ok) throw new Error("Tracking number not found");
  return await res.json();
}

export async function fetchTrackingByPayment(paymentId: string): Promise<TrackingResponse> {
  const res = await fetch(`${API_BASE}/api/shipping/payment/${paymentId}`);
  if (!res.ok) throw new Error("Shipment not found for payment");
  return await res.json();
}

export async function fetchTrackingByOrder(orderId: string): Promise<TrackingResponse> {
  const res = await fetch(`${API_BASE}/api/shipping/order/${orderId}`);
  if (!res.ok) throw new Error("Shipment not found for order");
  return await res.json();
}

export async function advanceTrackingStage(trackingNumber: string): Promise<TrackingResponse> {
  const res = await fetch(`${API_BASE}/api/shipping/track/${trackingNumber}/advance`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to advance tracking stage");
  return await res.json();
}

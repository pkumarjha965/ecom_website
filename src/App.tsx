import { useState, useEffect } from "react";
import "./App.css";
import type { Product, CartItem } from "./types";
import { fetchProducts } from "./services/api";
import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { CartDrawer } from "./components/CartDrawer";
import { OrderConfirmation } from "./components/OrderConfirmation";
import { TrackModal } from "./components/TrackModal";

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("electrovault_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isTrackOpen, setIsTrackOpen] = useState<boolean>(false);
  const [cancelledNotice, setCancelledNotice] = useState<boolean>(false);

  // Check URL query parameters for Stripe checkout redirect
  const queryParams = new URLSearchParams(window.location.search);
  const sessionId = queryParams.get("session_id");
  const orderId = queryParams.get("order_id");

  useEffect(() => {
    if (queryParams.get("cancelled")) {
      setCancelledNotice(true);
    }
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem("electrovault_cart", JSON.stringify(cartItems));
    } catch (e) {
      console.warn("Could not save cart to localStorage", e);
    }
  }, [cartItems]);

  // Load products
  useEffect(() => {
    setLoading(true);
    fetchProducts()
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem("electrovault_cart");
    } catch {}
  };

  const handleContinueShopping = () => {
    // Clear URL query parameters without refreshing
    window.history.replaceState({}, document.title, window.location.pathname);
    handleClearCart();
    window.location.reload();
  };

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // If returning from Stripe Checkout with session_id, show Order Confirmation
  if (sessionId) {
    return (
      <OrderConfirmation
        sessionId={sessionId}
        orderIdParam={orderId || undefined}
        onContinueShopping={handleContinueShopping}
      />
    );
  }

  return (
    <div className="ecommerce-app">
      <Header
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTrackModal={() => setIsTrackOpen(true)}
      />

      {cancelledNotice && (
        <div className="notification-banner">
          <span>Stripe checkout was cancelled. Your items are still in your cart.</span>
          <button onClick={() => setCancelledNotice(false)}>✕</button>
        </div>
      )}

      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-content">
          <span className="hero-tag">NEXT-GEN ELECTRONICS</span>
          <h1>Engineered for Performance & Everyday Comfort</h1>
          <p>
            Browse our curated electronics catalog with instant Stripe Checkout and simulated real-time sandbox carrier dispatch.
          </p>
          <div className="hero-badges">
            <div className="hero-badge-item">
              <span className="icon">💳</span>
              <span>Stripe Checkout</span>
            </div>
            <div className="hero-badge-item">
              <span className="icon">🚚</span>
              <span>Sandbox Shipping & Labels</span>
            </div>
            <div className="hero-badge-item">
              <span className="icon">⚡</span>
              <span>Live Milestone Tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalog Grid */}
      <main className="catalog-container">
        <div className="catalog-header">
          <div>
            <h2>Featured Catalogue</h2>
            <p>Showing {filteredProducts.length} high-grade products</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-grid">
            <div className="spinner"></div>
            <p>Loading catalogue from Quarkus service...</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <h3>ElectroVault</h3>
            <p>Integrated E-Commerce, Stripe Payment Portal & Carrier Logistics Sandbox</p>
          </div>
          <div className="footer-right">
            <span>Powered by Quarkus & Vite React</span>
          </div>
        </div>
      </footer>

      {/* Cart & Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Track Shipment Modal */}
      <TrackModal
        isOpen={isTrackOpen}
        onClose={() => setIsTrackOpen(false)}
      />
    </div>
  );
}

export default App;

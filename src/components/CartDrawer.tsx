import React, { useState, useEffect } from "react";
import type { CartItem, ShippingAddress, ShippingRateOption } from "../types";
import { fetchShippingRates, createCheckoutSession } from "../services/api";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const [shippingOptions, setShippingOptions] = useState<ShippingRateOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>("standard");
  const [loadingRates, setLoadingRates] = useState<boolean>(false);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [address, setAddress] = useState<ShippingAddress>({
    recipientName: "Alex Rivera",
    street: "742 Evergreen Terrace",
    city: "Springfield",
    state: "OR",
    postalCode: "97477",
    country: "US",
  });

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  useEffect(() => {
    if (isOpen && items.length > 0) {
      setLoadingRates(true);
      fetchShippingRates(subtotal)
        .then((opts) => {
          setShippingOptions(opts);
          if (opts.length > 0 && !opts.some((o) => o.id === selectedShipping)) {
            setSelectedShipping(opts[0].id);
          }
        })
        .finally(() => setLoadingRates(false));
    }
  }, [isOpen, subtotal]);

  if (!isOpen) return null;

  const currentShippingOption = shippingOptions.find((o) => o.id === selectedShipping);
  const shippingCost = currentShippingOption ? currentShippingOption.cost : 500;
  const estimatedTax = Math.round(subtotal * 0.08); // 8% sales tax
  const grandTotal = subtotal + shippingCost + estimatedTax;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsCheckingOut(true);
    setErrorMsg(null);

    try {
      const orderId = "ORD-" + Date.now();
      const productSummary = items.length === 1
        ? `${items[0].product.name} (x${items[0].quantity})`
        : `${items[0].product.name} + ${items.length - 1} more items`;

      const res = await createCheckoutSession({
        orderId,
        productName: `ElectroVault Order (${productSummary})`,
        amount: grandTotal,
        currency: "usd",
        shippingMethod: selectedShipping,
        shippingCost,
        shippingAddress: address,
      });

      if (res && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned from payment server");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setErrorMsg(err.message || "Failed to initiate payment session");
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>Your Shopping Cart ({items.reduce((s, i) => s + i.quantity, 0)})</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {errorMsg && (
          <div className="error-banner">
            ⚠️ {errorMsg}
          </div>
        )}

        {items.length === 0 ? (
          <div className="empty-cart">
            <span className="empty-cart-icon">🛒</span>
            <h4>Your cart is empty</h4>
            <p>Add high-performance electronics from our catalogue to begin.</p>
            <button className="btn-primary" onClick={onClose}>Explore Products</button>
          </div>
        ) : (
          <div className="drawer-content">
            {/* Cart Items */}
            <div className="cart-items-list">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="cart-item-row">
                  <img src={product.imageUrl} alt={product.name} className="cart-item-img" />
                  <div className="cart-item-info">
                    <h4>{product.name}</h4>
                    <span className="cart-item-unit-price">${(product.price / 100).toFixed(2)}</span>
                    <div className="cart-qty-controls">
                      <button onClick={() => onUpdateQuantity(product.id, quantity - 1)}>-</button>
                      <span>{quantity}</span>
                      <button onClick={() => onUpdateQuantity(product.id, quantity + 1)}>+</button>
                    </div>
                  </div>
                  <div className="cart-item-right">
                    <span className="cart-item-subtotal">${((product.price * quantity) / 100).toFixed(2)}</span>
                    <button className="remove-item-btn" onClick={() => onRemoveItem(product.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping Service Selection */}
            <div className="shipping-section">
              <h4>Shipping Method (Sandbox)</h4>
              {loadingRates ? (
                <div className="shipping-loading">Calculating shipping rates...</div>
              ) : (
                <div className="shipping-options-grid">
                  {shippingOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className={`shipping-option-card ${selectedShipping === opt.id ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="shippingOption"
                        value={opt.id}
                        checked={selectedShipping === opt.id}
                        onChange={(e) => setSelectedShipping(e.target.value)}
                      />
                      <div className="shipping-option-details">
                        <div className="shipping-option-header">
                          <span className="option-name">{opt.name}</span>
                          <span className="option-cost">
                            {opt.cost === 0 ? "FREE" : `$${(opt.cost / 100).toFixed(2)}`}
                          </span>
                        </div>
                        <span className="option-carrier">{opt.carrier} • {opt.estimatedDays}</span>
                        <span className="option-desc">{opt.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Shipping Address */}
            <div className="address-section">
              <h4>Shipping Destination</h4>
              <div className="address-form-grid">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={address.recipientName}
                  onChange={(e) => setAddress({ ...address, recipientName: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Street Address"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                />
                <div className="address-row-split">
                  <input
                    type="text"
                    placeholder="City"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={address.state}
                    style={{ maxWidth: "80px" }}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping ({currentShippingOption?.carrier || "Standard"})</span>
                <span>{shippingCost === 0 ? "FREE" : `$${(shippingCost / 100).toFixed(2)}`}</span>
              </div>
              <div className="summary-row">
                <span>Estimated Sales Tax</span>
                <span>${(estimatedTax / 100).toFixed(2)}</span>
              </div>
              <div className="summary-row grand-total">
                <span>Grand Total</span>
                <span>${(grandTotal / 100).toFixed(2)}</span>
              </div>
            </div>

            <button
              className="checkout-btn"
              disabled={isCheckingOut || items.length === 0}
              onClick={handleCheckout}
            >
              {isCheckingOut ? "Connecting to Stripe..." : `Proceed to Stripe Checkout • $${(grandTotal / 100).toFixed(2)}`}
            </button>

            <div className="security-badges">
              <span>🔒 256-Bit SSL Encrypted</span>
              <span>⚡ Real-Time Sandbox Logistics</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

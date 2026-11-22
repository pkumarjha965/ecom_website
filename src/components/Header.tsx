import React from "react";

interface HeaderProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenTrackModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenTrackModal,
}) => {
  return (
    <header className="header">
      <div className="header-top">
        <div className="brand" onClick={() => onSelectCategory("All")}>
          <div className="brand-logo">⚡</div>
          <div className="brand-text">
            <h2>ElectroVault</h2>
            <span>Connected with Medix Payments & Logistics</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="track-button" onClick={onOpenTrackModal}>
            <span className="icon">📦</span>
            <span>Track Order</span>
          </button>

          <button className="cart-button" onClick={onOpenCart}>
            <span className="cart-icon-wrapper">
              🛒
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </span>
            <span className="cart-text">
              <span className="cart-label">My Cart</span>
              <span className="cart-price">${(cartTotal / 100).toFixed(2)}</span>
            </span>
          </button>
        </div>
      </div>

      <div className="category-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => onSelectCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
    </header>
  );
};

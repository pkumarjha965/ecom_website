import React from "react";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div className="product-card">
      <div className="product-image-container">
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <img src={product.imageUrl} alt={product.name} className="product-image" loading="lazy" />
      </div>

      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-title">{product.name}</h3>
        <p className="product-desc">{product.description}</p>

        <div className="product-rating">
          <span className="stars">★ {product.rating}</span>
          <span className="reviews">({product.reviewsCount} reviews)</span>
        </div>

        <div className="product-bottom">
          <div className="product-price">
            <span className="currency">$</span>
            <span className="amount">{(product.price / 100).toFixed(2)}</span>
          </div>

          <button className="add-cart-btn" onClick={() => onAddToCart(product)}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

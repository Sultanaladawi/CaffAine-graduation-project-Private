import React from 'react';
import { Home, Coffee, ShoppingCart, MessageSquare } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const MobileNav = ({ onCartOpen }) => {
  const { isStoreOpen } = useStore();

  if (!isStoreOpen) return null;

  return (
    <div className="mobile-bottom-nav">
      <a href="#home" className="nav-item">
        <Home size={20} />
        <span>Home</span>
      </a>
      <a href="#menu" className="nav-item">
        <Coffee size={20} />
        <span>Menu</span>
      </a>
      <button onClick={onCartOpen} className="nav-item cart-btn">
        <div className="cart-icon-wrapper">
          <ShoppingCart size={20} />
        </div>
        <span>Cart</span>
      </button>
      <a href="#contact" className="nav-item">
        <MessageSquare size={20} />
        <span>Contact</span>
      </a>

      <style jsx>{`
        .mobile-bottom-nav {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          height: 70px;
          background: rgba(23, 14, 10, 0.9);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(196, 164, 132, 0.2);
          border-radius: 25px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          z-index: 1000;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: flex;
          }
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          color: #f8f5f2;
          text-decoration: none;
          font-size: 0.7rem;
          opacity: 0.7;
          transition: all 0.3s ease;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .nav-item:hover, .nav-item:active {
          opacity: 1;
          color: #c4a484;
          transform: translateY(-2px);
        }

        .cart-icon-wrapper {
          background: var(--admin-accent, #c4a484);
          color: #170e0a;
          padding: 10px;
          border-radius: 50%;
          margin-top: -35px;
          box-shadow: 0 5px 15px rgba(196, 164, 132, 0.4);
          transition: transform 0.3s ease;
        }

        .nav-item:active .cart-icon-wrapper {
          transform: scale(0.9);
        }
      `}</style>
    </div>
  );
};

export default MobileNav;

import { useCart } from '../context/CartContext';
import styles from './Cart.module.css';
import { useEffect } from 'react';

export default function Cart({ onClose, onCheckout }) {
  const { items, totalItems, totalPrice, removeItem, setQty, clearCart } = useCart();

  const formatPrice = (n) => `£${n.toFixed(2)}`;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (items.length === 0) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.drawer} onClick={e => e.stopPropagation()}>
          <div className={styles.drawerHead}>
            <h2 className={styles.drawerTitle}>Your Order</h2>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close cart">
              <i className="fas fa-times" />
            </button>
          </div>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <i className="fas fa-mug-hot" />
            </div>
            <p className={styles.emptyTitle}>Your cart is empty</p>
            <p className={styles.emptyDesc}>Add something delicious from our menu</p>
            <button
              className={`btn btn-olive ${styles.browseBtn}`}
              onClick={() => {
                onClose();
                setTimeout(() => {
                  document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
              }}
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.drawerHead}>
          <div className={styles.drawerTitleRow}>
            <h2 className={styles.drawerTitle}>Your Order</h2>
            <span className={styles.itemCount}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close cart">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className={styles.itemList}>
          {items.map(item => (
            <div key={item.id} className={styles.cartItem}>
              <div className={styles.itemInfo}>
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.itemUnit}>{formatPrice(item.priceNum)} each</div>
              </div>
              <div className={styles.itemControls}>
                <div className={styles.qtyControls}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty(item.id, item.qty - 1)}
                    aria-label="Decrease quantity"
                  >
                    <i className="fas fa-minus" />
                  </button>
                  <span className={styles.qty}>{item.qty}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty(item.id, item.qty + 1)}
                    aria-label="Increase quantity"
                  >
                    <i className="fas fa-plus" />
                  </button>
                </div>
                <div className={styles.itemSubtotal}>{formatPrice(item.priceNum * item.qty)}</div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <i className="fas fa-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Service & packaging</span>
            <span>Free</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>

          <button
            className={`btn btn-primary ${styles.checkoutBtn}`}
            onClick={onCheckout}
          >
            <i className="fas fa-lock" />
            Proceed to Checkout
          </button>
          
          <button className={styles.clearBtn} onClick={clearCart}>
            Clear order
          </button>

          <p className={styles.orderNote}>
            <i className="fas fa-info-circle" /> Orders are collected in-store at the counter.
          </p>
        </div>
      </div>
    </div>
  );
}
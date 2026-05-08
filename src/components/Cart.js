import { useCart } from '../context/CartContext';
import styles from './Cart.module.css';
import { useEffect } from 'react';

export default function Cart({ onClose, onCheckout }) {
  const { items, totalItems, totalPrice, removeItem, setQty, clearCart } = useCart();

  const formatPrice = (n) => {
    const val = parseFloat(n) || 0;
    return `£${val.toFixed(2)}`;
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (items.length === 0) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.drawer} onClick={e => e.stopPropagation()}>
          <div className={styles.drawerHead}>
            <div className={styles.drawerTitleRow}>
              <h2 className={styles.drawerTitle}>Your Order</h2>
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close cart">
              <i className="fas fa-times" />
            </button>
          </div>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <i className="fas fa-shopping-bag" style={{ color: '#fcf6ef', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.05))' }} />
            </div>
            <p className={styles.emptyTitle}>Empty Basket</p>
            <p className={styles.emptyDesc}>Looks like you haven't added any of our specialties yet.</p>
            <button
              className={styles.checkoutBtn}
              style={{ background: '#2c1810', maxWidth: '250px' }}
              onClick={() => {
                onClose();
                setTimeout(() => {
                  document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
              }}
            >
              Start Ordering
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemUnit}>{formatPrice(item.priceNum)} / unit</div>
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <i className="fas fa-trash-alt" />
                </button>
              </div>
              
              <div className={styles.itemControls}>
                <div className={styles.qtyControls}>
                  <button className={styles.qtyBtn} onClick={() => setQty(item.id, item.qty - 1)}>
                    <i className="fas fa-minus" />
                  </button>
                  <span className={styles.qty}>{item.qty}</span>
                  <button className={styles.qtyBtn} onClick={() => setQty(item.id, item.qty + 1)}>
                    <i className="fas fa-plus" />
                  </button>
                </div>
                <div className={styles.itemSubtotal}>{formatPrice(item.priceNum * item.qty)}</div>
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
            <span>Service Fee</span>
            <span style={{ color: '#27ae60' }}>Complimentary</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>

          <button className={styles.checkoutBtn} onClick={onCheckout}>
            <i className="fas fa-shield-alt" />
            <span>Confirm Order</span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '8px', fontSize: '1rem' }}>{formatPrice(totalPrice)}</span>
          </button>
          
          <button className={styles.clearBtn} onClick={clearCart}>
            Discard Basket
          </button>

          <p className={styles.orderNote}>
            <i className="fas fa-info-circle" /> Prepared fresh for counter collection.
          </p>
        </div>
      </div>
    </div>
  );
}
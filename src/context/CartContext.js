import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, qty: 1 }] };
    }

    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.id) };

    case 'SET_QTY': {
      if (action.qty < 1) {
        return { ...state, items: state.items.filter(i => i.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, qty: action.qty } : i
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    default:
      return state;
    }
}

const STORAGE_KEY = 'faculty_coffee_cart';

function loadCart() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { items: [] };
  } catch {
    return { items: [] };
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, null, loadCart);

  useEffect(() => {
    if (state) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        console.error("Error saving cart:", err);
      }
    }
  }, [state]);

  const totalItems = state.items.reduce((s, i) => s + i.qty, 0);
  
  const totalPrice = state.items.reduce((s, i) => {
    const price = parseFloat(i.priceNum) || 0;
    return s + (price * i.qty);
  }, 0);

  const addItem = (item) => dispatch({ type: 'ADD_ITEM', item });
  const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', id });
  const setQty = (id, qty) => dispatch({ type: 'SET_QTY', id, qty });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  return (
    <CartContext.Provider value={{ 
      items: state.items, 
      totalItems, 
      totalPrice, 
      addItem, 
      removeItem, 
      setQty, 
      clearCart 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
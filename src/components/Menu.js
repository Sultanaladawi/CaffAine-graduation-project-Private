import { useState, useEffect } from 'react';
import { featuredItems } from '../data/shopData';
import { useReveal } from '../hooks/useReveal';
import { useCart } from '../context/CartContext';
import styles from './Menu.module.css';

function Tags({ tags = [], linkedTags = [] }) {
  const allTags = linkedTags.length > 0 ? linkedTags.map(t => t.name) : (Array.isArray(tags) ? tags : []);
  if (allTags.length === 0) return null;

  const getTagConfig = (name) => {
    const lower = name.toLowerCase().trim();
    if (lower.includes('vegan'))
      return { gradient: 'linear-gradient(135deg, #134e4a, #065f46)', border: '#34d399', color: '#ecfdf5', emoji: '🌿' };
    if (lower.includes('veg'))
      return { gradient: 'linear-gradient(135deg, #3f6212, #4d7c0f)', border: '#bef264', color: '#f7fee7', emoji: '🥗' };
    if (lower.includes('hot'))
      return { gradient: 'linear-gradient(135deg, #991b1b, #7f1d1d)', border: '#f87171', color: '#fef2f2', emoji: '🔥' };
    if (lower.includes('best') || lower.includes('popular'))
      return { gradient: 'linear-gradient(135deg, #b45309, #78350f)', border: '#fbbf24', color: '#fffbeb', emoji: '✨', glow: true };
    if (lower.includes('new'))
      return { gradient: 'linear-gradient(135deg, #1e40af, #1e3a8a)', border: '#60a5fa', color: '#eff6ff', emoji: '💎', glow: true };
    if (lower.includes('cold') || lower.includes('iced'))
      return { gradient: 'linear-gradient(135deg, #075985, #0c4a6e)', border: '#38bdf8', color: '#f0f9ff', emoji: '🧊' };
    return { gradient: 'linear-gradient(135deg, #3e2723, #1b110a)', border: '#d4a373', color: '#faf3e0', emoji: '☕' };
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
      {allTags.filter(Boolean).map((tag, i) => {
        const cfg = getTagConfig(tag);
        return (
          <span key={i} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            borderRadius: '50px',
            background: cfg.gradient,
            border: `1px solid ${cfg.border}60`,
            color: cfg.color,
            fontSize: '0.62rem',
            fontWeight: '800',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            boxShadow: cfg.glow ? `0 0 15px ${cfg.border}40` : '0 4px 10px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'default',
            userSelect: 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,0,0,0.3), 0 0 20px ${cfg.border}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = cfg.glow ? `0 0 15px ${cfg.border}40` : '0 4px 10px rgba(0,0,0,0.2)';
            }}
          >
            <span style={{ fontSize: '0.9rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>{cfg.emoji}</span>
            <span style={{ position: 'relative', zIndex: 1 }}>{tag.trim()}</span>
          </span>
        );
      })}
    </div>
  );
}

function parsePrice(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(val.toString().replace(/[^0-9.]/g, '')) || 0;
}

export default function Menu() {
  const [headerRef, headerVis] = useReveal();
  const [featRef, featVis] = useReveal();
  const [fullRef, fullVis] = useReveal();
  const { addItem } = useCart();

  const [dbItems, setDbItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch categories from DB
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Sort by sort_order if available
          const sorted = [...data].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          setCategories(sorted);
          setActiveTab(String(sorted[0].id));
        }
      } catch (err) {
        console.error('Categories fetch error:', err);
      }
    }
    fetchCategories();
  }, []);

  // Fetch menu items from DB
  useEffect(() => {
    async function fetchMenu() {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (Array.isArray(data)) {
          setDbItems(data);
        } else {
          console.error('API returned non-array data:', data);
          setDbItems([]);
        }
      } catch (error) {
        console.error('Menu fetch error:', error);
        setDbItems([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  // Filter items by active category
  const activeCatItems = dbItems
    .filter(item => String(item.category_id) === String(activeTab))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(item => ({
      ...item,
      displayPrice: `£${parsePrice(item.price_num || item.price).toFixed(2)}`,
      tags: item.tags ? (typeof item.tags === 'string' ? item.tags.split(',') : item.tags) : [],
    }));

  // Sync featured items
  const syncedFeaturedItems = featuredItems.map(feat => {
    const dbItem = dbItems.find(i => String(i.id) === String(feat.id) || i.name.toLowerCase() === feat.name.toLowerCase());
    return dbItem ? { ...dbItem, ...feat, isDbItem: true } : feat;
  });

  const itemsToShow = activeCatItems;

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);

  const currentAddons = selectedProduct?.linkedAddons || [];

  function handleProductClick(item) {
    setSelectedProduct(item);
    setReviewRating(5);
    setReviewComment('');
    setReviewStatus('');
    setSelectedAddons([]);
  }

  function toggleAddon(addon) {
    if (selectedAddons.find(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  }

  const getBasePrice = () => {
    if (!selectedProduct) return 0;
    return parsePrice(selectedProduct.price_num || selectedProduct.price);
  };

  const getTotalPrice = () => {
    let total = getBasePrice();
    selectedAddons.forEach(a => total += a.price);
    return total;
  };

  function handleAddFromModal() {
    if (selectedProduct) {
      addItem({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: `£${getTotalPrice().toFixed(2)}`,
        priceNum: getTotalPrice(),
        addons: selectedAddons
      });
      setSelectedProduct(null);
    }
  }

  const submitReview = async (e) => {
    e.stopPropagation();
    if (!selectedProduct) return;
    try {
      setReviewStatus('Submitting...');
      const response = await fetch('/api/feedback/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          reviewer_name: 'Customer',
          comment: reviewComment,
          rating: reviewRating
        })
      });
      if (response.ok) {
        setReviewStatus('Review submitted! Thank you.');
        setReviewComment('');
      } else {
        setReviewStatus('Error submitting review');
      }
    } catch (err) {
      setReviewStatus('Network error');
    }
  };

  const getImageUrl = (item) => {
    if (!item || !item.image_url) return '/images/coffee-beans.png';
    return `/images/${item.image_url}`;
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = '/images/coffee-beans.png';
  };

  return (
    <section className={styles.menu} id="menu">
      {selectedProduct && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target.className === styles.modalOverlay) setSelectedProduct(null) }}>
          <div className={styles.modalContentFull}>
            <button className={styles.modalCloseOverlayBtn} onClick={() => setSelectedProduct(null)}>&times;</button>
            <div className={styles.modalImageFull}>
              <img src={getImageUrl(selectedProduct)} alt={selectedProduct.name} onError={handleImageError} />
            </div>
            <div className={styles.modalBodyFull}>
              <div className={styles.titleRow}>
                <h3>{selectedProduct.name}</h3>
                <span className={styles.priceHighlight}>£{getBasePrice().toFixed(2)}</span>
              </div>
              <p className={styles.descText}>{selectedProduct.desc || selectedProduct.description}</p>
              <div className={styles.addonSection}>
                <h4>ADD-ONS</h4>
                <div className={styles.addonList}>
                  {currentAddons.map(addon => (
                    <div key={addon.id} className={`${styles.addonRow} ${selectedAddons.find(a => a.id === addon.id) ? styles.addonRowSelected : ''}`} onClick={() => toggleAddon(addon)}>
                      <span className={styles.addonName}>{addon.name}</span>
                      <span className={styles.addonPrice}>+£{addon.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.feedbackSectionCompact}>
                <h4>RATE & REVIEW</h4>
                <div className={styles.starRatingCompact}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <i key={star} className={`fas fa-star ${star <= reviewRating ? styles.starActive : styles.starInactive}`} onClick={() => setReviewRating(star)} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" className={styles.feedbackInputCompact} placeholder="Leave a note..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                  <button className={styles.submitReviewBtnCompact} onClick={submitReview}><i className="fas fa-paper-plane" /></button>
                </div>
                {reviewStatus && <span style={{ fontSize: '0.8rem', color: reviewStatus.includes('Error') ? 'red' : 'green' }}>{reviewStatus}</span>}
              </div>
              <button className={styles.addToCartFull} onClick={handleAddFromModal} style={{
                background: 'linear-gradient(135deg, #2c1810, #c4a484)',
                border: 'none',
                height: '60px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 30px',
                color: '#fff',
                fontWeight: '900',
                fontSize: '1.1rem',
                letterSpacing: '1px',
                boxShadow: '0 10px 25px rgba(44, 24, 16, 0.3)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                marginTop: '10px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(44, 24, 16, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(44, 24, 16, 0.3)';
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <i className="fas fa-shopping-basket" style={{ fontSize: '1.3rem' }} />
                  <span>ADD TO CART</span>
                </div>
                <span style={{ fontSize: '1.3rem', background: 'rgba(255,255,255,0.1)', padding: '5px 15px', borderRadius: '12px' }}>£{getTotalPrice().toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={headerRef} className={`section-wrap ${styles.header} reveal ${headerVis ? 'vis' : ''}`}>
        <div className="label">What We Serve</div>
        <div className="divider" />
        <h2 className="h2" style={{ color: 'var(--espresso)' }}>Our Menu</h2>
      </div>

      <div ref={featRef} className={`section-wrap ${styles.featuredGrid} reveal ${featVis ? 'vis' : ''}`}>
        {syncedFeaturedItems.map((item) => (
          <FeaturedCard key={item.id} item={item} onAdd={() => handleProductClick(item)} getImageUrl={getImageUrl} handleImageError={handleImageError} />
        ))}
      </div>

      <div ref={fullRef} className={`section-wrap ${styles.fullMenu} reveal ${fullVis ? 'vis' : ''}`}>
        <div className={styles.tabBar} style={{ 
          display: 'flex', gap: '12px', overflowX: 'auto', padding: '10px 5px',
          scrollbarWidth: 'none', msOverflowStyle: 'none'
        }}>
          {categories.map(cat => {
            const isActive = activeTab === String(cat.id);
            const catColor = cat.color || '#c4a484';
            return (
              <button 
                key={cat.id} 
                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`} 
                onClick={() => setActiveTab(String(cat.id))} 
                style={{
                  padding: '12px 24px',
                  borderRadius: '50px',
                  border: '1px solid',
                  borderColor: isActive ? catColor : 'rgba(196, 164, 132, 0.2)',
                  background: isActive ? `linear-gradient(135deg, ${catColor}, #2c1810)` : 'rgba(255, 255, 255, 0.8)',
                  color: isActive ? '#fff' : '#8c6a56',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  boxShadow: isActive ? `0 10px 20px ${catColor}40` : '0 4px 10px rgba(0,0,0,0.02)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  backdropFilter: 'blur(5px)',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = catColor;
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = `0 8px 15px rgba(196, 164, 132, 0.15)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'rgba(196, 164, 132, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.02)';
                  }
                }}
              >
                <i className={`fas ${cat.icon || 'fa-coffee'}`} style={{ fontSize: '1rem', color: isActive ? '#fff' : catColor }} />
                <span style={{ letterSpacing: '0.5px' }}>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.itemList}>
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className={styles.item} style={{ border: '1px solid rgba(196,164,132,0.05)' }}>
                <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
                  <div className={styles.skeleton} style={{ width: '70px', height: '70px', borderRadius: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <div className={styles.skeleton} style={{ width: '40%', height: '18px', marginBottom: '10px' }} />
                    <div className={styles.skeleton} style={{ width: '80%', height: '14px', marginBottom: '10px' }} />
                    <div className={styles.skeleton} style={{ width: '30%', height: '14px' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.skeleton} style={{ width: '40px', height: '20px', marginBottom: '10px', marginLeft: 'auto' }} />
                  <div className={styles.skeleton} style={{ width: '30px', height: '30px', borderRadius: '50%', marginLeft: 'auto' }} />
                </div>
              </div>
            ))
          ) : itemsToShow.map((item) => (
            <div key={item.id} className={styles.item} onClick={() => handleProductClick(item)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
                <div className={styles.itemImageThumb} style={{
                  width: '70px', height: '70px', borderRadius: '12px',
                  overflow: 'hidden', flexShrink: 0, backgroundColor: 'rgba(0,0,0,0.05)'
                }}>
                  <img src={getImageUrl(item)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={handleImageError} />
                </div>
                <div className={styles.itemLeft}>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemDesc}>{item.desc || item.description}</div>
                  <Tags tags={item.tags} linkedTags={item.linkedTags} />
                </div>
              </div>
              <div className={styles.itemRight}>
                <div className={styles.itemPrice}>{item.displayPrice || item.price}</div>
                <button className={styles.addBtnSmall} onClick={(e) => { e.stopPropagation(); handleProductClick(item); }}>
                  <i className="fas fa-plus" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ item, onAdd, getImageUrl, handleImageError }) {
  const imgUrl = item.image ? item.image : (item.isDbItem ? getImageUrl(item) : '/images/coffee-beans.png');
  return (
    <div className={styles.featCard} onClick={onAdd} style={{ cursor: 'pointer' }}>
      <div className={styles.featImg}>
        <img src={imgUrl} alt={item.name} onError={handleImageError} />
        {item.tag && <span className={styles.featBadge}>{item.tag}</span>}
      </div>
      <div className={styles.featBody}>
        <h3 className={styles.featName}>{item.name}</h3>
        <div className={styles.featFooter}>
          <span className={styles.featPrice}>{item.displayPrice || item.price}</span>
          <button className={styles.featAddBtn} onClick={(e) => { e.stopPropagation(); onAdd(); }}>View</button>
        </div>
      </div>
    </div>
  );
}
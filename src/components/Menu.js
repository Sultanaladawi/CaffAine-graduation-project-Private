import { useState, useEffect } from 'react';
import { menuCategories, featuredItems } from '../data/shopData';
import { useReveal } from '../hooks/useReveal';
import { useCart } from '../context/CartContext';
import styles from './Menu.module.css';

function Tags({ tags = [], linkedTags = [] }) {
  const allTags = linkedTags.length > 0 ? linkedTags.map(t => t.name) : (Array.isArray(tags) ? tags : []);
  if (allTags.length === 0) return null;
  
  return (
    <div className={styles.tags} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
      {allTags.map((tag, i) => {
        const lowerTag = tag.toLowerCase().trim();
        let icon = <i className="fas fa-tag" style={{ fontSize: '0.7rem' }} />;
        let color = '#c4a484'; // Default gold
        
        if (lowerTag.includes('vegan')) { icon = <i className="fas fa-leaf" />; color = '#28a745'; }
        else if (lowerTag.includes('veg')) { icon = <i className="fas fa-seedling" />; color = '#2ecc71'; }
        else if (lowerTag.includes('hot')) { icon = <i className="fas fa-fire" />; color = '#e74c3c'; }
        else if (lowerTag.includes('best') || lowerTag.includes('star')) { icon = <i className="fas fa-star" />; color = '#f1c40f'; }
        else if (lowerTag.includes('new')) { icon = <i className="fas fa-sparkles" />; color = '#3498db'; }
        
        return (
          <span key={i} style={{ 
            fontSize: '0.65rem', 
            fontWeight: '700', 
            color: color,
            border: `1px solid ${color}40`,
            padding: '2px 8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            textTransform: 'uppercase',
            backgroundColor: `${color}08`
          }}>
            {icon} {tag}
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
  const [featRef,   featVis]   = useReveal();
  const [fullRef,   fullVis]   = useReveal();
  const [activeTab, setActiveTab] = useState(menuCategories[0].id);
  const { addItem } = useCart();

  const [dbItems, setDbItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const activeCatItems = dbItems
    .filter(item => item.category === activeTab || item.category_id === activeTab)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(item => ({
      ...item,
      displayPrice: `£${parsePrice(item.price_num || item.price).toFixed(2)}`,
      tags: item.tags ? (typeof item.tags === 'string' ? item.tags.split(',') : item.tags) : [],
    }));

  const activeCat = menuCategories.find(c => c.id === activeTab);
  const itemsToShow = activeCatItems.length > 0 ? activeCatItems : (activeCat?.items || []);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);

  // Real Addons from DB for the selected product
  const currentAddons = selectedProduct?.linkedAddons || [];

  // Handle opening modal
  function handleProductClick(item) {
    setSelectedProduct(item);
    setReviewRating(5);
    setReviewComment('');
    setReviewStatus('');
    setSelectedAddons([]); // reset addons
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
      setSelectedProduct(null); // Close modal after adding
    }
  }

  const submitReview = async (e) => {
    e.stopPropagation(); // Prevent modal from closing or parent clicks
    if (!selectedProduct) return;
    
    try {
      setReviewStatus('Submitting...');
      const payload = {
        product_id: selectedProduct.id || 1, // Fallback ID if missing
        reviewer_name: 'Customer',
        comment: reviewComment,
        rating: reviewRating
      };
      
      console.log('Sending review:', payload);
      
      const response = await fetch('/api/feedback/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setReviewStatus('Review submitted! Thank you.');
        setReviewComment('');
      } else {
        const errData = await response.json();
        setReviewStatus(`Error: ${errData.error || 'Failed to submit'}`);
      }
    } catch (err) {
      console.error('Submit review error:', err);
      setReviewStatus('Network error. Please try again.');
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
      {/* Redesigned Product Modal */}
      {selectedProduct && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target.className === styles.modalOverlay) setSelectedProduct(null) }}>
          <div className={styles.modalContentFull}>
            <button className={styles.modalCloseOverlayBtn} onClick={() => setSelectedProduct(null)}>&times;</button>
            
            <div className={styles.modalImageFull}>
              <img 
                src={getImageUrl(selectedProduct)} 
                alt={selectedProduct.name} 
                onError={(e) => handleImageError(e, selectedProduct)}
              />
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
                  {currentAddons.map(addon => {
                    const isSelected = selectedAddons.find(a => a.id === addon.id);
                    return (
                      <div 
                        key={addon.id} 
                        className={`${styles.addonRow} ${isSelected ? styles.addonRowSelected : ''}`}
                        onClick={() => toggleAddon(addon)}
                      >
                        <span className={styles.addonName}>{addon.name}</span>
                        <span className={styles.addonPrice}>+£{addon.price.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Section (Compact) */}
              <div className={styles.feedbackSectionCompact}>
                <h4>RATE & REVIEW</h4>
                <div className={styles.starRatingCompact}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <i 
                      key={star} 
                      className={`fas fa-star ${star <= reviewRating ? styles.starActive : styles.starInactive}`}
                      onClick={() => setReviewRating(star)}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text"
                    className={styles.feedbackInputCompact}
                    placeholder="Leave a quick note..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                  <button className={styles.submitReviewBtnCompact} onClick={submitReview}>
                    <i className="fas fa-paper-plane" />
                  </button>
                </div>
                {reviewStatus && <span style={{ fontSize: '0.8rem', color: reviewStatus.includes('Error') ? 'red' : 'green', marginTop: '5px', display: 'block' }}>{reviewStatus}</span>}
              </div>

              <button className={styles.addToCartFull} onClick={handleAddFromModal}>
                <span>ADD TO CART</span>
                <span>£{getTotalPrice().toFixed(2)}</span>
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
        {featuredItems.map((item) => (
          <FeaturedCard key={item.id} item={item} onAdd={() => handleProductClick(item)} />
        ))}
      </div>

      <div ref={fullRef} className={`section-wrap ${styles.fullMenu} reveal ${fullVis ? 'vis' : ''}`}>
        <div className={styles.tabBar}>
          {menuCategories.map(cat => {
            const isActive = activeTab === cat.id;
            return (
              <button 
                key={cat.id} 
                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`} 
                onClick={() => setActiveTab(cat.id)}
                style={isActive ? { background: cat.color, color: '#fff', borderColor: cat.color } : { borderColor: cat.color }}
              >
                <i className={`fas ${cat.icon}`} /> {cat.label}
              </button>
            );
          })}
        </div>

        <div className={styles.itemList}>
          {loading ? (
            <div className={styles.loader}>Loading our finest beans...</div>
          ) : itemsToShow.map((item) => (
            <div key={item.id} className={styles.item} onClick={() => handleProductClick(item)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
                <div className={styles.itemImageThumb} style={{ 
                  width: '70px', height: '70px', borderRadius: '12px', 
                  overflow: 'hidden', flexShrink: 0, backgroundColor: 'rgba(0,0,0,0.05)' 
                }}>
                  <img 
                    src={getImageUrl(item)} 
                    alt={item.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => handleImageError(e, item)}
                  />
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

function FeaturedCard({ item, onAdd }) {
  const imgUrl = item.image || '/images/coffee-beans.png';

  return (
    <div className={styles.featCard} onClick={onAdd} style={{ cursor: 'pointer' }}>
      <div className={styles.featImg}>
        <img 
          src={imgUrl} 
          alt={item.name} 
          onError={(e) => { e.target.onerror = null; e.target.src = '/images/coffee-beans.png'; }}
        />
        {item.tag && <span className={styles.featBadge}>{item.tag}</span>}
      </div>
      <div className={styles.featBody}>
        <h3 className={styles.featName}>{item.name}</h3>
        <div className={styles.featFooter}>
          <span className={styles.featPrice}>{item.price}</span>
          <button className={styles.featAddBtn} onClick={(e) => { e.stopPropagation(); onAdd(); }}>View</button>
        </div>
      </div>
    </div>
  );
}
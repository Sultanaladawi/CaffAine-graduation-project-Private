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
    if (lower.includes('hot') || lower.includes('spicy') || lower.includes('fire'))
      return { gradient: 'linear-gradient(135deg, #991b1b, #7f1d1d)', border: '#f87171', color: '#fef2f2', emoji: '🌶️' };
    if (lower.includes('best') || lower.includes('popular'))
      return { gradient: 'linear-gradient(135deg, #b45309, #78350f)', border: '#fbbf24', color: '#fffbeb', emoji: '🌟', glow: true };
    if (lower.includes('special') || lower.includes('signature') || lower.includes('rare') || lower.includes('luxury'))
      return { gradient: 'linear-gradient(135deg, #4c1d95, #2e1065)', border: '#a78bfa', color: '#f5f3ff', emoji: '👑', glow: true };
    if (lower.includes('new'))
      return { gradient: 'linear-gradient(135deg, #1e40af, #1e3a8a)', border: '#60a5fa', color: '#eff6ff', emoji: '🆕', glow: true };
    if (lower.includes('cold') || lower.includes('iced'))
      return { gradient: 'linear-gradient(135deg, #075985, #0c4a6e)', border: '#38bdf8', color: '#f0f9ff', emoji: '🧊' };
    if (lower.includes('winter') || lower.includes('ice'))
      return { gradient: 'linear-gradient(135deg, #e0f2fe, #7dd3fc)', border: '#38bdf8', color: '#0369a1', emoji: '❄️' };
    if (lower.includes('sweet') || lower.includes('sugar') || lower.includes('cake') || lower.includes('dessert'))
      return { gradient: 'linear-gradient(135deg, #be185d, #831843)', border: '#f472b6', color: '#fdf2f8', emoji: '🍰' };
    if (lower.includes('healthy') || lower.includes('organic') || lower.includes('eco'))
      return { gradient: 'linear-gradient(135deg, #15803d, #14532d)', border: '#4ade80', color: '#f0fdf4', emoji: '🍃' };
    if (lower.includes('protein') || lower.includes('gym') || lower.includes('fit'))
      return { gradient: 'linear-gradient(135deg, #1e3a8a, #172554)', border: '#3b82f6', color: '#eff6ff', emoji: '💪' };
    if (lower.includes('egg') || lower.includes('breakfast'))
      return { gradient: 'linear-gradient(135deg, #ca8a04, #854d0e)', border: '#facc15', color: '#fefce8', emoji: '🍳' };
    if (lower.includes('strong') || lower.includes('dark') || lower.includes('bitter'))
      return { gradient: 'linear-gradient(135deg, #111827, #000000)', border: '#9ca3af', color: '#f9fafb', emoji: '☕' };
    if (lower.includes('fruit') || lower.includes('fresh') || lower.includes('summer'))
      return { gradient: 'linear-gradient(135deg, #c2410c, #7c2d12)', border: '#fb923c', color: '#fff7ed', emoji: '🍓' };
    if (lower.includes('juice') || lower.includes('orange') || lower.includes('lemon'))
      return { gradient: 'linear-gradient(135deg, #ea580c, #9a3412)', border: '#fdba74', color: '#fff7ed', emoji: '🍹' };
    if (lower.includes('water') || lower.includes('mineral') || lower.includes('sparkling'))
      return { gradient: 'linear-gradient(135deg, #0ea5e9, #0369a1)', border: '#7dd3fc', color: '#f0f9ff', emoji: '💧' };
    if (lower.includes('classic') || lower.includes('original') || lower.includes('traditional'))
      return { gradient: 'linear-gradient(135deg, #78350f, #451a03)', border: '#d97706', color: '#fffbeb', emoji: '🏛️' };
    if (lower.includes('pastry') || lower.includes('croissant') || lower.includes('bread'))
      return { gradient: 'linear-gradient(135deg, #b45309, #78350f)', border: '#fcd34d', color: '#fffbeb', emoji: '🥐' };
    if (lower.includes('sandwich') || lower.includes('wrap') || lower.includes('club') || lower.includes('burger'))
      return { gradient: 'linear-gradient(135deg, #065f46, #064e3b)', border: '#34d399', color: '#ecfdf5', emoji: '🥪' };
    if (lower.includes('salad') || lower.includes('green') || lower.includes('bowl'))
      return { gradient: 'linear-gradient(135deg, #15803d, #14532d)', border: '#4ade80', color: '#f0fdf4', emoji: '🥗' };
    if (lower.includes('meal') || lower.includes('main') || lower.includes('pasta') || lower.includes('pizza'))
      return { gradient: 'linear-gradient(135deg, #991b1b, #7f1d1d)', border: '#fca5a5', color: '#fef2f2', emoji: '🥘' };
    if (lower.includes('snack') || lower.includes('fry') || lower.includes('chips'))
      return { gradient: 'linear-gradient(135deg, #d97706, #b45309)', border: '#fbbf24', color: '#fffbeb', emoji: '🍟' };
    if (lower.includes('soup'))
      return { gradient: 'linear-gradient(135deg, #c2410c, #7c2d12)', border: '#fdba74', color: '#fff7ed', emoji: '🥣' };
    if (lower.includes('meat') || lower.includes('chicken') || lower.includes('beef'))
      return { gradient: 'linear-gradient(135deg, #451a03, #1b0c03)', border: '#92400e', color: '#fffbeb', emoji: '🍗' };
    if (lower.includes('evening') || lower.includes('night') || lower.includes('sunset'))
      return { gradient: 'linear-gradient(135deg, #1e1b4b, #312e81)', border: '#818cf8', color: '#eef2ff', emoji: '🌙' };
    if (lower.includes('limited') || lower.includes('exclusive'))
      return { gradient: 'linear-gradient(135deg, #0d9488, #0f766e)', border: '#2dd4bf', color: '#f0fdfa', emoji: '⚡', glow: true };
    if (lower.includes('nut') || lower.includes('almond') || lower.includes('hazelnut'))
      return { gradient: 'linear-gradient(135deg, #713f12, #422006)', border: '#a16207', color: '#fefce8', emoji: '🥜' };
    if (lower.includes('chocolate') || lower.includes('cocoa'))
      return { gradient: 'linear-gradient(135deg, #3b2314, #24140a)', border: '#6f4e37', color: '#fdf5e6', emoji: '🍫' };
    if (lower.includes('vanilla') || lower.includes('milk') || lower.includes('latte') || lower.includes('cream'))
      return { gradient: 'linear-gradient(135deg, #f3f4f6, #9ca3af)', border: '#d1d5db', color: '#1f2937', emoji: '🥛' };
    if (lower.includes('caramel') || lower.includes('toffee') || lower.includes('syrup'))
      return { gradient: 'linear-gradient(135deg, #d97706, #92400e)', border: '#fcd34d', color: '#fffbeb', emoji: '🍯' };
    if (lower.includes('sugar-free') || lower.includes('diet'))
      return { gradient: 'linear-gradient(135deg, #0ea5e9, #0369a1)', border: '#7dd3fc', color: '#f0f9ff', emoji: '🍬' };
    if (lower.includes('relax') || lower.includes('tea') || lower.includes('calm') || lower.includes('herbal'))
      return { gradient: 'linear-gradient(135deg, #065f46, #064e3b)', border: '#6ee7b7', color: '#ecfdf5', emoji: '🍵' };
    if (lower.includes('energy') || lower.includes('boost'))
      return { gradient: 'linear-gradient(135deg, #4d7c0f, #365314)', border: '#a3e635', color: '#f7fee7', emoji: '⚡' };
    if (lower.includes('spiced') || lower.includes('cinnamon'))
      return { gradient: 'linear-gradient(135deg, #7c2d12, #431407)', border: '#fb923c', color: '#fff7ed', emoji: '🎋' };
    if (lower.includes('autumn') || lower.includes('fall'))
      return { gradient: 'linear-gradient(135deg, #b45309, #78350f)', border: '#f59e0b', color: '#fffbeb', emoji: '🍂' };
    if (lower.includes('spring') || lower.includes('flower'))
      return { gradient: 'linear-gradient(135deg, #db2777, #9d174d)', border: '#f472b6', color: '#fdf2f8', emoji: '🌸' };
    
    return { gradient: 'linear-gradient(135deg, #8c6a56, #5a3500)', border: '#c4a484', color: '#fff', emoji: '☕' };
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
  const { addItem, items, setQty, removeItem } = useCart();

  const [dbItems, setDbItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-GB'); 

  // Fetch categories from DB
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
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

  // Bilingual Search Mapper (Arabic <-> English)
  const getSearchTerms = (term) => {
    const t = term.toLowerCase().trim();
    const dictionary = {
      'شاي': ['tea'],
      'قهوة': ['coffee', 'espresso', 'caff'],
      'حليب': ['milk', 'latte'],
      'ماء': ['water', 'mineral'],
      'عصير': ['juice', 'fresh'],
      'حلى': ['sweet', 'cake', 'dessert'],
      'حلو': ['sweet', 'cake', 'dessert'],
      'بارد': ['cold', 'ice', 'iced'],
      'حار': ['hot', 'warm'],
      'سندوتش': ['sandwich', 'wrap', 'club'],
      'فطور': ['breakfast', 'morning', 'egg'],
      'كيك': ['cake', 'pastry'],
      'مشروب': ['drink', 'beverage']
    };
    
    let terms = [t];
    Object.keys(dictionary).forEach(key => {
      if (t.includes(key)) terms = [...terms, ...dictionary[key]];
    });
    return terms;
  };

  // Filter items based on active category AND search term
  const itemsToShow = dbItems
    .filter(item => {
      const searchTerms = getSearchTerms(searchTerm);
      const matchesSearch = searchTerms.some(s => {
        const matchesName = item.name.toLowerCase().includes(s);
        const matchesDesc = (item.desc || item.description || '').toLowerCase().includes(s);
        const matchesTags = (item.tags || '').toString().toLowerCase().includes(s);
        const matchesAddons = (item.linkedAddons || []).some(a => a.name.toLowerCase().includes(s));
        return matchesName || matchesDesc || matchesTags || matchesAddons;
      });
      
      if (searchTerm) return matchesSearch;
      return String(item.category_id) === String(activeTab);
    })
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(item => ({
      ...item,
      displayPrice: `£${parsePrice(item.price_num || item.price).toFixed(2)}`,
      tags: item.tags ? (typeof item.tags === 'string' ? item.tags.split(',') : item.tags) : [],
    }));

  const activeCategory = categories.find(c => String(c.id) === String(activeTab));
  const themeColor = activeCategory?.color || '#c4a484';

  // Get unique addons for current view
  const currentViewAddons = [];
  const seenAddonIds = new Set();
  itemsToShow.forEach(item => {
    (item.linkedAddons || []).forEach(addon => {
      if (!seenAddonIds.has(addon.id)) {
        seenAddonIds.add(addon.id);
        currentViewAddons.push(addon);
      }
    });
  });

  // Sync featured items
  const syncedFeaturedItems = featuredItems.map(feat => {
    const dbItem = dbItems.find(i => String(i.id) === String(feat.id) || i.name.toLowerCase() === feat.name.toLowerCase());
    return dbItem ? { ...dbItem, ...feat, isDbItem: true } : feat;
  });

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

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition not supported in this browser. Try Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      
      const cleanTranscript = transcript.replace(/[.,]/g, '').trim();
      setSearchTerm(cleanTranscript);
    };

    recognition.start();
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
        
        {/* Search Bar - Modern & Glassy */}
        <div style={{ 
          maxWidth: '600px', margin: '15px auto 5px auto', position: 'relative',
          padding: '0 15px'
        }}>
          <div style={{
            position: 'absolute', left: '30px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--espresso)', opacity: 0.6, pointerEvents: 'none', zIndex: 5
          }}>
            <i className="fas fa-search" />
          </div>
          <input 
            type="text" 
            placeholder={listening 
              ? (voiceLang === 'ar-SA' ? '🎙️ جاري الاستماع...' : '🎙️ Listening...') 
              : (voiceLang === 'ar-SA' ? 'ابحث عن قهوة، حلى...' : 'Search for coffee, tea, sweets...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '18px 110px 18px 55px', // More right padding for buttons
              borderRadius: '25px',
              border: '1px solid rgba(196, 164, 132, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              color: 'var(--espresso)',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--espresso)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(196, 164, 132, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(196, 164, 132, 0.2)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.03)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          />
          
          <div style={{
            position: 'absolute', right: '30px', top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer',
                  padding: '5px', fontSize: '1.1rem'
                }}
              >
                <i className="fas fa-times-circle" />
              </button>
            )}

            <button
              onClick={() => setVoiceLang(v => v === 'en-GB' ? 'ar-SA' : 'en-GB')}
              style={{
                background: 'rgba(196, 164, 132, 0.1)', border: 'none',
                borderRadius: '8px', padding: '4px 6px', fontSize: '0.65rem',
                fontWeight: '900', color: 'var(--espresso)', cursor: 'pointer'
              }}
              title={voiceLang === 'ar-SA' ? 'Switch to English' : 'التبديل للعربية'}
            >
              {voiceLang === 'ar-SA' ? 'AR' : 'EN'}
            </button>

            <button
              onClick={startVoice}
              style={{
                width: '35px', height: '35px', borderRadius: '50%',
                border: 'none', background: listening ? '#ff4d4d' : 'var(--espresso)',
                color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease',
                boxShadow: listening ? '0 0 15px rgba(255,77,77,0.4)' : 'none'
              }}
            >
              <i className={`fas ${listening ? 'fa-stop' : 'fa-microphone'}`} />
            </button>
          </div>
        </div>

        <div className={styles.tabBar} style={{ 
          display: 'flex', gap: '8px', overflowX: 'auto', padding: '5px',
          scrollbarWidth: 'none', msOverflowStyle: 'none', borderBottom: 'none'
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
          ) : itemsToShow.length > 0 ? (
            itemsToShow.map((item) => (
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
                <div className={styles.itemRight} onClick={e => e.stopPropagation()}>
                  <div className={styles.itemPrice}>{item.displayPrice || item.price}</div>
                  {(() => {
                    const cartItem = items.find(i => String(i.id) === String(item.id));
                    if (cartItem) {
                      return (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          background: `linear-gradient(135deg, ${themeColor}, #2c1810)`,
                          borderRadius: '50px', padding: '4px 6px',
                          boxShadow: `0 4px 15px ${themeColor}40`,
                          animation: 'fadeIn 0.3s ease'
                        }}>
                          <button
                            onClick={() => cartItem.qty <= 1 ? removeItem(cartItem.id) : setQty(cartItem.id, cartItem.qty - 1)}
                            style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              border: 'none', background: 'rgba(255,255,255,0.15)',
                              color: '#fff', fontWeight: '900', fontSize: '1.1rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', transition: 'background 0.2s',
                              lineHeight: 1
                            }}
                            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.3)'}
                            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
                          >−</button>
                          <span style={{
                            color: '#fff', fontWeight: '900', fontSize: '0.95rem',
                            minWidth: '18px', textAlign: 'center'
                          }}>{cartItem.qty}</span>
                          <button
                            onClick={() => setQty(cartItem.id, cartItem.qty + 1)}
                            style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              border: 'none', background: 'rgba(255,255,255,0.15)',
                              color: '#fff', fontWeight: '900', fontSize: '1.1rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', transition: 'background 0.2s',
                              lineHeight: 1
                            }}
                            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.3)'}
                            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
                          >+</button>
                        </div>
                      );
                    }
                    return (
                      <button 
                        className={styles.addBtnSmall} 
                        onClick={(e) => { e.stopPropagation(); handleProductClick(item); }}
                        style={{ 
                          background: `linear-gradient(135deg, ${themeColor}, #2c1810)`,
                          boxShadow: `0 6px 15px ${themeColor}40`
                        }}
                      >
                        <i className="fas fa-plus" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              textAlign: 'center', padding: '60px 20px', color: 'rgba(44, 24, 16, 0.4)',
              backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '30px', border: '1px dashed rgba(196,164,132,0.3)'
            }}>
              <i className="fas fa-mug-hot" style={{ fontSize: '3rem', marginBottom: '20px', display: 'block', opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--espresso)' }}>No matches found</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Try searching for something else or browse categories.</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  style={{
                    marginTop: '20px', padding: '10px 25px', borderRadius: '50px',
                    backgroundColor: 'var(--espresso)', color: '#fff', border: 'none',
                    fontWeight: '700', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* Context-aware Addons at the bottom of each category */}
          {!loading && !searchTerm && currentViewAddons.length > 0 && (
            <div style={{ 
              marginTop: '40px', padding: '25px', borderTop: '1px solid rgba(196, 164, 132, 0.1)',
              backgroundColor: 'rgba(196, 164, 132, 0.03)', borderRadius: '20px'
            }}>
              <div style={{ 
                fontSize: '0.7rem', color: 'var(--espresso)', fontWeight: '900', 
                letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '15px',
                opacity: 0.6, display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <i className="fas fa-plus-circle" /> Available Customizations
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {currentViewAddons.map(addon => (
                  <button 
                    key={addon.id} 
                    onClick={() => addItem({
                      id: `addon-${addon.id}`,
                      name: addon.name,
                      priceNum: parseFloat(addon.price) || 0.50,
                      image: '/images/coffee-beans.png', // Fallback icon
                      quantity: 1
                    })}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 16px', background: '#fff', borderRadius: '12px',
                      border: '1.5px solid rgba(196, 164, 132, 0.3)', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                      e.currentTarget.style.borderColor = themeColor;
                      e.currentTarget.style.backgroundColor = themeColor;
                      e.currentTarget.style.color = '#fff';
                      const priceSpan = e.currentTarget.querySelector('.addon-price');
                      if (priceSpan) priceSpan.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.borderColor = 'rgba(196, 164, 132, 0.3)';
                      e.currentTarget.style.backgroundColor = '#fff';
                      e.currentTarget.style.color = 'inherit';
                      const priceSpan = e.currentTarget.querySelector('.addon-price');
                      if (priceSpan) priceSpan.style.color = '#8c6a56';
                    }}
                  >
                    <i className="fas fa-plus" style={{ fontSize: '0.7rem', opacity: 0.7 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{addon.name}</span>
                    <span className="addon-price" style={{ 
                      fontSize: '0.8rem', fontWeight: '900', color: '#8c6a56', 
                      marginLeft: '5px', transition: 'color 0.3s'
                    }}>+£{(parseFloat(addon.price) || 0.50).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
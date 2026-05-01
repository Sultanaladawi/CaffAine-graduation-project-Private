import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Products.css';
import { Plus, Edit, Trash2, X, GripVertical, Image, Download } from 'lucide-react';
import { BsGrid3X3 } from 'react-icons/bs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [allAddons, setAllAddons] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Quick-add states
  const [newTagName, setNewTagName] = useState('');
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [images, setImages] = useState([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);
  const [notification, setNotification] = useState(null); // New state for elegant notifications
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const colors = {
    espresso: 'var(--admin-bg)',
    bean: 'var(--admin-card)',
    crema: 'var(--admin-accent)',
    latte: 'var(--admin-text)',
    border: 'var(--admin-border)',
    input: '#2D2926',
    gold: 'var(--admin-accent)'
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const headerTextStyle = { color: colors.latte, fontSize: '2.2rem', fontFamily: "'DM Serif Display', serif", fontWeight: 700 };
  const headerBoxStyle = { display: 'inline-block', padding: '10px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' };

  const [dbCategories, setDbCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setDbCategories(res.data || []);
      if (res.data && res.data.length > 0 && !formData.id) {
        setFormData(prev => ({...prev, category_id: res.data[0].id}));
      }
    } catch (err) {
      console.error('Categories fetch error:', err);
    }
  };

  const [formData, setFormData] = useState({ 
    id: null,
    name: '', 
    price_num: '', 
    description: '', 
    available: 1,
    category_id: '',
    image_url: '',
    tags: '',
    addons: '',
    addon_ids: [],
    tag_ids: []
  });

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      const sorted = (res.data || []).sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
      setProducts(sorted);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching products:", err);
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const res = await axios.get('/api/images');
      setImages(res.data || []);
    } catch (err) {
      console.error('Image fetch error:', err);
    }
  };

  const fetchAddons = async () => {
    try {
      const res = await axios.get('/api/addons');
      setAllAddons(res.data || []);
    } catch (err) {
      console.error('Addons fetch error:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await axios.get('/api/tags');
      setAllTags(res.data || []);
    } catch (err) {
      console.error('Tags fetch error:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchImages();
    fetchAddons();
    fetchTags();
  }, []);

  // Drag & Drop handlers
  const handleDragStart = (index) => { dragItem.current = index; };
  const handleDragEnter = (index) => { dragOverItem.current = index; };
  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    const items = [...products];
    const draggedItemContent = items[dragItem.current];
    items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    const reordered = items.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
    setProducts(reordered);
    setOrderChanged(true);
  };

  const saveOrder = async () => {
    try {
      setLoading(true);
      await axios.put('/api/products/reorder', {
        order: products.map(p => ({ id: p.id, sort_order: p.sort_order }))
      });
      setOrderChanged(false);
      showToast("Inventory sequence updated successfully");
      fetchProducts();
    } catch (err) {
      console.error('Reorder save error:', err);
      showToast("Failed to save sequence", "error");
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: null, name: '', price_num: '', description: '', available: 1, category_id: 'espresso', image_url: '', tags: '', addons: '', addon_ids: [], tag_ids: [] });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setModalMode('edit');
    setFormData({
      id: product.id,
      name: product.name,
      price_num: product.price_num,
      description: product.description,
      available: product.available ?? 1,
      category_id: product.category_id || 'espresso',
      image_url: product.image_url || '',
      tags: product.tags || '',
      addons: product.addons || '',
      addon_ids: product.linkedAddons ? product.linkedAddons.map(a => parseInt(a.id)) : [],
      tag_ids: product.linkedTags ? product.linkedTags.map(t => parseInt(t.id)) : []
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Filter out any legacy or invalid IDs before sending
      const cleanFormData = {
        ...formData,
        addon_ids: (formData.addon_ids || []).filter(id => !String(id).includes('legacy') && !isNaN(parseInt(id))),
        tag_ids: (formData.tag_ids || []).filter(id => !String(id).includes('legacy') && !isNaN(parseInt(id)))
      };

      if (modalMode === 'add') {
        await axios.post('/api/products', cleanFormData);
        showToast("Product created with precision");
      } else {
        await axios.put(`/api/products/${formData.id}`, cleanFormData);
        showToast("Product details refined");
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error('Product save error:', err);
      showToast(err.response?.data?.error || "Precision error", "error");
    }
  };

  const handleQuickAddTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await axios.post('/api/tags', { name: newTagName.trim() });
      const created = res.data;
      setAllTags(prev => [...prev, created].sort((a,b) => a.name.localeCompare(b.name)));
      setFormData(prev => ({...prev, tag_ids: [...prev.tag_ids, created.id]}));
      setNewTagName('');
    } catch (err) { alert("Failed to add tag"); }
  };

  const handleQuickAddAddon = async () => {
    if (!newAddonName.trim()) return;
    try {
      const res = await axios.post('/api/addons', { name: newAddonName.trim(), price: parseFloat(newAddonPrice) || 0 });
      const created = res.data;
      setAllAddons(prev => [...prev, created].sort((a,b) => a.name.localeCompare(b.name)));
      setFormData(prev => ({...prev, addon_ids: [...prev.addon_ids, created.id]}));
      setNewAddonName('');
      setNewAddonPrice('');
    } catch (err) { alert("Failed to add addon"); }
  };

  const exportPDF = () => {
    try {
      if (products.length === 0) {
        alert("No products available to export.");
        return;
      }
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(45, 41, 38);
      doc.text('Faculty Coffee - Product Inventory', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 32);
      doc.text('Complete list of menu items, pricing, and availability.', 14, 38);
      
      // Table
      const tableColumn = ["ID", "Product Name", "Category", "Price", "Status"];
      const tableRows = products.map((item, index) => [
        `PRD-${String(index + 1).padStart(3, '0')}`,
        item.name || 'Unnamed',
        dbCategories.find(c => String(c.id) === String(item.category_id))?.name || dbCategories.find(c => String(c.id) === String(item.category_id))?.label || item.category_id || 'N/A',
        `£${parseFloat(item.price_num || 0).toFixed(2)}`,
        item.available === 0 ? 'OUT OF STOCK' : 'AVAILABLE'
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { 
          fillColor: [196, 164, 132], 
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 9,
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        }
      });

      doc.save(`Faculty_Coffee_Products_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Error generating PDF: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`/api/products/${id}`);
        fetchProducts();
      } catch (err) {
        console.error("Delete product error:", err);
        alert("Error: " + (err.response?.data?.error || "Failed to delete product"));
      }
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    backgroundColor: colors.input,
    border: `1px solid ${colors.border}`,
    color: colors.latte,
    fontSize: '0.95rem',
    outline: 'none',
    transition: '0.3s'
  };

  const labelStyle = {
    color: colors.crema,
    fontSize: '0.85rem',
    fontWeight: '600',
    marginBottom: '8px',
    display: 'block',
    fontFamily: "'Inter', sans-serif"
  };

  return (
    <div className="dashboard-fade-in" style={{ 
      backgroundColor: colors.espresso, 
      minHeight: '100vh', 
      padding: '40px 10px 40px 5px' // Shifting left significantly
    }}>
      {/* Elegant Notification Toast */}
      {notification && (
        <div className={`premium-toast ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
          {notification.message}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: colors.bean, width: '100%', maxWidth: '700px', borderRadius: '30px', border: `1px solid ${colors.border}`, padding: '40px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflowY: 'auto', maxHeight: '90vh' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '25px', right: '25px', backgroundColor: 'transparent', border: 'none', color: colors.latte, cursor: 'pointer', opacity: 0.6 }}>
              <X size={24} />
            </button>
          
            <h3 style={{ color: colors.crema, margin: '0 0 30px 0', fontFamily: "'DM Serif Display', serif", fontSize: '2rem' }}>
              {modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Image Picker Field */}
              <div>
                <label style={labelStyle}>Product Image</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden',
                    border: `1px solid ${colors.border}`, backgroundColor: colors.input,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {formData.image_url ? 
                      <img src={`/images/${formData.image_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.onerror = null; e.target.src = '/images/coffee-beans.png'; }} /> 
                      : <Image size={24} color="#888" />}
                  </div>
                  <button type="button" onClick={() => setShowImagePicker(true)} style={{
                    flex: 1, padding: '14px', borderRadius: '12px', backgroundColor: colors.input,
                    border: `1px solid ${colors.border}`, color: formData.image_url ? colors.latte : '#888',
                    cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem'
                  }}>
                    {formData.image_url || 'Click to select image...'}
                  </button>
                  {formData.image_url && <button type="button" onClick={() => setFormData({...formData, image_url: ''})} style={{ background: 'none', border: 'none', color: '#e74a3b', cursor: 'pointer' }}><X size={18} /></button>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Product Name</label>
                  <input 
                    type="text" value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Espresso Shot" required
                    style={inputStyle}
                  />
                </div>
                <div style={{ width: '150px' }}>
                  <label style={labelStyle}>Price (£)</label>
                  <input 
                    type="text" value={formData.price_num} 
                    onChange={(e) => setFormData({...formData, price_num: e.target.value})}
                    placeholder="0.00" required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Tell us about this product..."
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Category</label>
                  <select 
                    value={formData.category_id} 
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    style={inputStyle}
                  >
                    {dbCategories.map(cat => (
                      <option key={cat.id} value={cat.id} style={{ backgroundColor: colors.espresso }}>{cat.label || cat.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Availability</label>
                  <select 
                    value={formData.available} 
                    onChange={(e) => setFormData({...formData, available: parseInt(e.target.value)})}
                    style={inputStyle}
                  >
                    <option value={1} style={{ backgroundColor: colors.espresso }}>Available</option>
                    <option value={0} style={{ backgroundColor: colors.espresso }}>Unavailable</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '25px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Category Tags</label>
                  <div style={{ 
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', 
                    padding: '15px', backgroundColor: colors.input, 
                    borderRadius: '16px', border: `1px solid ${colors.border}`,
                    maxHeight: '180px', overflowY: 'auto'
                  }}>
                    {allTags.map(tag => (
                      <label key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: colors.latte, cursor: 'pointer', padding: '4px 0' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.tag_ids.includes(tag.id)}
                          onChange={(e) => {
                            const newIds = e.target.checked 
                              ? [...formData.tag_ids, tag.id]
                              : formData.tag_ids.filter(id => id !== tag.id);
                            setFormData({...formData, tag_ids: newIds});
                          }}
                          style={{ accentColor: colors.crema, width: '16px', height: '16px' }}
                        />
                        {tag.name}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <input type="text" value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="Add new tag..." style={{...inputStyle, padding: '10px', fontSize: '0.85rem'}} />
                    <button type="button" onClick={handleQuickAddTag} style={{backgroundColor: colors.crema, color: colors.espresso, border: 'none', borderRadius: '10px', padding: '0 18px', cursor: 'pointer', fontWeight: 'bold'}}>+</button>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Available Add-ons</label>
                  <div style={{ 
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', 
                    padding: '15px', backgroundColor: colors.input, 
                    borderRadius: '16px', border: `1px solid ${colors.border}`,
                    maxHeight: '180px', overflowY: 'auto'
                  }}>
                    {allAddons.map(addon => (
                      <label key={addon.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: colors.latte, cursor: 'pointer', padding: '4px 0' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.addon_ids.includes(addon.id)}
                          onChange={(e) => {
                            const newIds = e.target.checked 
                              ? [...formData.addon_ids, addon.id]
                              : formData.addon_ids.filter(id => id !== addon.id);
                            setFormData({...formData, addon_ids: newIds});
                          }}
                          style={{ accentColor: colors.crema, width: '16px', height: '16px' }}
                        />
                        <span style={{ flex: 1 }}>{addon.name}</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>£{addon.price}</span>
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <input type="text" value={newAddonName} onChange={e => setNewAddonName(e.target.value)} placeholder="Addon..." style={{...inputStyle, padding: '10px', fontSize: '0.85rem', flex: 2}} />
                    <input type="text" value={newAddonPrice} onChange={e => setNewAddonPrice(e.target.value)} placeholder="£" style={{...inputStyle, padding: '10px', fontSize: '0.85rem', flex: 1}} />
                    <button type="button" onClick={handleQuickAddAddon} style={{backgroundColor: colors.crema, color: colors.espresso, border: 'none', borderRadius: '10px', padding: '0 18px', cursor: 'pointer', fontWeight: 'bold'}}>+</button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 2, padding: '16px', backgroundColor: colors.crema, color: colors.espresso, border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: '0.3s' }}>
                  {modalMode === 'add' ? 'Create Product' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '16px', backgroundColor: 'transparent', color: colors.latte, border: `1px solid ${colors.border}`, borderRadius: '15px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* Image Picker Modal */}
        {showImagePicker && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
            <div style={{ backgroundColor: colors.bean, borderRadius: '30px', padding: '35px', width: '100%', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto', border: `1px solid ${colors.border}`, boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ color: colors.crema, margin: 0, fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem' }}>Select Product Image</h3>
                <button onClick={() => setShowImagePicker(false)} style={{ background: 'none', border: 'none', color: colors.latte, cursor: 'pointer', padding: '5px' }}><X size={28} /></button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
                {images.map(img => {
                  const imgSrc = `/images/${img}`;
                  const backendSrc = `http://localhost:5000/images/${img}`;
                  
                  return (
                    <div key={img} 
                      onClick={() => { setFormData({...formData, image_url: img}); setShowImagePicker(false); }}
                      style={{ 
                        cursor: 'pointer', borderRadius: '20px', overflow: 'hidden', 
                        border: formData.image_url === img ? `3px solid ${colors.crema}` : `1px solid ${colors.border}`, 
                        transition: '0.3s', backgroundColor: 'rgba(0,0,0,0.2)',
                        transform: formData.image_url === img ? 'scale(1.05)' : 'none',
                        boxShadow: formData.image_url === img ? `0 0 20px ${colors.crema}40` : 'none'
                      }}>
                      <div style={{ height: '120px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                        <img 
                          src={imgSrc} 
                          alt={img} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          onError={(e) => {
                            if (e.target.src.includes('3002')) {
                               e.target.src = backendSrc;
                            } else {
                               e.target.onerror = null;
                               e.target.src = '/images/coffee-beans.png';
                            }
                          }}
                        />
                      </div>
                      <div style={{ 
                        padding: '10px', fontSize: '0.7rem', color: colors.latte, 
                        textAlign: 'center', backgroundColor: colors.input,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {img}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      <div style={{ 
        width: '100%', 
        maxWidth: '1480px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '40px',
        padding: '0 20px'
      }}>
        <div>
          <div style={{ 
            fontFamily: "'DM Serif Display', serif", 
            fontSize: '2rem', 
            color: colors.crema, 
            lineHeight: '1',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '15px'
          }}>
            Faculty<span style={{ color: '#fff', fontStyle: 'italic' }}>Coffee.</span>
          </div>
          <div className="header-box">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: 0, ...headerTextStyle }}>
              <BsGrid3X3 size={32} color={colors.crema} /> 
              Product Inventory
            </h2>
          </div>
          <p style={{ color: colors.crema, marginTop: '12px', opacity: 0.6, fontSize: '0.95rem' }}>Manage Faculty Coffee menu items and their configurations with premium precision.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={exportPDF}
            style={{ 
              backgroundColor: 'rgba(196, 164, 132, 0.1)', 
              color: colors.crema, 
              border: `1px solid ${colors.crema}`, 
              padding: '14px 28px', borderRadius: '14px', fontWeight: 'bold', 
              display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              transition: '0.3s'
            }}>
            <Download size={20} /> Export PDF
          </button>
          <button 
            onClick={openAddModal}
            style={{ 
              backgroundColor: colors.crema, color: colors.espresso, border: 'none', 
              padding: '14px 28px', borderRadius: '14px', fontWeight: 'bold', 
              display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              transition: '0.3s', boxShadow: '0 10px 20px rgba(196, 164, 132, 0.2)'
            }}>
            <Plus size={20} /> Add New Item
          </button>
          </div>
          {orderChanged && (
            <button 
              onClick={saveOrder}
              style={{ 
                backgroundColor: 'rgba(56, 239, 125, 0.1)', color: '#38ef7d', border: '1px solid rgba(56, 239, 125, 0.3)', 
                padding: '12px 24px', borderRadius: '14px', fontWeight: '600', 
                display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                transition: '0.3s',
                fontSize: '0.9rem',
                boxShadow: '0 4px 15px rgba(56, 239, 125, 0.1)'
              }}>
              Save New Order
            </button>
          )}
        </div>
      </div>

      <div style={{ 
        width: '100%',
        maxWidth: '1500px', 
        backgroundColor: 'rgba(255, 255, 255, 0.01)', 
        borderRadius: '32px', 
        border: `1px solid rgba(255, 255, 255, 0.06)`, 
        overflow: 'hidden', 
        boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
        padding: '10px'
      }}>
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center', color: colors.latte, letterSpacing: '3px', fontWeight: 'bold', opacity: 0.6 }}>
            PREPARING PREMIUM MENU...
          </div>
        ) :          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', color: colors.latte, textAlign: 'left', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '90px' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead style={{ backgroundColor: 'rgba(45, 41, 38, 0.7)' }}>
                <tr>
                  <th style={{ padding: '20px 12px', color: colors.crema, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>ID</th>
                  <th style={{ padding: '20px 12px', color: colors.crema, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>Product</th>
                  <th style={{ padding: '20px 12px', color: colors.crema, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>Category</th>
                  <th style={{ padding: '20px 12px', color: colors.crema, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>Price</th>
                  <th style={{ padding: '20px 12px', color: colors.crema, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>Tags</th>
                  <th style={{ padding: '20px 12px', color: colors.crema, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>Add-ons</th>
                  <th style={{ padding: '20px 12px', color: colors.crema, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>Status</th>
                  <th style={{ padding: '20px 12px', color: colors.crema, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item, index) => (
                  <tr key={item.id} className="product-row"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease'
                    }}>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ cursor: 'grab', opacity: 0.3 }}><GripVertical size={14} /></div>
                        <div className="id-badge-premium">
                          <span className="id-prefix">PRD</span>
                          <span className="id-number">{String(index + 1).padStart(3, '0')}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '52px', height: '52px', minWidth: '52px', backgroundColor: 'rgba(196, 164, 132, 0.1)', 
                          borderRadius: '12px', overflow: 'hidden', display: 'flex', 
                          alignItems: 'center', justifyContent: 'center', border: `1px solid ${colors.border}` 
                        }}>
                          <img 
                            src={item.image_url ? `/images/${item.image_url}` : '/images/coffee-beans.png'}
                            alt={item.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null; 
                              e.target.src = '/images/coffee-beans.png';
                            }}
                          />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: '600', color: colors.latte, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name || 'Unnamed Product'}</div>
                          <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description?.substring(0, 35)}{item.description?.length > 35 ? '…' : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '0.8rem', color: colors.latte, opacity: 0.7 }}>
                      {dbCategories.find(c => String(c.id) === String(item.category_id))?.name || dbCategories.find(c => String(c.id) === String(item.category_id))?.label || <span style={{color: '#ff4d4d'}}>Unlinked</span>}
                    </td>
                    <td style={{ padding: '16px 12px', fontWeight: 'bold', color: colors.crema, fontSize: '0.95rem' }}>
                      £{parseFloat(item.price_num || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {item.linkedTags && item.linkedTags.length > 0 ? item.linkedTags.map((tag, i) => (
                          <span key={i} style={{ 
                            fontSize: '0.6rem', 
                            color: '#120a05', 
                            background: 'linear-gradient(135deg, #c7a57a 0%, #e0d0b8 100%)', 
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            fontWeight: '700', 
                            textTransform: 'uppercase'
                          }}>
                            {tag.name}
                          </span>
                        )) : item.tags ? item.tags.split(',').map((tag, i) => (
                           <span key={i} style={{ 
                            fontSize: '0.6rem', color: colors.crema, 
                            border: '1px solid rgba(196, 164, 132, 0.3)',
                            padding: '3px 7px', borderRadius: '6px',
                            fontWeight: '600'
                          }}>
                            {tag.trim()}
                          </span>
                        )) : <span style={{ color: '#444', fontSize: '0.7rem', fontStyle: 'italic' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {item.addons ? item.addons.split(',').slice(0, 3).map((addon, i) => (
                          <span key={i} style={{ 
                            fontSize: '0.65rem', color: colors.crema, opacity: 0.7,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            + {addon.trim()}
                          </span>
                        )) : <span style={{ color: '#444', fontSize: '0.7rem', fontStyle: 'italic' }}>—</span>}
                        {item.addons && item.addons.split(',').length > 3 && (
                          <span style={{ fontSize: '0.6rem', color: colors.gold, opacity: 0.5 }}>+{item.addons.split(',').length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{ 
                        backgroundColor: item.available === 0 ? 'rgba(231, 74, 59, 0.1)' : 'rgba(40, 167, 69, 0.1)', 
                        color: item.available === 0 ? '#e74a3b' : '#28a745',
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '700',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.available === 0 ? 'OUT OF STOCK' : 'AVAILABLE'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <Edit onClick={() => openEditModal(item)} size={16} style={{ cursor: 'pointer', color: '#888', transition: 'color 0.2s' }} title="Edit" />
                        <Trash2 onClick={() => handleDelete(item.id)} size={16} style={{ cursor: 'pointer', color: '#e74a3b', transition: 'color 0.2s' }} title="Delete" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  );
};

export default Products;

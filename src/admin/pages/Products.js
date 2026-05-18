import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import { Plus, Edit, Trash2, X, GripVertical, Image, Download, CheckCircle2 } from 'lucide-react';
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
  // Tag inline editing
  const [tagEditId, setTagEditId] = useState(null);
  const [tagEditName, setTagEditName] = useState('');
  // Addon inline editing
  const [addonEditId, setAddonEditId] = useState(null);
  const [addonEditName, setAddonEditName] = useState('');
  const [addonEditPrice, setAddonEditPrice] = useState('');
  const [addonEditInventoryId, setAddonEditInventoryId] = useState('');
  const [newAddonInventoryId, setNewAddonInventoryId] = useState('');
  const [newInvName, setNewInvName] = useState('');
  const [newInvUnit, setNewInvUnit] = useState('g');
  const [newInvQty, setNewInvQty] = useState('');
  const [newInvThreshold, setNewInvThreshold] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [images, setImages] = useState([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);
  const [notification, setNotification] = useState(null); 

  // Recipe management
  const [allInventory, setAllInventory] = useState([]);
  const [recipeIngredients, setRecipeIngredients] = useState([]);

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

  const fetchInventory = async () => {
    try {
      const res = await axios.get('/api/inventory');
      setAllInventory(res.data || []);
    } catch (err) {
      console.error('Inventory fetch error:', err);
    }
  };

  const fetchRecipe = async (productId) => {
    try {
      const res = await axios.get(`/api/products/${productId}/recipe`);
      setRecipeIngredients(res.data || []);
    } catch (err) {
      console.error('Recipe fetch error:', err);
      setRecipeIngredients([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchImages();
    fetchAddons();
    fetchTags();
    fetchInventory();
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
      // Log the reorder action
      await axios.post('/api/log-action', {
        action: 'Menu Reordered',
        details: 'Administrator updated the product display sequence on the customer menu.'
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
    setFormData({ id: null, name: '', price_num: '', description: '', available: 1, category_id: dbCategories[0]?.id || '', image_url: '', tags: '', addons: '', addon_ids: [], tag_ids: [] });
    setRecipeIngredients([]);
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
      category_id: product.category_id || (dbCategories[0]?.id || ''),
      image_url: product.image_url || '',
      tags: product.tags || '',
      addons: product.addons || '',
      addon_ids: product.linkedAddons ? product.linkedAddons.map(a => parseInt(a.id)) : [],
      tag_ids: product.linkedTags ? product.linkedTags.map(t => parseInt(t.id)) : []
    });
    fetchRecipe(product.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Filter out any legacy or invalid IDs and remove duplicates before sending
      const cleanFormData = {
        ...formData,
        addon_ids: [...new Set((formData.addon_ids || []).filter(id => !String(id).includes('legacy') && !isNaN(parseInt(id))).map(id => parseInt(id)))],
        tag_ids: [...new Set((formData.tag_ids || []).filter(id => !String(id).includes('legacy') && !isNaN(parseInt(id))).map(id => parseInt(id)))]
      };

      let productId = formData.id;
      if (modalMode === 'add') {
        const res = await axios.post('/api/products', cleanFormData);
        productId = res.data.id;
        // Log the creation
        await axios.post('/api/log-action', {
          action: 'Product Created',
          details: `Added new product: ${cleanFormData.name} (${cleanFormData.price_num} JOD)`
        });
        showToast("Product created with precision");
      } else {
        await axios.put(`/api/products/${formData.id}`, cleanFormData);
        // Log the update
        await axios.post('/api/log-action', {
          action: 'Product Updated',
          details: `Modified product: ${cleanFormData.name} (${cleanFormData.price_num} JOD)`
        });
        showToast("Product details refined");
      }

      // Save Recipe
      try {
        await axios.post(`/api/products/${productId}/recipe`, {
          ingredients: recipeIngredients.filter(ing => ing.inventory_id && ing.quantity_required).map(ing => ({
            inventory_id: parseInt(ing.inventory_id),
            quantity_required: parseFloat(ing.quantity_required)
          }))
        });
      } catch (recipeErr) {
        console.error('Recipe save failed:', recipeErr);
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
      setAllTags(prev => [...prev, created].sort((a,b) => (a.name || '').localeCompare(b.name || '')));
      setFormData(prev => ({...prev, tag_ids: [...prev.tag_ids, created.id]}));
      setNewTagName('');
    } catch (err) { showToast('Failed to add tag', 'error'); }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('Delete this tag from the system?')) return;
    try {
      await axios.delete(`/api/tags/${tagId}`);
      setAllTags(prev => prev.filter(t => t.id !== tagId));
      setFormData(prev => ({...prev, tag_ids: prev.tag_ids.filter(id => id !== tagId)}));
      showToast('Tag deleted');
    } catch (err) { showToast('Failed to delete tag', 'error'); }
  };

  const handleSaveTagEdit = async (tagId) => {
    if (!tagEditName.trim()) return;
    try {
      await axios.put(`/api/tags/${tagId}`, { name: tagEditName.trim() });
      setAllTags(prev => prev.map(t => t.id === tagId ? {...t, name: tagEditName.trim()} : t));
      setTagEditId(null);
      setTagEditName('');
      showToast('Tag updated');
    } catch (err) { showToast('Failed to update tag', 'error'); }
  };

  const handleQuickAddAddon = async () => {
    if (!newAddonName.trim()) return;
    try {
      const res = await axios.post('/api/addons', { 
        name: newAddonName.trim(), 
        price: parseFloat(newAddonPrice) || 0
      });
      const created = res.data;
      setAllAddons(prev => [...prev, created].sort((a,b) => (a.name || '').localeCompare(b.name || '')));
      setFormData(prev => ({...prev, addon_ids: [...prev.addon_ids, created.id]}));
      setNewAddonName('');
      setNewAddonPrice('');
    } catch (err) { showToast('Failed to add addon', 'error'); }
  };

  const handleQuickAddInventory = async () => {
    if (!newInvName.trim()) return;
    try {
      const res = await axios.post('/api/inventory', { 
        item_name: newInvName.trim(), 
        unit: newInvUnit,
        quantity: parseFloat(newInvQty) || 0,
        min_threshold: parseInt(newInvThreshold) || 0
      });
      const created = res.data;
      // The API returns the new item, add to list
      setAllInventory(prev => [...prev, created].sort((a,b) => (a.item_name || '').localeCompare(b.item_name || '')));
      // Auto-add one row to the current recipe with this new item
      setRecipeIngredients(prev => [...prev, { inventory_id: created.id, quantity_required: '' }]);
      setNewInvName('');
      setNewInvQty('');
      setNewInvThreshold('');
      showToast(`Added ${created.item_name} to inventory`, 'success');
    } catch (err) { 
      console.error(err);
      showToast('Failed to add inventory item', 'error'); 
    }
  };

  const handleDeleteAddon = async (addonId) => {
    if (!window.confirm('Delete this addon from the system?')) return;
    try {
      await axios.delete(`/api/addons/${addonId}`);
      setAllAddons(prev => prev.filter(a => a.id !== addonId));
      setFormData(prev => ({...prev, addon_ids: prev.addon_ids.filter(id => id !== addonId)}));
      showToast('Addon deleted');
    } catch (err) { showToast('Failed to delete addon', 'error'); }
  };

  const handleSaveAddonEdit = async (addonId) => {
    if (!addonEditName.trim()) return;
    try {
      await axios.put(`/api/addons/${addonId}`, { 
        name: addonEditName.trim(), 
        price: parseFloat(addonEditPrice) || 0
      });
      setAllAddons(prev => prev.map(a => a.id === addonId ? {
        ...a, 
        name: addonEditName.trim(), 
        price: parseFloat(addonEditPrice) || 0
      } : a));
      setAddonEditId(null);
      setAddonEditName('');
      setAddonEditPrice('');
      showToast('Addon updated');
    } catch (err) { showToast('Failed to update addon', 'error'); }
  };


  const exportPDF = async () => {
    try {
      if (products.length === 0) {
        alert("No products available to export.");
        return;
      }
      
      // Log the export action
      await axios.post('/api/log-action', { 
        action: 'Export PDF', 
        details: 'Administrator exported the Menu Products report to PDF.' 
      });

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(45, 41, 38);
      doc.text('CaffAIne - Product Inventory', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Amman' })}`, 14, 32);
      doc.text('Complete list of menu items, pricing, and availability.', 14, 38);
      
      // Table
      const tableColumn = ["ID", "Product Name", "Category", "Price", "Status"];
      const tableRows = products.map((item, index) => [
        `PRD-${String(index + 1).padStart(3, '0')}`,
        item.name || 'Unnamed',
        dbCategories.find(c => String(c.id) === String(item.category_id))?.name || dbCategories.find(c => String(c.id) === String(item.category_id))?.label || item.category_id || 'N/A',
        item.discounted_price 
          ? `${parseFloat(item.discounted_price).toFixed(2)} JOD (Off: ${parseFloat(item.price_num).toFixed(2)} JOD)`
          : `${parseFloat(item.price_num || 0).toFixed(2)} JOD`,
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

      doc.save(`CaffAIne_Products_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Error generating PDF: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`/api/products/${id}`);
        // Log the deletion
        await axios.post('/api/log-action', {
          action: 'Product Deleted',
          details: `Deleted product ID: ${id}`
        });
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
      padding: '40px 10px 40px 5px', // Shifting left significantly
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Premium Background Elements */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 50% -20%, #2a1b10 0%, #070504 70%)`, zIndex: 0 }} />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <style>{`
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); z-index: 0; opacity: 0.05; animation: float 25s infinite alternate ease-in-out; }
        .orb-1 { width: 600px; height: 600px; background: ${colors.crema}; top: -200px; right: -100px; }
        .orb-2 { width: 500px; height: 500px; background: #2a1b10; bottom: -100px; left: -100px; }
        @keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(50px, 50px) scale(1.1); } }
        .page-badge { background: #1b130e; border: 1px solid ${colors.border}; padding: 12px 25px; border-radius: 18px; display: inline-flex; align-items: center; gap: 12px; margin: 20px 0; }
        .page-badge span { font-family: 'Inter', sans-serif; font-size: 2rem; font-weight: 900; color: #fff; letter-spacing: -0.5px; }

        /* Premium Row Hover Animation */
        .premium-row {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }
        .premium-row:hover {
          background-color: rgba(196, 164, 132, 0.08) !important;
          transform: translateY(-2px) scale(1.002);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          position: relative;
          z-index: 10;
        }

        /* Mobile View: Hide Table, Show Cards */
        .mobile-cards { display: none; }
        @media screen and (max-width: 1024px) {
          .desktop-table { display: none !important; }
          .mobile-cards { display: grid !important; }
        }
        
        .product-mobile-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid ${colors.border};
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        @media (max-width: 768px) {
          .products-header { flex-direction: column !important; gap: 20px !important; }
          .header-title { font-size: 2rem !important; }
          .page-badge span { font-size: 1.5rem !important; }
          .header-btns { width: 100% !important; flex-direction: column !important; }
          .header-btns > div { width: 100% !important; flex-direction: column !important; }
          .header-btns button { width: 100% !important; justify-content: center !important; }
          .product-modal { padding: 25px !important; width: 95% !important; border-radius: 20px !important; }
          .modal-grid-2 { flex-direction: column !important; gap: 15px !important; }
        }
      `}</style>
      {/* Elegant Notification Toast */}
      {notification && (
        <div className={`premium-toast ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
          {notification.message}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div className="product-modal" style={{ backgroundColor: colors.bean, width: '100%', maxWidth: '700px', borderRadius: '30px', border: `1px solid ${colors.border}`, padding: '40px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflowY: 'auto', maxHeight: '90vh' }}>
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
                      <img 
                        src={formData.image_url.startsWith('/images/') || formData.image_url.startsWith('http') ? formData.image_url : `/images/${formData.image_url}`} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={e => { e.target.onerror = null; e.target.src = '/images/coffee-beans.png'; }} 
                      /> 
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

              <div className="modal-grid-2" style={{ display: 'flex', gap: '20px' }}>
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
                  <label style={labelStyle}>Price (JOD)</label>
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
                  value={formData.description || ''} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Tell us about this product..."
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div className="modal-grid-2" style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Product Category</label>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    {dbCategories.map(cat => {
                      const isSelected = String(formData.category_id) === String(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFormData(prev => ({...prev, category_id: cat.id}))}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '12px',
                            border: isSelected ? `2px solid ${colors.crema}` : `1px solid ${colors.border}`,
                            backgroundColor: isSelected ? 'rgba(196, 164, 132, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            color: isSelected ? colors.crema : colors.latte,
                            cursor: 'pointer',
                            fontWeight: isSelected ? '700' : '400',
                            transition: '0.2s',
                            fontSize: '0.85rem'
                          }}
                        >
                          {cat.name || cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Availability</label>
                  <select 
                    value={formData.available} 
                    onChange={(e) => setFormData({...formData, available: parseInt(e.target.value)})}
                    style={inputStyle}
                  >
                    <option value={1} style={{ backgroundColor: colors.espresso }}>Available (Live)</option>
                    <option value={0} style={{ backgroundColor: colors.espresso }}>Unavailable (Hidden)</option>
                  </select>

                  <div style={{ marginTop: '20px', padding: '15px', borderRadius: '15px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.border}` }}>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '5px' }}>Quick Tip:</div>
                    <div style={{ fontSize: '0.8rem', color: colors.latte, lineHeight: '1.4' }}>
                      Categories define where the product appears on the customer menu. Tags help with filtering and search.
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-grid-2" style={{ display: 'flex', gap: '25px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Category Tags</label>

                  {/* Selected tags as removable pills */}
                  {formData.tag_ids.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', padding: '10px', background: 'rgba(196,164,132,0.05)', borderRadius: '12px', border: '1px solid rgba(196,164,132,0.15)' }}>
                      {formData.tag_ids.map((tid, idx) => {
                        const tag = allTags.find(t => t.id === tid);
                        if (!tag) return null;
                        return (
                          <span key={`tag-${tid}-${idx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: 'linear-gradient(135deg, #c7a57a, #a47c4f)', color: '#1a0e05', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            {tag.name}
                            <button type="button" onClick={() => setFormData(prev => ({...prev, tag_ids: prev.tag_ids.filter((_, i) => i !== idx)}))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#1a0e05', fontSize: '1rem', lineHeight: 1 }}>×</button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* All tags with inline edit/delete */}
                  <div style={{ padding: '6px', backgroundColor: colors.input, borderRadius: '14px', border: `1px solid ${colors.border}`, maxHeight: '155px', overflowY: 'auto' }}>
                    {allTags.map(tag => {
                      const isSelected = formData.tag_ids.includes(tag.id);
                      const isEditing = tagEditId === tag.id;
                      return (
                        <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 6px', borderRadius: '8px', marginBottom: '2px', background: isSelected ? 'rgba(196,164,132,0.1)' : 'transparent', transition: '0.2s' }}>
                          <input type="checkbox" checked={isSelected}
                            onChange={e => {
                              const newIds = e.target.checked ? [...formData.tag_ids, tag.id] : formData.tag_ids.filter(id => id !== tag.id);
                              setFormData(prev => ({...prev, tag_ids: newIds}));
                            }}
                            style={{ accentColor: colors.crema, width: '14px', height: '14px', flexShrink: 0, cursor: 'pointer' }}
                          />
                          {isEditing ? (
                            <input value={tagEditName} onChange={e => setTagEditName(e.target.value)}
                              onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();handleSaveTagEdit(tag.id);} if(e.key==='Escape') setTagEditId(null); }}
                              autoFocus
                              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.crema}`, borderRadius: '6px', color: colors.latte, padding: '2px 8px', fontSize: '0.8rem', outline: 'none' }}
                            />
                          ) : (
                            <span style={{ flex: 1, fontSize: '0.82rem', color: isSelected ? colors.crema : colors.latte }}>{tag.name}</span>
                          )}
                          {isEditing ? (
                            <button type="button" onClick={() => handleSaveTagEdit(tag.id)} style={{ background: 'rgba(56,239,125,0.15)', border: '1px solid rgba(56,239,125,0.3)', borderRadius: '6px', color: '#38ef7d', cursor: 'pointer', padding: '2px 8px', fontSize: '0.72rem', fontWeight: '700' }}>✓</button>
                          ) : (
                            <button type="button" onClick={() => { setTagEditId(tag.id); setTagEditName(tag.name); }} style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', padding: '2px 5px', fontSize: '0.75rem', flexShrink: 0 }} title="Rename tag">✏️</button>
                          )}
                          <button type="button" onClick={() => handleDeleteTag(tag.id)} style={{ background: 'none', border: 'none', color: 'rgba(231,74,59,0.5)', cursor: 'pointer', padding: '2px 5px', fontSize: '0.75rem', flexShrink: 0 }} title="Delete tag">✕</button>
                        </div>
                      );
                    })}
                    {allTags.length === 0 && <div style={{ color: '#555', fontSize: '0.8rem', padding: '12px', textAlign: 'center' }}>No tags yet. Add one below.</div>}
                  </div>

                  {/* Quick add with Enter support */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
                    <input type="text" value={newTagName} onChange={e => setNewTagName(e.target.value)}
                      onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleQuickAddTag(); }}}
                      placeholder="New tag..." style={{...inputStyle, width: '0', flex: 1, padding: '10px', fontSize: '0.85rem'}} />
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickAddTag(); }} style={{backgroundColor: colors.crema, color: colors.espresso, border: 'none', borderRadius: '10px', width: '42px', height: '42px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0, fontSize: '1.2rem'}}>+</button>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Available Add-ons</label>
                  
                  {/* Selected addons as removable pills */}
                  {formData.addon_ids.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', padding: '10px', background: 'rgba(196,164,132,0.05)', borderRadius: '12px', border: '1px solid rgba(196,164,132,0.15)' }}>
                      {formData.addon_ids.map((aid, idx) => {
                        const addon = allAddons.find(a => a.id === aid);
                        if (!addon) return null;
                        return (
                          <span key={`addon-${aid}-${idx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(196,164,132,0.1)', border: '1px solid rgba(196,164,132,0.3)', color: colors.crema, fontSize: '0.72rem', fontWeight: '700' }}>
                            {addon.name} ({addon.price} JOD)
                            <button type="button" onClick={() => setFormData(prev => ({...prev, addon_ids: prev.addon_ids.filter((_, i) => i !== idx)}))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: colors.crema, fontSize: '1rem', lineHeight: 1, marginLeft: '2px' }}>×</button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* All addons with inline edit/delete */}
                  <div style={{ padding: '6px', backgroundColor: colors.input, borderRadius: '14px', border: `1px solid ${colors.border}`, maxHeight: '155px', overflowY: 'auto' }}>
                    {allAddons.map(addon => {
                      const isSelected = formData.addon_ids.includes(addon.id);
                      const isEditing = addonEditId === addon.id;
                      return (
                        <div key={addon.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 6px', borderRadius: '8px', marginBottom: '2px', background: isSelected ? 'rgba(196,164,132,0.1)' : 'transparent', transition: '0.2s' }}>
                          <input type="checkbox" checked={isSelected}
                            onChange={e => {
                              const newIds = e.target.checked ? [...formData.addon_ids, addon.id] : formData.addon_ids.filter(id => id !== addon.id);
                              setFormData(prev => ({...prev, addon_ids: newIds}));
                            }}
                            style={{ accentColor: colors.crema, width: '14px', height: '14px', flexShrink: 0, cursor: 'pointer' }}
                          />
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                              <input value={addonEditName} onChange={e => setAddonEditName(e.target.value)}
                                placeholder="Name"
                                style={{ flex: 2, background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.crema}`, borderRadius: '6px', color: colors.latte, padding: '2px 6px', fontSize: '0.75rem', outline: 'none' }}
                              />
                              <input value={addonEditPrice} onChange={e => setAddonEditPrice(e.target.value)}
                                placeholder="JOD"
                                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.crema}`, borderRadius: '6px', color: colors.latte, padding: '2px 6px', fontSize: '0.75rem', outline: 'none' }}
                              />
                            </div>
                          ) : (
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: isSelected ? colors.crema : colors.latte }}>
                              <span>{addon.name}</span>
                              <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>{addon.price} JOD</span>
                            </div>
                          )}
                          {isEditing ? (
                            <button type="button" onClick={() => handleSaveAddonEdit(addon.id)} style={{ background: 'rgba(56,239,125,0.15)', border: '1px solid rgba(56,239,125,0.3)', borderRadius: '6px', color: '#38ef7d', cursor: 'pointer', padding: '2px 8px', fontSize: '0.72rem', fontWeight: '700' }}>✓</button>
                          ) : (
                            <button type="button" onClick={() => { 
                              setAddonEditId(addon.id); 
                              setAddonEditName(addon.name); 
                              setAddonEditPrice(addon.price); 
                              setAddonEditInventoryId(addon.inventory_id || '');
                            }} style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', padding: '2px 5px', fontSize: '0.75rem', flexShrink: 0 }} title="Edit addon">✏️</button>
                          )}
                          <button type="button" onClick={() => handleDeleteAddon(addon.id)} style={{ background: 'none', border: 'none', color: 'rgba(231,74,59,0.5)', cursor: 'pointer', padding: '2px 5px', fontSize: '0.75rem', flexShrink: 0 }} title="Delete addon">✕</button>
                        </div>
                      );
                    })}
                    {allAddons.length === 0 && <div style={{ color: '#555', fontSize: '0.8rem', padding: '12px', textAlign: 'center' }}>No addons yet.</div>}
                  </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                      <input type="text" value={newAddonName} onChange={e => setNewAddonName(e.target.value)}
                        onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleQuickAddAddon(); }}}
                        placeholder="Name" style={{...inputStyle, width: '100px', flex: '2', padding: '10px', fontSize: '0.82rem'}} />
                      <input type="text" value={newAddonPrice} onChange={e => setNewAddonPrice(e.target.value)}
                        onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleQuickAddAddon(); }}}
                        placeholder="JOD" style={{...inputStyle, width: '50px', flex: '1', padding: '10px', fontSize: '0.82rem'}} />
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickAddAddon(); }} style={{backgroundColor: colors.crema, color: colors.espresso, border: 'none', borderRadius: '10px', width: '42px', height: '42px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0, fontSize: '1.2rem'}}>+</button>
                    </div>
                  </div>
                </div>

              {/* NEW: Recipe / Ingredients Section */}
              <div style={{ padding: '20px', backgroundColor: 'rgba(196,164,132,0.05)', borderRadius: '20px', border: `1px solid ${colors.border}`, marginTop: '10px' }}>
                <label style={{ ...labelStyle, marginBottom: '15px', color: colors.crema, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GripVertical size={16} /> Recipe &amp; Ingredients Mapping
                </label>
                
                {/* Existing ingredients list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                  {recipeIngredients.map((ing, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <select 
                        value={ing.inventory_id} 
                        onChange={(e) => {
                          const newIngs = [...recipeIngredients];
                          newIngs[idx].inventory_id = e.target.value;
                          setRecipeIngredients(newIngs);
                        }}
                        style={{ ...inputStyle, flex: 2, padding: '10px' }}
                      >
                        <option value="">Select Ingredient...</option>
                        {allInventory.map(inv => (
                          <option key={inv.id} value={inv.id}>{inv.item_name} ({inv.unit})</option>
                        ))}
                      </select>
                      <input 
                        type="number" step="0.01"
                        value={ing.quantity_required}
                        onChange={(e) => {
                          const newIngs = [...recipeIngredients];
                          newIngs[idx].quantity_required = e.target.value;
                          setRecipeIngredients(newIngs);
                        }}
                        placeholder="Qty used"
                        style={{ ...inputStyle, flex: 1, padding: '10px' }}
                      />
                      <button type="button" onClick={() => setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#e74a3b', cursor: 'pointer' }}><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
                
                <button 
                  type="button" 
                  onClick={() => setRecipeIngredients([...recipeIngredients, { inventory_id: '', quantity_required: '' }])}
                  style={{ background: 'rgba(196,164,132,0.1)', border: `1px dashed ${colors.crema}`, color: colors.crema, padding: '10px', borderRadius: '10px', width: '100%', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '15px' }}
                >
                  + Add Ingredient to Recipe
                </button>

                {/* Add New Raw Material */}
                <details style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '15px' }}>
                  <summary style={{ cursor: 'pointer', color: '#aaa', fontSize: '0.82rem', fontWeight: '600', userSelect: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1rem' }}>➕</span> Create New Raw Material (if not in list above)
                  </summary>
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input type="text" value={newInvName} onChange={e => setNewInvName(e.target.value)}
                      placeholder="Material name (e.g. Espresso Beans)"
                      style={{ ...inputStyle, padding: '10px', fontSize: '0.85rem' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="number" value={newInvQty} onChange={e => setNewInvQty(e.target.value)}
                        placeholder="Initial Qty"
                        style={{ ...inputStyle, flex: 1, padding: '10px', fontSize: '0.85rem' }} />
                      <input type="number" value={newInvThreshold} onChange={e => setNewInvThreshold(e.target.value)}
                        placeholder="Low Stock Alert"
                        style={{ ...inputStyle, flex: 1, padding: '10px', fontSize: '0.85rem' }} title="Low stock alert threshold" />
                      <select
                        value={['g','ml','pcs'].includes(newInvUnit) || newInvUnit === '' ? newInvUnit : '__custom__'}
                        onChange={e => {
                          if (e.target.value === '__custom__') setNewInvUnit('');
                          else setNewInvUnit(e.target.value);
                        }}
                        style={{ ...inputStyle, flex: 1, padding: '10px', fontSize: '0.85rem' }}>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="pcs">pcs</option>
                        <option value="__custom__">Other...</option>
                      </select>
                      {!['g','ml','pcs'].includes(newInvUnit) && (
                        <input type="text" value={newInvUnit}
                          onChange={e => setNewInvUnit(e.target.value)}
                          placeholder="e.g. kg, L, cup..."
                          style={{ ...inputStyle, flex: 1, padding: '10px', fontSize: '0.85rem' }}
                          autoFocus
                        />
                      )}
                    </div>
                    <button type="button" onClick={handleQuickAddInventory}
                      style={{ backgroundColor: colors.crema, color: colors.espresso, border: 'none', borderRadius: '10px', padding: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      ➕ Add to Inventory
                    </button>
                  </div>
                </details>
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
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {/* Upload from Device Button */}
                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                    padding: '10px 18px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600',
                    backgroundColor: uploadLoading ? '#555' : colors.latte,
                    color: colors.bean, border: 'none', transition: '0.2s'
                  }}>
                    {uploadLoading ? '⏳ Uploading...' : '📁 Upload from Device'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      disabled={uploadLoading}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setUploadLoading(true);
                        const fd = new FormData();
                        fd.append('image', file);
                        try {
                          const res = await axios.post('/api/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                          const newFilename = res.data.filename;
                          await fetchImages(); // refresh grid
                          setFormData(prev => ({ ...prev, image_url: newFilename }));
                          setShowImagePicker(false);
                        } catch (err) {
                          alert('Upload failed: ' + (err.response?.data?.error || err.message));
                        } finally {
                          setUploadLoading(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                  <button onClick={() => setShowImagePicker(false)} style={{ background: 'none', border: 'none', color: colors.latte, cursor: 'pointer', padding: '5px' }}><X size={28} /></button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
                {images.map(img => {
                  const imgSrc = `/images/${img}`;
                  
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
                            if (!e.target.dataset.retried) {
                               e.target.dataset.retried = 'true';
                               e.target.src = `http://127.0.0.1:5000/images/${img}`; // Fallback direct to server if proxy misses the static folder
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

      <div className="products-header" style={{ 
        position: 'relative',
        zIndex: 1,
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '40px'
      }}>
        <div>
          <div className="header-title" style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.8rem', color: colors.crema, lineHeight: 1 }}>
            CaffAIne <span style={{ color: '#fff', fontStyle: 'italic' }}>Coffee.</span>
          </div>

          <div className="page-badge">
            <BsGrid3X3 size={28} color={colors.crema} />
            <span>Product Catalog</span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: 500, marginTop: '5px' }}>
            CaffAIne | Menu Items & Product Configuration
          </p>
        </div>
        <div className="header-btns" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
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
        position: 'relative',
        zIndex: 1,
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
        ) : (
          <>
            {/* Desktop View Table */}
            <div className="desktop-table" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', color: colors.latte, textAlign: 'left', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '140px' }} />
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
                  <tr key={item.id} className="product-row premium-row"
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
                        <span style={{ display: 'inline-block', whiteSpace: 'nowrap', padding: '6px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #c7a57a 0%, #a47c4f 100%)', color: colors.espresso, fontWeight: 900, letterSpacing: '1px', boxShadow: '0 4px 10px rgba(196, 164, 132, 0.3)' }}>
                          PRD-{String(index + 1).padStart(3, '0')}
                        </span>
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
                            src={item.image_url ? (item.image_url.startsWith('/images/') || item.image_url.startsWith('http') ? item.image_url : `/images/${item.image_url.toLowerCase()}`) : '/images/coffee-beans.png'}
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
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ 
                          textDecoration: item.discounted_price ? 'line-through' : 'none', 
                          opacity: item.discounted_price ? 0.5 : 1,
                          fontSize: item.discounted_price ? '0.8rem' : '0.95rem',
                          color: item.discounted_price ? colors.latte : colors.crema
                        }}>
                          {parseFloat(item.price_num || 0).toFixed(2)} JOD
                        </span>
                        {item.discounted_price && (
                          <span style={{ color: '#38ef7d', fontSize: '1rem', textShadow: '0 0 10px rgba(56, 239, 125, 0.2)' }}>
                            {parseFloat(item.discounted_price).toFixed(2)} JOD
                          </span>
                        )}
                      </div>
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
                            fontSize: '0.6rem', 
                            color: '#120a05', 
                            background: 'linear-gradient(135deg, #c7a57a 0%, #e0d0b8 100%)', 
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            fontWeight: '700', 
                            textTransform: 'uppercase'
                          }}>
                            {tag.trim()}
                          </span>
                        )) : <span style={{ color: '#444', fontSize: '0.7rem', fontStyle: 'italic' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {item.linkedAddons && item.linkedAddons.length > 0 ? item.linkedAddons.slice(0, 3).map((addon, i) => (
                          <span key={i} style={{ 
                            fontSize: '0.65rem', color: colors.crema, opacity: 0.7,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            + {addon.name}
                          </span>
                        )) : item.addons ? item.addons.split(',').slice(0, 3).map((addon, i) => (
                          <span key={i} style={{ 
                            fontSize: '0.65rem', color: colors.crema, opacity: 0.7,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            + {addon.trim()}
                          </span>
                        )) : <span style={{ color: '#444', fontSize: '0.7rem', fontStyle: 'italic' }}>—</span>}
                        {item.linkedAddons && item.linkedAddons.length > 3 ? (
                          <span style={{ fontSize: '0.6rem', color: colors.gold, opacity: 0.5 }}>+{item.linkedAddons.length - 3} more</span>
                        ) : item.addons && item.addons.split(',').length > 3 && (
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

            {/* Mobile View Cards */}
            <div className="mobile-cards">
              {products.map((item, index) => (
                <div key={item.id} className="product-mobile-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '8px', background: 'linear-gradient(135deg, #c7a57a 0%, #a47c4f 100%)', color: colors.espresso, fontWeight: 900, fontSize: '0.7rem' }}>
                      PRD-{String(index + 1).padStart(3, '0')}
                    </span>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <Edit onClick={() => openEditModal(item)} size={18} style={{ cursor: 'pointer', color: colors.crema }} />
                      <Trash2 onClick={() => handleDelete(item.id)} size={18} style={{ cursor: 'pointer', color: '#e74a3b' }} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '15px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                      <img 
                        src={item.image_url ? (item.image_url.startsWith('/images/') || item.image_url.startsWith('http') ? item.image_url : `/images/${item.image_url.toLowerCase()}`) : '/images/coffee-beans.png'}
                        alt={item.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.target.onerror = null; e.target.src = '/images/coffee-beans.png'; }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: '#fff', margin: '0 0 5px 0', fontSize: '1.1rem' }}>{item.name}</h4>
                      <div style={{ color: colors.crema, fontSize: '0.85rem', fontWeight: '700' }}>
                        {item.discounted_price ? (
                          <>
                            <span style={{ textDecoration: 'line-through', opacity: 0.5, marginRight: '8px' }}>{parseFloat(item.price_num).toFixed(2)} JOD</span>
                            <span style={{ color: '#38ef7d' }}>{parseFloat(item.discounted_price).toFixed(2)} JOD</span>
                          </>
                        ) : `${parseFloat(item.price_num || 0).toFixed(2)} JOD`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '5px' }}>
                        {dbCategories.find(c => String(c.id) === String(item.category_id))?.name || 'Uncategorized'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: `1px solid rgba(255,255,255,0.05)` }}>
                    <span style={{ 
                      backgroundColor: item.available === 0 ? 'rgba(231, 74, 59, 0.1)' : 'rgba(40, 167, 69, 0.1)', 
                      color: item.available === 0 ? '#e74a3b' : '#28a745',
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '700'
                    }}>
                      {item.available === 0 ? 'OUT OF STOCK' : 'AVAILABLE'}
                    </span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                       {item.linkedTags?.slice(0,2).map((t, i) => (
                         <span key={i} style={{ fontSize: '0.6rem', color: '#c7a57a', border: '1px solid #c7a57a', padding: '2px 6px', borderRadius: '5px' }}>{t.name}</span>
                       ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Products;

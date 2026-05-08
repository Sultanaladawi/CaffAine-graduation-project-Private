import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Coffee } from 'lucide-react';
import './styles/global.css';

import { CartProvider }   from './context/CartContext';
import { StoreProvider, useStore } from './context/StoreContext';
import Navbar             from './components/Navbar';
import Hero               from './components/Hero';
import Menu               from './components/Menu';
import Gallery            from './components/Gallery';
import About              from './components/About';
import Careers            from './components/Careers';
import Contact            from './components/Contact';
import Footer             from './components/Footer';
import Chatbot            from './components/Chatbot';
import Cart               from './components/Cart';
import Checkout           from './components/Checkout';
import LoadingScreen      from './components/LoadingScreen';

import { AdminProvider }  from './admin/AdminContext';
import AdminRoute         from './admin/AdminRoute';
import AdminLogin         from './admin/AdminLogin';
import AdminLayout        from './admin/AdminLayout';
import Dashboard          from './admin/pages/Dashboard';
import Orders             from './admin/pages/Orders';
import Products           from './admin/pages/Products';
import Analytics          from './admin/pages/Analytics';
import Inventory          from './admin/pages/Inventory';
import Offers             from './admin/pages/Offers';
import AIAssistant        from './admin/pages/AIAssistant';
import Applications       from './admin/pages/Applications';
import Jobs               from './admin/pages/Jobs';
import Feedback           from './admin/pages/Feedback';
import Messages           from './admin/pages/Messages';
import LeaderDashboard    from './admin/pages/LeaderDashboard';

let LenisClass = null;
try { LenisClass = require('@studio-freight/lenis').default; } catch (_) {}

function PublicSite() {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const { isStoreOpen } = useStore();

  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (!LenisClass) return;
    const lenis = new LenisClass({ 
      duration: 1.25, 
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      smoothWheel: true, 
      wheelMultiplier: 0.9 
    });
    
    function raf(time) { 
      lenis.raf(time); 
      requestAnimationFrame(raf); 
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div className="public-site-wrapper" style={{ minHeight: '100vh' }}>
      <LoadingScreen onComplete={() => setLoaded(true)} />
      
      <div id="scroll-progress" />
      <div id="cursor-dot" ref={dotRef} />
      <div id="cursor-ring" ref={ringRef} />
      
      <Navbar onCartOpen={() => { setCartOpen(true); setCheckoutOpen(false); }} />
      
      <main>
        <Hero />
        <Menu />
        <Gallery />
        <About />
        <Careers />
        <Contact />
      </main>

      <Footer />
      <Chatbot />

      {cartOpen && (
        <Cart 
          onClose={() => setCartOpen(false)} 
          onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} 
        />
      )}
      {checkoutOpen && (
        <Checkout 
          onClose={() => { setCartOpen(false); setCheckoutOpen(false); }} 
          onBack={() => { setCheckoutOpen(false); setCartOpen(true); }} 
        />
      )}

      {/* Global Closed Overlay */}
      {!isStoreOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(10, 6, 4, 0.96)',
          backdropFilter: 'blur(15px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ffffff', textAlign: 'center', padding: '30px'
        }}>
          <div style={{ maxWidth: '500px' }}>
            <div style={{ color: '#c4a484', marginBottom: '25px', opacity: 1 }}>
              <Coffee size={80} strokeWidth={1} />
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '3rem', marginBottom: '15px', letterSpacing: '1px' }}>
              Resting & Roasting
            </h2>
            <p style={{ fontSize: '1.2rem', lineHeight: '1.7', opacity: 0.95, marginBottom: '40px', fontWeight: '300' }}>
              We're currently enjoying our coffee break. Our doors are closed, but we'll be back soon with fresh brews and warm welcomes.
            </p>
            <div style={{ 
              padding: '25px', border: '1px solid rgba(196, 164, 132, 0.4)', 
              borderRadius: '20px', backgroundColor: 'rgba(196, 164, 132, 0.08)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <p style={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '3px', marginBottom: '15px', color: '#c4a484' }}>
                Opening Hours
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '1rem' }}>
                <p style={{ margin: 0 }}>Mon–Fri: 07:30 – 17:00</p>
                <p style={{ margin: 0 }}>Saturday: 09:00 – 18:00</p>
                <p style={{ margin: 0 }}>Sunday: 10:00 – 16:00</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AdminProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<PublicSite />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard"    element={<Dashboard />} />
                <Route path="orders"       element={<Orders />} />
                <Route path="products"     element={<Products />} />
                <Route path="analytics"    element={<Analytics />} />
                <Route path="inventory"    element={<Inventory />} />
                <Route path="offers"       element={<Offers />} />
                <Route path="applications" element={<Applications />} />
                <Route path="jobs"         element={<Jobs />} />
                <Route path="messages"     element={<Messages />} />
                <Route path="feedback"     element={<Feedback />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="leader"       element={<LeaderDashboard />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </AdminProvider>
      </StoreProvider>
    </BrowserRouter>
  );
}
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminContext } from './AdminContext';

export default function AdminRoute({ children }) {
  const { admin, loading } = useAdminContext();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#120a05', 
        color: '#c9a96e',      
        fontFamily: 'inherit'
      }}>
        <div className="spinner" style={{ 
          border: '3px solid rgba(201, 169, 110, 0.1)', 
          borderTop: '3px solid #c9a96e', 
          borderRadius: '50%', 
          width: '32px', 
          height: '32px', 
          animation: 'spin 0.8s linear infinite',
          marginBottom: '20px'
        }}></div>
        <p style={{ 
          letterSpacing: '2px', 
          fontSize: '0.75rem', 
          fontWeight: '600',
          opacity: 0.8 
        }}>
          VERIFYING PERMISSIONS
        </p>
        
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
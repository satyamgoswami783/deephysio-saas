import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');
  const role = sessionStorage.getItem('deephysio_role');

  // Strict check: both token and role must exist and not be invalid strings
  const isAuthenticated = token && token !== 'null' && token !== 'undefined' && 
                          role && role !== 'null' && role !== 'undefined';

  if (!isAuthenticated) {
    // Clear any partial/stale data to ensure a clean redirect to login
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('deephysio_role');
    sessionStorage.removeItem('deephysio_user');
    
    return <Navigate to="/login" replace />;
  }


  return children;
};

export default ProtectedRoute;


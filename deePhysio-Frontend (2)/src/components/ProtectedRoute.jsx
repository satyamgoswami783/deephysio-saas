import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Read from sessionStorage with fallback to localStorage for PWA continuity
  let token = sessionStorage.getItem('token');
  let role = sessionStorage.getItem('deephysio_role');

  if (!token || token === 'null' || token === 'undefined') {
    const localToken = localStorage.getItem('token');
    if (localToken && localToken !== 'null' && localToken !== 'undefined') {
      token = localToken;
      sessionStorage.setItem('token', localToken);
    }
  }

  if (!role || role === 'null' || role === 'undefined') {
    const localRole = localStorage.getItem('deephysio_role');
    if (localRole && localRole !== 'null' && localRole !== 'undefined') {
      role = localRole;
      sessionStorage.setItem('deephysio_role', localRole);
    }
  }

  // Hydrate user profile into sessionStorage if missing
  if (!sessionStorage.getItem('deephysio_user')) {
    const localUser = localStorage.getItem('deephysio_user');
    if (localUser && localUser !== 'null' && localUser !== 'undefined') {
      sessionStorage.setItem('deephysio_user', localUser);
    }
  }

  // Strict check: both token and role must exist and not be invalid strings
  const isAuthenticated = Boolean(
    token && token !== 'null' && token !== 'undefined' && 
    role && role !== 'null' && role !== 'undefined'
  );

  if (!isAuthenticated) {
    // Clear any partial/stale data to ensure a clean redirect to login
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('deephysio_role');
    sessionStorage.removeItem('deephysio_user');
    localStorage.removeItem('token');
    localStorage.removeItem('deephysio_role');
    localStorage.removeItem('deephysio_user');
    
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;


import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';

/**
 * Wraps a route and redirects unauthenticated users to the home page,
 * opening the login popup via the `openLogin` query parameter.
 */
const ProtectedRoute = ({ children }) => {
  const { token } = useContext(StoreContext);
  const location = useLocation();

  if (!token) {
    // Redirect to home and signal the login popup to open
    return <Navigate to="/?login=1" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

// Global API configuration
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://api-saas.clinicpilotdemo.store/api'
).replace(/\/$/, '');

/**
 * Get active auth token from session or persistent local storage
 */
export const getAuthToken = () => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

/**
 * Get standard auth headers with Bearer token
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  const isValidToken = token && token !== 'null' && token !== 'undefined';

  return {
    "Content-Type": "application/json",
    ...(isValidToken ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const clearAllTenantState = () => {
  sessionStorage.clear();
  const keysToPreserve = ['deephysio_language', 'deephysio_locale'];
  try {
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    }
  } catch (_) {}
};

/**
 * Global fetch wrapper with 401 interception
 */
export const fetchApi = async (url, options = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };
  if (isFormData) {
    delete headers['Content-Type'];
  }

  const executeFetch = async (targetUrl) => {
    return await fetch(targetUrl, {
      ...options,
      headers
    });
  };

  try {
    let response;
    try {
      response = await executeFetch(fullUrl);
    } catch (netErr) {
      // Automatic fallback between localhost and 127.0.0.1 to avoid Windows IPv6/IPv4 refusal
      if (fullUrl.includes('localhost:5000')) {
        const altUrl = fullUrl.replace('localhost:5000', '127.0.0.1:5000');
        response = await executeFetch(altUrl);
      } else if (fullUrl.includes('127.0.0.1:5000')) {
        const altUrl = fullUrl.replace('127.0.0.1:5000', 'localhost:5000');
        response = await executeFetch(altUrl);
      } else {
        throw netErr;
      }
    }

    if (response.status === 401 && !url.includes('auth/login')) {
      // Token expired or invalid -> log out and clear session fully
      clearAllTenantState();

      // Avoid redirect loop by checking if we're not already on login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return null; // Return null to prevent further execution in components
    }

    return response;
  } catch (error) {
    console.error("Global API Error:", error);
    throw error;
  }
};

export default API_BASE_URL;

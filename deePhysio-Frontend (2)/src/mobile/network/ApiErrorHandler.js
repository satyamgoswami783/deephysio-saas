/**
 * Centralized API & Network Error Parser
 * Replaces console errors and technical traces with clean user-friendly messages.
 */

export const parseApiError = (error, response = null) => {
  if (!navigator.onLine) {
    return {
      type: 'OFFLINE',
      title: 'Connection Lost',
      message: 'Your device is offline. Please check your internet connection.',
      canRetry: true
    };
  }

  if (response) {
    switch (response.status) {
      case 401:
        return {
          type: 'UNAUTHORIZED',
          title: 'Session Expired',
          message: 'Your login session has expired. Please log in again to continue.',
          canRetry: false,
          requiresLogin: true
        };
      case 403:
        return {
          type: 'FORBIDDEN',
          title: 'Access Restricted',
          message: 'You do not have permission to perform this clinical action.',
          canRetry: false
        };
      case 404:
        return {
          type: 'NOT_FOUND',
          title: 'Record Not Found',
          message: 'The requested medical record or page could not be located.',
          canRetry: false
        };
      case 500:
        return {
          type: 'SERVER_ERROR',
          title: 'Server Error',
          message: 'Our clinical server encountered an unexpected condition. Please try again shortly.',
          canRetry: true
        };
      case 502:
      case 503:
      case 504:
        return {
          type: 'SERVICE_UNAVAILABLE',
          title: 'Server Temporarily Unavailable',
          message: 'The healthcare server is currently restarting or under maintenance. Please try again in a few moments.',
          canRetry: true
        };
      default:
        break;
    }
  }

  const errorString = String(error?.message || error || '').toLowerCase();

  if (errorString.includes('timeout') || errorString.includes('abort')) {
    return {
      type: 'TIMEOUT',
      title: 'Request Timed Out',
      message: 'The server took too long to respond. Please check your connection and retry.',
      canRetry: true
    };
  }

  if (errorString.includes('failed to fetch') || errorString.includes('networkerror')) {
    return {
      type: 'NETWORK_FAILURE',
      title: 'Network Communication Error',
      message: 'Could not reach the clinical API server. Please check your WiFi or mobile data.',
      canRetry: true
    };
  }

  return {
    type: 'GENERIC',
    title: 'Operation Failed',
    message: error?.message || 'An unexpected error occurred. Please try again.',
    canRetry: true
  };
};

export default parseApiError;

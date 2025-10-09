/**
 * Configuration utility for environment variables
 */

// Get the server URL from environment variable, with fallback to localhost
export const getServerUrl = () => {
    return import.meta.env.VITE_SERVER_URL || 'http://20.193.253.139:5000';
};

// For cases where we need the API base URL specifically
export const getApiBaseUrl = () => {
    return `${getServerUrl()}/api`;
};

// Get the email URL from environment variable, with fallback to localhost
export const getEmailUrl = () => {
    return import.meta.env.VITE_EMAIL_URL || 'http://20.193.253.139:5001';
};

// Default server URL constant
export const SERVER_URL = getServerUrl();
export const API_BASE_URL = getApiBaseUrl();
export const EMAIL_URL = getEmailUrl();
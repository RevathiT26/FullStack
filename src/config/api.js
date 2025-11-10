import axios from 'axios';
// Get environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4080';
const API_HIERARCHY_ENDPOINT = import.meta.env.VITE_API_HIERARCHY_ENDPOINT || '/api/hierarchy';
// Create axios instance with base configuration
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});
// API endpoints
export const API_ENDPOINTS = {
    hierarchy: API_HIERARCHY_ENDPOINT,
    // Add more endpoints here as needed
};
// Request interceptor for logging in development
apiClient.interceptors.request.use((config) => {
    if (import.meta.env.DEV) {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
}, (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
});
// Response interceptor for error handling
apiClient.interceptors.response.use((response) => {
    if (import.meta.env.DEV) {
        console.log('API Response:', response.status, response.data);
    }
    return response;
}, (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
});

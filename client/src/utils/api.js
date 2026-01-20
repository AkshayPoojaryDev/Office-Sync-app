// client/src/utils/api.js
// Centralized API service layer with axios

import axios from 'axios';
import { API_BASE_URL } from '../config';
import { auth } from '../firebase';

// Create axios instance with base configuration
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    async (config) => {
        try {
            // Get current user's ID token
            const user = auth.currentUser;
            if (user) {
                const token = await user.getIdToken();
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting auth token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle common errors
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            if (status === 401) {
                // Unauthorized - redirect to login
                console.error('Unauthorized access');
            } else if (status === 403) {
                console.error('Forbidden - insufficient permissions');
            } else if (status === 500) {
                console.error('Server error');
            }

            // Return error with message
            return Promise.reject(data.message || data.error || 'An error occurred');
        } else if (error.request) {
            // Request made but no response
            return Promise.reject('Network error - please check your connection');
        } else {
            // Something else happened
            return Promise.reject(error.message || 'An unexpected error occurred');
        }
    }
);

// API methods
export const api = {
    // Order endpoints
    placeOrder: (orderData) =>
        apiClient.post('/api/order', orderData),

    getStats: () =>
        apiClient.get('/api/stats'),

    getUserOrders: (userId) =>
        apiClient.get(`/api/orders/user/${userId}`),

    // Notice endpoints
    getNotices: (params = {}) =>
        apiClient.get('/api/notices', { params }),

    createNotice: (noticeData) =>
        apiClient.post('/api/notices', noticeData),

    updateNotice: (id, noticeData) =>
        apiClient.put(`/api/notices/${id}`, noticeData),

    deleteNotice: (id) =>
        apiClient.delete(`/api/notices/${id}`),

    // Poll endpoints
    voteOnPoll: (noticeId, optionIndex) =>
        apiClient.post(`/api/notices/${noticeId}/vote`, { optionIndex }),

    // Admin endpoints
    getAdminStats: () =>
        apiClient.get('/api/admin/stats'),
};

export default apiClient;

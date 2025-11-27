// client/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Configure axios to work with cookies
    useEffect(() => {
        // Include cookies and set base URL
        axios.defaults.withCredentials = true;
        axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

        // Response interceptor to auto-refresh once on 401
        const interceptor = axios.interceptors.response.use(
            (resp) => resp,
            async (error) => {
                const original = error.config;
                const status = error.response?.status;
                const isRefreshCall = original?.url?.includes('/api/auth/refresh');
                const isLoginCall = original?.url?.includes('/api/auth/login');
                
                // Only try to refresh if it's a 401, not already retried, and not a login/refresh call
                if (status === 401 && !original?._retry && !isRefreshCall && !isLoginCall) {
                    original._retry = true;
                    try {
                        // Try to refresh the token
                        await axios.post('/api/auth/refresh');
                        // Retry the original request
                        return axios(original);
                    } catch (refreshErr) {
                        // Refresh failed; clear user and redirect to login
                        console.log('Token refresh failed, logging out');
                        setUser(null);
                        return Promise.reject(error);
                    }
                }
                return Promise.reject(error);
            }
        );

        // Initial auth check
        checkAuthStatus();

        // Set up periodic token refresh (every 10 minutes)
        const refreshInterval = setInterval(async () => {
            try {
                await axios.post('/api/auth/refresh');
                console.log('Token refreshed successfully');
            } catch (error) {
                console.log('Background token refresh failed');
                // Don't logout on background refresh failure - let normal requests handle it
            }
        }, 10 * 60 * 1000); // 10 minutes

        // Cleanup
        return () => {
            axios.interceptors.response.eject(interceptor);
            clearInterval(refreshInterval);
        };
    }, []);

    const checkAuthStatus = async () => {
        try {
            // The browser will automatically include the authToken cookie with this request
            const response = await axios.get('/api/auth/profile');
            
            if (response.data.success) {
                setUser(response.data.user);
            }
        } catch (error) {
            // If profile fetch fails, user is not authenticated
            // This is normal on first visit or after token expiry
            console.log('No valid authentication found');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            // Send login credentials including rememberMe flag
            const response = await axios.post('/api/auth/login', credentials);
            
            if (response.data.success) {
                const { user } = response.data;
                
                // Update user state - the token is now safely stored in HTTP-only cookie
                setUser(user);
                
                return { success: true, user };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            return { success: false, message };
        }
    };

    const register = async (userData) => {
        try {
            // Send registration data including rememberMe flag if provided
            const response = await axios.post('/api/auth/register', userData);
            
            if (response.data.success) {
                const { user } = response.data;
                
                // Update user state - the token is now safely stored in HTTP-only cookie
                setUser(user);
                
                return { success: true, user };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            const errors = error.response?.data?.errors || [];
            return { success: false, message, errors };
        }
    };

    const logout = async () => {
        try {
            // Call the logout endpoint to clear the HTTP-only cookie on server side
            await axios.post('/api/auth/logout');
            
            // Clear user state
            setUser(null);
            
            return { success: true };
        } catch (error) {
            // Even if the server request fails, we should clear local state
            setUser(null);
            console.error('Logout error:', error);
            return { success: false, message: 'Logout failed' };
        }
    };

    const isAuthenticated = () => {
        return !!user;
    };

    const hasRole = (role) => {
        return user && user.user_type === role;
    };

    // Function to refresh user data (useful after profile updates)
    const refreshUser = async () => {
        try {
            const response = await axios.get('/api/auth/profile');
            if (response.data.success) {
                setUser(response.data.user);
                return { success: true };
            }
        } catch (error) {
            // If refresh fails, user might not be authenticated anymore
            setUser(null);
            return { success: false };
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        hasRole,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
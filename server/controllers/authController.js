// server/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Token helpers: short-lived access, long-lived refresh (rotation, httpOnly cookies)
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '30d';

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';

const getAccessSecret = () => process.env.JWT_SECRET;
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            user_id: user.user_id,
            email: user.email,
            user_type: user.user_type,
        },
        getAccessSecret(),
        { expiresIn: ACCESS_TOKEN_TTL }
    );
};

// include remember flag in payload so we can persist cookie type across rotations
const generateRefreshToken = (user, remember) => {
    return jwt.sign(
        {
            user_id: user.user_id,
            email: user.email,
            user_type: user.user_type,
            remember: !!remember,
        },
        getRefreshSecret(),
        { expiresIn: REFRESH_TOKEN_TTL }
    );
};

const cookieBase = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
};

const setAccessCookie = (res, token) => {
    // Align cookie lifetime roughly with token lifetime (15 minutes default)
    const maxAgeMs = 15 * 60 * 1000;
    res.cookie(ACCESS_TOKEN_COOKIE, token, { ...cookieBase, maxAge: maxAgeMs });
};

const setRefreshCookie = (res, token, remember) => {
    const options = { ...cookieBase };
    // persist for 30d when remember=true; otherwise session cookie
    if (remember) {
        options.maxAge = 30 * 24 * 60 * 60 * 1000;
    }
    res.cookie(REFRESH_TOKEN_COOKIE, token, options);
};

const clearAuthCookies = (res) => {
    const base = { ...cookieBase };
    res.clearCookie(ACCESS_TOKEN_COOKIE, base);
    res.clearCookie(REFRESH_TOKEN_COOKIE, base);
};

const register = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, email, phone, address, password, user_type, rememberMe = false } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create new user
        const newUser = await User.create({
            name,
            email,
            phone,
            address,
            password,
            user_type
        });

        // Generate tokens and set secure cookies
        const accessToken = generateAccessToken(newUser);
        const refreshToken = generateRefreshToken(newUser, rememberMe);
        setAccessCookie(res, accessToken);
        setRefreshCookie(res, refreshToken, rememberMe);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                user_id: newUser.user_id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                address: newUser.address,
                user_type: newUser.user_type
            }
            // Tokens are in HTTP-only cookies
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
};

const login = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password, user_type, rememberMe = false } = req.body;

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credential'
            });
        }

        // Check user type
        if (user.user_type !== user_type) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credential'
            });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive. Please contact admin.'
            });
        }

        // Verify password
        const isPasswordValid = await User.verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credential'
            });
        }

    // Generate tokens and set secure cookies
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, rememberMe);
    setAccessCookie(res, accessToken);
    setRefreshCookie(res, refreshToken, rememberMe);

        console.log(`✅ User logged in: ${user.email} (${user.user_type}) - Remember: ${rememberMe}`);

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                user_type: user.user_type,
                img_url: user.img_url
            }
            // Tokens are in HTTP-only cookies
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
};

// Logout endpoint to clear cookies
const logout = async (req, res) => {
    try {
        // Clear both access and refresh cookies
        clearAuthCookies(res);
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during logout'
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.getProfile(req.user.user_id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                user_type: user.user_type,
                status: user.status,
                img_url: user.img_url,
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const updateData = req.body;
        
        const updatedUser = await User.updateProfile(userId, updateData);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                user_id: updatedUser.user_id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                user_type: updatedUser.user_type,
                status: updatedUser.status,
                img_url: updatedUser.img_url,
                created_at: updatedUser.created_at
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        const statusCode = error.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

// Verify current password for authenticated user
const verifyPassword = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        // Fetch hashed password for user
        const hashed = await User.getPasswordHash(userId);
        if (!hashed) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isValid = await User.verifyPassword(password, hashed);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        return res.json({ success: true, message: 'Password verified' });
    } catch (error) {
        console.error('Verify password error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Update password for authenticated user
const updatePassword = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
        }

        await User.update(userId, { password: newPassword });
        return res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update password' });
    }
};

// Reset password by email (forgot password flow after OTP verification on client)
const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email and newPassword are required' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await User.update(user.user_id, { password: newPassword });
        return res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
};

// Update profile image
const updateProfileImage = async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }
        
        // Build the full image URL
        const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
        const imageUrl = `${serverUrl}/api/uploads/image/profiles/${req.file.filename}`;
        
        const updatedUser = await User.updateProfileImage(userId, imageUrl);
        
        res.json({
            success: true,
            message: 'Profile image updated successfully',
            user: {
                user_id: updatedUser.user_id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                user_type: updatedUser.user_type,
                status: updatedUser.status,
                img_url: updatedUser.img_url,
                created_at: updatedUser.created_at
            },
            imageUrl: updatedUser.img_url
        });
    } catch (error) {
        console.error('Update profile image error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update profile image'
        });
    }
};

// Remove profile image
const removeProfileImage = async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        const updatedUser = await User.removeProfileImage(userId);
        
        res.json({
            success: true,
            message: 'Profile image removed successfully',
            user: {
                user_id: updatedUser.user_id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                user_type: updatedUser.user_type,
                status: updatedUser.status,
                img_url: updatedUser.img_url,
                created_at: updatedUser.created_at
            }
        });
    } catch (error) {
        console.error('Remove profile image error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to remove profile image'
        });
    }
};

// Delete account for current user
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const deleted = await User.delete(userId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'User not found or already deleted'
            });
        }
        clearAuthCookies(res);
        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
};

// Token refresh using refresh cookie; rotates refresh token and renews access token
const refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
        if (!token) {
            console.log('⚠️ No refresh token found in cookies');
            return res.status(401).json({ success: false, message: 'Refresh token required' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, getRefreshSecret());
        } catch (err) {
            console.log('⚠️ Invalid or expired refresh token:', err.message);
            return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
        }

        // Ensure user still exists and is active
        const user = await User.findById(decoded.user_id);
        if (!user || user.status !== 'active') {
            console.log('⚠️ User not found or inactive during token refresh');
            clearAuthCookies(res);
            return res.status(401).json({ success: false, message: 'User not authorized' });
        }

        // Rotate refresh token and issue new access token
        const newAccess = generateAccessToken(user);
        const newRefresh = generateRefreshToken(user, decoded.remember);
        setAccessCookie(res, newAccess);
        setRefreshCookie(res, newRefresh, decoded.remember);

        console.log(`🔄 Token refreshed for user: ${user.email}`);
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ Refresh token error:', error);
        return res.status(500).json({ success: false, message: 'Failed to refresh token' });
    }
};

module.exports = {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    updateProfileImage,
    removeProfileImage,
    deleteAccount,
    refreshToken,
    verifyPassword,
    updatePassword,
    resetPassword
};
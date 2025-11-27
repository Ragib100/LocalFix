// server/middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
    try {
        // Get access token from HTTP-only cookie only (cookie-based auth)
        const token = req.cookies?.accessToken;

        if (!token) {
            console.log('⚠️ No access token found in cookies');
            return res.status(401).json({ 
                success: false,
                message: 'Access token required' 
            });
        }

        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user information to request object for use in subsequent middleware/routes
        req.user = {
            user_id: decoded.user_id,
            email: decoded.email,
            user_type: decoded.user_type
        };
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log('⚠️ Token has expired');
            return res.status(401).json({ 
                success: false,
                message: 'Token has expired' 
            });
        } else if (error.name === 'JsonWebTokenError') {
            console.log('⚠️ Invalid token');
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token' 
            });
        }
        
        console.error('Authentication error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error during authentication' 
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: 'User not authenticated' 
            });
        }

        if (!roles.includes(req.user.user_type)) {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Insufficient permissions.' 
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorize
};
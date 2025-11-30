// server/models/User.js
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const { executeQuery } = require('../config/database');

class User {
    static async getPasswordHash(userId) {
        const sql = `SELECT hashed_pass FROM users WHERE user_id = $1`;
        const result = await executeQuery(sql, [userId]);
        if (!result.success) {
            throw new Error(`Database error: ${result.error}`);
        }
        if (result.rows.length === 0) return null;
        return result.rows[0].hashed_pass;
    }
    static async findByEmail(email) {
        const sql = `SELECT user_id, name, email, phone, address, hashed_pass, user_type, status, img_url, created_at 
                     FROM users WHERE email = $1`;
        
        const result = await executeQuery(sql, [email]);
        
        if (!result.success) {
            throw new Error(`Database error: ${result.error}`);
        }
        
        if (result.rows.length === 0) return null;
        
        // PostgreSQL returns column names in lowercase by default
        const user = result.rows[0];
        return {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            password: user.hashed_pass, // Map hashed_pass to password for compatibility
            user_type: user.user_type,
            status: user.status,
            img_url: user.img_url,
            created_at: user.created_at
        };
    }

    static async create(userData) {
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        
        const sql = `INSERT INTO users (name, email, phone, address, hashed_pass, user_type)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING user_id`;
        
        const params = [
            userData.name,
            userData.email,
            userData.phone,
            userData.address,
            hashedPassword,
            userData.user_type
        ];
        
        const result = await executeQuery(sql, params);
        
        if (!result.success) {
            throw new Error(`Failed to create user: ${result.error}`);
        }
        
        return {
            user_id: result.rows[0].user_id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            address: userData.address,
            user_type: userData.user_type
        };
    }

    static async findById(userId) {
        const sql = `SELECT user_id, name, email, phone, address, user_type, status, img_url, created_at 
                     FROM users WHERE user_id = $1`;
        
        const result = await executeQuery(sql, [userId]);
        
        if (!result.success) {
            throw new Error(`Database error: ${result.error}`);
        }
        
        if (result.rows.length === 0) return null;
        
        const user = result.rows[0];
        return {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            user_type: user.user_type,
            status: user.status,
            img_url: user.img_url,
            created_at: user.created_at
        };
    }

    static async update(userId, updateData) {
        const fields = [];
        const binds = { user_id: userId };
        
        // Dynamically build UPDATE query based on provided fields
        if (updateData.name) {
            fields.push('name = :name');
            binds.name = updateData.name;
        }
        if (updateData.email) {
            fields.push('email = :email');
            binds.email = updateData.email;
        }
        if (updateData.phone) {
            fields.push('phone = :phone');
            binds.phone = updateData.phone;
        }
        if (updateData.address) {
            fields.push('address = :address');
            binds.address = updateData.address;
        }
        if (updateData.status) {
            fields.push('status = :status');
            binds.status = updateData.status;
        }
        if (updateData.img_url !== undefined) {
            fields.push('img_url = :img_url');
            binds.img_url = updateData.img_url;
        }
        if (updateData.password) {
            const hashedPassword = await bcrypt.hash(updateData.password, 10);
            fields.push('hashed_pass = :hashed_pass');
            binds.hashed_pass = hashedPassword;
        }
        
        if (fields.length === 0) {
            throw new Error('No fields to update');
        }
        
        binds.user_id = userId;
        const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                     WHERE user_id = :user_id`;
        
        const result = await executeQuery(sql, binds);
        
        if (!result.success) {
            throw new Error(`Failed to update user: ${result.error}`);
        }
        
        return result.rowsAffected > 0;
    }

    static async delete(userId) {
        // First get user data to delete associated files
        const user = await this.findById(userId);
        if (user && user.img_url) {
            await this.deleteProfileImage(user.img_url);
        }
        
        const sql = `DELETE FROM users WHERE user_id = $1`;
        
        const result = await executeQuery(sql, [userId]);
        
        if (!result.success) {
            throw new Error(`Failed to delete user: ${result.error}`);
        }
        
        return result.rowCount > 0;
    }

    // NEW: Get profile method
    static async getProfile(userId) {
        return await this.findById(userId);
    }

    // NEW: Update profile method with validation
    static async updateProfile(userId, updateData) {
        // Validate input
        if (!updateData || Object.keys(updateData).length === 0) {
            throw new Error('At least one field is required for update');
        }
        
        // Prepare update data (only include fields that are provided)
        const validatedData = {};
        
        if (updateData.name && updateData.name.trim()) {
            if (updateData.name.trim().length < 2) {
                throw new Error('Name must be at least 2 characters long');
            }
            validatedData.name = updateData.name.trim();
        }
        
        if (updateData.phone && updateData.phone.trim()) {
            // Basic phone validation (adjust regex as needed for your format)
            const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
            if (!phoneRegex.test(updateData.phone.trim())) {
                throw new Error('Please enter a valid phone number');
            }
            validatedData.phone = updateData.phone.trim();
        }
        
        if (updateData.address && updateData.address.trim()) {
            validatedData.address = updateData.address.trim();
        }
        
        if (updateData.password && updateData.password.trim()) {
            if (updateData.password.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }
            validatedData.password = updateData.password;
        }

        if (updateData.img_url !== undefined) {
            validatedData.img_url = updateData.img_url;
        }
        
        // Update user in database
        const updated = await this.update(userId, validatedData);
        
        if (!updated) {
            throw new Error('User not found or no changes made');
        }
        
        // Return updated user data
        return await this.findById(userId);
    }

    // NEW: Update profile image method
    static async updateProfileImage(userId, newImageUrl) {
        // Get current user data to delete old image
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Delete old image if exists
        if (user.img_url) {
            await this.deleteProfileImage(user.img_url);
        }
        
        // Update with new image URL
        const updated = await this.update(userId, { img_url: newImageUrl });
        
        if (!updated) {
            throw new Error('Failed to update profile image');
        }
        
        return await this.findById(userId);
    }

    // NEW: Delete profile image method
    static async deleteProfileImage(imageUrl) {
        if (!imageUrl) return;
        
        try {
            // Check if it's a Supabase URL
            if (imageUrl.includes('supabase.co')) {
                // Extract filename from Supabase URL
                const urlParts = imageUrl.split('/');
                const filename = urlParts[urlParts.length - 1];
                
                // Delete from Supabase
                const uploadService = require('../services/uploadService');
                const deleted = await uploadService.deleteFile('profiles', filename);
                
                if (deleted) {
                    console.log(`Deleted profile image from Supabase: ${filename}`);
                } else {
                    console.log(`Could not delete profile image from Supabase: ${filename}`);
                }
            } else {
                // Legacy: Handle local file deletion
                const urlParts = imageUrl.split('/');
                const filename = urlParts[urlParts.length - 1];
                const imagePath = path.join(__dirname, '../../uploads/profiles', filename);
                
                try {
                    await fs.access(imagePath);
                    await fs.unlink(imagePath);
                    console.log(`Deleted local profile image: ${imagePath}`);
                } catch (fileError) {
                    // File doesn't exist or can't be deleted, log but don't throw
                    console.log(`Could not delete local profile image: ${imagePath}`, fileError.message);
                }
            }
        } catch (error) {
            console.error('Error deleting profile image:', error);
        }
    }

    // NEW: Remove profile image method (sets img_url to null)
    static async removeProfileImage(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Delete the physical file
        if (user.img_url) {
            await this.deleteProfileImage(user.img_url);
        }
        
        // Update database to remove image URL
        const updated = await this.update(userId, { img_url: null });
        
        if (!updated) {
            throw new Error('Failed to remove profile image');
        }
        
        return await this.findById(userId);
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async emailExists(email) {
        const user = await this.findByEmail(email);
        return !!user;
    }

    static async getAllUsers(limit = 100, offset = 0) {
        const sql = `SELECT user_id, name, email, phone, address, user_type, status, img_url, created_at 
                     FROM users 
                     ORDER BY created_at DESC 
                     LIMIT $1 OFFSET $2`;
        
        const result = await executeQuery(sql, [limit, offset]);
        
        if (!result.success) {
            throw new Error(`Database error: ${result.error}`);
        }
        
        return result.rows.map(user => ({
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            user_type: user.user_type,
            status: user.status,
            img_url: user.img_url,
            created_at: user.created_at
        }));
    }

    static async searchUsers(searchTerm) {
        const sql = `SELECT user_id, name, email, phone, address, user_type, status, img_url, created_at 
                     FROM users 
                     WHERE LOWER(name) LIKE LOWER($1) 
                        OR LOWER(email) LIKE LOWER($1)
                        OR LOWER(phone) LIKE LOWER($1)
                     ORDER BY name`;
        
        const result = await executeQuery(sql, [`%${searchTerm}%`]);
        
        if (!result.success) {
            throw new Error(`Database error: ${result.error}`);
        }
        
        return result.rows.map(user => ({
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            user_type: user.user_type,
            status: user.status,
            img_url: user.img_url,
            created_at: user.created_at
        }));
    }
}

module.exports = User;
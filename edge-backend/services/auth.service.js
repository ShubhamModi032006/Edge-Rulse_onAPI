import jwt from 'jsonwebtoken';

// PART C: Create Auth Service
export const validateAuth = ({ headers, rule }) => {
    try {
        const config = rule.config || {};
        
        // 1. Extract Authorization header safely
        let authHeader = headers['authorization'];
        if (!authHeader) {
            // Support capitalized header configurations some frameworks use
            authHeader = headers['Authorization'];
        }

        // 2. If completely missing header evaluate to missing token block
        if (!authHeader) {
            return { valid: false, reason: "missing_token" };
        }

        // 3. Parse token content (Format assumes "Bearer <token>" style structure if passed)
        const token = authHeader.split(" ")[1];

        // 4. Branch based on rule.config.type
        
        if (config.type === 'bearer') {
            // CASE 2 - STATIC BEARER TOKEN
            // Extracts Authorization header and compares directly against static predefined token string
            if (token !== config.token) {
                return { valid: false, reason: "invalid_token" };
            }
        } else if (config.type === 'jwt') {
            // CASE 3 - JWT VALIDATION
            // Uses securely passed secret key to decode string dynamically, falling back to block rule if broken
            try {
                jwt.verify(token, config.secret);
            } catch (error) {
                return { valid: false, reason: "invalid_token" };
            }
        }
        
        // CASE 1 - BASIC REQUIRE HEADER -> config.type is omitted or "required: true"
        // If config.type is not specified, it safely falls here and concludes execution.
        // Since we already successfully validated !authHeader above, we know it exists.

        // 5. Successful validation exit point
        return { valid: true };
    } catch (error) {
        console.error('Auth Validation Error:', error);
        return { valid: false, reason: "validation_error" };
    }
};

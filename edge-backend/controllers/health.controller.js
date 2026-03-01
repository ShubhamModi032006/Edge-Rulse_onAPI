
import { successResponse } from '../utils/response.js';

export const getHealth = (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "EdgeRules",
        timestamp: new Date().toISOString()
    });
};

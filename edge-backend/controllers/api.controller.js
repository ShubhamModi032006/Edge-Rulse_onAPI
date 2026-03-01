import { successResponse, errorResponse } from '../utils/response.js';
import { createApi, getAllApis } from '../services/api.service.js';

export const registerApi = async (req, res, next) => {
    try {
        const { name, baseUrl, environment } = req.body;

        if (!name || !baseUrl || !environment) {
            return errorResponse(res, 'Missing required fields: name, baseUrl, environment', 400);
        }

        const validEnvironments = ['production', 'staging'];
        if (!validEnvironments.includes(environment)) {
            return errorResponse(res, 'environment must be one of: production, staging', 400);
        }

        const newApi = await createApi({ name, baseUrl, environment });
        return successResponse(res, newApi, 'API registered successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const listApis = async (req, res, next) => {
    try {
        const apis = await getAllApis();
        return successResponse(res, apis, 'APIs retrieved successfully');
    } catch (error) {
        next(error);
    }
};

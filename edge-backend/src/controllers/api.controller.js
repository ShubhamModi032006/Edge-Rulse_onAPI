
import { successResponse, errorResponse } from '../utils/response.js';
import { registerApiService, listApisService } from '../services/api.service.js';

export const registerApi = (req, res) => {
    const { name, baseUrl, environment } = req.body;

    if (!name || !baseUrl || !environment) {
        return errorResponse(res, 'Missing required fields: name, baseUrl, environment', 400);
    }

    const validEnvironments = ['production', 'staging'];
    if (!validEnvironments.includes(environment)) {
        return errorResponse(res, 'environment must be one of: production, staging', 400);
    }

    try {
        const newApi = registerApiService({ name, baseUrl, environment });
        return successResponse(res, newApi, 'API registered successfully', 201);
    } catch (error) {
        return errorResponse(res, 'Failed to register API', 500, error);
    }
};

export const listApis = (req, res) => {
    try {
        const apis = listApisService();
        return successResponse(res, apis, 'APIs retrieved successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to list APIs', 500, error);
    }
};

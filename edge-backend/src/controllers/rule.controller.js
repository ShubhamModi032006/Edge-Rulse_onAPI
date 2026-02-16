
import { successResponse, errorResponse } from '../utils/response.js';
import { createRuleService, listRulesService } from '../services/rule.service.js';

export const createRule = (req, res) => {
    const { apiId, type, scope, priority } = req.body;

    if (!apiId || !type || !scope || priority === undefined) {
        return errorResponse(res, 'Missing required fields: apiId, type, scope, priority', 400);
    }

    const validTypes = ['rate_limit', 'block', 'header'];
    if (!validTypes.includes(type)) {
        return errorResponse(res, 'type must be one of: rate_limit, block, header', 400);
    }

    try {
        const newRule = createRuleService({ apiId, type, scope, priority });
        return successResponse(res, newRule, 'Rule created successfully', 201);
    } catch (error) {
        return errorResponse(res, 'Failed to create rule', 500, error);
    }
};

export const listRules = (req, res) => {
    try {
        const rules = listRulesService();
        return successResponse(res, rules, 'Rules retrieved successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to list rules', 500, error);
    }
};

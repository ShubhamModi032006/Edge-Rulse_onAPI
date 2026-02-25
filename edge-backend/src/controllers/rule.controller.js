import { successResponse, errorResponse } from '../utils/response.js';
import {
    createRule,
    getRules,
    getRuleById,
    updateRule,
    disableRule,
    getRuleVersions
} from '../services/rule.service.js';

export const createNewRule = async (req, res, next) => {
    try {
        const { apiId, name, type, scope, priority, startTime, endTime } = req.body;

        if (!apiId || !name || !type || !scope || priority === undefined) {
            return errorResponse(res, 'Missing required fields: apiId, name, type, scope, priority', 400);
        }

        const validTypes = ['rate_limit', 'block', 'header'];
        if (!validTypes.includes(type)) {
            return errorResponse(res, 'type must be one of: rate_limit, block, header', 400);
        }

        const newRule = await createRule({ apiId, name, type, scope, priority, startTime, endTime });
        return successResponse(res, newRule, 'Rule created successfully', 201);
    } catch (error) {
        if (error.message === 'API not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

export const listAllRules = async (req, res, next) => {
    try {
        const { apiId } = req.query;
        const rules = await getRules(apiId);
        return successResponse(res, rules, 'Rules retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const getSingleRule = async (req, res, next) => {
    try {
        const { id } = req.params;
        const rule = await getRuleById(id);

        if (!rule) {
            return errorResponse(res, 'Rule not found', 404);
        }

        return successResponse(res, rule, 'Rule retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const updateExistingRule = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (Object.keys(updateData).length === 0) {
            return errorResponse(res, 'No fields provided for update', 400);
        }

        if (updateData.type) {
            const validTypes = ['rate_limit', 'block', 'header'];
            if (!validTypes.includes(updateData.type)) {
                return errorResponse(res, 'type must be one of: rate_limit, block, header', 400);
            }
        }

        const updatedRule = await updateRule(id, updateData);
        return successResponse(res, updatedRule, 'Rule updated successfully');
    } catch (error) {
        if (error.message === 'Rule not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

export const deleteRule = async (req, res, next) => {
    try {
        const { id } = req.params;
        const disabledRule = await disableRule(id);
        return successResponse(res, disabledRule, 'Rule disabled successfully');
    } catch (error) {
        if (error.message === 'Rule not found') {
            return errorResponse(res, error.message, 404);
        }
        next(error);
    }
};

export const listRuleVersions = async (req, res, next) => {
    try {
        const { id } = req.params;
        const versions = await getRuleVersions(id);
        return successResponse(res, versions, 'Rule versions retrieved successfully');
    } catch (error) {
        next(error);
    }
};

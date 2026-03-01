
import { errorResponse } from '../utils/response.js';

export const notFoundHandler = (req, res, next) => {
    errorResponse(res, 'Resource not found', 404);
};

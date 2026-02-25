import { errorResponse } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Handle specific database errors if needed (e.g. unique constraint violation)
    if (err.code === '23505') {
        return errorResponse(res, 'A record with that value already exists.', 409);
    }

    errorResponse(res, err.message || 'Internal Server Error', err.statusCode || 500);
};

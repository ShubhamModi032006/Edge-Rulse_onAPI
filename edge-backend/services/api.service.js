import crypto from 'crypto';
import pool from '../config/db.js';

export const createApi = async (apiData) => {
    const { name, baseUrl, environment, routePrefix } = apiData;
    const apiKey = crypto.randomBytes(32).toString('hex');

    const query = `
        INSERT INTO apis (name, base_url, environment, api_key, route_prefix)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const values = [name, baseUrl, environment, apiKey, routePrefix || null];

    const result = await pool.query(query, values);
    return result.rows[0];
};

export const getAllApis = async () => {
    const query = 'SELECT * FROM apis ORDER BY created_at DESC;';
    const result = await pool.query(query);
    return result.rows;
};

export const getApiById = async (apiId) => {
    const query = 'SELECT * FROM apis WHERE id = $1 AND is_active = true;';
    const result = await pool.query(query, [apiId]);
    return result.rows[0] || null;
};

export const getApiByRoutePrefix = async (urlPath) => {
    const query = `
        SELECT * FROM apis 
        WHERE $1 LIKE route_prefix || '%' 
          AND is_active = true 
          AND route_prefix IS NOT NULL
        ORDER BY LENGTH(route_prefix) DESC 
        LIMIT 1;
    `;
    const result = await pool.query(query, [urlPath]);
    return result.rows[0] || null;
};

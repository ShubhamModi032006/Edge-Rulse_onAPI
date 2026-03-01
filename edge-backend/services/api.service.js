import crypto from 'crypto';
import pool from '../config/db.js';

export const createApi = async (apiData) => {
    const { name, baseUrl, environment } = apiData;
    const apiKey = crypto.randomBytes(32).toString('hex');

    const query = `
        INSERT INTO apis (name, base_url, environment, api_key)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const values = [name, baseUrl, environment, apiKey];

    const result = await pool.query(query, values);
    return result.rows[0];
};

export const getAllApis = async () => {
    const query = 'SELECT * FROM apis ORDER BY created_at DESC;';
    const result = await pool.query(query);
    return result.rows;
};

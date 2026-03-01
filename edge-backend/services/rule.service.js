import pool from '../config/db.js';

export const createRule = async (ruleData) => {
    const { apiId, name, type, scope, priority, startTime, endTime } = ruleData;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verify API exists
        const apiCheck = await client.query('SELECT id FROM apis WHERE id = $1', [apiId]);
        if (apiCheck.rowCount === 0) {
            throw new Error('API not found');
        }

        const insertRuleQuery = `
            INSERT INTO rules (api_id, name, type, scope, priority, start_time, end_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const ruleValues = [apiId, name, type, scope, priority, startTime || null, endTime || null];
        const ruleResult = await client.query(insertRuleQuery, ruleValues);
        const newRule = ruleResult.rows[0];

        // Insert first version
        const insertVersionQuery = `
            INSERT INTO rule_versions (rule_id, version_number, config)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;

        // Use the newly created rule as the config snapshot
        const configSnapshot = JSON.stringify(newRule);
        const versionValues = [newRule.id, 1, configSnapshot];
        await client.query(insertVersionQuery, versionValues);

        await client.query('COMMIT');
        return newRule;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const getRules = async (apiId = null) => {
    let query = 'SELECT * FROM rules';
    const values = [];

    if (apiId) {
        query += ' WHERE api_id = $1';
        values.push(apiId);
    }

    query += ' ORDER BY created_at DESC;';

    const result = await pool.query(query, values);
    return result.rows;
};

export const getRuleById = async (id) => {
    const query = 'SELECT * FROM rules WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
        return null;
    }

    return result.rows[0];
};

const getNextVersionNumber = async (client, ruleId) => {
    const query = 'SELECT MAX(version_number) as max_version FROM rule_versions WHERE rule_id = $1';
    const result = await client.query(query, [ruleId]);
    return (result.rows[0].max_version || 0) + 1;
};

export const updateRule = async (id, updateData) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // First check if rule exists
        const checkQuery = 'SELECT * FROM rules WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);
        if (checkResult.rowCount === 0) {
            throw new Error('Rule not found');
        }

        // Map camelCase to snake_case for DB columns
        const columnMap = {
            apiId: 'api_id',
            name: 'name',
            type: 'type',
            scope: 'scope',
            priority: 'priority',
            startTime: 'start_time',
            endTime: 'end_time',
            isEnabled: 'is_enabled'
        };

        const fields = [];
        const values = [];
        let index = 1;

        for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined && columnMap[key]) {
                fields.push(`${columnMap[key]} = $${index}`);
                values.push(value);
                index++;
            }
        }

        if (fields.length === 0) {
            throw new Error('No valid fields provided for update');
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        const updateQuery = `
            UPDATE rules
            SET ${fields.join(', ')}
            WHERE id = $${index}
            RETURNING *;
        `;
        values.push(id);

        const ruleResult = await client.query(updateQuery, values);
        const updatedRule = ruleResult.rows[0];

        const nextVersion = await getNextVersionNumber(client, id);

        // Insert new version
        const insertVersionQuery = `
            INSERT INTO rule_versions (rule_id, version_number, config)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const configSnapshot = JSON.stringify(updatedRule);
        await client.query(insertVersionQuery, [id, nextVersion, configSnapshot]);

        await client.query('COMMIT');
        return updatedRule;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const disableRule = async (id) => {
    const query = `
        UPDATE rules
        SET is_enabled = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
    `;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
        throw new Error('Rule not found');
    }
    return result.rows[0];
};

export const getRuleVersions = async (id) => {
    const query = 'SELECT * FROM rule_versions WHERE rule_id = $1 ORDER BY version_number ASC;';
    const result = await pool.query(query, [id]);
    return result.rows;
};

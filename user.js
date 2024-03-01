const express = require('express');
const router = express.Router();
const { Client } = require('pg');
require('dotenv').config();

const {
    PGHOST,
    PGDATABASE,
    PGUSER,
    PGPASSWORD,
    PGPORT,
    ENDPOINT_ID
} = process.env;

const client = new Client({
    host: PGHOST,
    port: PGPORT,
    database: PGDATABASE,
    user: PGUSER,
    password: PGPASSWORD,
    ssl: true, 
});

//get apis
async function getUserById(userId) {
    try {
        await client.connect();

        const result = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error querying PostgreSQL:', error);
        throw new Error('Internal server error');
    } finally {
        await client.end();
    }
}

//postman test: http://localhost:3000/users/1
router.get('/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

async function getUserByName(name) {
    try {
        await client.connect();

        const result = await client.query('SELECT * FROM users WHERE name = $1', [name]);
        return result.rows[0];
    } catch (error) {
        console.error('Error querying PostgreSQL:', error);
        throw new Error('Internal server error');
    } finally {
        await client.end();
    }
}

//postman test: http://localhost:3000/users/name/User2
router.get('/name/:name', async (req, res) => {
    const name = req.params.name;

    try {
        const user = await getUserByName(name);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

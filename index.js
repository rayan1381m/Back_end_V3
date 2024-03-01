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

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to PostgreSQL database');
    } catch (error) {
        console.error('Error connecting to PostgreSQL database:', error);
    }
}

async function getPgVersion() {
    try {
        const result = await client.query('SELECT version()');
        console.log(result.rows[0]);
    } catch (error) {
        console.error('Error querying PostgreSQL:', error);
    }
}

connectToDatabase();
getPgVersion();

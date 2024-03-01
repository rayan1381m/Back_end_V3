const express = require("express");
const router = express.Router();
const { Client } = require("pg");
require("dotenv").config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT, ENDPOINT_ID } =
  process.env;

const client = new Client({
  host: PGHOST,
  port: PGPORT,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  ssl: true,
});

//get apis
async function findGameById(gameId) {
  try {
    await client.connect();

    const result = await client.query("SELECT * FROM games WHERE id = $1", [
      gameId,
    ]);
    const game = result.rows[0];

    return game;
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  } finally {
    await client.end();
  }
}

async function findGameByName(gameName) {
  try {
    await client.connect();

    const result = await client.query("SELECT * FROM games WHERE name = $1", [
      gameName,
    ]);
    const game = result.rows[0];

    return game;
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  } finally {
    await client.end();
  }
}

//postman test: http://localhost:3000/games/2
router.get("/:id", async (req, res) => {
  const gameId = req.params.id;

  try {
    const game = await findGameById(gameId);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.json(game);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

//postman test: http://localhost:3000/games/name/Dota 2
router.get("/name/:name", async (req, res) => {
  const gameName = req.params.name;

  try {
    const game = await findGameByName(gameName);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.json(game);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

//post api
// Function to create a new game with validation
async function createGame(name, likes, comments, price) {
  // Check if name and price are provided and price is not negative
  if (!name || !price || price < 0) {
    throw new Error(
      "Invalid game data. Name and price are required, and price cannot be negative."
    );
  }

  try {
    await client.connect();

    const result = await client.query(
      "INSERT INTO games (name, likes, comments, price) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, likes, comments, price]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  } finally {
    await client.end();
  }
}

//postman test: http://localhost:3000/games
/*{
    "name": "Elden Rings",
    "likes": 0,
    "comments": "ghalat kardm ghalat",
    "price": 13.45
} */
router.post("/", async (req, res) => {
  const { name, likes, comments, price } = req.body;

  try {
    const newGame = await createGame(name, likes, comments, price);
    res.status(201).json(newGame);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

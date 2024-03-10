const express = require("express");
const router = express.Router();
const { Client } = require("pg");
require("dotenv").config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT, ENDPOINT_ID } = process.env;

const client = new Client({
  host: PGHOST,
  port: PGPORT,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  ssl: true,
  // idleTimeoutMillis: 0,
  // connectionTimeoutMillis: 0,
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Error connecting to PostgreSQL:', err));

//get apis
async function findGameById(gameId) {
  try {
    const result = await client.query("SELECT * FROM games WHERE id = $1", [gameId]);
    return result.rows[0];
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
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

async function findGameByName(gameName) {
  try {
    const result = await client.query("SELECT * FROM games WHERE name = $1", [gameName]);
    return result.rows[0];
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  }
}

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

async function getFilteredGames(minPrice) {
  let query = "SELECT * FROM games";
  const values = [];

  if (minPrice) {
    query += " WHERE price >= $1";
    values.push(parseFloat(minPrice));
  }

  const result = await client.query(query, values);
  return result.rows;
}

//postman test: http://localhost:3000/games/?minPrice=10
router.get("/", async (req, res) => {
  const { minPrice } = req.query;

  try {
    const games = await getFilteredGames(minPrice);
    res.json(games);
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//post api
async function createGame(name, likes, comments, price) {
  if (!name || !price || price < 0) {
    throw new Error("Invalid game data. Name and price are required, and price cannot be negative.");
  }

  try {
    const result = await client.query(
      "INSERT INTO games (name, likes, comments, price) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, likes, comments, price]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
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

//delete api
async function deleteGameById(gameId) {
  try {
    const result = await client.query("DELETE FROM games WHERE id = $1", [gameId]);
    return result.rowCount;
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  }
}

//postman test: http://localhost:3000/games/7
router.delete("/:id", async (req, res) => {
  const gameId = req.params.id;

  try {
    const rowsAffected = await deleteGameById(gameId);

    if (rowsAffected === 1) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Game not found" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

async function deleteGameByName(gameName) {
  try {
    const result = await client.query("DELETE FROM games WHERE name = $1", [gameName]);
    return result.rowCount;
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  }
}

//postman test: http://localhost:3000/games/name/fifa 24
router.delete("/name/:name", async (req, res) => {
  const gameName = req.params.name;

  try {
    const rowsAffected = await deleteGameByName(gameName);

    if (rowsAffected === 1) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Game not found" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

//put api
router.put("/:id", async (req, res) => {
  const gameId = req.params.id;
  const { name, likes, comments, price } = req.body;

  try {
    let query = "UPDATE games SET ";
    const values = [gameId];
    let index = 2;

    if (name) {
      query += `name = $${index}, `;
      values.push(name);
      index++;
    }

    if (likes !== undefined) {
      query += `likes = $${index}, `;
      values.push(likes);
      index++;
    }

    if (comments) {
      query += `comments = $${index}, `;
      values.push(comments);
      index++;
    }

    if (price !== undefined) {
      query += `price = $${index}, `;
      values.push(price);
      index++;
    }

    query = query.slice(0, -2);

    query += " WHERE id = $1 RETURNING *";

    const result = await client.query(query, values);
    const updatedGame = result.rows[0];

    if (!updatedGame) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.json(updatedGame);
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//patch api
//postman test: http://localhost:3000/games/4
/*{
    "price": 19.19
}
*/
router.patch("/:id", async (req, res) => {
  const gameId = req.params.id;
  const { name, price } = req.body;

  try {
    let query = "UPDATE games SET ";
    const values = [gameId];
    let index = 2;

    if (name) {
      query += `name = $${index}, `;
      values.push(name);
      index++;
    }

    if (price) {
      query += `price = $${index}, `;
      values.push(price);
      index++;
    }

    query = query.slice(0, -2);

    query += " WHERE id = $1 RETURNING *";

    const result = await client.query(query, values);
    const updatedGame = result.rows[0];

    if (!updatedGame) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.json(updatedGame);
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

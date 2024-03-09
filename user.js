const express = require("express");
const router = express.Router();
const { Client } = require("pg");
require("dotenv").config();
const crypto = require("crypto");

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

client
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Error connecting to PostgreSQL:", err));

//get apis
async function getUserById(userId) {
  try {
    const result = await client.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  }
}

//postman test: http://localhost:3000/users/1
router.get("/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

async function getUserByName(name) {
  try {
    const result = await client.query("SELECT * FROM users WHERE name = $1", [
      name,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  }
}

//postman test: http://localhost:3000/users/name/User2
router.get("/name/:name", async (req, res) => {
  const name = req.params.name;

  try {
    const user = await getUserByName(name);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

//post api
async function createUser(name, isAdmin, password) {
  try {
    //const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    const userExists = await client.query(
      "SELECT * FROM users WHERE name = $1",
      [name]
    );

    if (userExists.rows.length > 0) {
      throw new Error("Username already exists");
    }

    const result = await client.query(
      "INSERT INTO users (name, is_admin, password) VALUES ($1, $2, $3) RETURNING *",
      [name, isAdmin, password]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  }
}

//postman test: http://localhost:3000/users
/*{
    "name": "Rayan",
    "isAdmin": true,
    "password": "password123"
} */
router.post("/", async (req, res) => {
  const { name, isAdmin, password } = req.body;

  try {
    const newUser = await createUser(name, isAdmin, password);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await getUserByName(name);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");
    if (user.password !== hashedPassword) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

//delete api
async function deleteUserById(id) {
  try {
    const result = await client.query("DELETE FROM users WHERE id = $1", [id]);
    return result.rowCount;
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  }
}

//postman test: http://localhost:3000/users/3
router.delete("/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const rowsAffected = await deleteUserById(userId);

    if (rowsAffected === 1) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

async function deleteUserByName(name) {
  try {
    const result = await client.query("DELETE FROM users WHERE name = $1", [
      name,
    ]);
    return result.rowCount;
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  }
}

//postman test: http://localhost:3000/users/name/User3
router.delete("/name/:name", async (req, res) => {
  const name = req.params.name;

  try {
    const rowsAffected = await deleteUserByName(name);

    if (rowsAffected === 1) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

//put api

//postman test: http://localhost:3000/users/1
/*{
    "name": "Updated Name",
    "isAdmin": false,
    "password": "newpassword123"
}
*/
router.put("/:id", async (req, res) => {
  const userId = req.params.id;
  const { name, isAdmin, password } = req.body;

  try {
    let query = "UPDATE users SET ";
    const values = [userId];
    let index = 2;

    if (name) {
      query += `name = $${index}, `;
      values.push(name);
      index++;
    }

    if (isAdmin !== undefined) {
      query += `is_admin = $${index}, `;
      values.push(isAdmin);
      index++;
    }

    if (password) {
      query += `password = $${index}, `;
      values.push(password);
      index++;
    }

    //if we have to snage more than one field, its remove comma and space to prevent mistake
    query = query.slice(0, -2);

    query += " WHERE id = $1 RETURNING *";

    const result = await client.query(query, values);
    const updatedUser = result.rows[0];

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//postman test: http://localhost:3000/getuser {
/*  "name": "Rayan"
  }*/
router.post("/getuser", async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await getUserByName(name);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } else if (user.password !== password) {
      return res.status(404).json({ message: "Wrong password" });
    }

    const insertQuery = "INSERT INTO user_logs (name) VALUES ($1) RETURNING *";
    const insertValues = [name];
    await client.query(insertQuery, insertValues);

    if (user.is_admin) {
      return res.json({ isAdmin: true });
    } else {
      return res.json({ isAdmin: false });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

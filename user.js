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
async function getUserById(userId) {
  try {
    await client.connect();

    const result = await client.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  } finally {
    await client.end();
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
    await client.connect();

    const result = await client.query("SELECT * FROM users WHERE name = $1", [
      name,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  } finally {
    await client.end();
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
    await client.connect();

    const result = await client.query(
      "INSERT INTO users (name, is_admin, password) VALUES ($1, $2, $3) RETURNING *",
      [name, isAdmin, password]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  } finally {
    await client.end();
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

//delete api
async function deleteUserById(id) {
  try {
    await client.connect();

    const result = await client.query("DELETE FROM users WHERE id = $1", [id]);
    return result.rowCount;
  } catch (error) {
    console.error("Error querying PostgreSQL:", error);
    throw new Error("Internal server error");
  } finally {
    await client.end();
  }
}

//postman test: http://localhost:3000/users/3
router.delete("/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const rowsAffected = await deleteUserById(userId);

    if (rowsAffected === 1) {
      res.status(204).send(); // Send a 204 No Content response if deletion is successful
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// Function to delete a user by name
async function deleteUserByName(name) {
    try {
      await client.connect();
  
      const result = await client.query("DELETE FROM users WHERE name = $1", [name]);
      return result.rowCount;
    } catch (error) {
      console.error("Error querying PostgreSQL:", error);
      throw new Error("Internal server error");
    } finally {
      await client.end();
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
    await client.connect();

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
  } finally {
    await client.end();
  }
});


module.exports = router;

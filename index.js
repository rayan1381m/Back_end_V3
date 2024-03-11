const express = require('express');
const app = express();
const cors = require("cors");
const userRoutes = require('./user');
const gameRoutes = require('./game.js');

app.use(cors());

app.use(express.json());
app.use('/users', userRoutes);
app.use('/games', gameRoutes);

const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

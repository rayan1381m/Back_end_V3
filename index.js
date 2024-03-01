const express = require('express');
const app = express();
const userRoutes = require('./user');
const gameRoutes = require('./game.js');
const bodyParser = require('body-parser');

app.use(express.json());
app.use('/users', userRoutes);
app.use('/games', gameRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const weatherRouter = require('./routes/weather');
const generateRouter = require('./routes/generate');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', weatherRouter);
app.use('/api', generateRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

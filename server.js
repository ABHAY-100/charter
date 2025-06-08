const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const certificateRoutes = require('./routes/certificate.routes.js');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(bodyParser.json());

app.use('/api/v1', certificateRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Hey, I\'m Alive' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

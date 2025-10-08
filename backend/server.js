require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./src/models');
const authRoutes = require('./src/routes/authRoutes');
const gardenRoutes = require('./src/routes/gardenRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/jardin', gardenRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Mi Jardín Mental API is running' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    await sequelize.sync();
    console.log('Database synced.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
})();

module.exports = app;

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const supabase = require('./src/lib/supabaseClient');
const authRoutes = require('./src/routes/authRoutes');
const gardenRoutes = require('./src/routes/gardenRoutes');
const userRoutes = require('./src/routes/userRoutes');
const economyRoutes = require('./src/routes/economyRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(cors());
app.use(
  bodyParser.json({
    limit: '5mb',
  })
);
app.use(
  bodyParser.urlencoded({
    limit: '5mb',
    extended: true,
  })
);
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/jardin', gardenRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/economia', economyRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Mi Jardín Mental API is running' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

const logSupabaseStatus = async () => {
  try {
    const { error } = await supabase.from('usuarios').select('id', { count: 'exact', head: true }).limit(1);
    if (error) {
      console.warn('Supabase connection established but validation query returned an error (this may happen before tables exist):', error.message);
    } else {
      console.log('Supabase connection verified successfully.');
    }
  } catch (err) {
    console.warn('Unable to verify Supabase connection:', err.message);
  }
};

logSupabaseStatus();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

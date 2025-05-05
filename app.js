const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const movieRoutes = require('./src/routes/movieRoutes');

const app = express();

// Configuración mejorada de CORS
const corsOptions = {
  origin: [
    'http://localhost:5173', // Desarrollo local
    'https://tu-frontend-en-render.onrender.com' // Reemplaza con tu URL de frontend en Render
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Rutas
app.use('/auth', authRoutes);
app.use('/profiles', profileRoutes);
app.use('/movies', movieRoutes);

// Conexión a MongoDB con manejo mejorado de errores
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => {
  console.error('Error de conexión a MongoDB:', err);
  process.exit(1); // Salir si no hay conexión a la DB
});

// Configuración del puerto para Render
const port = process.env.PORT || 10000; // Render usa el puerto 10000

// Iniciar servidor
const server = app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});

// Manejo de errores global
process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', err);
  server.close(() => process.exit(1));
});
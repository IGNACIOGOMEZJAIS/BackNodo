const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');




const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const movieRoutes = require('./routes/movieRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/profiles', profileRoutes);
app.use('/movies', movieRoutes);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error de MongoDB:', err));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});

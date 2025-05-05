const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Rutas públicas
router.get('/', movieController.getAllMovies);
router.get('/search', movieController.searchMovies);
router.get('/:id', movieController.getMovie);

// Rutas protegidas (solo administradores)
router.use('/', authenticateToken);
router.post('/', movieController.createMovie);
router.patch('/:id', movieController.updateMovie);
router.delete('/:id', movieController.deleteMovie);

module.exports = router;

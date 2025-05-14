const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Proteger todas las rutas
router.use('/', authenticateToken);

// Rutas básicas CRUD
router.get('/', profileController.getAllProfiles);
router.get('/getmyprofiles', profileController.getProfiles);

router.get('/:id', profileController.getProfile);
router.patch('/:id', profileController.updateProfile);
router.delete('/:id', profileController.deleteProfile);



module.exports = router;

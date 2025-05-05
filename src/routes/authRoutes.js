const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/create-profile', authController.createProfile);
router.post('/login', authController.login);

module.exports = router;

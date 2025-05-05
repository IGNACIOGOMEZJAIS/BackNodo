//Instalamos jwt y bcryptjs ==> npm install jsonwebtoken bcryptjs




//Creamos el schema para el usuario
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);





//Creamos un servicio para autenticacion
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
// Clase que maneja toda la lógica de autenticación
class AuthService {
    // Método para registrar un nuevo usuario
    async register(userData) {
        // Verificamos si ya existe un usuario con el mismo email o username
        const existingUser = await User.findOne({ 
            $or: [
                { email: userData.email },
                { username: userData.username }
            ]
        });

        // Si existe lanzamos un error
        if (existingUser) {
            throw new Error('Usuario o email ya existe');
        }

        // Encriptamos la contraseña antes de crear el usuario usando bcrypt
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Creamos una nueva instancia del modelo User con los datos recibidos
        const user = new User({
            ...userData,
            password: hashedPassword
        });
        
        // Guardamos el usuario en la base de datos
        await user.save();
        
        // Convertimos el documento mongoose a un objeto plano
        const userResponse = user.toObject();
        // Eliminamos la contraseña por seguridad
        delete userResponse.password;
        
        // Generamos un token JWT para el usuario
        const token = this.generateToken(user);
        // Retornamos el usuario (sin password) y su token
        return { user: userResponse, token };
    }

    // Método para iniciar sesión
    async login(email, password) {
        // Buscamos el usuario por email
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        // Verificamos si la contraseña es correcta
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Contraseña incorrecta');
        }

        // Convertimos el usuario a objeto plano y eliminamos la contraseña
        const userResponse = user.toObject();
        delete userResponse.password;

        // Generamos un nuevo token y retornamos la respuesta
        const token = this.generateToken(user);
        return { user: userResponse, token };
    }
    
    // Método auxiliar para generar tokens JWT
    generateToken(user) {
        // Creamos un token que incluye el id y rol del usuario
        return jwt.sign(
            { 
                id: user._id,
                role: user.role 
            },
            // Usamos la clave secreta del .env
            process.env.JWT_SECRET,
            // El token expira en 24 horas
            { expiresIn: '24h' }
        );
    }
}

module.exports = new AuthService();


//Creamos un controlador para la autenticacion
const authService = require('../services/authService');

exports.register = async (req, res) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};


//Creamos el middleware
const jwt = require('jsonwebtoken');
// Middleware para verificar el token de autenticación
exports.authenticateToken = (req, res, next) => {
    // Obtenemos el header de autorización
    const authHeader = req.headers['authorization'];
    // Extraemos el token del header (formato: "Bearer <token>")
    const token = authHeader && authHeader.split(' ')[1];

    // Si no hay token, devolvemos error 401 (No autorizado)
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    try {
        // Verificamos el token usando la clave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Guardamos la información del usuario decodificada en el objeto request
        req.user = decoded;
        // Continuamos con la siguiente función middleware
        next();
    } catch (error) {
        // Si el token es inválido, devolvemos error 403 (Prohibido)
        return res.status(403).json({ message: 'Token inválido' });
    }
};

// Middleware para verificar si el usuario es administrador
exports.isAdmin = (req, res, next) => {
    // Verificamos si el rol del usuario es 'admin'
    if (req.user.role !== 'admin') {
        // Si no es admin, devolvemos error 403 (Prohibido)
        return res.status(403).json({ message: 'Acceso denegado' });
    }
    // Si es admin, continuamos con la siguiente función middleware
    next();
};

//creamos las rutas 
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

module.exports = router;

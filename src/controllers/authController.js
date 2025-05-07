//Creamos un controlador para la autenticacion
const User = require('../models/User');
const Profile = require('../models/Profile');
const jwt = require('jsonwebtoken');
const Role = require('../models/Role');
const { log } = require('winston');

const createSendToken = (user, statusCode, res) => {
    const token = user.generateAuthToken();
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user }
    });
};

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. Obtener el rol de account_owner
        const ownerRole = await Role.findOne({ name: 'account_owner' });
        if (!ownerRole) {
            return res.status(500).json({
                status: 'error',
                message: 'Error en la configuración de roles'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'El usuario ya existe'
            });
        }

        //verificar que el usuario no exista
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({
                status: 'error',
                message: 'El username ya existe'
            });
        }

        // 2. Crear usuario con rol de owner
        const user = await User.create({
            username,
            email,
            password,
            role: ownerRole._id
        });

        // 3. Crear perfil principal
        await Profile.create({
            user: user._id,
            name: username,
            type: 'owner'
        });

        createSendToken(user, 201, res);
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.createProfile = async (req, res) => {
    try {
        const { username, email, password, roleName, dateOfBirth } = req.body;

        // 1. Verificar que el rol solicitado sea válido
        const allowedRoles = ['standard_profile', 'child_profile'];
        if (!allowedRoles.includes(roleName)) {
            return res.status(400).json({
                status: 'error',
                message: 'Rol inválido. Los roles permitidos son: standard_profile, child_profile'
            });
        }

        // 2. Mapear el roleName al tipo de perfil
        const profileTypeMap = {
            standard_profile: 'standard',
            child_profile: 'child'
        };
        const profileType = profileTypeMap[roleName];

        // 3. Verificar que quien crea el perfil es un account_owner
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Se requiere autorización del account_owner'
            });
        }

        const token = authHeader.split(' ')[1];
        let ownerUser;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            ownerUser = await User.findById(decoded.id).populate('role');

            if (!ownerUser || ownerUser.role.name !== 'account_owner') {
                return res.status(403).json({
                    status: 'error',
                    message: 'Solo un account_owner puede crear perfiles adicionales'
                });
            }
        } catch (error) {
            return res.status(401).json({
                status: 'error',
                message: 'Token inválido o expirado'
            });
        }

        // 4. Obtener el rol solicitado
        const role = await Role.findOne({ name: roleName });
        if (!role) {
            return res.status(500).json({
                status: 'error',
                message: 'Error en la configuración de roles'
            });
        }

        // 5. Crear usuario con el rol especificado
        const user = await User.create({
            username,
            email,
            password,
            role: role._id
        });

        // 6. Crear perfil vinculado al owner
        await Profile.create({
            user: user._id,
            owner: ownerUser._id,
            name: username,
            type: profileType,
            dateOfBirth: profileType === 'child' ? dateOfBirth : undefined
        });

        createSendToken(user, 201, res);
    } catch (error) {
        console.error('Error al crear perfil:', error);
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Por favor proporcione email y contraseña'
            });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                status: 'error',
                message: 'Email o contraseña incorrectos'
            });
        }

        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        createSendToken(user, 200, res);
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al iniciar sesión'
        });
    }
};

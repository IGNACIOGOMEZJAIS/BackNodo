
//Creamos el middleware

const User = require('../models/User');

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



exports.hasPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'No autenticado' });
            }

            // Obtener usuario con rol y permisos populados
            const user = await User.findById(req.user.id)
                .populate({
                    path: 'role',
                    populate: {
                        path: 'permissions'
                    }
                });
                

            const hasPermission = user.role.permissions.some(
                permission => permission.name === requiredPermission
            );

            if (!hasPermission) {
                return res.status(403).json({ 
                    message: 'No tienes permiso para realizar esta acción' 
                });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};


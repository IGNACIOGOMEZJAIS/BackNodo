
//Primero, actualicemos el modelo de Usuario para incluir roles más específicos
const mongoose = require('mongoose');

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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);








//creamos un modelo de permisos y roles

const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);



const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);



//agregamos roles al usuario

/* role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
}
 */




//Crear un middleware de autorización:


const User = require('../models/User');

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



//Actualizar el servicio de autenticación:

// ... código existente ...
  // Obtener el rol por defecto (user)
  const defaultRole = await Role.findOne({ name: 'user' });
  if (!defaultRole) {
      throw new Error('Rol por defecto no encontrado');
  }

  // Populate role and permissions for token
  await user.populate({
    path: 'role',
    populate: {
        path: 'permissions'
    }
});

const token = this.generateToken(user);
return { user, token };

/* 
generateToken(user) {
    return jwt.sign(
        { 
            id: user._id,
            role: user.role.name,
            permissions: user.role.permissions.map(p => p.name)
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
} */
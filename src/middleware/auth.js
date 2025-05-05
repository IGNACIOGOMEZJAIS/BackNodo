const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'No autorizado' });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'No tiene permiso' });
        }
        next();
    };
};

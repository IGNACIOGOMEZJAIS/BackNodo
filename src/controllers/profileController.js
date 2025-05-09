const Profile = require('../models/Profile');
const User = require('../models/User');
const jwt = require('jsonwebtoken');


// Middleware para verificar permisos
const checkProfilePermissions = async (userId, profileId) => {
    const profile = await Profile.findById(profileId);
    if (!profile) {
        throw new Error('Perfil no encontrado');
    }

    // Verificar si el usuario es dueño del perfil o es el owner del perfil
    const user = await User.findById(userId).populate('role');
    if (!user) {
        throw new Error('Usuario no encontrado');
    }

    const isOwner = user.role.name === 'account_owner';
    const isProfileOwner = profile.user.toString() === userId;

    if (!isOwner && !isProfileOwner) {
        throw new Error('No tienes permiso para acceder a este perfil');
    }

    return { profile, user };
};

// Obtener todos los perfiles (solo para account_owner)
exports.getAllProfiles = async (req, res) => {
    try {
        const profiles = await Profile.find()
            .populate('user', 'username email')
            .select('-watchHistory -watchlist');

        const total = await Profile.countDocuments();

        res.status(200).json({
            status: 'success',
            results: profiles.length,
            total,
            data: { profiles }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Obtener un perfil específico
exports.getProfile = async (req, res) => {
    try {
        const { profile } = await checkProfilePermissions(req.user.id, req.params.id);

        res.status(200).json({
            status: 'success',
            data: { profile }
        });
    } catch (error) {
        res.status(404).json({
            status: 'error',
            message: error.message
        });
    }
};

// Actualizar perfil
exports.updateProfile = async (req, res) => {
    try {
        const { profile } = await checkProfilePermissions(req.user.id, req.params.id);

        const restrictedFields = ['user', 'owner'];
        restrictedFields.forEach(field => delete req.body[field]);

        Object.assign(profile, req.body);
        await profile.save();

        res.status(200).json({
            status: 'success',
            data: { profile }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Eliminar perfil
exports.deleteProfile = async (req, res) => {
    try {
        const { profile, user } = await checkProfilePermissions(req.user.id, req.params.id);

        // No permitir eliminar el perfil principal del owner
        if (profile.type === 'owner') {
            return res.status(400).json({
                status: 'error',
                message: 'No se puede eliminar el perfil principal'
            });
        }

        // Eliminar el perfil y su usuario asociado
        await Profile.findByIdAndDelete(profile._id);
        await User.findByIdAndDelete(profile.user);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Agregar película a la watchlist
exports.addToWatchlist = async (req, res) => {
    try {
        const { profile } = await checkProfilePermissions(req.user.id, req.params.id);

        const movieId = req.body.movieId;
        if (!movieId) {
            return res.status(400).json({
                status: 'error',
                message: 'Se requiere el ID de la película'
            });
        }

        // Verificar si la película ya está en la watchlist
        const alreadyInWatchlist = profile.watchlist.some(item =>
            item.movie.toString() === movieId
        );

        if (alreadyInWatchlist) {
            return res.status(400).json({
                status: 'error',
                message: 'La película ya está en la watchlist'
            });
        }

        profile.watchlist.push({ movie: movieId });
        await profile.save();

        res.status(200).json({
            status: 'success',
            data: { profile }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};


exports.getProfiles = async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).populate('role'); // Asegúrate de que role tenga _id y name
  
      const roleId = user.role._id.toString();
  
      const OWNER_ROLE_ID = '68123f3a4ac4061660a2d06b';     // Owner
      const STANDARD_ROLE_ID = '68123f3a4ac4061660a2d06c';  // Standard
      const CHILD_ROLE_ID = '68123f3a4ac4061660a2d06d';     // Child
  
      let profiles = [];
  
      if (roleId === OWNER_ROLE_ID) {
        // Owner ve todos sus perfiles
        profiles = await Profile.find({ owner: user._id });
      } else if ([STANDARD_ROLE_ID, CHILD_ROLE_ID].includes(roleId)) {
        // Standard o Child solo ven su perfil
        profiles = await Profile.find({ user: user._id });
      } else {
        return res.status(403).json({ status: 'error', message: 'No tienes permisos para ver los perfiles' });
      }
  
      res.status(200).json({ status: 'success', data: { profiles } });
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
  


// Eliminar película de la watchlist
exports.removeFromWatchlist = async (req, res) => {
    try {
        const { profile } = await checkProfilePermissions(req.user.id, req.params.id);

        const movieId = req.params.movieId;
        profile.watchlist = profile.watchlist.filter(item =>
            item.movie.toString() !== movieId
        );

        await profile.save();

        res.status(200).json({
            status: 'success',
            data: { profile }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Agregar película al historial
exports.addToWatchHistory = async (req, res) => {
    try {
        const { profile } = await checkProfilePermissions(req.user.id, req.params.id);

        const { movieId, completed = false } = req.body;
        if (!movieId) {
            return res.status(400).json({
                status: 'error',
                message: 'Se requiere el ID de la película'
            });
        }

        // Actualizar o agregar al historial
        const historyIndex = profile.watchHistory.findIndex(item =>
            item.movie.toString() === movieId
        );

        if (historyIndex >= 0) {
            profile.watchHistory[historyIndex].watchedAt = new Date();
            profile.watchHistory[historyIndex].completed = completed;
        } else {
            profile.watchHistory.push({
                movie: movieId,
                completed
            });
        }

        await profile.save();

        res.status(200).json({
            status: 'success',
            data: { profile }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

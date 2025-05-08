const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    avatar: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['owner', 'standard', 'child'],
        required: true
    },
    
}, {
    timestamps: true // ✅ Correctamente ubicado
});

profileSchema.index({ user: 1 });
profileSchema.index({ type: 1 });
profileSchema.index({ 'preferences.favoriteGenres': 1 });

module.exports = mongoose.model('Profile', profileSchema);

const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'La descripción es requerida']
    },
    genre: {
        type: String,
        required: true
      },
    rating: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
    },
    posterUrl: {
        type: String,
        default: ''
    }
}, {
    timestamps: true // ✅ acá está bien
});

movieSchema.index({ title: 'text', description: 'text' });
movieSchema.index({ rating: 1 });

module.exports = mongoose.model('Movie', movieSchema);

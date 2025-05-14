const Movie = require('../models/Movie');
const User = require('../models/User');

class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'q'];
        excludedFields.forEach(el => delete queryObj[el]);

        // Filtrado avanzado
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-releaseDate');
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    paginate() {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = (this.queryString.limit !== undefined)
            ? parseInt(this.queryString.limit, 10)
            : 10;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        return this;
    }

    search() {
        if (this.queryString.q) {
            const searchQuery = this.queryString.q;
            this.query = this.query.find({
                $or: [
                    { title: { $regex: searchQuery, $options: 'i' } },
                    { overview: { $regex: searchQuery, $options: 'i' } },
                    { genres: { $regex: searchQuery, $options: 'i' } }
                ]
            });
        }
        return this;
    }
}

// Verificar permisos de administrador
const isAdmin = async (userId) => {
    const user = await User.findById(userId).populate('role');
    return user && user.role.name === 'account_owner';
};

/**
 * Obtiene todas las películas que coinciden con los filtros y búsqueda proporcionados en la consulta.
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<void>}
 */
exports.getAllMovies = async (req, res) => {
    try {
        // Construir query con características avanzadas
        const features = new APIFeatures(Movie.find(), req.query)
            .search()
            .filter()
            .sort()
            .limitFields()
            .paginate();

        // Ejecutar query
        const movies = await features.query;
        const total = await Movie.countDocuments();

        res.status(200).json({
            status: 'success',
            results: movies.length,
            total,
            currentPage: parseInt(req.query.page, 10) || 1,
            totalPages: Math.ceil(total / (parseInt(req.query.limit, 10) || 10)),
            data: { movies }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getMovie = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);

        if (!movie) {
            return res.status(404).json({
                status: 'error',
                message: 'Película no encontrada'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { movie }
        });
    } catch (error) {
        res.status(404).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.createMovie = async (req, res) => {
    try {
        // Verificar permisos de administrador
        if (!await isAdmin(req.user.id)) {
            return res.status(403).json({
                status: 'error',
                message: 'Solo los administradores pueden crear películas'
            });
        }

        const movie = await Movie.create(req.body);

        res.status(201).json({
            status: 'success',
            data: { movie }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.updateMovie = async (req, res) => {
    try {
        // Verificar permisos de administrador
        if (!await isAdmin(req.user.id)) {
            return res.status(403).json({
                status: 'error',
                message: 'Solo los administradores pueden actualizar películas'
            });
        }

        const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!movie) {
            return res.status(404).json({
                status: 'error',
                message: 'Película no encontrada'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { movie }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.deleteMovie = async (req, res) => {
    try {
        // Verificar permisos de administrador
        if (!await isAdmin(req.user.id)) {
            return res.status(403).json({
                status: 'error',
                message: 'Solo los administradores pueden eliminar películas'
            });
        }

        const movie = await Movie.findByIdAndDelete(req.params.id);

        if (!movie) {
            return res.status(404).json({
                status: 'error',
                message: 'Película no encontrada'
            });
        }

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

// Búsqueda avanzada de películas
exports.searchMovies = async (req, res) => {
    try {
        const {
            title,
            genres,
            releaseYear,
            minRating,
            maxRating,
            sortBy,
            page = 1,
            limit = 10000
        } = req.query;

        // Construir query
        let query = {};

        if (title) {
            query.title = { $regex: title, $options: 'i' };
        }

        if (genres) {
            query.genres = { $in: genres.split(',') };
        }

        if (releaseYear) {
            query.releaseDate = {
                $gte: new Date(`${releaseYear}-01-01`),
                $lte: new Date(`${releaseYear}-12-31`)
            };
        }

        if (minRating || maxRating) {
            query.rating = {};
            if (minRating) query.rating.$gte = parseFloat(minRating);
            if (maxRating) query.rating.$lte = parseFloat(maxRating);
        }

        // Ejecutar query con paginación
        const skip = (page - 1) * limit;
        const movies = await Movie.find(query)
            .sort(sortBy || '-releaseDate')
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Movie.countDocuments(query);

        res.status(200).json({
            status: 'success',
            results: movies.length,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: { movies }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

const mongoose = require('mongoose');
const Role = require('../models/Role');
require('dotenv').config();

const roles = [
    {
        name: 'account_owner',
        description: 'Dueño de la cuenta con control total',
        permissions: [
            'manage_profiles',
            'manage_account',
            'watch_content',
            'manage_watchlist'
        ]
    },
    {
        name: 'standard_profile',
        description: 'Perfil estándar con acceso normal',
        permissions: [
            'watch_content',
            'manage_watchlist'
        ]
    },
    {
        name: 'child_profile',
        description: 'Perfil para niños con restricciones',
        permissions: [
            'watch_kids_content',
            'manage_watchlist'
        ]
    }
];

async function initRoles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/moviedb');
        console.log('Conectado a MongoDB');

        // Crear roles
        for (const role of roles) {
            await Role.findOneAndUpdate(
                { name: role.name },
                role,
                { upsert: true, new: true }
            );
            console.log(`Rol ${role.name} creado/actualizado`);
        }

        console.log('Roles inicializados correctamente');
        process.exit(0);
    } catch (error) {
        console.error('Error al inicializar roles:', error);
        process.exit(1);
    }
}

initRoles();

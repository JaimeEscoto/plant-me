const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');
const defineUser = require('./user');
const defineGarden = require('./garden');
const definePlant = require('./plant');

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  port: dbConfig.port,
  logging: dbConfig.logging,
});

const models = {};

models.User = defineUser(sequelize);
models.Garden = defineGarden(sequelize);
models.Plant = definePlant(sequelize);

models.User.hasOne(models.Garden, { foreignKey: 'usuario_id', as: 'jardin' });
models.Garden.belongsTo(models.User, { foreignKey: 'usuario_id', as: 'usuario' });

models.Garden.hasMany(models.Plant, { foreignKey: 'jardin_id', as: 'plantas' });
models.Plant.belongsTo(models.Garden, { foreignKey: 'jardin_id', as: 'jardin' });

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Garden = sequelize.define(
    'Garden',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      usuario_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      estado_salud: {
        type: DataTypes.INTEGER,
        defaultValue: 50,
        validate: {
          min: 0,
          max: 100,
        },
      },
      ultima_modificacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'jardines',
      timestamps: false,
    }
  );

  return Garden;
};

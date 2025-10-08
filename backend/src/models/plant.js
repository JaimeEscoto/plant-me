const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Plant = sequelize.define(
    'Plant',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      jardin_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tipo: {
        type: DataTypes.ENUM('positivo', 'negativo', 'neutro'),
        allowNull: false,
      },
      fecha_plantado: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'plantas',
      timestamps: false,
    }
  );

  return Plant;
};

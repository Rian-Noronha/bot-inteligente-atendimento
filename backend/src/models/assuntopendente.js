'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AssuntoPendente extends Model {
    static associate(models) {
      this.belongsTo(models.ChatConsulta, { foreignKey: 'consulta_id', as: 'consulta' });
      this.belongsTo(models.Subcategoria, { foreignKey: 'subcategoria_id', as: 'subcategoria' });
    }
  }
  AssuntoPendente.init({
    texto_assunto: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'AssuntoPendente',
    tableName: 'assuntos_pendentes'
  });
  return AssuntoPendente;
};
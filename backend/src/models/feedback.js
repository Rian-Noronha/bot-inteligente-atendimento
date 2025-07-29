'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  // CORRIGIDO: Nome da classe em PascalCase
  class Feedback extends Model {
    static associate(models) {
      this.belongsTo(models.ChatResposta, {
        foreignKey: 'resposta_id',
        as: 'resposta'
      });
    }
  }
  Feedback.init({
    nota: DataTypes.FLOAT,
    comentario: DataTypes.STRING,
    util: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Feedback', // CORRIGIDO: Nome do modelo em PascalCase
    tableName: 'feedbacks'
  });
  return Feedback;
};
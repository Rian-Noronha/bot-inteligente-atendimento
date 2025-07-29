'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SessaoAtiva extends Model {
    static associate(models) {
      this.belongsTo(models.Usuario, { 
        foreignKey: 'usuario_id', 
        as: 'usuario' 
      });
    }
  }
  SessaoAtiva.init({
    session_id: DataTypes.STRING,
    usuario_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'SessaoAtiva',
    tableName: 'sessoes_ativas' 
  });
  return SessaoAtiva;
};
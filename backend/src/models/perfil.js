'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Perfil extends Model {
    static associate(models) {
      this.hasMany(models.Usuario, {
        foreignKey: 'perfil_id',
        as: 'usuarios'
      });
    }
  }
  Perfil.init({
    nome: DataTypes.STRING,
    descricao: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Perfil',
    tableName: 'perfis'
  });
  return Perfil;
};
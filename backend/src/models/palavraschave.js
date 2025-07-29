'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PalavraChave extends Model {
    static associate(models) {
      this.belongsToMany(models.Documento, {
        through: 'documentos_palavras_chave',
        foreignKey: 'palavra_chave_id',
        as: 'documentos'
      });
    }
  }
  PalavraChave.init({
    palavra: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'PalavraChave',
    tableName: 'palavras_chave'
  });
  return PalavraChave;
};
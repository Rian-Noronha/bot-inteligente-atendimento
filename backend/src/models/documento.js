'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Documento extends Model {
    static associate(models) {
      this.belongsTo(models.Subcategoria, {
        foreignKey: 'subcategoria_id',
        as: 'subcategoria'
      });
      this.belongsToMany(models.PalavraChave, {
        through: 'documentos_palavras_chave',
        foreignKey: 'documento_id',
        as: 'palavrasChave'
      });

      this.hasMany(models.ChatResposta, {
        foreignKey: 'documento_fonte', 
        as: 'respostas'              
      });
    }
  }
  Documento.init({
    titulo: DataTypes.STRING,
    descricao: DataTypes.STRING,
    solucao: DataTypes.TEXT,
    ativo: DataTypes.BOOLEAN,
    urlArquivo: DataTypes.STRING,
    caminhoArquivo: DataTypes.STRING,
    tipoArquivo: DataTypes.STRING,
    embedding: {
      type: DataTypes.VECTOR(768), 
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Documento',
    tableName: 'documentos'
  });
  return Documento;
};
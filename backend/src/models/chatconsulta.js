'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatConsulta extends Model {
    static associate(models) {
      this.belongsTo(models.ChatSessao, { foreignKey: 'sessao_id', as: 'sessao' });
      this.belongsTo(models.Subcategoria, { foreignKey: 'subcategoria_id', as: 'subcategoria' });
      this.hasOne(models.ChatResposta, { foreignKey: 'consulta_id', as: 'resposta' });
      this.hasOne(models.AssuntoPendente, { foreignKey: 'consulta_id', as: 'assuntoPendente' });
    }
  }
  ChatConsulta.init({
    pergunta: DataTypes.TEXT,
    embedding: {
      type: DataTypes.VECTOR(768),
      allowNull: true 
    }
  }, {
    sequelize,
    modelName: 'ChatConsulta',
    tableName: 'chat_consultas'
  });
  return ChatConsulta;
};
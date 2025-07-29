'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatResposta extends Model {
    static associate(models) {
      this.belongsTo(models.ChatConsulta, { foreignKey: 'consulta_id', as: 'consulta' });
      this.belongsTo(models.Documento, { foreignKey: 'documento_fonte', as: 'fonte' });
      this.hasMany(models.Feedback, { foreignKey: 'resposta_id', as: 'feedbacks' });
    }
  }
  ChatResposta.init({
    texto_resposta: DataTypes.TEXT,
    url_fonte: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'ChatResposta',
    tableName: 'chat_respostas'
  });
  return ChatResposta;
};

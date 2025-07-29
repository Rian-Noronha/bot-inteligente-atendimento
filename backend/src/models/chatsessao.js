'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatSessao extends Model {
    static associate(models) {
      this.belongsTo(models.Usuario, {
        foreignKey: 'usuario_id',
        as: 'usuario'
      });
      this.hasMany(models.ChatConsulta, {
        foreignKey: 'sessao_id',
        as: 'consultas'
      });
    }
  }
  ChatSessao.init({
    registro_inicio: DataTypes.DATE,
    registro_fim: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'ChatSessao',
    tableName: 'chat_sessoes'
  });
  return ChatSessao;
};
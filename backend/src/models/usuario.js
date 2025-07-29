'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    static associate(models) {
      this.belongsTo(models.Perfil, {
        foreignKey: 'perfil_id',
        as: 'perfil'
      });
      this.hasMany(models.ChatSessao, {
        foreignKey: 'usuario_id',
        as: 'sessoes'
      });
     
      this.hasMany(models.SessaoAtiva, { 
        foreignKey: 'usuario_id', 
        as: 'sessoesAtivas' 
      });
    }
  }

  const hashPassword = async (usuario) => {
    if (usuario.changed('senha_hash') && usuario.senha_hash) {
      const salt = await bcrypt.genSalt(10);
      usuario.senha_hash = await bcrypt.hash(usuario.senha_hash, salt);
    }
  };

  Usuario.init({
    nome: DataTypes.STRING,
    email: DataTypes.STRING,
    senha_hash: DataTypes.STRING,
    ativo: DataTypes.BOOLEAN,
    reset_password_token: DataTypes.STRING,
    reset_password_expires: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    
    // --- lógica de scopes ---
    defaultScope: {
      // SEMPRE excluir o hash da senha das consultas
      attributes: { exclude: ['senha_hash'] },
    },
    scopes: {
      // Um "scope" nomeado, chamar para INCLUIR a senha
      withPassword: {
        attributes: { include: ['senha_hash'] },
      }
    },
    

    hooks: {
      beforeCreate: hashPassword,
      beforeUpdate: hashPassword
    }
  });

  return Usuario;
};

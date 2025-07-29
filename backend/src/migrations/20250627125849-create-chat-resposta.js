'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_respostas', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      consulta_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'chat_consultas', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      documento_fonte: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'documentos', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      texto_resposta: { type: Sequelize.STRING(500), allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('chat_respostas'); }
};

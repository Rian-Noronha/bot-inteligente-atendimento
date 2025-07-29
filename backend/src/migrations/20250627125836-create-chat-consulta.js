'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_consultas', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      sessao_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'chat_sessoes', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      subcategoria_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'subcategorias', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      pergunta: { type: Sequelize.STRING(300), allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('chat_consultas'); }
};

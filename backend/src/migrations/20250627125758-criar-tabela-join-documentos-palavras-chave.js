'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documentos_palavras_chave', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      documento_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'documentos', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      palavra_chave_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'palavras_chave', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('documentos_palavras_chave'); }
};

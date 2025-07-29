'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('assuntos_pendentes', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      consulta_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'chat_consultas', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      subcategoria_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'subcategorias', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      texto_assunto: { type: Sequelize.STRING(200), allowNull: false },
      status: { type: Sequelize.STRING(50), allowNull: false },
      datahora_sugestao: { type: Sequelize.DATE },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('assuntos_pendentes'); }
};

'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documentos', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      titulo: { type: Sequelize.STRING(100), allowNull: false },
      descricao: { type: Sequelize.STRING(500), allowNull: false },
      solucao: { type: Sequelize.STRING(500), allowNull: false },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      urlArquivo: { type: Sequelize.STRING(255), allowNull: true },
      tipoDocumento: { type: Sequelize.STRING(10), allowNull: true },
      subcategoria_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'subcategorias', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('documentos'); }
};

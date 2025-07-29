'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('perfis', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      nome: { type: Sequelize.STRING, allowNull: false },
      descricao: { type: Sequelize.STRING(300), allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('perfis'); }
};

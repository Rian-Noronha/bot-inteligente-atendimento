'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('documentos', 'tipoArquivo', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('documentos', 'tipoArquivo', {
      type: Sequelize.STRING(10),
      allowNull: true,
    });
  }
};
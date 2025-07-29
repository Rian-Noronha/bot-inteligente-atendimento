'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('documentos', 'tipoDocumento', 'tipoArquivo');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn('documentos', 'tipoArquivo', 'tipoDocumento');
  }
};
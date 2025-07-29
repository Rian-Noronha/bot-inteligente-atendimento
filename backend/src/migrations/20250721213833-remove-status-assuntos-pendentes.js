'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('assuntos_pendentes', 'status');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('assuntos_pendentes', 'status', {
      type: Sequelize.STRING(50)
    });
  }
};
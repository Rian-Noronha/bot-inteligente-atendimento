'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const VECTOR_DIMENSION = 768;
    await queryInterface.addColumn('documentos', 'embedding', {
      type: `VECTOR(${VECTOR_DIMENSION})`,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('documentos', 'embedding');
  }
};

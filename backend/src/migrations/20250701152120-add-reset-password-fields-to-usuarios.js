'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'reset_password_token', {
      type: Sequelize.STRING,
      allowNull: true, // A coluna pode ser nula, pois só terá valor durante o processo de reset
    });

    // Adiciona a coluna para a data de expiração do token
    await queryInterface.addColumn('usuarios', 'reset_password_expires', {
      type: Sequelize.DATE,
      allowNull: true, // Também pode ser nula
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuarios', 'reset_password_token');
    await queryInterface.removeColumn('usuarios', 'reset_password_expires');
  }
};
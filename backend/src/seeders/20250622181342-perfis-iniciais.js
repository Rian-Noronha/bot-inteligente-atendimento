'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('perfis', [

      {
        nome: 'Administrador',
        descricao: 'Acesso total ao sistema como manipular documentos, acesso de operadores, etc.',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        nome: 'Operador',
        descricao: 'Acesso ao chat.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('perfis', null, {});
  }
};

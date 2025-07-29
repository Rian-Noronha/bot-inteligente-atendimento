'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('categorias', [

      {
        nome: 'Cartão',
        descricao: 'Categoria correspondente ao departamento Cartão.',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        nome: 'SAC',
        descricao: 'Categoria correspondente ao serviço de atendimento ao cliente.',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        nome: 'E-Commerce',
        descricao: 'Categoria correspondente ao departamento de e-commerce.',
        createdAt: new Date(),
        updatedAt: new Date()
      }

    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('categorias', null, {});
  },

};

'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('chat_respostas', 'url_fonte', {
      type: Sequelize.STRING, 
      allowNull: true,      
      after: 'texto_resposta'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('chat_respostas', 'url_fonte');
  }
};
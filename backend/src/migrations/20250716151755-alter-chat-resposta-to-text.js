'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('chat_respostas', 'texto_resposta', {
      type: Sequelize.TEXT,
      allowNull: true 
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('chat_respostas', 'texto_resposta', {
      type: Sequelize.STRING(500),
      allowNull: true 
    });
  }
};
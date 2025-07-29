'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feedbacks', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      nota: { type: Sequelize.FLOAT },
      comentario: { type: Sequelize.STRING(300) },
      util: { type: Sequelize.BOOLEAN, allowNull: false },
      resposta_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'chat_respostas', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) { await queryInterface.dropTable('feedbacks'); }
};

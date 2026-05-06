'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user', 'birthDate', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.addColumn('user', 'cpf', {
      type: Sequelize.STRING(11),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('user', 'refreshToken', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('user', 'refreshToken');
    await queryInterface.removeColumn('user', 'cpf');
    await queryInterface.removeColumn('user', 'birthDate');
  },
};

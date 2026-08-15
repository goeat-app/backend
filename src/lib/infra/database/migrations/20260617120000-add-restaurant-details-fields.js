'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('restaurants', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('restaurants', 'whatsapp', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    await queryInterface.addColumn('restaurants', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('restaurants', 'phone');
    await queryInterface.removeColumn('restaurants', 'whatsapp');
    await queryInterface.removeColumn('restaurants', 'description');
  },
};

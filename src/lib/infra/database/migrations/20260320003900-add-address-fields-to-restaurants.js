'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('restaurants', 'address', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('restaurants', 'city', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('restaurants', 'state', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('restaurants', 'postal_code', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('restaurants', 'address');
    await queryInterface.removeColumn('restaurants', 'city');
    await queryInterface.removeColumn('restaurants', 'state');
    await queryInterface.removeColumn('restaurants', 'postal_code');
  },
};

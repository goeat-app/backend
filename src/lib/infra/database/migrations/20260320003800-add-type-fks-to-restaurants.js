'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('restaurants', 'place_type_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'place_types',
        key: 'id',
      },
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('restaurants', 'food_type_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'food_types',
        key: 'id',
      },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('restaurants', 'place_type_id');
    await queryInterface.removeColumn('restaurants', 'food_type_id');
  },
};

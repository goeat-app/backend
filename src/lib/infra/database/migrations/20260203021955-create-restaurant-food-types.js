'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('restaurant_food_types', {
      restaurant_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: {
          model: 'restaurants',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      food_type_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: {
          model: 'food_types',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('restaurant_food_types');
  },
};

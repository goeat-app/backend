'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('profile_mapping_food_type', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      profile_mapping_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'profile_mapping',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      food_type_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'food_types',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('profile_mapping_food_type');
  },
};

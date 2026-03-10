'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('restaurant_place_types', {
      restaurant_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: 'restaurants', key: 'id' },
        onDelete: 'CASCADE'
      },
      place_type_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: 'place_types', key: 'id' },
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('restaurant_place_types');
  }
};

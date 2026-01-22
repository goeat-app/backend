'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('profile_mapping_place_type', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      profileMappingId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'profile_mapping',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      placeTypeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'place_types',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Adiciona índice único para evitar duplicatas
    await queryInterface.addIndex('profile_mapping_place_type', ['profileMappingId', 'placeTypeId'], {
      unique: true,
      name: 'profile_mapping_place_type_unique_idx',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('profile_mapping_place_type');
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('menu_item_sizes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      menu_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'menu_items',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex('menu_item_sizes', ['menu_item_id']);
    await queryInterface.addIndex('menu_item_sizes', ['menu_item_id', 'sort_order']);
    await queryInterface.addIndex('menu_item_sizes', ['menu_item_id', 'label'], {
      unique: true,
      name: 'menu_item_sizes_item_label_unique_active',
      where: {
        deleted_at: null,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('menu_item_sizes');
  },
};

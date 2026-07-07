'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('restaurants', 'provider', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('restaurants', 'provider_place_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('restaurants', 'primary_type', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('restaurants', 'types', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    });
    await queryInterface.addColumn('restaurants', 'price_level', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('restaurants', 'google_rating', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('restaurants', 'google_rating_count', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('restaurants', 'business_status', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('restaurants', 'opening_hours', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('restaurants', 'website', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('restaurants', 'editorial_summary', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('restaurants', 'first_seen_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('restaurants', 'last_seen_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('restaurants', 'last_synced_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addConstraint('restaurants', {
      fields: ['provider', 'provider_place_id'],
      type: 'unique',
      name: 'restaurants_provider_place_id_unique',
    });

    await queryInterface.addIndex(
      'restaurants',
      ['provider', 'provider_place_id'],
      {
        name: 'idx_restaurants_provider_place_id',
      },
    );
    await queryInterface.addIndex('restaurants', ['latitude', 'longitude'], {
      name: 'idx_restaurants_location',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('restaurants', 'idx_restaurants_location');
    await queryInterface.removeIndex(
      'restaurants',
      'idx_restaurants_provider_place_id',
    );
    await queryInterface.removeConstraint(
      'restaurants',
      'restaurants_provider_place_id_unique',
    );

    await queryInterface.removeColumn('restaurants', 'last_synced_at');
    await queryInterface.removeColumn('restaurants', 'last_seen_at');
    await queryInterface.removeColumn('restaurants', 'first_seen_at');
    await queryInterface.removeColumn('restaurants', 'editorial_summary');
    await queryInterface.removeColumn('restaurants', 'website');
    await queryInterface.removeColumn('restaurants', 'opening_hours');
    await queryInterface.removeColumn('restaurants', 'business_status');
    await queryInterface.removeColumn('restaurants', 'google_rating_count');
    await queryInterface.removeColumn('restaurants', 'google_rating');
    await queryInterface.removeColumn('restaurants', 'price_level');
    await queryInterface.removeColumn('restaurants', 'types');
    await queryInterface.removeColumn('restaurants', 'primary_type');
    await queryInterface.removeColumn('restaurants', 'provider_place_id');
    await queryInterface.removeColumn('restaurants', 'provider');
  },
};

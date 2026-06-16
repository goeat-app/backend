'use strict';

const { randomUUID } = require('crypto');
const {
  curatedCampinasRestaurants,
} = require('./data/curated-campinas-restaurants');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const restaurant of curatedCampinasRestaurants) {
        await queryInterface.sequelize.query(
          `
          INSERT INTO restaurants (
            id, name, slug, place_type_id, food_type_id,
            average_rating, total_reviews, average_price,
            address, city, state, postal_code,
            latitude, longitude, is_active
          )
          VALUES (
            :id, :name, :slug, :place_type_id, :food_type_id,
            :average_rating, :total_reviews, :average_price,
            :address, :city, :state, :postal_code,
            :latitude, :longitude, :is_active
          )
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            place_type_id = EXCLUDED.place_type_id,
            food_type_id = EXCLUDED.food_type_id,
            average_rating = EXCLUDED.average_rating,
            total_reviews = EXCLUDED.total_reviews,
            average_price = EXCLUDED.average_price,
            address = EXCLUDED.address,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            postal_code = EXCLUDED.postal_code,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            is_active = EXCLUDED.is_active
          `,
          {
            replacements: {
              id: randomUUID(),
              name: restaurant.name,
              slug: restaurant.slug,
              place_type_id: restaurant.place_type_id,
              food_type_id: restaurant.food_type_id,
              average_rating: restaurant.average_rating,
              total_reviews: restaurant.total_reviews,
              average_price: restaurant.average_price,
              address: restaurant.address,
              city: restaurant.city,
              state: restaurant.state,
              postal_code: restaurant.postal_code,
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
              is_active: restaurant.is_active,
            },
            transaction,
          },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    const slugs = curatedCampinasRestaurants.map((r) => r.slug);

    await queryInterface.bulkDelete(
      'restaurants',
      { slug: { [Sequelize.Op.in]: slugs } },
      {},
    );
  },
};

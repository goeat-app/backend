'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const foodTypes = [
      {
        id: 'c7873d71-7940-41f2-83a2-ee948c0b542f',
        name: 'Frutos do Mar',
        slug: 'seafood',
        icon_key: 'seafood',
        created_at: '2026-03-12 23:02:57.386+00',
        updated_at: '2026-03-12 23:02:57.386+00',
      },
      {
        id: '6d8d8c3c-4b80-4c17-80b8-8644162eba8a',
        name: 'Vegetariano',
        slug: 'vegetarian',
        icon_key: 'vegetarian',
        created_at: '2026-03-12 23:02:58.001+00',
        updated_at: '2026-03-12 23:02:58.001+00',
      },
      {
        id: '714ef106-cdf6-4f15-9ad0-b231c658adb6',
        name: 'Sanduíches',
        slug: 'sandwiches',
        icon_key: 'sadwiches',
        created_at: '2026-03-12 23:02:56.85+00',
        updated_at: '2026-03-12 23:02:56.85+00',
      },
      {
        id: '24cd3be1-1a85-42a8-af98-24a9ea6a1e77',
        name: 'Saudável',
        slug: 'healthy',
        icon_key: 'romantic-env',
        created_at: '2026-03-12 23:02:56.365+00',
        updated_at: '2026-03-12 23:02:56.365+00',
      },
      {
        id: 'ac27d44e-ee37-4cdf-9a48-504f4a90fbc5',
        name: 'Asiática',
        slug: 'asian-food',
        icon_key: 'asian-food',
        created_at: '2026-03-12 23:02:53.701+00',
        updated_at: '2026-03-12 23:02:53.701+00',
      },
      {
        id: '8ca27942-0f99-4ac5-a85d-4f6650e527a2',
        name: 'Mexicana',
        slug: 'mexican-food',
        icon_key: 'mexican-food',
        created_at: '2026-03-12 23:02:55.749+00',
        updated_at: '2026-03-12 23:02:55.749+00',
      },
      {
        id: '23eaf8a9-c31d-4838-ae4d-a920e7725f4e',
        name: 'Italiana',
        slug: 'italian-food',
        icon_key: 'italian-food',
        created_at: '2026-03-12 23:02:54.981+00',
        updated_at: '2026-03-12 23:02:54.981+00',
      },
      {
        id: 'aca794b3-cafc-4f0e-be34-fd3ecec1b8e8',
        name: 'Brasileira',
        slug: 'brazilian-food',
        icon_key: 'brazilian-food',
        created_at: '2026-03-12 23:02:54.314+00',
        updated_at: '2026-03-12 23:02:54.314+00',
      },
      {
        id: 'c0b8ff07-9544-47af-af61-f2dfa0cfb441',
        name: 'Árabe',
        slug: 'arabian-food',
        icon_key: 'arabian-food',
        created_at: '2026-03-12 23:02:52.978+00',
        updated_at: '2026-03-12 23:02:52.978+00',
      },
    ];

    const placeTypes = [
      {
        id: '25f31cd6-79b4-4a43-bc31-f0edc1e57ee8',
        name: 'Bistrô',
        slug: 'bistro-env',
        icon_key: 'bistro-env',
        created_at: '2026-03-12 23:02:58.613+00',
        updated_at: '2026-03-12 23:02:58.613+00',
      },
      {
        id: 'f66a7db9-6bc4-4770-b74d-8a95f6a43ed4',
        name: 'Café',
        slug: 'cafe-env',
        icon_key: 'cafe-env',
        created_at: '2026-03-12 23:02:59.228+00',
        updated_at: '2026-03-12 23:02:59.228+00',
      },
      {
        id: '85a8bddc-c139-49f8-a4c6-496c9bde26be',
        name: 'Agitado',
        slug: 'excited-env',
        icon_key: 'excited-env',
        created_at: '2026-03-12 23:02:59.944+00',
        updated_at: '2026-03-12 23:02:59.944+00',
      },
      {
        id: 'db945c14-7d20-4c62-9776-ec251ce89c32',
        name: 'Fast Food',
        slug: 'fast-food-env',
        icon_key: 'fast-food-env',
        created_at: '2026-03-12 23:03:00.73+00',
        updated_at: '2026-03-12 23:03:00.73+00',
      },
      {
        id: 'd5bfd5bd-5828-4e7b-aa7f-134d03ac4971',
        name: 'Divertido',
        slug: 'fun-env',
        icon_key: 'fun-env',
        created_at: '2026-03-12 23:03:01.889+00',
        updated_at: '2026-03-12 23:03:01.889+00',
      },
      {
        id: '50da815c-daa9-4a8f-9f2a-9b670e598e36',
        name: 'Rodízio',
        slug: 'rodizio-env',
        icon_key: 'rodizio-env',
        created_at: '2026-03-12 23:03:02.505+00',
        updated_at: '2026-03-12 23:03:02.505+00',
      },
      {
        id: '3e3e7ad8-3317-4f15-92a7-2bf8cddb44af',
        name: 'Romântico',
        slug: 'romantic-env',
        icon_key: 'romantic-env',
        created_at: '2026-03-12 23:03:03.119+00',
        updated_at: '2026-03-12 23:03:03.119+00',
      },
      {
        id: '25e24f2f-d4b1-4665-bc34-8b63eebb8708',
        name: 'Temático',
        slug: 'thematic-env',
        icon_key: 'thematic-env',
        created_at: '2026-03-12 23:03:03.732+00',
        updated_at: '2026-03-12 23:03:03.732+00',
      },
    ];

    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const item of foodTypes) {
        await queryInterface.sequelize.query(
          `
          INSERT INTO food_types (id, name, slug, icon_key, created_at, updated_at)
          VALUES (:id, :name, :slug, :icon_key, :created_at, :updated_at)
          ON CONFLICT (slug)
          DO UPDATE SET
            name = EXCLUDED.name,
            icon_key = EXCLUDED.icon_key,
            updated_at = EXCLUDED.updated_at
          `,
          {
            replacements: item,
            transaction,
          },
        );
      }

      for (const item of placeTypes) {
        await queryInterface.sequelize.query(
          `
          INSERT INTO place_types (id, name, slug, icon_key, created_at, updated_at)
          VALUES (:id, :name, :slug, :icon_key, :created_at, :updated_at)
          ON CONFLICT (slug)
          DO UPDATE SET
            name = EXCLUDED.name,
            icon_key = EXCLUDED.icon_key,
            updated_at = EXCLUDED.updated_at
          `,
          {
            replacements: item,
            transaction,
          },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    const foodTypeSlugs = [
      'seafood',
      'vegetarian',
      'sandwiches',
      'healthy',
      'asian-food',
      'mexican-food',
      'italian-food',
      'brazilian-food',
      'arabian-food',
    ];

    const placeTypeSlugs = [
      'bistro-env',
      'cafe-env',
      'excited-env',
      'fast-food-env',
      'fun-env',
      'rodizio-env',
      'romantic-env',
      'thematic-env',
    ];

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        'food_types',
        {
          slug: {
            [Sequelize.Op.in]: foodTypeSlugs,
          },
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'place_types',
        {
          slug: {
            [Sequelize.Op.in]: placeTypeSlugs,
          },
        },
        { transaction },
      );
    });
  },
};

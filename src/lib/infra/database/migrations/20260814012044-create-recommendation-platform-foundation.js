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
    await queryInterface.addColumn('restaurants', 'website', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('restaurants', 'editorial_summary', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addConstraint('restaurants', {
      fields: ['provider', 'provider_place_id'],
      type: 'unique',
      name: 'restaurants_provider_place_id_unique',
    });

    await queryInterface.createTable('user_preferences', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      favorite_cuisines: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      preferred_ambiance: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      budget_level: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addConstraint('user_preferences', {
      fields: ['user_id'],
      type: 'unique',
      name: 'user_preferences_user_id_unique',
    });

    await queryInterface.createTable('user_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      profile_version: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cuisine_affinities: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      ambiance_affinities: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      budget_affinity: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addConstraint('user_profiles', {
      fields: ['user_id'],
      type: 'unique',
      name: 'user_profiles_user_id_unique',
    });

    await queryInterface.createTable('recommendation_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false,
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false,
      },
      radius_meters: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      strategy: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      model_version: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      feature_version: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      candidate_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      config_snapshot: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      fallback_reason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      generated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.createTable('recommendations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'recommendation_sessions',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      restaurant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'restaurants',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      score: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      score_breakdown: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.createTable('recommendation_interactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      recommendation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'recommendations',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      interaction_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      value: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.createTable('restaurant_ratings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      restaurant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'restaurants',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      comment: {
        type: Sequelize.TEXT,
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

    await queryInterface.addConstraint('restaurant_ratings', {
      fields: ['user_id', 'restaurant_id'],
      type: 'unique',
      name: 'restaurant_ratings_user_restaurant_unique',
    });

    await queryInterface.createTable('recommendation_feedback_state', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      recommendation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'recommendations',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      current_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addConstraint('recommendation_feedback_state', {
      fields: ['recommendation_id', 'user_id'],
      type: 'unique',
      name: 'recommendation_feedback_state_recommendation_user_unique',
    });

    await queryInterface.createTable('ml_models', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      model_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      version: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      feature_version: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      training_dataset_version: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      metrics: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      artifact_uri: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      deployed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addConstraint('ml_models', {
      fields: ['model_name', 'version'],
      type: 'unique',
      name: 'ml_models_model_name_version_unique',
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
    await queryInterface.addIndex(
      'recommendation_sessions',
      ['user_id', 'generated_at'],
      {
        name: 'idx_recommendation_sessions_user',
        order: [['generated_at', 'DESC']],
      },
    );
    await queryInterface.addIndex('recommendations', ['session_id'], {
      name: 'idx_recommendations_session',
    });
    await queryInterface.addIndex(
      'recommendation_interactions',
      ['user_id', 'created_at'],
      {
        name: 'idx_interactions_user',
        order: [['created_at', 'DESC']],
      },
    );
    await queryInterface.addIndex('restaurant_ratings', ['restaurant_id'], {
      name: 'idx_ratings_restaurant',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ml_models');
    await queryInterface.dropTable('recommendation_feedback_state');
    await queryInterface.dropTable('restaurant_ratings');
    await queryInterface.dropTable('recommendation_interactions');
    await queryInterface.dropTable('recommendations');
    await queryInterface.dropTable('recommendation_sessions');
    await queryInterface.dropTable('user_profiles');
    await queryInterface.dropTable('user_preferences');

    await queryInterface.removeConstraint(
      'restaurants',
      'restaurants_provider_place_id_unique',
    );
    await queryInterface.removeIndex('restaurants', 'idx_restaurants_location');
    await queryInterface.removeIndex(
      'restaurants',
      'idx_restaurants_provider_place_id',
    );

    await queryInterface.removeColumn('restaurants', 'website');
    await queryInterface.removeColumn('restaurants', 'editorial_summary');
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

require('dotenv').config();

const baseConfig = {
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
  dialectOptions: {
    ...(process.env.NODE_ENV === 'production'
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {}),
    family: 4,
  },
};

module.exports = {
  development: {
    ...baseConfig,
  },
  production: {
    ...baseConfig,
  },
  test: {
    ...baseConfig,
  },
};

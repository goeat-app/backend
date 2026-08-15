const sequelizeCliConfig = require('./sequelize-cli.config');

describe('sequelize-cli config', () => {
  it('exports configuration for both development and production environments', () => {
    expect(sequelizeCliConfig).toHaveProperty('development');
    expect(sequelizeCliConfig).toHaveProperty('production');
    expect(sequelizeCliConfig.development.dialect).toBe('postgres');
    expect(sequelizeCliConfig.production.dialect).toBe('postgres');
  });
});

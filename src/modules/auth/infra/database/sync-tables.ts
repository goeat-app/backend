import { sequelize } from './sequelize-instance';
import { UserModel } from './user.model';

async function syncTables() {
  try {
    await sequelize.authenticate();
    await UserModel.sync();
    console.log('Tabelas sincronizadas com sucesso!');
  } catch (error) {
    console.error('Erro ao sincronizar tabelas:', error);
  } finally {
    await sequelize.close();
  }
}

export { syncTables };

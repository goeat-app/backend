import { sequelize } from './sequelize-instance'; 
import { User } from '../../user/user.model';     

async function syncTables() {
  try {
    await sequelize.authenticate();
    await User.sync();
    console.log('Tabelas sincronizadas com sucesso!');
  } catch (error) {
    console.error('Erro ao sincronizar tabelas:', error);
  } finally {
    await sequelize.close();
  }
}

export { syncTables };
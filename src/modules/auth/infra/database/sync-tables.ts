import { FoodTypeModel } from '@/modules/profileMapping/infra/database/food-type.model';
import { sequelize } from './sequelize-instance';
import { UserModel } from './user.model';
import { PlaceTypeModel } from '@/modules/profileMapping/infra/database/place-type.model';
import { ProfileMappingModel } from '@/modules/profileMapping/infra/database/profile-mapping-model';
import { ProfileMappingPlaceTypeModel } from '@/modules/profileMapping/infra/database/profile-mapping-place-type.model';
import { ProfileMappingFoodTypeModel } from '@/modules/profileMapping/infra/database/profile-mapping-food-type.model';

async function syncTables() {
  try {
    await sequelize.authenticate();
    await UserModel.sync();
    await FoodTypeModel.sync();
    await PlaceTypeModel.sync();
    await ProfileMappingModel.sync();
    await ProfileMappingPlaceTypeModel.sync();
    await ProfileMappingFoodTypeModel.sync();
    console.log('Tabelas sincronizadas com sucesso!');
  } catch (error) {
    console.error('Erro ao sincronizar tabelas:', error);
  } finally {
    await sequelize.close();
  }
}

export { syncTables };

import { UserPreferenceEntity } from '../../entities/user-preference.entity';

export interface UpsertUserPreferencesInput {
  userId: string;
  favoriteCuisines: string[];
  preferredAmbiance: string[];
  budgetLevel: number | null;
}

export abstract class IUserPreferenceRepository {
  abstract findUserPreferencesByUserId(
    userId: string,
  ): Promise<UserPreferenceEntity | null>;

  abstract upsertUserPreferences(
    input: UpsertUserPreferencesInput,
  ): Promise<UserPreferenceEntity>;
}

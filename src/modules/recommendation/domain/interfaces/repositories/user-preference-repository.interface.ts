import { UserPreferenceEntity } from '../../entities/user-preference.entity';

export abstract class IUserPreferenceRepository {
  abstract findUserPreferencesByUserId(
    userId: string,
  ): Promise<UserPreferenceEntity | null>;
}

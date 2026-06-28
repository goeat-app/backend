import { Injectable } from '@nestjs/common';
import { IUserPreferenceRepository } from '@/modules/recommendation/domain/interfaces/repositories/user-preference-repository.interface';
import { UpsertUserPreferencesBody } from '../dtos/request/upsert-user-preferences.dto';
import { UserPreferencesResponseDto } from '../dtos/response/user-preferences-response.dto';

@Injectable()
export class UpsertUserPreferencesUseCase {
  constructor(
    private readonly userPreferenceRepository: IUserPreferenceRepository,
  ) {}

  async execute(
    userId: string,
    input: UpsertUserPreferencesBody,
  ): Promise<UserPreferencesResponseDto> {
    const preferences =
      await this.userPreferenceRepository.upsertUserPreferences({
        userId,
        favoriteCuisines: input.favoriteCuisines,
        preferredAmbiance: input.preferredAmbiance,
        budgetLevel: input.budgetLevel ?? null,
      });

    return {
      favoriteCuisines: preferences.favoriteCuisines,
      preferredAmbiance: preferences.preferredAmbiance,
      budgetLevel: preferences.budgetLevel,
    };
  }
}

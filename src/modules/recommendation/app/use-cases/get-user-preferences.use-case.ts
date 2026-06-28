import { Injectable } from '@nestjs/common';
import { IUserPreferenceRepository } from '@/modules/recommendation/domain/interfaces/repositories/user-preference-repository.interface';
import { UserPreferencesResponseDto } from '../dtos/response/user-preferences-response.dto';

@Injectable()
export class GetUserPreferencesUseCase {
  constructor(
    private readonly userPreferenceRepository: IUserPreferenceRepository,
  ) {}

  async execute(userId: string): Promise<UserPreferencesResponseDto> {
    const preferences =
      await this.userPreferenceRepository.findUserPreferencesByUserId(userId);

    return {
      favoriteCuisines: preferences?.favoriteCuisines ?? [],
      preferredAmbiance: preferences?.preferredAmbiance ?? [],
      budgetLevel: preferences?.budgetLevel ?? null,
    };
  }
}

import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { UserModel } from '@/modules/auth/infra/database/user.model';
import { FirebaseAuthGuard } from '@/modules/auth/infra/firebase/firebase-auth.guard';
import { UpsertUserPreferencesDto } from '../../app/dtos/request/upsert-user-preferences.dto';
import { UserPreferencesResponseDto } from '../../app/dtos/response/user-preferences-response.dto';
import { GetUserPreferencesUseCase } from '../../app/use-cases/get-user-preferences.use-case';
import { UpsertUserPreferencesUseCase } from '../../app/use-cases/upsert-user-preferences.use-case';

@Controller('users/me/preferences')
export class UserPreferencesController {
  constructor(
    private readonly getUserPreferencesUseCase: GetUserPreferencesUseCase,
    private readonly upsertUserPreferencesUseCase: UpsertUserPreferencesUseCase,
  ) {}

  @Get()
  @UseGuards(FirebaseAuthGuard)
  async getPreferences(
    @Req() req: Request & { user: UserModel },
  ): Promise<UserPreferencesResponseDto> {
    return this.getUserPreferencesUseCase.execute(req.user.id);
  }

  @Put()
  @UseGuards(FirebaseAuthGuard)
  async upsertPreferences(
    @Body() body: UpsertUserPreferencesDto,
    @Req() req: Request & { user: UserModel },
  ): Promise<UserPreferencesResponseDto> {
    return this.upsertUserPreferencesUseCase.execute(req.user.id, body);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProfileMappingUseCase } from '../../app/use-cases/profile-mapping.use-case';
import { CreateProfileMappingDto } from '../../dtos/create-profile.dto';
import { FirebaseAuthGuard } from '@/modules/auth/infra/firebase/firebase-auth.guard';
import { UserModel } from '@/modules/auth/infra/database/user.model';
import { ProfileMappingResponseType } from '../../dtos/profile-response.dto';

@Controller('profile-mapping')
export class ProfileMappingController {
  constructor(private readonly profileMappingUseCase: ProfileMappingUseCase) {}

  @UseGuards(FirebaseAuthGuard)
  @Get()
  getAuthenticatedUserProfileMapping(
    @Req() req: Request & { user: UserModel },
  ): Promise<ProfileMappingResponseType> {
    return this.profileMappingUseCase.getProfileMapping(req.user.id);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post()
  @HttpCode(201)
  create(
    @Body() userProfile: CreateProfileMappingDto,
    @Req() req: Request & { user: UserModel },
  ): Promise<void> {
    return this.profileMappingUseCase.createProfileMapping(
      req.user.id,
      userProfile,
    );
  }
}

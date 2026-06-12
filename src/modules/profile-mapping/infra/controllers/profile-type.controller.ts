import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
//import { JwtAuthGuard } from '@/modules/auth/infra/jwt/jwt-auth.guard';
import { ProfileMappingUseCase } from '../../app/use-cases/profile-mapping.use-case';
import { CreateProfileMappingDto } from '../../dtos/create-profile.dto';
import { FirebaseAuthGuard } from '@/modules/auth/infra/firebase/firebase-auth.guard';
import { UserModel } from '@/modules/auth/infra/database/user.model';

@Controller('profile-mapping')
export class ProfileMappingController {
  constructor(private readonly profileMappingUseCase: ProfileMappingUseCase) {}

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

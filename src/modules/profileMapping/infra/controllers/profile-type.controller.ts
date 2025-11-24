import { Controller, Post, Body, Query, Get, HttpCode } from '@nestjs/common';
//import { JwtAuthGuard } from '@/modules/auth/infra/jwt/jwt-auth.guard';
import { ProfileMappingUseCase } from '../../app/use-cases/profile-mapping.use-case';
import { CreateProfileMappingDto } from '../../dtos/create-profile.dto';

@Controller('profile-mapping')
export class ProfileMappingController {
  constructor(private readonly profileMappingUseCase: ProfileMappingUseCase) { }

  //@UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(201)
  create(@Body() userProfile: CreateProfileMappingDto) {
    return this.profileMappingUseCase.createProfileMapping(userProfile);
  }

  //@UseGuards(JwtAuthGuard)
  @Get('by-user')
  getByUserId(@Query('id') userId: string) {
    return this.profileMappingUseCase.getProfileMappingById(userId);
  }
}

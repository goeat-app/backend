import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UpdateUserDto } from '../../dtos/update-user.dto';
import { UserProfileService } from '../../app/services/user-profile.service';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';

@Controller('profile')
export class ProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(FirebaseAuthGuard)
  @Put()
  async updateProfile(
    @Body() body: UpdateUserDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    try {
      await this.userProfileService.updateUser({
        firebaseUid: req.user.id,
        name: body.name,
        phone: body.phone,
      });
    } catch (error) {
      console.error('Profile update error:', error);

      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Profile update failed',
      );
    }
  }
}

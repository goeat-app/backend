import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UpdateUserDto } from '../../dtos/update-user.dto';
import { UserProfileService } from '../../app/services/user-profile.service';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';
import { UserModel } from '../database/user.model';

@Controller('profile')
export class ProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(FirebaseAuthGuard)
  @Put()
  async updateProfile(
    @Body() body: UpdateUserDto,
    @Req() req: Request & { user: UserModel },
  ) {
    await this.userProfileService.updateUser({
      user: req.user,
      name: body.name,
      phone: body.phone,
    });
  }
}

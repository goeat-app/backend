import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/modules/auth/infra/jwt/jwt-auth.guard';
import { RestaurantRole } from '@/modules/restaurant-access/domain/enums/restaurant-role.enum';
import { RestaurantRoles } from '@/modules/restaurant-access/infra/auth/restaurant-roles.decorator';
import { RestaurantRolesGuard } from '@/modules/restaurant-access/infra/auth/restaurant-roles.guard';
import { UploadRestaurantImageUseCase } from '../../app/use-cases/upload-restaurant-image.use-case';
import { DeleteRestaurantImageUseCase } from '../../app/use-cases/delete-restaurant-image.use-case';
import { UploadImageResponseDto } from '../../dtos/upload-image-response.dto';

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

@UseGuards(JwtAuthGuard, RestaurantRolesGuard)
@Controller('restaurants')
export class RestaurantImagesController {
  constructor(
    private readonly uploadUseCase: UploadRestaurantImageUseCase,
    private readonly deleteUseCase: DeleteRestaurantImageUseCase,
  ) {}

  @Post(':restaurantId/images')
  @HttpCode(201)
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('restaurantId') restaurantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('is_cover') isCover?: string,
  ): Promise<UploadImageResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of 30MB`,
      );
    }

    // Validate file type
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${ALLOWED_MIMETYPES.join(', ')}`,
      );
    }

    return this.uploadUseCase.execute({
      restaurantId,
      buffer: file.buffer,
      mimetype: file.mimetype,
      isCover: isCover === 'true',
    });
  }

  @Delete(':restaurantId/images/:imageId')
  @HttpCode(204)
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async deleteImage(
    @Param('restaurantId') restaurantId: string,
    @Param('imageId') imageId: string,
  ): Promise<void> {
    return this.deleteUseCase.execute({ imageId, restaurantId });
  }
}

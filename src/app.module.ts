import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModel } from './modules/auth/infra/database/user.model';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.HOST!,
      port: parseInt(process.env.PORT!),
      username: process.env.USER!,
      password: process.env.PASSWORD!,
      database: process.env.DATABASE!,
      autoLoadModels: false,
      synchronize: true,
      models: [UserModel],
    }),
  ],
})
export class AppModule {}

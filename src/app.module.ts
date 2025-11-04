import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModule } from './user/user.module';
import { JwtAuthModule } from './infrastructure/jwt/jwt.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './user/user.model';

@Module({
  imports: [
    UserModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.HOST!,
      port: parseInt(process.env.PORT!),
      username: process.env.USER!,
      password: process.env.PASSWORD!,
      database: process.env.DATABASE!,
      autoLoadModels: false, //manter false                                                                                                                             
      synchronize: true,
      models: [User]
    })
    ,
    JwtAuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }


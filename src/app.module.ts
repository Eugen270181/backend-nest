import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { CoreModule } from './core/core.module';
import { TestingModule } from './modules/testing/testing.module';
import { BloggersPlatformModule } from './modules/blogers-platform/bloggers-platform.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/nest-blogger-platform'), // Укажите свой URL MongoDB
    CoreModule,
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

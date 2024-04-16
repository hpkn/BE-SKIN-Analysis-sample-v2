import { Module } from '@nestjs/common';
// import { PassportModule } from '@nestjs/passport';
// import { ApiKeyStrategy } from './apikey.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [],
    exports: [],
})
export class ApiKeyModule {}

// src/apikey.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy) {
    // private readonly validApiKeys = [, '5f67428e-96b1-4353-b928-9efea88245e6']; // Replace with your valid API keys

    constructor(private readonly configService: ConfigService) {
        super();
    }

    validate(apiKey: string) {
        console.log('checking', apiKey);
        if (this.configService.get<string>('API_KEY') === apiKey) {
            return true;
        }
        new UnauthorizedException();
    }
}

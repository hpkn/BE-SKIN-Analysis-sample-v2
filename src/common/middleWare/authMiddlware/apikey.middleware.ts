import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
    private readonly secretKey = process.env.API_KEY;

    use(req: Request, res: Response, next: NextFunction) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            console.log(token);
            if (this.secretKey !== token) {
                // Token not provided, handle accordingly (e.g., return unauthorized response)
                return res.status(403).send({
                    status: 10002,
                    type: 'AuthenticationError',
                    message: {
                        en: 'You are unauthorized, try refreshing the page.',
                    },
                });
            }
            // return decoded;
            // Do further verification or processing if needed
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).send({
                    status: 10000,
                    type: 'TokenExpiredError',
                    message: {
                        en: 'Your token is expired',
                    },
                });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(401).send({
                    status: 10001,
                    type: 'JsonWebTokenError',
                    message: {
                        en: 'Invalid access token',
                    },
                });
            } else if (err.name === 'NotBeforeError') {
                return res.status(401).send({
                    status: 10003,
                    type: 'JsonWebTokenError',
                    message: {
                        en: err.message,
                    },
                });
            }
            return res.status(403).send({
                status: 10002,
                type: 'AuthenticationError',
                message: {
                    en: 'You are unauthorized, try refreshing the page.',
                },
            });
        }
    }
}

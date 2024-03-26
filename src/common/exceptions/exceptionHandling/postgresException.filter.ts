import { Injectable, NestMiddleware, HttpException, HttpStatus, Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response, NextFunction } from 'express';
import { Pool, DatabaseError } from 'pg';
import { errorMappings } from './interface/postgres.interface';

@Catch(DatabaseError)
export class DatabaseErrorException extends BaseExceptionFilter {
    catch(exception: DatabaseError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const errorCode = exception.code;
        const errMapping = errorMappings[errorCode];

        if (errMapping) {
            const { status, message } = errorMappings;
            message: `${message}`;
        } else {
            exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
            super.catch(exception, host); // Handle unknown error codes
        }
    }
}
// @Injectable()
// export class PostgresErrorMiddleware implements NestMiddleware {
//     constructor(private readonly pool: Pool) {} // Inject the PostgreSQL pool

//     async use(req: Request, res: Response, next: NextFunction) {
//         try {
//             await next(); // Execute the next middleware or route handler
//         } catch (error) {
//             if (error instanceof HttpException) {
//                 // Pass HTTP exceptions to the default error handler
//                 next(error);
//             } else if (this.isPostgresError(error)) {
//                 // Handle PostgreSQL-related errors
//                 console.error('PostgreSQL Error:', error.message);
//                 res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
//             } else {
//                 // Pass other errors to the default error handler
//                 next(error);
//             }
//         }
//     }

//     private isPostgresError(error: any): boolean {
//         // Check if the error is a PostgreSQL error
//         return error && error.code && error.severity && error.detail;
//     }
// }

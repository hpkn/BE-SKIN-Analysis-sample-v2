import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import * as nodemailer from 'nodemailer';

import {
    CustomHttpExceptionResponse,
    HttpExceptionResponse,
} from '../exceptionHandling/interface/http-exception.interface';
import { ErrorOccurrences } from './interface/error-occurence.interface';

@Catch(Error)
export class ErrorNotificationFilter implements ExceptionFilter {
    private errorOccurrences: ErrorOccurrences = {};

    catch(exception: unknown, host: ArgumentsHost) {

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        let status: HttpStatus;
        let errorMessage: string;
        console.log(exception);

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const errorResponse = exception.getResponse();

            errorMessage = (errorResponse as HttpExceptionResponse)?.error || exception?.message;
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;

            errorMessage = 'Database Error!';
        }

        const errorResponse = this.getErrorResponse(status, errorMessage, request);

        const errorKey = `${request.method}-${request.url}-${request.headers.host}`;
        if (!this.errorOccurrences[errorKey]) {
            this.errorOccurrences[errorKey] = { count: 0, lastOccurred: Date.now() };
        }

        this.errorOccurrences[errorKey].count++;

        if (
            this.errorOccurrences[errorKey].count === Number(process.env.THRESHOLD) &&
            Date.now() - this.errorOccurrences[errorKey].lastOccurred <= Number(process.env.TIMEFRAME)
        ) {
            this.errorOccurrences[errorKey].count = 0;
            this.errorOccurrences[errorKey].lastOccurred = Date.now();
            this.sendEmailNotification(errorResponse, request, exception);
        }

        response.status(status).json(errorResponse);
    }

    private sendEmailNotification = async (
        errorResponse: CustomHttpExceptionResponse,
        request: Request,
        exception: unknown,
    ) => {
        const { statusCode, error } = errorResponse;
        const { method, url } = request;
        const { impactAssessment, recommendedActions } = this.generateErrorDetails(exception);

        const kr_time = new Date().toLocaleString();
        const location = request.headers.host;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.RECIPIENT_EMAIL,
            subject: `Critical Error Alert: API Service Down`,
            html: `
                <p><strong>Timestamp:</strong> ${kr_time}</p>
                <p><strong>Error:</strong> ${errorResponse.error}</p>
                <p><strong>Status Code:</strong> ${JSON.stringify(statusCode)}</p>
                <p><strong>Error Log:</strong> ${JSON.stringify(
                exception instanceof HttpException ? exception.stack : error,
            )}</p>
                <p><strong>Endpoint:</strong> ${url}</p>
                <p><strong>Method:</strong> ${method}</p>
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Impact Assessment:</strong> ${impactAssessment}</p>
                <p><strong>Recommanded Actions:</strong> ${recommendedActions}</p>
                <p><strong>Contact Information:</strong> ${process.env.CONTACT_INFO}</p>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending email notification:', error);
        }
    };

    private getErrorResponse = (
        status: HttpStatus,
        errorMessage: string,
        request: Request,
    ): CustomHttpExceptionResponse => ({
        statusCode: status,
        error: errorMessage,
        path: request.url,
        method: request.method,
        timeStamp: new Date(),
    });

    private generateErrorDetails(exception: any): { impactAssessment: string, recommendedActions: string } {
        let impactAssessment = '';
        let recommendedActions = '';

        // Check the type of exception
        if (exception.status === 404) {
            // For 404 Not Found
            impactAssessment = 'The requested resource or endpoint is not found, resulting in a "Not Found" error.';
            recommendedActions = 'Check the requested URL and ensure that the corresponding route is correctly configured in the application. Verify that the server is running and accessible.';
        } else if (exception.status === 400) {
            // For 400 Bad Request
            if (exception.response && exception.response.isString === 'batch_id must be a string') {
                // Specific error message for batch_id
                impactAssessment = 'The request body is missing or incorrect, specifically the "batch_id" parameter is not provided as a string, resulting in a "Bad Request" error.';
                recommendedActions = 'Review the request payload and ensure that all required parameters, including "batch_id", are provided and in the correct format. Implement validation checks on the server side to handle such cases gracefully and provide informative error messages to the client.';
            } else {
                // Generic argument error
                impactAssessment = 'The server encountered a "Bad Request" error due to invalid arguments in the request.';
                recommendedActions = 'Refer to the API documentation to understand the correct request format and provide valid arguments.';
            }
        } else if (exception.status === 500) {
            // For 500 Internal Server Error
            impactAssessment = 'The server encountered an internal error while processing the request, resulting in a "500 Internal Server Error".';
            recommendedActions = 'Check the server logs for detailed error messages. Investigate and address any database-related issues.';
        }

        return { impactAssessment, recommendedActions };
    }

    private transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE,
        host: process.env.EMAIL_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
}

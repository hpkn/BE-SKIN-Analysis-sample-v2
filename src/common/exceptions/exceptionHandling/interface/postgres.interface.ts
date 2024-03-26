import { HttpStatus } from '@nestjs/common';

export const errorMappings: Record<string, { status: number; message: string }> = {
    23505: {
        status: HttpStatus.BAD_REQUEST,
        message: 'Unique Violation: Occurs when an attempt to insert or update a record violates a unique constraint.',
    },
    23502: {
        status: HttpStatus.NO_CONTENT,
        message:
            'Not Null Violation: Occurs when an attempt is made to insert a null value into a column with a not null constraint',
    },
    23503: {
        status: HttpStatus.CONFLICT,
        message:
            'Foreign Key Violation: Occurs when an attempt to insert or update a record fails because of a foreign key constraint.',
    },
    '42P01': {
        status: HttpStatus.CONFLICT,
        message: 'Undefined Table: Raised when trying to access a table that doesnt exist',
    },

    '42703': {
        status: HttpStatus.CONFLICT,
        message: 'Undefined Column: Raised when trying to access a column that doesnt exist in a table',
    },
    '42P07': {
        status: HttpStatus.CONFLICT,
        message: 'Duplicate Table: Raised when trying to create a table with a name that already exists.',
    },

    '42701': {
        status: HttpStatus.CONFLICT,
        message: 'Duplicate Column: Raised when trying to add a column with a name that already exists in a table.',
    },

    '42P10': {
        status: HttpStatus.CONFLICT,
        message:
            'Duplicate Object: Raised when trying to create an object (like a table or index) that already exists.',
    },

    '22001': {
        status: HttpStatus.CONFLICT,
        message:
            'String Data Right Truncation: Raised when trying to insert a string value that is longer than the allowed length for a column.',
    },

    '23514': {
        status: HttpStatus.CONFLICT,
        message: 'Check Violation: Raised when a constraint defined with a CHECK constraint is violated.',
    },
};

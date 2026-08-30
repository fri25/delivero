import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

const PRISMA_STATUS_MAP: Record<string, HttpStatus> = {
  P2002: HttpStatus.CONFLICT, // unique constraint violation
  P2025: HttpStatus.NOT_FOUND, // record not found
  P2003: HttpStatus.BAD_REQUEST, // foreign key constraint failed
};

// V07 : exception.message pour un code Prisma connu contient le nom de
// table/contrainte/colonne (schéma interne) — jamais renvoyé tel quel au
// client, remplacé par un message générique par code.
const PRISMA_GENERIC_MESSAGE: Record<string, string> = {
  P2002: 'Cette ressource existe déjà.',
  P2025: 'Ressource introuvable.',
  P2003: 'Référence invalide.',
};
const PRISMA_DEFAULT_MESSAGE = 'Requête invalide.';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, error, message } = this.resolve(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseBody = {
      statusCode,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): {
    statusCode: HttpStatus;
    error: string;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const message =
        typeof payload === 'string'
          ? payload
          : ((payload as { message?: string | string[] }).message ??
            exception.message);
      return { statusCode: status, error: exception.name, message };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const status =
        PRISMA_STATUS_MAP[exception.code] ?? HttpStatus.BAD_REQUEST;
      // Le détail (table, contrainte, colonne) reste utile côté serveur pour
      // débugger, donc journalisé ici — mais jamais renvoyé au client (V07).
      this.logger.debug(`Prisma:${exception.code} — ${exception.message}`);
      return {
        statusCode: status,
        error: `Prisma:${exception.code}`,
        message:
          PRISMA_GENERIC_MESSAGE[exception.code] ?? PRISMA_DEFAULT_MESSAGE,
      };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Prisma:ValidationError',
        message: 'Requête invalide.',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'Une erreur inattendue est survenue.',
    };
  }
}

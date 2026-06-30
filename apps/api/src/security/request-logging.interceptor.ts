import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<{
      method?: string;
      url?: string;
      user?: { id?: string };
      requestId?: string;
    }>();
    const response = context.switchToHttp().getResponse<{ statusCode?: number }>();

    const requestId = randomUUID();
    request.requestId = requestId;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logRequest({
          requestId,
          method: request.method ?? 'UNKNOWN',
          path: request.url ?? 'unknown',
          statusCode: response.statusCode ?? 200,
          durationMs: Date.now() - startedAt,
          userId: request.user?.id ?? null,
        });
      }),
      catchError((error: unknown) => {
        const statusCode =
          typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          typeof (error as { status: unknown }).status === 'number'
            ? (error as { status: number }).status
            : 500;

        this.logRequest({
          requestId,
          method: request.method ?? 'UNKNOWN',
          path: request.url ?? 'unknown',
          statusCode,
          durationMs: Date.now() - startedAt,
          userId: request.user?.id ?? null,
        });

        return throwError(() => error);
      }),
    );
  }

  private logRequest(entry: {
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    userId: string | null;
  }): void {
    this.logger.log(JSON.stringify(entry));
  }
}

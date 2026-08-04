import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { AuthService } from '../../app/services/auth.service';
import { UserModel } from '../database/user.model';

type RequestWithUser = Request & {
  headers: {
    authorization?: string;
  };
  user: UserModel | null;
};

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request.headers.authorization);
    console.log('FirebaseAuthGuard: Extracted token:', token);
    if (!token) {
      throw new HttpException(
        { message: 'Unauthorized' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const decodedToken = await this.verifyToken(token);

      const user =
        await this.authService.resolveUserFromFirebaseToken(decodedToken);

      request.user = user;

      return true;
    } catch (error) {
      this.logger.error('FirebaseAuthGuard: Authentication failed', error);

      // Re-throw HttpException to preserve the intended status code (401, 503, etc.)
      if (error instanceof HttpException) {
        throw error;
      }

      // For any other unexpected errors, throw 401 Unauthorized
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractBearerToken(authHeader?: string): string | null {
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token || !token.trim()) {
      return null;
    }

    return token.trim();
  }

  private async verifyToken(token: string): Promise<DecodedIdToken> {
    const testToken = this.tryVerifyTestToken(token);

    if (testToken) {
      return testToken;
    }

    try {
      return await getAuth().verifyIdToken(token);
    } catch (error) {
      if (this.isExpiredTokenError(error)) {
        throw new HttpException(
          { message: 'Token expired' },
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (this.isServiceUnavailableError(error)) {
        this.logger.error('Firebase Auth verification is unavailable', error);
        throw new HttpException(
          { message: 'Auth service unavailable' },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        { message: 'Unauthorized' },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private tryVerifyTestToken(token: string): DecodedIdToken | null {
    if (process.env.ALLOW_TEST_FIREBASE_TOKENS !== 'true') {
      return null;
    }

    if (token === 'expired.token') {
      throw new HttpException(
        { message: 'Token expired' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (token === 'service.unavailable') {
      this.logger.error(
        'Firebase Auth verification is unavailable (test token mode)',
      );
      throw new HttpException(
        { message: 'Auth service unavailable' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!token.startsWith('test-firebase.')) {
      return null;
    }

    const payloadPart = token.slice('test-firebase.'.length);

    try {
      const parsed = JSON.parse(
        Buffer.from(payloadPart, 'base64url').toString('utf-8'),
      ) as {
        uid: string;
        email?: string;
        email_verified?: boolean;
        name?: string;
        phone_number?: string;
      };

      const nowSeconds = Math.floor(Date.now() / 1000);

      return {
        aud: 'test-aud',
        auth_time: nowSeconds,
        exp: nowSeconds + 3600,
        firebase: {
          identities: {},
          sign_in_provider: 'custom',
        },
        iat: nowSeconds,
        iss: 'https://securetoken.google.com/test-project',
        sub: parsed.uid,
        uid: parsed.uid,
        email: parsed.email,
        email_verified: parsed.email_verified,
        name: parsed.name,
        phone_number: parsed.phone_number,
      };
    } catch {
      throw new HttpException(
        { message: 'Unauthorized' },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private isExpiredTokenError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const code = Reflect.get(error, 'code');
    return code === 'auth/id-token-expired' || code === 'auth/id-token-revoked';
  }

  private isServiceUnavailableError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const code = Reflect.get(error, 'code');
    const message = String(Reflect.get(error, 'message') ?? '').toLowerCase();

    if (
      code === 'app/network-error' ||
      code === 'app/invalid-credential' ||
      code === 'auth/internal-error'
    ) {
      return true;
    }

    return (
      message.includes('network') ||
      message.includes('failed to initialize') ||
      message.includes('failed to determine service account')
    );
  }
}

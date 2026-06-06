import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { LoginResponse } from '../../domain/entities/login.entity';
import { RefreshTokenResponse } from '../../domain/entities/refresh-token.entity';

type FirebaseSignInResponse = {
  idToken: string;
  refreshToken: string;
};

type FirebaseRefreshResponse = {
  access_token: string;
  refresh_token: string;
};

@Injectable()
export class FirebaseAuthClientService {
  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<LoginResponse> {
    try {
      const response = await axios.post<FirebaseSignInResponse>(
        `${this.getIdentityToolkitBaseUrl()}/accounts:signInWithPassword?key=${this.getApiKey()}`,
        {
          email,
          password,
          returnSecureToken: true,
        },
      );

      return {
        accessToken: response.data.idToken,
        refreshToken: response.data.refreshToken,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        throw new UnauthorizedException('Invalid email or password');
      }

      throw new InternalServerErrorException('Unable to authenticate user');
    }
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<RefreshTokenResponse> {
    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString();

      const response = await axios.post<FirebaseRefreshResponse>(
        `${this.getSecureTokenBaseUrl()}/token?key=${this.getApiKey()}`,
        body,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      throw new InternalServerErrorException('Unable to refresh access token');
    }
  }

  private getIdentityToolkitBaseUrl() {
    const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    if (emulatorHost) {
      return `http://${emulatorHost}/identitytoolkit.googleapis.com/v1`;
    }

    return 'https://identitytoolkit.googleapis.com/v1';
  }

  private getSecureTokenBaseUrl() {
    const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    if (emulatorHost) {
      return `http://${emulatorHost}/securetoken.googleapis.com/v1`;
    }

    return 'https://securetoken.googleapis.com/v1';
  }

  private getApiKey() {
    return process.env.FIREBASE_WEB_API_KEY || 'demo-goeat-key';
  }
}

import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const adviser = await this.prisma.adviser.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!adviser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, adviser.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(adviser.id, adviser.email);

    return {
      ...tokens,
      user: {
        id: adviser.id,
        email: adviser.email,
        fullName: adviser.fullName,
        firmName: adviser.firmName,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const secret = this.configService.get<string>('AUTH_REFRESH_SECRET') || 'secret_for_refresh';
      const payload = this.jwtService.verify(refreshToken, { secret });

      const adviser = await this.prisma.adviser.findUnique({
        where: { id: payload.sub },
      });

      if (!adviser) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(adviser.id, adviser.email);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getMe(adviserId: string) {
    const adviser = await this.prisma.adviser.findUnique({
      where: { id: adviserId },
      select: {
        id: true,
        email: true,
        fullName: true,
        firmName: true,
        createdAt: true,
      },
    });

    if (!adviser) throw new NotFoundException('Adviser not found');
    return adviser;
  }

  async forgotPassword(email: string) {
    const adviser = await this.prisma.adviser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!adviser) {
      // Return success anyway for security prevention of email enumeration
      return { message: 'If an account exists, a reset link has been dispatched.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    await this.prisma.adviser.update({
      where: { id: adviser.id },
      data: { resetToken, resetTokenExpiry },
    });

    return {
      message: 'Password reset token generated successfully',
      resetToken, // Returned in development/demo response for seamless testing
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const adviser = await this.prisma.adviser.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!adviser) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.adviser.update({
      where: { id: adviser.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password has been reset successfully' };
  }

  private async generateTokens(adviserId: string, email: string) {
    const accessSecret = this.configService.get<string>('AUTH_JWT_SECRET') || 'secret';
    const refreshSecret = this.configService.get<string>('AUTH_REFRESH_SECRET') || 'secret_for_refresh';
    const accessExpiry = this.configService.get<string>('AUTH_JWT_TOKEN_EXPIRES_IN') || '15m';
    const refreshExpiry = this.configService.get<string>('AUTH_REFRESH_TOKEN_EXPIRES_IN') || '30d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: adviserId, email, type: 'access' },
        { secret: accessSecret, expiresIn: accessExpiry as any },
      ),
      this.jwtService.signAsync(
        { sub: adviserId, email, type: 'refresh' },
        { secret: refreshSecret, expiresIn: refreshExpiry as any },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiry,
    };
  }
}

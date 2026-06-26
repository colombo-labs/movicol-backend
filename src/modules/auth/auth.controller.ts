import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin(@Req() req: any) {
    // Passport redirects to Google with prompt=select_account
    // configured in GoogleStrategy
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = await this.authService.findOrCreateUser(req.user as any);
    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');

    res.cookie('access_token', accessToken, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${frontendUrl}?auth=success`);
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.['refresh_token'];
    if (!token) throw new UnauthorizedException('No refresh token');

    const result = await this.authService.refreshAccessToken(token);
    if (!result) throw new UnauthorizedException('Invalid refresh token');

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: 'Token refreshed' });
  }

  @Get('me')
  async me(@CurrentUser('id') userId: string) {
    if (!userId) throw new UnauthorizedException();
    return this.authService.getMe(userId);
  }

  @Post('logout')
  async logout(@CurrentUser() user: any, @Res() res: Response) {
    if (user?.sessionId) await this.authService.logout(user.sessionId, user.id);

    res.clearCookie('access_token', { httpOnly: false, secure: false, sameSite: 'lax' });
    res.clearCookie('refresh_token', { httpOnly: true, secure: false, sameSite: 'lax' });
    res.json({ message: 'Logged out' });
  }
}

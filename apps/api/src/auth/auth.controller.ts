import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { DemanderOtpDto, VerifierOtpDto } from './dto/otp.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OtpService } from './otp.service';
import type { AuthenticatedUser } from './types/auth-user.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  // V03 : brute force / énumération de numéros (409 si déjà pris) — limite
  // volontairement plus stricte que le throttle global de l'application.
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // F-CLI-01 : connexion / inscription par code à usage unique. Le service
  // limite aussi par numéro (1 code/min, 5/h) — chaque SMS a un coût.
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('otp/demander')
  @HttpCode(HttpStatus.OK)
  demanderOtp(@Body() dto: DemanderOtpDto) {
    return this.otpService.demander(dto);
  }

  // 5 essais par code côté service, plus ce plafond par IP.
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('otp/verifier')
  @HttpCode(HttpStatus.OK)
  verifierOtp(@Body() dto: VerifierOtpDto) {
    return this.otpService.verifier(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }
}

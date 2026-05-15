import { Global, Module } from '@nestjs/common'
import { AccessTokenAuthGuard } from './access-token-auth.guard'
import { AuthorizationService } from './authorization.service'
import { OptionalAccessTokenAuthGuard } from './optional-access-token-auth.guard'
import { PasswordHashService } from './password-hash.service'
import { SessionAuthService } from './session-auth.service'
import { TokenHashService } from './token-hash.service'
import { TokenService } from './token.service'

@Global()
@Module({
  providers: [
    AuthorizationService,
    PasswordHashService,
    SessionAuthService,
    TokenHashService,
    TokenService,
    AccessTokenAuthGuard,
    OptionalAccessTokenAuthGuard,
  ],
  exports: [
    AuthorizationService,
    PasswordHashService,
    SessionAuthService,
    TokenHashService,
    TokenService,
    AccessTokenAuthGuard,
    OptionalAccessTokenAuthGuard,
  ],
})
export class SecurityModule {}

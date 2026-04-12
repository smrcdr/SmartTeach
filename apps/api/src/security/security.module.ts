import { Global, Module } from '@nestjs/common'
import { AccessTokenAuthGuard } from './access-token-auth.guard'
import { PasswordHashService } from './password-hash.service'
import { TokenHashService } from './token-hash.service'
import { TokenService } from './token.service'

@Global()
@Module({
  providers: [
    PasswordHashService,
    TokenHashService,
    TokenService,
    AccessTokenAuthGuard,
  ],
  exports: [
    PasswordHashService,
    TokenHashService,
    TokenService,
    AccessTokenAuthGuard,
  ],
})
export class SecurityModule {}

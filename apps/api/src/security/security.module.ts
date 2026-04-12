import { Global, Module } from '@nestjs/common'
import { PasswordHashService } from './password-hash.service'
import { TokenService } from './token.service'

@Global()
@Module({
  providers: [PasswordHashService, TokenService],
  exports: [PasswordHashService, TokenService],
})
export class SecurityModule {}

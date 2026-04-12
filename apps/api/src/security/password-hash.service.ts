import { Inject, Injectable } from '@nestjs/common'
import { compare, hash } from 'bcryptjs'
import { AppConfigService } from '../config/app-config.service'

@Injectable()
export class PasswordHashService {
  constructor(@Inject(AppConfigService) private readonly config: AppConfigService) {}

  hash(plainPassword: string) {
    return hash(plainPassword, this.config.passwordHashRounds)
  }

  compare(plainPassword: string, passwordHash: string) {
    return compare(plainPassword, passwordHash)
  }
}

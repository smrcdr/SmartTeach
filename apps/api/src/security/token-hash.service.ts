import { createHash, timingSafeEqual } from 'node:crypto'
import { Injectable } from '@nestjs/common'

@Injectable()
export class TokenHashService {
  hash(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }

  matches(token: string, tokenHash: string) {
    const normalizedTokenHash = this.hash(token)

    if (normalizedTokenHash.length !== tokenHash.length) {
      return false
    }

    return timingSafeEqual(
      Buffer.from(normalizedTokenHash),
      Buffer.from(tokenHash),
    )
  }
}

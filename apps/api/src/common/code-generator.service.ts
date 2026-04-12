import { Injectable } from '@nestjs/common'
import { randomInt } from 'node:crypto'

const DEFAULT_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const NUMERIC_ALPHABET = '0123456789'
const TOKEN_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

@Injectable()
export class CodeGeneratorService {
  generateGroupCode(length = 6) {
    return this.generate(length, DEFAULT_ALPHABET)
  }

  generateNumericCode(length = 6) {
    return this.generate(length, NUMERIC_ALPHABET)
  }

  generateToken(length = 32) {
    return this.generate(length, TOKEN_ALPHABET)
  }

  private generate(length: number, alphabet: string) {
    return Array.from({ length }, () => alphabet[randomInt(0, alphabet.length)]).join('')
  }
}

type LoginValidationPayload = {
  email: string
  password: string
}

type RegisterValidationPayload = LoginValidationPayload & {
  displayName: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(email: string) {
  return emailPattern.test(email)
}

export function validateLoginPayload(payload: LoginValidationPayload): string | null {
  const email = payload.email.trim()

  if (!email) {
    return 'Введите email'
  }

  if (!isValidEmail(email)) {
    return 'Введите корректный email'
  }

  if (!payload.password) {
    return 'Введите пароль'
  }

  if (payload.password.length < 8) {
    return 'Пароль должен быть не короче 8 символов'
  }

  return null
}

export function validateRegisterPayload(payload: RegisterValidationPayload): string | null {
  const displayName = payload.displayName.trim()

  if (!displayName) {
    return 'Введите имя'
  }

  if (displayName.length < 2) {
    return 'Имя должно быть не короче 2 символов'
  }

  return validateLoginPayload(payload)
}

export function translateAuthValidationError(error: string): string | null {
  const normalized = error.toLowerCase()

  if (normalized.includes('email')) {
    if (
      normalized.includes('invalid') ||
      normalized.includes('email address') ||
      normalized.includes('must be a valid email')
    ) {
      return 'Введите корректный email'
    }

    if (
      normalized.includes('required') ||
      normalized.includes('expected string') ||
      normalized.includes('too small')
    ) {
      return 'Введите email'
    }
  }

  if (normalized.includes('password')) {
    if (
      normalized.includes('too small') ||
      normalized.includes('min') ||
      normalized.includes('>=8') ||
      normalized.includes('at least 8')
    ) {
      return 'Пароль должен быть не короче 8 символов'
    }

    if (
      normalized.includes('required') ||
      normalized.includes('expected string') ||
      normalized.includes('invalid')
    ) {
      return 'Введите пароль'
    }
  }

  if (normalized.includes('displayname') || normalized.includes('display name')) {
    if (
      normalized.includes('too small') ||
      normalized.includes('min') ||
      normalized.includes('>=2') ||
      normalized.includes('at least 2')
    ) {
      return 'Имя должно быть не короче 2 символов'
    }

    if (
      normalized.includes('required') ||
      normalized.includes('expected string') ||
      normalized.includes('invalid')
    ) {
      return 'Введите имя'
    }
  }

  return null
}

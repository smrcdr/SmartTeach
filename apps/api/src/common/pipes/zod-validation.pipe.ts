import { ArgumentMetadata, BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'
import { ZodError, type ZodTypeAny } from 'zod'

type ZodDtoType = {
  schema?: ZodTypeAny
}

const NEST_PRIMITIVE_TYPES: Function[] = [String, Boolean, Number, Array, Object]

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    const schema = this.resolveSchema(metadata.metatype)

    if (!schema) {
      return value
    }

    try {
      return schema.parse(value)
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.issues.map((issue) => {
            const path = issue.path.join('.')

            return path ? `${path}: ${issue.message}` : issue.message
          }),
        })
      }

      throw error
    }
  }

  private resolveSchema(metatype?: ZodDtoType | Function) {
    if (!metatype || NEST_PRIMITIVE_TYPES.includes(metatype as Function)) {
      return null
    }

    return (metatype as ZodDtoType).schema ?? null
  }
}

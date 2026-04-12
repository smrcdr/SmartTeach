import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger'
import { ErrorResponseDto } from '../../common/dto/error-response.dto'
import { HealthResponseDto } from './dto/health-response.dto'
import { SystemService } from './system.service'

@ApiTags('System')
@Controller({
  path: 'health',
  version: '1',
})
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Проверить доступность API',
  })
  @ApiOkResponse({
    type: HealthResponseDto,
  })
  @ApiServiceUnavailableResponse({
    type: ErrorResponseDto,
  })
  getHealth() {
    return this.systemService.getHealth()
  }
}

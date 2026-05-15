import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { ErrorResponseDto } from '../../common/dto/error-response.dto'
import { CurrentAuth } from '../../security/current-auth.decorator'
import type { AuthContext } from '../../security/auth.types'
import { AccessTokenAuthGuard } from '../../security/access-token-auth.guard'
import { CreateMaterialSectionRequestDto } from './dto/create-material-section-request.dto'
import { CreateMaterialSubsectionRequestDto } from './dto/create-material-subsection-request.dto'
import { MaterialSectionDto } from './dto/material-section.dto'
import { MaterialSubsectionDetailsDto } from './dto/material-subsection-details.dto'
import { UpdateMaterialSectionRequestDto } from './dto/update-material-section-request.dto'
import { UpdateMaterialSubsectionRequestDto } from './dto/update-material-subsection-request.dto'
import { MaterialsService } from './materials.service'

@ApiTags('Materials')
@ApiBearerAuth('bearerAuth')
@UseGuards(AccessTokenAuthGuard)
@Controller({
  path: 'groups',
  version: '1',
})
export class MaterialsController {
  constructor(@Inject(MaterialsService) private readonly materialsService: MaterialsService) {}

  @Get(':groupId/materials')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить структуру материалов группы',
  })
  @ApiOkResponse({
    type: MaterialSectionDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  listMaterials(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
  ) {
    return this.materialsService.listMaterials(groupId, auth.userId)
  }

  @Post(':groupId/materials/sections')
  @ApiOperation({
    summary: 'Создать раздел материалов',
    description: 'Доступно владельцу и администраторам группы, если lessons_enabled включен.',
  })
  @ApiCreatedResponse({
    type: MaterialSectionDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  createSection(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Body() payload: CreateMaterialSectionRequestDto,
  ) {
    return this.materialsService.createSection(groupId, auth.userId, payload)
  }

  @Patch(':groupId/materials/sections/:sectionId')
  @ApiOperation({
    summary: 'Обновить раздел материалов',
    description: 'Доступно владельцу и администраторам группы, если lessons_enabled включен.',
  })
  @ApiOkResponse({
    type: MaterialSectionDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  updateSection(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('sectionId', new ParseUUIDPipe({ version: '4' })) sectionId: string,
    @Body() payload: UpdateMaterialSectionRequestDto,
  ) {
    return this.materialsService.updateSection(groupId, sectionId, auth.userId, payload)
  }

  @Delete(':groupId/materials/sections/:sectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удалить раздел материалов',
    description: 'Удаляет раздел, его подразделы и уроки внутри них.',
  })
  @ApiNoContentResponse({
    description: 'Раздел успешно удален.',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  async deleteSection(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('sectionId', new ParseUUIDPipe({ version: '4' })) sectionId: string,
  ) {
    await this.materialsService.deleteSection(groupId, sectionId, auth.userId)
  }

  @Post(':groupId/materials/sections/:sectionId/subsections')
  @ApiOperation({
    summary: 'Создать подраздел материалов',
    description: 'Доступно владельцу и администраторам группы, если lessons_enabled включен.',
  })
  @ApiCreatedResponse({
    type: MaterialSubsectionDetailsDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  createSubsection(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('sectionId', new ParseUUIDPipe({ version: '4' })) sectionId: string,
    @Body() payload: CreateMaterialSubsectionRequestDto,
  ) {
    return this.materialsService.createSubsection(groupId, sectionId, auth.userId, payload)
  }

  @Patch(':groupId/materials/subsections/:subsectionId')
  @ApiOperation({
    summary: 'Обновить подраздел материалов',
    description: 'Доступно владельцу и администраторам группы, если lessons_enabled включен.',
  })
  @ApiOkResponse({
    type: MaterialSubsectionDetailsDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  updateSubsection(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('subsectionId', new ParseUUIDPipe({ version: '4' })) subsectionId: string,
    @Body() payload: UpdateMaterialSubsectionRequestDto,
  ) {
    return this.materialsService.updateSubsection(groupId, subsectionId, auth.userId, payload)
  }

  @Delete(':groupId/materials/subsections/:subsectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удалить подраздел материалов',
    description: 'Удаляет подраздел и уроки внутри него.',
  })
  @ApiNoContentResponse({
    description: 'Подраздел успешно удален.',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  async deleteSubsection(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('subsectionId', new ParseUUIDPipe({ version: '4' })) subsectionId: string,
  ) {
    await this.materialsService.deleteSubsection(groupId, subsectionId, auth.userId)
  }

  @Get(':groupId/materials/subsections/:subsectionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить подраздел материалов с уроками',
  })
  @ApiOkResponse({
    type: MaterialSubsectionDetailsDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  getSubsection(
    @CurrentAuth() auth: AuthContext,
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Param('subsectionId', new ParseUUIDPipe({ version: '4' })) subsectionId: string,
  ) {
    return this.materialsService.getSubsection(groupId, subsectionId, auth.userId)
  }
}

import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { ErrorResponseDto } from '../../common/dto/error-response.dto'
import { CurrentAuth } from '../../security/current-auth.decorator'
import type { AuthContext } from '../../security/auth.types'
import { AccessTokenAuthGuard } from '../../security/access-token-auth.guard'
import { FileObjectDto } from './dto/file-object.dto'
import { UploadFileRequestDto } from './dto/upload-file-request.dto'
import { FilesService } from './files.service'

type UploadedFilePayload = {
  buffer: Buffer
  size: number
  originalname: string
  mimetype: string
}

@ApiTags('Files')
@ApiBearerAuth('bearerAuth')
@UseGuards(AccessTokenAuthGuard)
@Controller({
  path: 'files',
  version: '1',
})
export class FilesController {
  constructor(@Inject(FilesService) private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadFileRequestDto,
  })
  @ApiOperation({
    summary: 'Загрузить файл',
    description: 'Загружает файл в объектное хранилище и возвращает его метаданные.',
  })
  @ApiCreatedResponse({
    type: FileObjectDto,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  uploadFile(
    @CurrentAuth() auth: AuthContext,
    @UploadedFile() uploadedFile: UploadedFilePayload | undefined,
    @Body() payload: UploadFileRequestDto,
  ) {
    return this.filesService.uploadFile(auth.userId, uploadedFile, payload.folder)
  }

  @Get(':fileId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить метаданные файла',
  })
  @ApiOkResponse({
    type: FileObjectDto,
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
  })
  getFile(@Param('fileId', new ParseUUIDPipe({ version: '4' })) fileId: string) {
    return this.filesService.getFileOrThrow(fileId)
  }

  @Delete(':fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удалить файл',
    description: 'Выполняет мягкое удаление файла и делает его недоступным для новых привязок.',
  })
  @ApiNoContentResponse({
    description: 'Файл успешно удален.',
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
  async deleteFile(
    @CurrentAuth() auth: AuthContext,
    @Param('fileId', new ParseUUIDPipe({ version: '4' })) fileId: string,
  ) {
    await this.filesService.deleteFile(fileId, auth.userId)
  }
}

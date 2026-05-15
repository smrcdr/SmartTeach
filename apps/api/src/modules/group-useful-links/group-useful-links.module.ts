import { Module } from '@nestjs/common'
import { GroupUsefulLinksController } from './group-useful-links.controller'
import { GroupUsefulLinksService } from './group-useful-links.service'

@Module({
  controllers: [GroupUsefulLinksController],
  providers: [GroupUsefulLinksService],
})
export class GroupUsefulLinksModule {}

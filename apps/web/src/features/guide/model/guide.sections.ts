import { adminGuideSection } from './admin.sections'
import { assignmentsGuideSection } from './assignments.sections'
import { communicationGuideSection } from './communication.sections'
import { groupsGuideSection } from './groups.sections'
import type { GuideSection } from './guide.types'
import { learningGuideSection } from './learning.sections'
import { scheduleGuideSection } from './schedule.sections'
import { startGuideSection } from './start.sections'

export const guideSections: GuideSection[] = [
  startGuideSection,
  groupsGuideSection,
  learningGuideSection,
  assignmentsGuideSection,
  scheduleGuideSection,
  communicationGuideSection,
  adminGuideSection
]

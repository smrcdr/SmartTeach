import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getDemoGroup } from '@/app/demo/demo-data'

export function useDemoGroup() {
  const route = useRoute()

  return computed(() => getDemoGroup(String(route.params.groupId))!)
}

export type GuideTopic = {
  id: string
  title: string
  purpose: string
  usage: string
  helps: string[]
  steps: string[]
  tips?: string[]
}

export type GuideSection = {
  id: string
  title: string
  description: string
  topics: GuideTopic[]
}

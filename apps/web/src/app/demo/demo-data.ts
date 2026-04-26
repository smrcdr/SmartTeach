import type { DemoGroup, DemoUser } from './types'

export const currentUser: DemoUser = {
  id: 'alex-rivera',
  name: 'Алекс Ривера',
  role: 'Куратор курса',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgPZnm7hSQSR0S_RLzrrjv0n2_yU-MIZzFCC-H3x2QLziOuTqIOOlLBb3hRYQLT8vOM081dNf4_xlOumBndQtg-TVSiWdu2NCmzkIOZhu5GaokuAJ2_DGTB_9eReZTdlzDOhScICKQUoSyhQFKs1UeOiZ5xkhGqT5ZPJuULkk-RVwnL3uzc26f_o29VsBv8wb1Hz1wP1jcqFbO7BhNZV3QPxc9eUQHV7RV-OA1yc5KXjjyizGB0qtOm9akEwGvFgrkL3u1YkOSr8Q',
  bio: 'Проектирует учебные программы и помогает командам учиться системно.'
}

const coverImages = {
  fullStack: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWx2Hd1hIhlpIPw-QqwQMFbTIwfqGsNckNAbih0jTGiPJDsow7d3dmLTJiwOY9qVH5MmepdQ-AXzfkBHM7eTMKwpK0aUGMkfx7GKHIlBx_DEDEY-BGQvGsX6OcD97rz25zykdwC9lZclAXJTYc7SoWLKiLS5DOfj7wP1S7GviZtsHWmCji2wmKQxkHSi5TkeYUuI5TEX8BvP64v33ak_ZTfF9AL7SwtezbQr4FYhura6hKYw8r2t489QOQJxgjF6gqXM7dKRdOJEI',
  math: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAswjN5pCMtPdE43gp0iEF6ODYm8oa74PFumR6Kf6JR7Iiy1LDC7OUMYGfJMeuPYcOIn6OVG4G4-Asq9BZkstf4UPBAaRbDhEW8NJf-qXl6-jNFsluahbsnCM2VpR03SB8lEGsFpay1vcbScy19UCqHMJfAVeDDDa4B02irLNg1UJNTIxzmT3HXfRvLpk5qMLKpb4bVjLU3DqlRnV6awTQ8lqAl4lNnrDprS4X6Iff_2TpHGBpPHQRy4hnJdrhGyoKqF_Va-X7Kykk',
  design: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZkUQCeaa2q12rX44E3YvM4-FjskIvS-GVFGE3PVYC-vddQRwzEzUdVBN5ea8nDj9be8V-nfvw6s46Dj_bJIkXVuLfiM4QaHuoGCTSq1tFOde8qmIEFm8VoIJOb6fYVD6vBTAbkoQY2YIWG10Y35sFBr7eNxdomqIN4lg8ZjHC2uioOzRFfhauMXhtXrt6pK8UdUri6gMKXv1mVJUPbvPPFahosnq0J6MJbdFQcD0Yyu1J4mx4VHKXEXqDwOrZevgccpT3VS-jNTc',
  marketing: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqEC9mI9AK6m8j00BESUmqQT93L0_6ICr6yIoy4nAVgSDG-n-z2tvG3cadKDtXIDt5LCValJgqcsSk4saGKd9Mc55V2Z24cPgTvnDhwELtpUp9VCfgqglQKqM3BnivJnlBaxGaIOH1SdjXAo_unmu8LNPFDdlsnDDUU7OgFQQVXBtFAC3RAXmS0lAfBkWtCIb30s0agvADCTlvtJUqRRLiqytfiCkf8T6KZWH-DC0z6HG56ZSPK1v-3gjiHXKJ3-qhk3CcgSkIqNQ',
  english: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzYipCKxi3nuzw0uGNXlb_iVW1AYw88HqR05ww5fJGfqWnYPrcpryYQEicgFyJlF6VIQUGLeQrTPLpFZGR0aBoaMhgxE8bJzV4uCyk0CNp4JCeAsMOJYn9qRh299II3fSCscLPyDpPJOyNq0aQprMMTOT6vMPca3Zx2oYsbJjgpy2yU9YxvNf5W8W8YzBZgnGm27JrHGmthsvWn7bHsR3o5ctSMYmpvhO9FGfKRcpioZNzyIkwlk9V4J6HmK-Kl6COLrX2Uw40YxE'
}

export const recommendedGroups: DemoGroup[] = [
  {
    id: 'full-stack',
    title: 'Full-stack разработка',
    description: 'Комплексное изучение фронтенд и бэкенд технологий: от интерфейсов до серверной архитектуры.',
    code: 'FS-8832',
    coverImage: coverImages.fullStack,
    membersCount: 1240,
    duration: '16 недель',
    status: 'ACTIVE',
    modules: ['lessons', 'assignments', 'schedule', 'chats', 'members'],
    owner: currentUser,
    lessons: [
      { id: 'architecture', title: 'Архитектура современного веб-приложения', status: 'PUBLISHED', summary: 'Слои приложения, контракты API и границы ответственности.', duration: '54 мин' },
      { id: 'vue-state', title: 'Состояние интерфейса во Vue', status: 'PUBLISHED', summary: 'Pinia, асинхронные действия и работа с локальным кэшем.', duration: '42 мин' },
      { id: 'deployment', title: 'Деплой и наблюдаемость', status: 'DRAFT', summary: 'Сборка, окружения и базовые метрики качества.', duration: '38 мин' }
    ],
    assignments: [
      { id: 'api-contract', title: 'Спроектировать API-контракт', status: 'PUBLISHED', dueDate: '2026-05-04', submissions: 18 },
      { id: 'frontend-shell', title: 'Собрать frontend shell', status: 'PUBLISHED', dueDate: '2026-05-08', submissions: 11 }
    ],
    schedule: [
      { id: 'kickoff', title: 'Разбор архитектуры проекта', status: 'PLANNED', startsAt: '2026-04-29T16:00:00.000Z', place: 'Zoom' },
      { id: 'review', title: 'Код-ревью учебных проектов', status: 'PLANNED', startsAt: '2026-05-03T17:30:00.000Z', place: 'Аудитория 305' }
    ],
    members: [
      currentUser,
      { id: 'mila', name: 'Мила Орлова', role: 'Студент', avatarUrl: 'https://i.pravatar.cc/160?img=44', bio: 'Изучает backend и продуктовые интерфейсы.' },
      { id: 'dan', name: 'Данил Ким', role: 'Ассистент', avatarUrl: 'https://i.pravatar.cc/160?img=12', bio: 'Помогает с ревью домашних заданий.' }
    ],
    chats: [
      { id: 'general', title: 'Общий чат', lastMessage: 'Материалы к занятию уже в уроках.', unreadCount: 3 },
      { id: 'review', title: 'Код-ревью', lastMessage: 'Прикрепите ссылку на репозиторий.', unreadCount: 0 }
    ]
  },
  {
    id: 'math',
    title: 'Высшая математика',
    description: 'Математический анализ, линейная алгебра и теория вероятностей для инженерных задач.',
    code: 'MTH-1204',
    coverImage: coverImages.math,
    membersCount: 856,
    duration: '12 недель',
    status: 'ACTIVE',
    modules: ['lessons', 'assignments', 'schedule'],
    owner: currentUser,
    lessons: [],
    assignments: [],
    schedule: [],
    members: [currentUser],
    chats: []
  },
  {
    id: 'design',
    title: 'UI/UX дизайн',
    description: 'Проектирование пользовательского опыта, исследование сценариев и создание прототипов.',
    code: 'UX-1190',
    coverImage: coverImages.design,
    membersCount: 2105,
    duration: '10 недель',
    status: 'ACTIVE',
    modules: ['lessons', 'assignments', 'chats', 'members'],
    owner: currentUser,
    lessons: [],
    assignments: [],
    schedule: [],
    members: [currentUser],
    chats: []
  },
  {
    id: 'marketing',
    title: 'Цифровой маркетинг',
    description: 'Стратегии роста, аналитика поведения пользователей и запуск образовательных кампаний.',
    code: 'MKT-5401',
    coverImage: coverImages.marketing,
    membersCount: 624,
    duration: '8 недель',
    status: 'ACTIVE',
    modules: ['lessons', 'assignments', 'schedule', 'chats'],
    owner: currentUser,
    lessons: [],
    assignments: [],
    schedule: [],
    members: [currentUser],
    chats: []
  },
  {
    id: 'english',
    title: 'English for Beginners',
    description: 'Разговорная практика, базовая грамматика и персональная траектория развития.',
    code: 'ENG-7740',
    coverImage: coverImages.english,
    membersCount: 318,
    duration: '9 недель',
    status: 'ACTIVE',
    modules: ['lessons', 'schedule', 'chats'],
    owner: currentUser,
    lessons: [],
    assignments: [],
    schedule: [],
    members: [currentUser],
    chats: []
  }
]

export const myGroups = recommendedGroups.slice(0, 3)

export function getDemoGroup(groupId: string): DemoGroup | undefined {
  return recommendedGroups.find((group) => group.id === groupId) ?? recommendedGroups[0]
}

import type {
  ChatItem,
  CourseCardItem,
  FilterGroup,
  JoinGroupCodeItem,
  MyGroupItem,
  NavItem,
  ProfileInfoItem,
  ProfileStat,
  UserProfile,
} from '../types/dashboard'
import alexAvatar from '../assets/avatar-alex.svg'

export const currentUser: UserProfile = {
  firstName: 'Alex',
  name: 'Alex R.',
  avatar: alexAvatar,
}

export const navItems: NavItem[] = [
  { label: 'Главная', to: '/' },
  { label: 'Каталог', to: '/catalog' },
  { label: 'Мои группы', to: '/my-groups' },
  { label: 'Чаты', to: '/chats' },
  { label: 'Профиль', to: '/profile' },
  { label: 'Вступить в группу', to: '/join-group' },
]

export const recommendedCourses: CourseCardItem[] = [
  {
    id: 1,
    to: '/groups/1',
    title: 'Python для продолжающих',
    author: 'Arminis Karner',
    tags: ['Программирование', 'Начальный', 'Самостоятельно'],
    language: 'Русский',
    description: 'Практический курс по Python с упором на реальные задачи, мини-проекты и чистый код.',
    rating: '4.7',
    students: '17K',
    reviewsCount: 284,
    featured: false,
    cover:
      'linear-gradient(135deg, rgba(8, 36, 56, 0.35), rgba(8, 36, 56, 0.1)), linear-gradient(120deg, #9fe870 0%, #2fa7ca 100%)',
    actionLabel: 'Открыть группу',
  },
  {
    id: 2,
    to: '/groups/2',
    title: 'История Европы: Новое время',
    author: 'Kemalia Hamira',
    tags: ['История', 'Теория', 'Самостоятельно'],
    language: 'Русский',
    description: 'Обзор ключевых событий новой Европы с понятной структурой и короткими тематическими блоками.',
    rating: '4.7',
    students: '17K',
    reviewsCount: 196,
    featured: false,
    cover:
      'linear-gradient(135deg, rgba(7, 13, 39, 0.25), rgba(7, 13, 39, 0.05)), linear-gradient(135deg, #0d1b3d 0%, #3454d1 40%, #e8b04c 100%)',
    actionLabel: 'Открыть группу',
  },
  {
    id: 3,
    to: '/groups/3',
    title: 'Основы графического дизайна',
    author: 'Kamsari Funree',
    tags: ['Дизайн', 'Начальный', 'Практика'],
    language: 'Русский',
    description: 'Базовый курс по композиции, сеткам и визуальной иерархии для учебных и цифровых проектов.',
    rating: '4.7',
    students: '37K',
    reviewsCount: 512,
    featured: true,
    cover:
      'linear-gradient(135deg, rgba(54, 26, 10, 0.2), rgba(54, 26, 10, 0.05)), linear-gradient(120deg, #f6c453 0%, #f58b57 50%, #ef5d60 100%)',
    actionLabel: 'Открыть группу',
  },
  {
    id: 4,
    to: '/groups/4',
    title: 'Лаборатория креативного письма',
    author: 'Alex Xi Nane',
    tags: ['Письмо', 'Практика', 'С наставником'],
    language: 'Русский',
    description: 'Короткие упражнения и редакторские практики для тех, кто хочет писать яснее и увереннее.',
    rating: '4.7',
    students: '17K',
    reviewsCount: 143,
    featured: false,
    cover:
      'linear-gradient(135deg, rgba(65, 42, 28, 0.15), rgba(65, 42, 28, 0.05)), linear-gradient(120deg, #f6ede5 0%, #e8c9b0 45%, #c78665 100%)',
    actionLabel: 'Открыть группу',
  },
  {
    id: 5,
    to: '/groups/5',
    title: 'Основы истории дизайна',
    author: 'Aman Dannen',
    tags: ['Дизайн', 'Теория', 'Самостоятельно'],
    language: 'Английский',
    description: 'Эволюция предметного и цифрового дизайна на примерах студий, школ и реальных артефактов.',
    rating: '4.7',
    students: '18K',
    reviewsCount: 227,
    featured: false,
    cover:
      'linear-gradient(135deg, rgba(30, 47, 60, 0.15), rgba(30, 47, 60, 0.05)), linear-gradient(120deg, #d2e8f2 0%, #97bfd3 45%, #5e7990 100%)',
    actionLabel: 'Открыть группу',
  },
  {
    id: 6,
    to: '/groups/6',
    title: 'Паттерны Frontend',
    author: 'Aaran Standen',
    tags: ['Программирование', 'Средний', 'С наставником'],
    language: 'Английский',
    description: 'Разбор паттернов интерфейсов, компонентного мышления и типовых ошибок во фронтенд-разработке.',
    rating: '4.7',
    students: '33K',
    reviewsCount: 468,
    featured: false,
    cover:
      'linear-gradient(135deg, rgba(13, 17, 23, 0.25), rgba(13, 17, 23, 0.05)), linear-gradient(120deg, #111827 0%, #334155 50%, #38bdf8 100%)',
    actionLabel: 'Открыть группу',
  },
  {
    id: 7,
    to: '/groups/7',
    title: 'UI-системы для команд',
    author: 'Aman Lannen',
    tags: ['Дизайн', 'Системы', 'Самостоятельно'],
    language: 'Английский',
    description: 'Как выстраивать единый визуальный язык, документацию компонентов и рабочий процесс команды.',
    rating: '4.7',
    students: '5.7K',
    reviewsCount: 89,
    featured: true,
    cover:
      'linear-gradient(135deg, rgba(24, 42, 46, 0.18), rgba(24, 42, 46, 0.04)), linear-gradient(120deg, #eaf4f4 0%, #94d2bd 50%, #0a9396 100%)',
    actionLabel: 'Открыть группу',
  },
  {
    id: 8,
    to: '/groups/8',
    title: 'Совместная работа в продуктовых командах',
    author: 'Alex Munnar',
    tags: ['Продукт', 'Командная работа', 'Практика'],
    language: 'Английский',
    description: 'Сценарии совместной работы преподавателей и учеников внутри групп, курсов и проектных потоков.',
    rating: '4.7',
    students: '22K',
    reviewsCount: 351,
    featured: false,
    cover:
      'linear-gradient(135deg, rgba(58, 33, 15, 0.18), rgba(58, 33, 15, 0.04)), linear-gradient(120deg, #fef3c7 0%, #fdba74 45%, #7c3aed 100%)',
    actionLabel: 'Открыть группу',
  },
]

export const catalogFilters: FilterGroup[] = [
  {
    title: 'Уровень',
    key: 'level',
    options: ['Начальный', 'Средний', 'Продвинутый'],
  },
  {
    title: 'Язык',
    key: 'language',
    options: ['Русский', 'Английский'],
  },
  {
    title: 'Отзывы',
    key: 'reviews',
    options: ['Менее 10', '11-30', '31-50', '51-100', '101-300', '301-500', '500+'],
  },
]

export const myGroupsStatuses = ['Активные', 'Архивированные', 'Удаленные'] as const

export const myGroups: MyGroupItem[] = [
  {
    id: 101,
    to: '/groups/101',
    title: 'Python для продолжающих',
    author: 'Arminis Karner',
    tags: ['Программирование', 'Начальный', 'Самостоятельно'],
    language: 'Русский',
    description: 'Группа, в которой вы проходите практические задания по Python и получаете обратную связь.',
    rating: '4.7',
    students: '17K',
    reviewsCount: 284,
    featured: false,
    cover:
      'linear-gradient(135deg, rgba(8, 36, 56, 0.35), rgba(8, 36, 56, 0.1)), linear-gradient(120deg, #9fe870 0%, #2fa7ca 100%)',
    actionLabel: 'Открыть группу',
    status: 'Активные',
  },
  {
    id: 102,
    to: '/groups/102',
    title: 'Паттерны Frontend',
    author: 'Aaran Standen',
    tags: ['Программирование', 'Средний', 'С наставником'],
    language: 'Английский',
    description: 'Основная рабочая группа по интерфейсным паттернам, обсуждениям и домашним заданиям.',
    rating: '4.7',
    students: '33K',
    reviewsCount: 468,
    featured: false,
    cover:
      'linear-gradient(135deg, rgba(13, 17, 23, 0.25), rgba(13, 17, 23, 0.05)), linear-gradient(120deg, #111827 0%, #334155 50%, #38bdf8 100%)',
    actionLabel: 'Открыть группу',
    status: 'Активные',
  },
  {
    id: 103,
    to: '/groups/103',
    title: 'Основы графического дизайна',
    author: 'Kamsari Funree',
    tags: ['Дизайн', 'Начальный', 'Практика'],
    language: 'Русский',
    description: 'Группа с воркшопами, совместными разборами и промежуточными проектами по дизайну.',
    rating: '4.7',
    students: '37K',
    reviewsCount: 512,
    featured: false,
    cover:
      'linear-gradient(135deg, rgba(54, 26, 10, 0.2), rgba(54, 26, 10, 0.05)), linear-gradient(120deg, #f6c453 0%, #f58b57 50%, #ef5d60 100%)',
    actionLabel: 'Открыть группу',
    status: 'Активные',
  },
  {
    id: 104,
    to: '/groups/104',
    title: 'История Европы: Новое время',
    author: 'Kemalia Hamira',
    tags: ['История', 'Теория', 'Самостоятельно'],
    language: 'Русский',
    description: 'Архивная учебная группа с сохраненными материалами, лекциями и обсуждениями.',
    rating: '4.7',
    students: '17K',
    reviewsCount: 196,
    featured: false,
    cover:
      'linear-gradient(135deg, rgba(7, 13, 39, 0.25), rgba(7, 13, 39, 0.05)), linear-gradient(135deg, #0d1b3d 0%, #3454d1 40%, #e8b04c 100%)',
    actionLabel: 'Открыть группу',
    status: 'Архивированные',
  },
  {
    id: 105,
    to: '/groups/105',
    title: 'UI-системы для команд',
    author: 'Aman Lannen',
    tags: ['Дизайн', 'Системы', 'Самостоятельно'],
    language: 'Английский',
    description: 'Завершенная группа по UI-системам, которая переведена в архив для повторного просмотра.',
    rating: '4.7',
    students: '5.7K',
    reviewsCount: 89,
    featured: false,
    cover:
      'linear-gradient(135deg, rgba(24, 42, 46, 0.18), rgba(24, 42, 46, 0.04)), linear-gradient(120deg, #eaf4f4 0%, #94d2bd 50%, #0a9396 100%)',
    actionLabel: 'Открыть группу',
    status: 'Архивированные',
  },
  {
    id: 106,
    to: '/groups/106',
    title: 'Лаборатория креативного письма',
    author: 'Alex Xi Nane',
    tags: ['Письмо', 'Практика', 'С наставником'],
    language: 'Русский',
    description: 'Группа была удалена после окончания потока, но запись состояния нужна для интерфейсного сценария.',
    rating: '4.7',
    students: '17K',
    reviewsCount: 143,
    featured: false,
    cover:
      'linear-gradient(135deg, rgba(65, 42, 28, 0.15), rgba(65, 42, 28, 0.05)), linear-gradient(120deg, #f6ede5 0%, #e8c9b0 45%, #c78665 100%)',
    actionLabel: 'Открыть группу',
    status: 'Удаленные',
  },
]

export const chats: ChatItem[] = [
  {
    id: 1,
    title: 'Python для продолжающих',
    kind: 'group',
    subtitle: 'Групповой чат',
    lastMessage: 'Завтра разберем задачи по спискам и словарям.',
    lastTime: '11:24',
    unreadCount: 3,
    messages: [
      { id: 1, author: 'Arminis Karner', text: 'Сегодня у нас был хороший темп по домашней работе.', time: '10:02', own: false },
      { id: 2, author: 'Alex R.', text: 'Да, особенно блок по функциям оказался полезным.', time: '10:08', own: true },
      { id: 3, author: 'Arminis Karner', text: 'Завтра разберем задачи по спискам и словарям.', time: '11:24', own: false },
    ],
  },
  {
    id: 2,
    title: 'Frontend Patterns',
    kind: 'group',
    subtitle: 'Групповой чат',
    lastMessage: 'Скинул новый шаблон для компонентной композиции.',
    lastTime: '09:40',
    unreadCount: 1,
    messages: [
      { id: 1, author: 'Aaran Standen', text: 'Скинул новый шаблон для компонентной композиции.', time: '09:40', own: false },
      { id: 2, author: 'Alex R.', text: 'Посмотрю вечером и отпишусь по вопросам.', time: '09:44', own: true },
    ],
  },
  {
    id: 3,
    title: 'Дизайн-поток 2026',
    kind: 'group',
    subtitle: 'Групповой чат',
    lastMessage: 'Собираем финальные презентации до пятницы.',
    lastTime: 'Вчера',
    unreadCount: 0,
    messages: [
      { id: 1, author: 'Kamsari Funree', text: 'Собираем финальные презентации до пятницы.', time: 'Вчера, 18:10', own: false },
      { id: 2, author: 'Alex R.', text: 'Принял, загружу свою версию завтра.', time: 'Вчера, 18:35', own: true },
    ],
  },
  {
    id: 4,
    title: 'Kemalia Hamira',
    kind: 'direct',
    subtitle: 'Личный чат',
    lastMessage: 'Если хотите, могу прислать дополнительные материалы по теме.',
    lastTime: '12:06',
    unreadCount: 2,
    online: true,
    messages: [
      { id: 1, author: 'Kemalia Hamira', text: 'Если хотите, могу прислать дополнительные материалы по теме.', time: '12:06', own: false },
      { id: 2, author: 'Alex R.', text: 'Да, это было бы полезно, спасибо.', time: '12:09', own: true },
    ],
  },
  {
    id: 5,
    title: 'Aman Dannen',
    kind: 'direct',
    subtitle: 'Личный чат',
    lastMessage: 'Проверьте, пожалуйста, комментарии к макету.',
    lastTime: 'Вчера',
    unreadCount: 0,
    online: false,
    messages: [
      { id: 1, author: 'Aman Dannen', text: 'Проверьте, пожалуйста, комментарии к макету.', time: 'Вчера, 14:22', own: false },
      { id: 2, author: 'Alex R.', text: 'Уже смотрю, к вечеру отвечу по каждому пункту.', time: 'Вчера, 14:40', own: true },
    ],
  },
  {
    id: 6,
    title: 'Alex Xi Nane',
    kind: 'direct',
    subtitle: 'Личный чат',
    lastMessage: 'Добавил идеи для письменного задания в общий документ.',
    lastTime: 'Пн',
    unreadCount: 0,
    online: true,
    messages: [
      { id: 1, author: 'Alex Xi Nane', text: 'Добавил идеи для письменного задания в общий документ.', time: 'Пн, 11:05', own: false },
      { id: 2, author: 'Alex R.', text: 'Отлично, гляну после обеда.', time: 'Пн, 11:11', own: true },
    ],
  },
]

export const profileStats: ProfileStat[] = [
  { label: 'Активные группы', value: '3' },
  { label: 'Чатов', value: '6' },
]

export const profileInfo: ProfileInfoItem[] = [
  { label: 'Имя', value: 'Alex R.' },
  { label: 'Роль', value: 'Студент и участник групп' },
  { label: 'Язык интерфейса', value: 'Русский' },
  { label: 'Email', value: 'alex.r@smarteach.dev' },
  { label: 'Телефон', value: '+7 (999) 123-45-67' },
  { label: 'Город', value: 'Москва' },
]

export const profileBio =
  'Изучаю программирование и дизайн, состою в нескольких учебных группах и предпочитаю держать все учебные активности в одном аккуратном интерфейсе.'

export const profileSkills = [
  'Python',
  'Frontend',
  'UI',
  'Дизайн-системы',
  'Английский B2',
]

export const profileSkillOptions = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Vue',
  'React',
  'Frontend',
  'Backend',
  'UI',
  'UX',
  'Figma',
  'Дизайн-системы',
  'Прототипирование',
  'Аналитика',
  'SQL',
  'NestJS',
  'Английский B1',
  'Английский B2',
  'Английский C1',
]

export const joinGroupCodes: JoinGroupCodeItem[] = [
  {
    code: 'PY-2026-ALFA',
    title: 'Python для продолжающих',
    subtitle: 'Учебная группа по практике Python',
    members: '124 участника',
  },
  {
    code: 'DESIGN-ROOM-7',
    title: 'Основы графического дизайна',
    subtitle: 'Группа с практическими заданиями и разборами',
    members: '86 участников',
  },
  {
    code: 'FRONT-TEAM-11',
    title: 'Паттерны Frontend',
    subtitle: 'Группа по современным интерфейсам и архитектуре',
    members: '143 участника',
  },
]

export const allGroups: CourseCardItem[] = [...recommendedCourses, ...myGroups]

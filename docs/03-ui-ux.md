# 3. UI/UX и карта экранов

Этот документ описывает текущие страницы frontend по маршрутам из `apps/web/src/app/router/routes.ts`.

## Публичные страницы

- `/` - главная страница платформы
- `/guide` - страница-гид по платформе
- `/login` - вход
- `/register` - регистрация

## Общие страницы приложения

- `/catalog` - каталог групп
- `/my-groups` - список групп текущего пользователя
- `/groups/new` - создание группы
- `/groups/join` - вступление в группу
- `/groups/:groupId` - публичное превью группы
- `/chats` - общий раздел чатов пользователя
- `/profile` - собственный профиль
- `/profile/edit` - редактирование профиля
- `/users/:userId` - страница другого пользователя

## Рабочее пространство группы

Все внутренние экраны группы находятся под `/groups/:groupId/workspace`.

- `/groups/:groupId/workspace` - обзор группы
- `/groups/:groupId/workspace/lessons` - список материалов и уроков
- `/groups/:groupId/workspace/lessons/subsections/:subsectionId` - конкретная подсекция материалов
- `/groups/:groupId/workspace/lessons/new` - создание урока
- `/groups/:groupId/workspace/lessons/:lessonId` - просмотр урока
- `/groups/:groupId/workspace/lessons/:lessonId/edit` - редактирование урока
- `/groups/:groupId/workspace/assignments` - список заданий
- `/groups/:groupId/workspace/assignments/new` - создание задания
- `/groups/:groupId/workspace/assignments/:assignmentId` - просмотр задания
- `/groups/:groupId/workspace/assignments/:assignmentId/edit` - редактирование задания
- `/groups/:groupId/workspace/assignments/:assignmentId/submit` - отправка или редактирование сдачи
- `/groups/:groupId/workspace/assignments/:assignmentId/submissions` - список сдач по заданию
- `/groups/:groupId/workspace/assignments/:assignmentId/submissions/:submissionId` - детальная страница сдачи
- `/groups/:groupId/workspace/members` - участники группы
- `/groups/:groupId/workspace/schedule` - расписание группы
- `/groups/:groupId/workspace/schedule/new` - создание события расписания
- `/groups/:groupId/workspace/schedule/:eventId/edit` - редактирование события расписания
- `/groups/:groupId/workspace/chats` - групповые чаты
- `/groups/:groupId/workspace/requests` - заявки на вступление
- `/groups/:groupId/workspace/settings` - настройки группы

## Логика навигации внутри группы

Навигация по рабочему пространству строится из `groupWorkspaceNav` и зависит от настроек группы:

- раздел `Материалы` скрывается при `lessonsEnabled = false`
- раздел `Задания` скрывается при `assignmentsEnabled = false`
- раздел `Расписание` скрывается при `scheduleEnabled = false`
- раздел `Чаты` скрывается при `chatEnabled = false`
- разделы `Заявки` и `Настройки` предназначены для администраторов группы

## Основные пользовательские сценарии

### Гость

- открыть главную страницу
- изучить гид по платформе
- посмотреть каталог групп
- открыть превью группы по прямой ссылке
- перейти к регистрации или входу

### Участник

- войти в аккаунт
- открыть свои группы
- вступить в группу по коду или из каталога
- просматривать материалы, задания, участников, расписание и чаты
- открыть общий раздел чатов и продолжить личную переписку

### Администратор группы

- создать группу
- настроить режим доступа и включенные модули
- обрабатывать заявки на вступление
- управлять участниками и ролями
- наполнять группу материалами, уроками, заданиями и событиями
- создавать групповые чаты и полезные ссылки

## UX-заметки по текущей реализации

- превью группы и рабочее пространство разделены
- код группы используется как отдельная точка входа в сценарий вступления
- учебный контент организован не только списком уроков, но и иерархией секций и подсекций материалов
- сценарии работы с заданиями разведены по отдельным страницам для автора задания, участника и проверяющего

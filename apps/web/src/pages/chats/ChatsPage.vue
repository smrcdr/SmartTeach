<script setup lang="ts">
import {
  CheckCheck,
  FileText,
  GraduationCap,
  MoreVertical,
  PlusCircle,
  Search,
  Send,
  Smile,
  Users
} from 'lucide-vue-next'

const chatItems = [
  {
    id: 'design-systems',
    title: 'Дизайн-системы 2024',
    preview: 'Вы: Согласен, давайте использовать Inter',
    time: '14:20',
    active: true,
    icon: Users,
    tone: 'primary'
  },
  {
    id: 'art-history',
    title: 'История искусств',
    preview: 'Александр: Кто уже сдал реферат?',
    time: 'Вчера',
    active: false,
    icon: GraduationCap,
    tone: 'secondary'
  },
  {
    id: 'professor',
    title: 'Проф. Виктор Савин',
    preview: 'Отлично, жду ваш проект завтра.',
    time: '10:05',
    active: false,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSIexoPT1M7fNR4sEADlW4WOhTrE9ZiNVaw9KCIT9fP5U54Y41C50hugTKtK4d7biTMgaIuvP28X4EmOAmxFuSSXXTh8UwjHgxMRKPJySZPu8tGyg0EZnty4rd8JpxyRNpT84DzM11h1F_HvMJmbC3MOUUcA1VtO2w2JpRde8KoyfRLQp2XVrO64Z3z9eqgIFPzjXNdglNEbrZdaYOCXaUna8cyD30uprt1qCLh5XAzEg7d4itZ2og68QQpilAtWdsnGpTze7eZCs',
    online: true
  },
  {
    id: 'marina',
    title: 'Марина Ковалева',
    preview: 'Скинь ссылку на Figma, пожалуйста',
    time: 'Пн',
    active: false,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBNeNDDFZIpzdzFL0bUOFqGXvKpaJD4ZXnpV_PzgAVc3liqOIba3nLqGFJbkag8TmjKiLeRfQAidRostkHh0dHCwss9acZZkbLPjAMajz3LScsd5YKriRvpPswRDH_-Z2WqaDvP8yiZrOfUoioUyVdlAPKnLOkZ4dKTenymiRWnGopQ-9EWvkw-szTJr4X6cq0MuqUadLbPnqF-eu1nu1G-KBdHAFvXMwccyj-n5JGEdk-WBzcsC3sik9NTZmgT-qOpXmcQWakt4o'
  }
]

const filterItems = ['Все', 'Группы', 'Личные']
</script>

<template>
  <main class="chats-shell">
    <aside class="chat-list">
      <div class="chat-list__header">
        <h1>Чаты</h1>
        <div class="chat-filters" aria-label="Фильтры чатов">
          <button
            v-for="filter in filterItems"
            :key="filter"
            :class="['chat-filter', filter === 'Все' && 'chat-filter--active']"
            type="button"
          >
            {{ filter }}
          </button>
        </div>
      </div>

      <div class="chat-list__scroll">
        <article
          v-for="chat in chatItems"
          :key="chat.id"
          :class="['chat-list__item', chat.active && 'chat-list__item--active']"
        >
          <div class="chat-list__avatar-wrap">
            <img
              v-if="chat.avatarUrl"
              class="chat-list__avatar"
              :src="chat.avatarUrl"
              :alt="chat.title"
            />
            <span
              v-else
              :class="['chat-list__icon', chat.tone === 'primary' && 'chat-list__icon--primary']"
            >
              <component :is="chat.icon" :size="22" />
            </span>
            <span v-if="chat.online" class="chat-list__online" />
          </div>

          <div class="chat-list__copy">
            <div>
              <h2>{{ chat.title }}</h2>
              <time>{{ chat.time }}</time>
            </div>
            <p>{{ chat.preview }}</p>
          </div>
        </article>
      </div>
    </aside>

    <section class="chat-room" aria-label="Активный чат">
      <header class="chat-room__header">
        <div class="chat-room__identity">
          <span class="chat-room__icon"><Users :size="22" /></span>
          <div>
            <h2>Дизайн-системы 2024</h2>
            <p><span />12 участников онлайн</p>
          </div>
        </div>
        <div class="chat-room__tools">
          <button type="button" aria-label="Поиск в чате"><Search :size="20" /></button>
          <button type="button" aria-label="Настройки чата"><MoreVertical :size="20" /></button>
        </div>
      </header>

      <div class="chat-room__messages">
        <div class="chat-date">Сегодня</div>

        <article class="message message--incoming">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVFwX7KulofPF4e_C-vnU7igIQKbsUwFjBOYYxyasVYxjY3J51Q7BObs0f6ZOS9efj5HMBM2-cuX78WVXkLL8B52pwUmAitYXE4OlCEJ2QDaaWbi8QkbxpRW3DKHB9rUqa1t7Suk5uD25xXz7qloYpJ3wMnghMkHyZ4Wn99VtQCs_bQIlgOps3jUF42GkhR6Pvdcj4nVPnyWTmZEs4uDslEBGPl9aO8pdWU2-2_yFdcwG16Cr5DnPnowPT5KtM45VN-_o7Zkd3z3Y"
            alt="Марина Ковалева"
          />
          <div class="message__stack">
            <div class="message__bubble">
              <strong>Марина Ковалева</strong>
              Всем привет! Кто-нибудь уже посмотрел новый модуль по Material Design 3? Там очень интересные обновления по работе с цветом.
            </div>
            <time>14:05</time>
          </div>
        </article>

        <article class="message message--incoming message--continued">
          <div class="message__stack">
            <div class="message__bubble">Особенно заинтересовала система генерации палитр на основе исходного цвета.</div>
            <time>14:06</time>
          </div>
        </article>

        <article class="message message--outgoing">
          <div class="message__stack">
            <div class="message__bubble">
              Да, я как раз сейчас изучаю документацию. Система "The Digital Curator", которую мы используем, во многом перекликается с этими принципами.
            </div>
            <time>14:18 <CheckCheck :size="14" /></time>
          </div>
        </article>

        <article class="message message--outgoing message--continued">
          <div class="message__stack">
            <div class="message__bubble">Согласен, давайте использовать Inter в качестве основного шрифта, как в руководстве.</div>
            <time>14:20 <CheckCheck :size="14" /></time>
          </div>
        </article>

        <article class="message message--incoming message--system">
          <span class="message__system-avatar"><GraduationCap :size="18" /></span>
          <div class="message__stack">
            <div class="message__bubble">
              <strong>Система</strong>
              Александр Иванов прикрепил файл:
              <a href="#" class="message__file"><FileText :size="16" /> design_tokens_v2.pdf</a>
            </div>
            <time>14:25</time>
          </div>
        </article>
      </div>

      <form class="chat-composer">
        <button type="button" aria-label="Прикрепить файл"><PlusCircle :size="24" /></button>
        <div class="chat-composer__field">
          <input placeholder="Написать сообщение..." />
          <button type="button" aria-label="Добавить реакцию"><Smile :size="20" /></button>
        </div>
        <button class="chat-composer__send" type="submit" aria-label="Отправить сообщение"><Send :size="20" /></button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.chats-shell {
  background: var(--color-surface);
  display: grid;
  grid-template-columns: minmax(320px, 384px) minmax(0, 1fr);
  height: 100vh;
  overflow: hidden;
  padding-top: 64px;
}

.chat-list {
  background: var(--color-surface-low);
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-list__header {
  padding: 28px 24px 18px;
}

.chat-list__header h1 {
  color: var(--color-primary);
  font-size: 1.65rem;
  letter-spacing: 0;
  line-height: 1;
  margin: 0 0 22px;
}

.chat-filters {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.chat-filter {
  background: var(--color-surface-highest);
  border: 0;
  border-radius: 999px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 800;
  min-height: 36px;
  transition: background-color 160ms ease, color 160ms ease;
}

.chat-filter--active {
  background: var(--color-primary);
  color: #fff;
}

.chat-list__scroll {
  display: grid;
  gap: 6px;
  overflow-y: auto;
  padding: 0 12px 24px;
}

.chat-list__item {
  align-items: center;
  border-radius: 999px;
  cursor: pointer;
  display: grid;
  gap: 14px;
  grid-template-columns: 48px minmax(0, 1fr);
  min-width: 0;
  padding: 14px 16px;
  transition: background-color 160ms ease, box-shadow 160ms ease;
}

.chat-list__item:hover {
  background: rgb(228 225 233 / 45%);
}

.chat-list__item--active {
  background: var(--color-surface-lowest);
  box-shadow: 0 8px 26px -20px rgb(21 25 108 / 42%);
}

.chat-list__avatar-wrap {
  position: relative;
}

.chat-list__avatar,
.chat-list__icon {
  border-radius: 50%;
  height: 48px;
  width: 48px;
}

.chat-list__avatar {
  object-fit: cover;
}

.chat-list__icon {
  align-items: center;
  background: var(--color-secondary-container);
  color: var(--color-secondary);
  display: inline-flex;
  justify-content: center;
}

.chat-list__icon--primary {
  background: var(--color-primary-container);
  color: #fff;
}

.chat-list__online {
  background: #25b768;
  border: 2px solid var(--color-surface-low);
  border-radius: 50%;
  bottom: 0;
  height: 12px;
  position: absolute;
  right: 0;
  width: 12px;
}

.chat-list__copy {
  min-width: 0;
}

.chat-list__copy div {
  align-items: baseline;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  min-width: 0;
}

.chat-list__copy h2 {
  color: var(--color-text);
  font-size: 0.9rem;
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-list__item--active h2 {
  color: var(--color-primary);
}

.chat-list__copy time {
  color: var(--color-text-muted);
  flex: 0 0 auto;
  font-size: 0.66rem;
  font-weight: 750;
}

.chat-list__copy p {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.35;
  margin: 5px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-room {
  background: var(--color-surface);
  display: grid;
  grid-template-rows: 80px minmax(0, 1fr) auto;
  min-width: 0;
}

.chat-room__header {
  align-items: center;
  background: rgb(251 248 255 / 84%);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: space-between;
  padding: 0 32px;
  z-index: 2;
}

.chat-room__identity {
  align-items: center;
  display: flex;
  gap: 14px;
}

.chat-room__icon {
  align-items: center;
  background: var(--color-primary-container);
  border-radius: 50%;
  color: #fff;
  display: inline-flex;
  height: 44px;
  justify-content: center;
  width: 44px;
}

.chat-room__identity h2,
.chat-room__identity p {
  margin: 0;
}

.chat-room__identity h2 {
  color: var(--color-primary);
  font-size: 1.1rem;
  letter-spacing: 0;
}

.chat-room__identity p {
  align-items: center;
  color: var(--color-text-muted);
  display: flex;
  font-size: 0.68rem;
  font-weight: 850;
  gap: 8px;
  letter-spacing: 0.08em;
  margin-top: 4px;
  text-transform: uppercase;
}

.chat-room__identity p span {
  background: #25b768;
  border-radius: 50%;
  height: 7px;
  width: 7px;
}

.chat-room__tools {
  display: flex;
  gap: 6px;
}

.chat-room__tools button,
.chat-composer button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 50%;
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
  transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
}

.chat-room__tools button {
  height: 42px;
  width: 42px;
}

.chat-room__tools button:hover,
.chat-composer button:hover {
  background: var(--color-surface-low);
  color: var(--color-primary);
}

.chat-room__messages {
  align-content: end;
  background: var(--color-surface-bright);
  display: grid;
  gap: 12px;
  overflow-y: auto;
  padding: 24px 32px 30px;
}

.chat-date {
  background: var(--color-surface-low);
  border-radius: 999px;
  color: rgb(70 70 81 / 72%);
  font-size: 0.64rem;
  font-weight: 900;
  justify-self: center;
  letter-spacing: 0.14em;
  margin-bottom: 12px;
  padding: 7px 14px;
  text-transform: uppercase;
}

.message {
  align-items: end;
  display: flex;
  gap: 11px;
  max-width: min(76%, 760px);
}

.message img,
.message__system-avatar {
  border-radius: 50%;
  flex: 0 0 auto;
  height: 34px;
  width: 34px;
}

.message img {
  object-fit: cover;
}

.message__system-avatar {
  align-items: center;
  background: var(--color-secondary-container);
  color: var(--color-secondary);
  display: inline-flex;
  justify-content: center;
}

.message--continued {
  margin-top: -8px;
}

.message--continued.message--incoming {
  margin-left: 45px;
}

.message--outgoing {
  justify-self: end;
  margin-left: auto;
}

.message--system .message__bubble {
  font-style: italic;
}

.message__stack {
  display: grid;
  gap: 5px;
}

.message__bubble {
  background: var(--color-surface-low);
  border-radius: 18px;
  border-bottom-left-radius: 3px;
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.55;
  padding: 14px 16px;
}

.message__bubble strong {
  color: var(--color-primary);
  display: block;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  margin-bottom: 5px;
}

.message--outgoing .message__bubble {
  background: var(--color-primary);
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 3px;
  box-shadow: 0 16px 34px -24px rgb(21 25 108 / 60%);
  color: #fff;
}

.message time {
  align-items: center;
  color: var(--color-text-muted);
  display: inline-flex;
  font-size: 0.68rem;
  font-weight: 700;
  gap: 4px;
  padding: 0 4px;
}

.message--outgoing time {
  justify-content: flex-end;
}

.message__file {
  align-items: center;
  color: var(--color-primary);
  display: inline-flex;
  font-style: normal;
  font-weight: 850;
  gap: 5px;
  text-decoration: underline;
}

.chat-composer {
  align-items: center;
  background: var(--color-surface);
  display: grid;
  gap: 12px;
  grid-template-columns: 44px minmax(0, 1fr) 48px;
  padding: 18px 32px 24px;
}

.chat-composer > button {
  height: 44px;
  width: 44px;
}

.chat-composer__field {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid transparent;
  border-radius: 999px;
  display: flex;
  min-height: 50px;
  padding: 0 10px 0 22px;
  transition: background-color 160ms ease, border-color 160ms ease;
}

.chat-composer__field:focus-within {
  background: var(--color-surface-highest);
  border-color: rgb(21 25 108 / 22%);
}

.chat-composer__field input {
  background: transparent;
  border: 0;
  color: var(--color-text);
  flex: 1;
  min-width: 0;
  outline: none;
}

.chat-composer__field input::placeholder {
  color: rgb(70 70 81 / 62%);
}

.chat-composer__send {
  background: var(--color-primary) !important;
  color: #fff !important;
  height: 48px !important;
  width: 48px !important;
}

.chat-composer__send:hover {
  background: var(--color-primary-container) !important;
  transform: scale(1.03);
}

@media (max-width: 900px) {
  .chats-shell {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .chat-list {
    max-height: 42vh;
  }

  .chat-room {
    min-height: 72vh;
  }

  .message {
    max-width: 92%;
  }
}

@media (max-width: 620px) {
  .chat-room__header,
  .chat-room__messages,
  .chat-composer {
    padding-left: 18px;
    padding-right: 18px;
  }

  .chat-composer {
    grid-template-columns: 1fr 48px;
  }

  .chat-composer > button:first-child {
    display: none;
  }
}
</style>

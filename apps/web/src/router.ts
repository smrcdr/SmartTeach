import { createRouter, createWebHistory } from 'vue-router'
import CatalogPage from './pages/CatalogPage.vue'
import ChatsPage from './pages/ChatsPage.vue'
import CreateGroupPage from './pages/CreateGroupPage.vue'
import GroupDetailsPage from './pages/GroupDetailsPage.vue'
import HomePage from './pages/HomePage.vue'
import JoinGroupPage from './pages/JoinGroupPage.vue'
import MyGroupsPage from './pages/MyGroupsPage.vue'
import PlaceholderPage from './pages/PlaceholderPage.vue'
import ProfileEditPage from './pages/ProfileEditPage.vue'
import ProfilePage from './pages/ProfilePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/catalog', component: CatalogPage },
    { path: '/create-group', component: CreateGroupPage },
    { path: '/groups/:id', component: GroupDetailsPage },
    { path: '/my-groups', component: MyGroupsPage },
    { path: '/join-group', component: JoinGroupPage },
    { path: '/chats', component: ChatsPage },
    { path: '/profile', component: ProfilePage },
    { path: '/profile/edit', component: ProfileEditPage },
  ],
})

export default router

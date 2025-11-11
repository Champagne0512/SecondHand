import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
import Home from '../views/Home.vue'
import Poems from '../views/Poems.vue'
import PoemDetail from '../views/PoemDetail.vue'
import Search from '../views/Search.vue'
import Profile from '../views/Profile.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/poems',
    name: 'Poems',
    component: Poems
  },
  {
    path: '/poem/:id',
    name: 'PoemDetail',
    component: PoemDetail,
    props: true
  },
  {
    path: '/search',
    name: 'Search',
    component: Search
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  }
]

export default routes
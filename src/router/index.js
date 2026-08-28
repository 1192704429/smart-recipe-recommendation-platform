import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import UsersView from '../views/UsersView.vue'
import RecipesView from '../views/RecipesView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import IngredientsView from '../views/IngredientsView.vue'
import BannersView from '../views/BannersView.vue'
import AuditView from '../views/AuditView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginView },
  { path: '/dashboard', component: DashboardView },
  { path: '/users', component: UsersView },
  { path: '/recipes', component: RecipesView },
  { path: '/categories', component: CategoriesView },
  { path: '/ingredients', component: IngredientsView },
  { path: '/banners', component: BannersView },
  { path: '/audit', component: AuditView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router

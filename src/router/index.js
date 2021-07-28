import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import UsersRegistry from '../views/UsersRegistry.vue'
import UsersLogin from '../views/UsersLogin.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/users/login',
    name: 'UsersLogin',
    component: UsersLogin
  },
  {
    path: '/users/register',
    name: 'UsersRegistry',
    component: UsersRegistry
  }
]

const router = new VueRouter({
  routes,
  mode: 'history'
})

export default router

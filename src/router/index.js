import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/Home.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/add-record',
    name: 'AddRecord',
    component: () => import('../views/AddRecord.vue')
  },
  {
    path: '/persons',
    name: 'Persons',
    component: () => import('../views/Persons.vue')
  },
  {
    path: '/query',
    name: 'Query',
    component: () => import('../views/Query.vue')
  },
  {
    path: '/backup',
    name: 'Backup',
    component: () => import('../views/Backup.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue')
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;

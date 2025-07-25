import { createRouter, createWebHashHistory } from 'vue-router'
import Homepage from '@/views/Homepage.vue'
import EditorPage from '@/views/EditorPage.vue'

const routes = [
  {
    path: '/',
    name: 'homepage',
    component: Homepage,
    meta: {
      title: 'NovelBox - AI辅助小说创作工具'
    }
  },
  {
    path: '/editor/:novelId',
    name: 'editor',
    component: EditorPage,
    props: true,
    meta: {
      title: 'NovelBox - 编辑器'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  // Update document title
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  next()
})

export default router
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as svc from '../services/empathyService.js'
import { useUiStore } from './ui.js'

export const useEmpathyStore = defineStore('empathy', () => {
  const posts = ref([
    {
      id: '1',
      recImg: '/images/nok.jpg', recName: 'Nok S.', recRole: 'Data Scientist · DS Team',
      sndImg: '', sndName: 'Somsak P.',
      msg: 'ขอบใจมากเลย! พี่น๊อกช่วยงานได้เยอะมากเลยค่ะ 🙌',
      tag: 'เก่งมาก ⭐', time: '2 ชม. ที่แล้ว', react: '❤️ 12 · 👏 5', likeCount: 17,
      comments: [
        { id: 'c1', img: '', name: 'NAMSOM', text: 'เห็นด้วยมากค่ะ พี่น๊อกเก่งมาก 👏', time: '1 ชม. ที่แล้ว' },
        { id: 'c2', img: '', name: 'Pam W.', text: 'ขอบคุณที่ชื่นชมพี่น๊อกนะคะ 🙏', time: '45 นาที' },
        { id: 'c3', img: '', name: 'Ton K.', text: 'เก่งจริงๆ ครับ!', time: '20 นาที' }
      ]
    },
    {
      id: '2',
      recImg: '/images/namsom.jpg', recName: 'NAMSOM', recRole: 'People Engagement · DS Team',
      sndImg: '', sndName: 'Nok S.',
      msg: 'ขอบคุณจุนมากเลยนะคะ 🙏 ช่วยเหลือทีมเสมอเลย',
      tag: 'ขอบคุณ 🙏', time: 'เมื่อวาน', react: '🩷 8', likeCount: 8,
      comments: [
        { id: 'c4', img: '', name: 'Somsak P.', text: 'จุนดีมากจริงๆ ค่ะ ❤️', time: 'เมื่อวาน' },
        { id: 'c5', img: '', name: 'Pam W.', text: 'ทีมเราดีมากเลย 🌟', time: 'เมื่อวาน' }
      ]
    },
    {
      id: '3',
      recImg: '/images/wut.jpg', recName: 'WUT', recRole: 'Data Science Department',
      sndImg: '', sndName: 'Pam W.',
      msg: 'ทีม DS เก่งมากๆ ประทับใจทุกคนเลยค่ะ 💪 ขอบคุณทุกคนนะคะ',
      tag: 'สู้ๆ 💪', time: '3 วันก่อน', react: '❤️ 20 · 🌟 6', likeCount: 26,
      comments: [
        { id: 'c6', img: '', name: 'Somsak P.', text: 'ขอบคุณ Pam มากเลยค่ะ 😊', time: '3 วันก่อน' },
        { id: 'c7', img: '', name: 'Nok S.', text: 'ทีมเราเก่งด้วยกันทุกคนค่ะ 💪', time: '3 วันก่อน' },
        { id: 'c8', img: '', name: 'Ton K.', text: 'สู้ๆ ครับทุกคน!', time: '2 วันก่อน' },
        { id: 'c9', img: '', name: 'NAMSOM', text: 'ประทับใจทีมมากเลยค่ะ 🌟', time: '2 วันก่อน' },
        { id: 'c10', img: '', name: 'Kai M.', text: 'ขอบคุณ Pam ที่ชื่นชมทีมนะคะ ❤️', time: '1 วันก่อน' }
      ]
    }
  ])
  const isLoading = ref(false)
  const lastFetched = ref(null)

  async function loadPosts(force = false) {
    if (!force && lastFetched.value && (Date.now() - lastFetched.value) < 60000) return
    isLoading.value = true
    try {
      const data = await svc.fetchPosts()
      posts.value = data
      lastFetched.value = Date.now()
    } catch {
      // keep seeded data on error
    } finally {
      isLoading.value = false
    }
  }

  async function addPost(payload) {
    const ui = useUiStore()
    const temp = { ...payload, id: 'tmp_' + Date.now(), comments: [], likeCount: 0 }
    posts.value.unshift(temp)
    try {
      const created = await svc.createPost(payload)
      const idx = posts.value.findIndex(p => p.id === temp.id)
      if (idx !== -1) posts.value[idx] = created
      ui.showToast('ส่งคำชื่นชมสำเร็จ! 💝')
    } catch {
      posts.value = posts.value.filter(p => p.id !== temp.id)
      ui.showToast('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  async function addComment(postId, text, authorName) {
    const ui = useUiStore()
    const post = posts.value.find(p => p.id === postId)
    if (!post) return
    const temp = { id: 'tmp_cm_' + Date.now(), name: authorName, text, time: 'เมื่อกี้' }
    post.comments.push(temp)
    try {
      const cm = await svc.addComment(postId, text, authorName)
      const idx = post.comments.findIndex(c => c.id === temp.id)
      if (idx !== -1) post.comments[idx] = cm
    } catch {
      post.comments = post.comments.filter(c => c.id !== temp.id)
      ui.showToast('ส่งความคิดเห็นไม่สำเร็จ')
    }
  }

  async function toggleLike(postId) {
    const post = posts.value.find(p => p.id === postId)
    if (!post) return
    const wasLiked = post._liked
    post._liked = !wasLiked
    post.likeCount = (post.likeCount || 0) + (post._liked ? 1 : -1)
    try {
      await svc.toggleLike(postId, post._liked)
    } catch {
      post._liked = wasLiked
      post.likeCount = (post.likeCount || 0) + (wasLiked ? 1 : -1)
    }
  }

  return { posts, isLoading, loadPosts, addPost, addComment, toggleLike }
})

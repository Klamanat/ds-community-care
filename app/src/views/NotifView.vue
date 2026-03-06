<template>
  <div class="notif-page">
    <div style="font-size:15px;font-weight:800;color:var(--dark);margin-bottom:14px;padding-top:4px;">🔔 แจ้งเตือน</div>
    <div
      v-for="n in notifs"
      :key="n.id"
      class="notif-item ripple-host"
      :class="{ 'notif-unread': n.unread }"
      @click="markRead(n)"
    >
      <div class="notif-dot" :style="{ background: n.color }"></div>
      <div class="notif-body">
        <div class="notif-title">{{ n.title }}</div>
        <div class="notif-msg">{{ n.msg }}</div>
        <div class="notif-time">{{ n.time }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUiStore } from '../stores/ui.js'

const ui = useUiStore()
const notifs = ref([
  { id:1, unread:true,  color:'#6366F1', title:'🎂 วันเกิดของ Somsak P. วันนี้!',   msg:'อย่าลืมส่งคำอวยพรให้เพื่อนร่วมงานนะคะ 🎉', time:'เมื่อกี้' },
  { id:2, unread:true,  color:'#EC4899', title:'💝 มีคนส่งความรู้สึกดีๆ ให้คุณ!',  msg:'Nok S. ส่ง "ขอบคุณ 🙏" มาให้คุณ',          time:'10 นาทีที่แล้ว' },
  { id:3, unread:true,  color:'#F59E0B', title:'⭐ คุณได้รับคะแนน DS Reward!',      msg:'เข้าร่วมกิจกรรม Hackathon ได้รับ +50 คะแนน', time:'1 ชั่วโมงที่แล้ว' },
  { id:4, unread:false, color:'#A89DC0', title:'📅 เตือนกิจกรรม: Songkran Festival', msg:'กิจกรรมสงกรานต์จะเริ่มในอีก 3 สัปดาห์',      time:'เมื่อวาน' },
  { id:5, unread:false, color:'#A89DC0', title:'🧠 Mental Health Week เริ่มแล้ว',   msg:'ลงทะเบียนเข้ารับการปรึกษาฟรี ตลอดเดือนนี้',  time:'2 วันที่แล้ว' },
])

function markRead(n) {
  if (n.unread) {
    n.unread = false
    ui.notifBadge = Math.max(0, ui.notifBadge - 1)
  }
}
</script>

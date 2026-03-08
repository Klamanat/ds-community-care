<template>
  <BaseModal modal-id="modal-reward">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#06C755 0%,#00A040 100%);padding:0 20px 20px;position:relative;overflow:hidden;flex-shrink:0;border-radius:28px 28px 0 0;">
      <!-- Glow orb -->
      <div style="position:absolute;top:-30px;right:-20px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,0.18),transparent 70%);pointer-events:none;"></div>
      <div style="position:absolute;bottom:-20px;left:-10px;width:90px;height:90px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,0.1),transparent 70%);pointer-events:none;"></div>

      <div class="modal-handle" style="background:rgba(255,255,255,0.4);"></div>
      <div style="text-align:center;position:relative;z-index:1;margin-top:10px;">
        <!-- Shield icon -->
        <div style="width:56px;height:56px;margin:0 auto 10px;background:rgba(255,255,255,0.2);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:30px;border:2px solid rgba(255,255,255,0.35);">🏆</div>
        <div style="font-size:22px;font-weight:800;color:white;text-shadow:0 2px 4px rgba(0,0,0,0.15);">DS Reward</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.85);margin-top:3px;">สะสมคะแนนแลกของรางวัล 🎁</div>
      </div>

      <!-- Points badge -->
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(0,0,0,0.15);border-radius:16px;padding:10px 16px;margin-top:14px;">
        <span style="font-size:20px;">⭐</span>
        <span style="font-size:13px;font-weight:700;color:white;">คะแนนของคุณ:</span>
        <span style="font-size:18px;font-weight:900;color:#FFE566;">{{ totalPts }} pts</span>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="modal-body-scroll" style="padding:16px;">
      <div style="font-size:12px;font-weight:800;color:#6B7280;letter-spacing:0.5px;margin-bottom:10px;">✨ วิธีสะสมคะแนน</div>

      <div style="display:flex;flex-direction:column;gap:8px;">
        <div
          v-for="item in rewardItems"
          :key="item.name"
          class="pts-card"
          :style="{ background: item.bgColor, border: `1.5px solid ${item.color}30` }"
        >
          <div class="pts-icon">{{ item.icon }}</div>
          <div class="pts-info">
            <div class="pts-name">{{ item.name }}</div>
            <div class="pts-sub">{{ item.desc }}</div>
          </div>
          <div class="pts-badge" :style="{ background: item.color, color: 'white' }">{{ item.pts }}</div>
        </div>
      </div>

      <button class="modal-close-btn mt-4" style="background:linear-gradient(135deg,#06C755,#00A040);" @click="ui.showToast('ระบบสะสมคะแนน — เร็วๆ นี้ 🚀')">
        สะสมคะแนนเลย ⭐
      </button>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore } from '../../stores/ui.js'

const ui = useUiStore()

const totalPts = 280

const rewardItems = [
  { icon:'🎪', name:'ผู้ร่วมจัดกิจกรรม People Engagement', desc:'เป็นผู้ร่วมจัด / Co-host กิจกรรม',           pts:'+100 pts', color:'#FF6B9D', bgColor:'#FFF0F5' },
  { icon:'🙌', name:'เข้าร่วมกิจกรรม',                    desc:'เข้าร่วม event / กิจกรรมองค์กร',            pts:'+50 pts',  color:'#6366F1', bgColor:'#EEF2FF' },
  { icon:'💌', name:'ส่ง Empathy ให้เพื่อน',              desc:'ส่งกำลังใจ / ข้อความให้เพื่อนร่วมงาน',      pts:'+10 pts',  color:'#EC4899', bgColor:'#FDF2F8' },
  { icon:'📅', name:'Check-in รายวัน',                    desc:'เช็คอินในแอปทุกวัน',                        pts:'+5 pts',   color:'#F59E0B', bgColor:'#FFFBEB' },
  { icon:'🗓️', name:'Check-in Bimonthly',                 desc:'เช็คอินครบ 2 สัปดาห์ติดต่อกัน',             pts:'+150 pts', color:'#10B981', bgColor:'#ECFDF5' },
  { icon:'🎂', name:'อวยพรวันเกิดเพื่อน',                 desc:'ส่งคำอวยพรวันเกิดให้เพื่อนร่วมงาน',         pts:'+50 pts',  color:'#A855F7', bgColor:'#F5F3FF' },
]
</script>

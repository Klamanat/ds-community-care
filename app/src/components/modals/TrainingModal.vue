<template>
  <BaseModal modal-id="modal-training">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#FFD6DC 0%,#FF8FA3 40%,#FF4D6D 100%);padding:0 20px 20px;position:relative;overflow:hidden;flex-shrink:0;border-radius:28px 28px 0 0;">
      <!-- Floating icons -->
      <span style="position:absolute;font-size:22px;top:18px;left:16px;opacity:0.35;animation:floatY 2.2s ease-in-out infinite;">📚</span>
      <span style="position:absolute;font-size:18px;top:14px;left:52px;opacity:0.3;animation:floatY 3s ease-in-out infinite 0.5s;">✏️</span>
      <span style="position:absolute;font-size:20px;top:20px;right:48px;opacity:0.35;animation:floatY 2.8s ease-in-out infinite 0.8s;">💡</span>
      <span style="position:absolute;font-size:16px;top:12px;right:16px;opacity:0.3;animation:floatY 2.5s ease-in-out infinite 0.3s;">🎯</span>
      <span style="position:absolute;font-size:14px;bottom:24px;left:12px;opacity:0.3;animation:floatY 3.2s ease-in-out infinite 1s;">⭐</span>
      <span style="position:absolute;font-size:16px;bottom:20px;right:14px;opacity:0.3;animation:floatY 2.6s ease-in-out infinite 0.6s;">🏆</span>

      <div class="modal-handle" style="background:rgba(255,255,255,0.4);"></div>
      <div style="text-align:center;position:relative;z-index:1;margin-top:10px;">
        <div style="font-size:36px;margin-bottom:4px;">📚</div>
        <div style="font-size:21px;font-weight:800;color:white;text-shadow:0 2px 4px rgba(0,0,0,0.15);">Training & Development</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:3px;letter-spacing:0.5px;">หลักสูตรพัฒนาทักษะ 2026 🌱</div>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="modal-body-scroll" style="padding:16px;">
      <div class="train-grid">
        <div v-for="card in trainingCards" :key="card.name"
          class="t-card ripple-host"
          :class="{ 'col-span-2': card.wide }"
          :style="{ background: card.bgColor, border: `1.5px solid ${card.color}30` }"
          @click="ui.showToast(card.name + ' — เร็วๆนี้ 🚀')"
        >
          <div class="tc-icon-sm">{{ card.icon }}</div>
          <div class="tc-name-dark">{{ card.name }}</div>
          <div class="tc-tag-color" :style="{ color: card.color, background: card.color + '20' }">{{ card.tag }}</div>
        </div>
      </div>

      <button class="modal-close-btn mt-4" style="background:linear-gradient(135deg,#FF4D6D,#FF8FA3);" @click="ui.closeModal()">
        ลงทะเบียนเรียน 🎓
      </button>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore } from '../../stores/ui.js'

const ui = useUiStore()

const trainingCards = [
  { icon:'📅', name:'Annual Training',               tag:'ประจำปี',          color:'#0EA5E9', bgColor:'#E0F2FE' },
  { icon:'🎯', name:'IDP',                           tag:'แผนพัฒนาตนเอง',   color:'#A855F7', bgColor:'#F5F3FF' },
  { icon:'✍️', name:'Internal Blog',                 tag:'บทความภายใน',     color:'#EC4899', bgColor:'#FDF2F8' },
  { icon:'🌐', name:'External Training',             tag:'อบรมภายนอก',      color:'#F59E0B', bgColor:'#FFFBEB' },
  { icon:'📋', name:'Compulsory Program',            tag:'หลักสูตรบังคับ',  color:'#EF4444', bgColor:'#FFF1F2' },
  { icon:'⭐', name:'แนะนำคอร์ส SuperSkills 2026',   tag:'คอร์สแนะนำ',      color:'#10B981', bgColor:'#ECFDF5', wide: true },
  { icon:'🏭', name:'Site Visit',                    tag:'เยี่ยมชมสถานที่', color:'#06B6D4', bgColor:'#ECFEFF' },
  { icon:'👑', name:'Talent & Leadership Program',   tag:'ผู้นำรุ่นใหม่',   color:'#8B5CF6', bgColor:'#F5F3FF' },
]
</script>

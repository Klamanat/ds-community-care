<template>
  <BaseModal modal-id="modal-culture" sheet-class="modal-sheet--full">
    <!-- Dark hero header -->
    <div style="background:#0A0A1A;padding:20px 20px 18px;position:relative;overflow:hidden;flex-shrink:0;border-radius:28px 28px 0 0;">
      <div class="modal-handle" style="background:rgba(255,255,255,0.25);"></div>
      <!-- Grid overlay -->
      <div class="absolute inset-0 opacity-20 pointer-events-none"
           style="background:repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(0,180,255,0.4) 40px,rgba(0,180,255,0.4) 41px),repeating-linear-gradient(0deg,transparent,transparent 30px,rgba(0,180,255,0.3) 30px,rgba(0,180,255,0.3) 31px);"></div>
      <!-- Glow orbs -->
      <div class="absolute -top-8 -left-5 w-[140px] h-[140px] rounded-full pointer-events-none"
           style="background:radial-gradient(circle,rgba(255,100,30,0.35),transparent 70%);"></div>
      <div class="absolute -top-5 -right-5 w-[120px] h-[120px] rounded-full pointer-events-none"
           style="background:radial-gradient(circle,rgba(120,50,255,0.3),transparent 70%);"></div>

      <!-- Close button -->
      <button
        class="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center text-[16px] text-white/60 hover:text-white hover:bg-white/10 transition-all"
        @click="ui.closeModal()"
      >✕</button>

      <div class="text-center relative z-10 mt-2">
        <div class="text-[42px] font-black tracking-[8px] bg-clip-text text-transparent"
             style="background-image:linear-gradient(90deg,#FF6B00,#FF3CAC,#A855F7,#3B82F6);-webkit-background-clip:text;filter:drop-shadow(0 0 8px rgba(255,100,30,0.5));">FIRE 🔥</div>
        <div class="text-[20px] font-extrabold text-[#FFD700] mt-0.5"
             style="text-shadow:0 0 10px rgba(255,215,0,0.6);">ปลุกพลังสร้างสรรค์</div>
        <div class="text-[12px] text-[rgba(150,200,255,0.85)] mt-1 tracking-[2px]">
          Digital Solutions Team Culture
        </div>
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="modal-body-scroll" style="background:#0A0A1A;">
      <div class="px-4 pt-4 pb-8 flex flex-col gap-3">
        <!-- FIRE Cards -->
        <div
          v-for="card in fireCards"
          :key="card.letter"
          class="fire-card border"
          :style="{ borderColor: card.color + '40', background: 'linear-gradient(135deg,#0F0F20,#1A1A30)' }"
        >
          <div class="fire-letter" :style="{ color: card.color, textShadow: `0 0 12px ${card.color},0 0 24px ${card.color}40` }">
            {{ card.letter }}
          </div>
          <div class="fire-content">
            <div class="fire-title" :style="{ color: card.color }">{{ card.title }}</div>
            <div class="fire-subtitle">{{ card.subtitle }}</div>
            <div class="fire-desc">{{ card.desc }}</div>
          </div>
          <div class="text-[32px] absolute right-14 top-4"
               :style="{ filter: `drop-shadow(0 0 6px ${card.color})` }">{{ card.emoji }}</div>
        </div>

        <!-- Innovation badge -->
        <div class="text-center mt-2">
          <div class="culture-badge inline-flex">
            <span class="culture-badge-icon">🚀</span>
            <div class="culture-badge-text">
              <div class="text-[13px] font-black text-white">Innovation Driven</div>
              <div class="text-[10px] text-white/60 mt-0.5">DS Team · 2026</div>
            </div>
          </div>
        </div>

        <!-- Core Values -->
        <div class="mt-2">
          <div class="text-[13px] font-extrabold text-[rgba(150,200,255,0.7)] tracking-[2px] uppercase mb-3 text-center">
            Our Core Values
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <div
              v-for="v in coreValues"
              :key="v.en"
              class="culture-value bg-[#0F1020] border-[#1E2040]"
            >
              <div class="culture-value-icon">{{ v.icon }}</div>
              <div class="culture-value-name text-white/90">{{ v.name }}</div>
              <div class="culture-value-en text-white/40">{{ v.en }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore } from '../../stores/ui.js'

const ui = useUiStore()

const fireCards = [
  { letter:'F', title:'Flexible',       subtitle:'พลั้วไหว ไร้ขีดจำกัด',             color:'#FF8C00', emoji:'🪶',
    desc:'ปรับตัวเองและทำงานแบบ Agile รับมือกับการเปลี่ยนแปลงในทุกความท้าทาย' },
  { letter:'I', title:'Impact',         subtitle:'ปล่อยของ เล็งที่เป้าหมาย',         color:'#00CFFF', emoji:'🚀',
    desc:'ใช้ Passion สร้างผลลัพธ์ โฟกัสที่ Outcome ไม่ใช่แค่ Output' },
  { letter:'R', title:'Responsibility', subtitle:'เป็นบอสด้วยกัน รับผิดชอบเต็มร้อย', color:'#CC44FF', emoji:'🛡️',
    desc:'เล่นเป็นทีมเดียวกัน ความสำเร็จของทีมคือความสำเร็จของทุกคน' },
  { letter:'E', title:'Excellence',     subtitle:'ตำนานเหนือชั้น ทะลุมาตรฐาน',       color:'#44FFB0', emoji:'💎',
    desc:'ไม่หยุดที่มาตรฐานเดิม ส่งมอบงานที่เหนือความคาดหมาย ใส่ใจในทุกรายละเอียด' },
]

const coreValues = [
  { icon:'🤝', name:'ทำงานเป็นทีม', en:'Team First' },
  { icon:'💡', name:'คิดสร้างสรรค์', en:'Creative Thinking' },
  { icon:'📈', name:'พัฒนาต่อเนื่อง', en:'Continuous Growth' },
  { icon:'❤️', name:'ใส่ใจกัน',     en:'Care & Support' },
]
</script>

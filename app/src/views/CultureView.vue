<template>
  <div style="background:#0A0A1A;min-height:100vh;overflow-x:hidden;">
    <!-- FIRE Hero Header -->
    <div style="background:#0A0A1A;padding:24px 20px 20px;position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;opacity:0.18;background:repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(0,180,255,0.4) 40px,rgba(0,180,255,0.4) 41px),repeating-linear-gradient(0deg,transparent,transparent 30px,rgba(0,180,255,0.3) 30px,rgba(0,180,255,0.3) 31px);"></div>
      <div style="position:absolute;top:-30px;left:-20px;width:140px;height:140px;background:radial-gradient(circle,rgba(255,100,30,0.35),transparent 70%);border-radius:50%;"></div>
      <div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;background:radial-gradient(circle,rgba(120,50,255,0.3),transparent 70%);border-radius:50%;"></div>
      <div style="text-align:center;position:relative;z-index:2;">
        <div style="font-size:48px;font-weight:900;letter-spacing:8px;background:linear-gradient(90deg,#FF6B00,#FF3CAC,#A855F7,#3B82F6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 8px rgba(255,100,30,0.5));">FIRE 🔥</div>
        <div style="font-size:22px;font-weight:800;color:#FFD700;margin-top:2px;text-shadow:0 0 10px rgba(255,215,0,0.6);">ปลุกพลังสร้างสรรค์</div>
        <div style="font-size:13px;color:rgba(150,200,255,0.85);margin-top:4px;letter-spacing:2px;">Digital Solutions Team Culture</div>
      </div>
    </div>

    <!-- FIRE Cards -->
    <div style="padding:0 16px 32px;display:flex;flex-direction:column;gap:12px;">
      <div v-for="card in fireCards" :key="card.letter" class="fire-card" :style="{ borderColor: card.color }">
        <div class="fire-card-inner">
          <div class="fire-letter" :style="{ color: card.color, textShadow: `0 0 12px ${card.color},0 0 24px ${card.color}40` }">{{ card.letter }}</div>
          <div class="fire-content">
            <div class="fire-title" :style="{ color: card.color }">{{ card.title }}</div>
            <div class="fire-subtitle">{{ card.subtitle }}</div>
            <div class="fire-desc">{{ card.desc }}</div>
          </div>
          <div style="font-size:32px;" :style="{ filter: `drop-shadow(0 0 6px ${card.color})` }">{{ card.emoji }}</div>
        </div>
      </div>

      <!-- Innovation badge -->
      <div style="text-align:center;margin-top:8px;">
        <div class="culture-badge">
          <span class="culture-badge-icon">🚀</span>
          <span class="culture-badge-text">Innovation Driven</span>
        </div>
      </div>

      <!-- Core Values -->
      <div style="margin-top:8px;">
        <div style="font-size:13px;font-weight:800;color:rgba(150,200,255,0.7);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;text-align:center;">Our Core Values</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div v-for="v in coreValues" :key="v.en" class="culture-value">
            <div class="culture-value-icon">{{ v.icon }}</div>
            <div class="culture-value-name">{{ v.name }}</div>
            <div class="culture-value-en">{{ v.en }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const fireCards = [
  { letter:'F', title:'Flexible',       subtitle:'พลั้วไหว ไร้ขีดจำกัด',        color:'#FF8C00', emoji:'🪶', desc:'ปรับตัวเองและทำงานแบบ Agile รับมือกับการเปลี่ยนแปลงในทุกความท้าทาย' },
  { letter:'I', title:'Impact',         subtitle:'ปล่อยของ เล็งที่เป้าหมาย',    color:'#00CFFF', emoji:'🚀', desc:'ใช้ Passion สร้างผลลัพธ์ โฟกัสที่ Outcome ไม่ใช่แค่ Output' },
  { letter:'R', title:'Responsibility', subtitle:'เป็นบอสด้วยกัน รับผิดชอบเต็มร้อย', color:'#CC44FF', emoji:'🛡️', desc:'เล่นเป็นทีมเดียวกัน ความสำเร็จของทีมคือความสำเร็จของทุกคน' },
  { letter:'E', title:'Excellence',     subtitle:'ตำนานเหนือชั้น ทะลุมาตรฐาน',  color:'#44FFB0', emoji:'💎', desc:'ไม่หยุดที่มาตรฐานเดิม ส่งมอบงานที่เหนือความคาดหมาย ใส่ใจในทุกรายละเอียด' },
]

const coreValues = [
  { icon:'🤝', name:'ทำงานเป็นทีม', en:'Team First' },
  { icon:'💡', name:'คิดสร้างสรรค์', en:'Creative Thinking' },
  { icon:'📈', name:'พัฒนาต่อเนื่อง', en:'Continuous Growth' },
  { icon:'❤️', name:'ใส่ใจกัน',     en:'Care & Support' },
]
</script>

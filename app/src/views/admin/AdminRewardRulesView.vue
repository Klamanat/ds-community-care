<template>
  <div class="al-wrap">
    <header class="al-header">
      <div class="al-logo">🛡️ DS Admin</div>
      <div class="al-header-right">
        <span class="al-user-name">{{ admin.adminName }}</span>
        <button class="al-logout-btn" @click="doLogout">ออกจากระบบ</button>
      </div>
    </header>

    <main class="al-main">
      <a class="al-back" @click="router.push('/admin')">← Dashboard</a>

      <div class="al-page-header">
        <h2 class="al-page-title">🏆 วิธีสะสมคะแนน</h2>
      </div>

      <div class="al-card">
        <div class="al-card-header">
          <span class="al-card-title">กฎการสะสมคะแนน</span>
          <span class="al-badge al-badge-blue">{{ rules.length }} รายการ</span>
        </div>

        <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
        <div v-else-if="!rules.length" class="al-empty">📭 ไม่พบข้อมูล — รัน seedPointRules() ใน GAS ก่อน</div>

        <div v-else>
          <div class="al-item rw-rule-item" v-for="r in rules" :key="r.id">
            <div class="rw-rule-icon">{{ r.icon }}</div>
            <div class="al-item-body">
              <div class="al-item-title">{{ r.name }}</div>
              <div class="al-item-sub">{{ r.desc }}</div>
              <div class="al-item-meta">
                <span class="al-badge" :class="r.active === 'false' ? 'al-badge-gray' : 'al-badge-green'">
                  {{ r.active === 'false' ? 'ปิด' : 'เปิด' }}
                </span>
                <span class="al-badge al-badge-blue">+{{ r.pts }} pts</span>
                <span class="al-badge al-badge-gray" style="font-size:10px;">{{ r.type }}</span>
              </div>
            </div>
            <div class="al-item-actions">
              <button class="al-btn al-btn-edit" @click="openEdit(r)">แก้ไข</button>
            </div>
          </div>
        </div>
      </div>

      <div class="al-info-box">
        <div style="font-size:12px;font-weight:800;color:#3730A3;margin-bottom:6px;">ℹ️ หมายเหตุ</div>
        <ul style="font-size:12px;color:#4338CA;line-height:2;padding-left:16px;margin:0;">
          <li>แก้ไขจำนวนคะแนน, icon, ชื่อ และคำอธิบายของแต่ละกฎได้</li>
          <li>ปิด/เปิด กฎ — ถ้าปิดจะไม่มอบคะแนนให้ผู้ใช้เมื่อทำกิจกรรมนั้น</li>
          <li>เพิ่มกฎใหม่ได้โดยเพิ่มแถวใน Google Sheets (PointRules)</li>
        </ul>
      </div>
    </main>

    <!-- Edit Modal -->
    <div v-if="modal.open" class="al-modal-overlay" @click.self="modal.open=false">
      <div class="al-modal">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">✏️ แก้ไขกฎคะแนน</div>

        <div class="al-form-2col">
          <div class="al-form-row">
            <label class="al-form-label">Icon</label>
            <input v-model="form.icon" class="al-form-input" maxlength="4" placeholder="🙌" />
          </div>
          <div class="al-form-row">
            <label class="al-form-label">คะแนน (pts)</label>
            <input v-model.number="form.pts" type="number" min="0" max="9999" class="al-form-input" />
          </div>
        </div>

        <div class="al-form-row">
          <label class="al-form-label">ชื่อ</label>
          <input v-model="form.name" class="al-form-input" maxlength="60" placeholder="ชื่อกิจกรรม" />
        </div>
        <div class="al-form-row">
          <label class="al-form-label">คำอธิบาย</label>
          <input v-model="form.desc" class="al-form-input" maxlength="120" placeholder="รายละเอียด..." />
        </div>

        <div class="al-form-row">
          <label class="al-form-label">สถานะ</label>
          <div class="rw-toggle-wrap">
            <label class="rw-toggle">
              <input type="checkbox" :checked="form.active !== 'false'" @change="e => form.active = e.target.checked ? 'true' : 'false'" />
              <span class="rw-toggle-slider"></span>
            </label>
            <span class="rw-toggle-label">{{ form.active !== 'false' ? '✅ เปิดใช้งาน' : '🔴 ปิดใช้งาน' }}</span>
          </div>
        </div>

        <div v-if="modal.error" class="al-error">⚠️ {{ modal.error }}</div>

        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="modal.open=false">ยกเลิก</button>
          <button class="al-btn al-btn-save" :disabled="modal.saving" @click="saveModal">
            {{ modal.saving ? 'กำลังบันทึก...' : '✅ บันทึก' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore }  from '../../stores/admin.js'
import { useRewardStore } from '../../stores/reward.js'
import { adminUpdateRewardRule } from '../../services/rewardService.js'

const admin  = useAdminStore()
const reward = useRewardStore()
const router = useRouter()

const loading = ref(true)
const rules   = ref([])

const modal = reactive({ open: false, saving: false, error: '' })
const form  = reactive({ id: '', icon: '', name: '', desc: '', pts: 0, active: 'true' })

onMounted(async () => {
  await reward.loadRules(true)
  rules.value = reward.rules
  loading.value = false
})

function openEdit(r) {
  Object.assign(form, { ...r })
  modal.error = ''
  modal.open  = true
}

async function saveModal() {
  if (!form.name.trim()) { modal.error = 'กรุณากรอกชื่อ'; return }
  modal.saving = true; modal.error = ''
  try {
    await adminUpdateRewardRule(admin.token, form.id, {
      icon:   form.icon,
      name:   form.name,
      desc:   form.desc,
      pts:    String(form.pts),
      active: form.active,
    })
    // Update local list
    const idx = rules.value.findIndex(r => r.id === form.id)
    if (idx >= 0) Object.assign(rules.value[idx], { ...form })
    reward.rules = [...rules.value]
    modal.open = false
  } catch (e) {
    modal.error = e.message || 'เกิดข้อผิดพลาด'
  } finally {
    modal.saving = false
  }
}

function doLogout() { admin.logout(); router.push('/admin/login') }
</script>

<style scoped>
@import './admin.css';

.rw-rule-icon {
  font-size: 28px;
  width: 40px;
  text-align: center;
  flex-shrink: 0;
}
.rw-rule-item { align-items: center; }

.rw-toggle-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}
.rw-toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}
.rw-toggle input { opacity: 0; width: 0; height: 0; }
.rw-toggle-slider {
  position: absolute;
  inset: 0;
  background: #CDD0D4;
  border-radius: 24px;
  cursor: pointer;
  transition: background 0.2s;
}
.rw-toggle-slider::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.rw-toggle input:checked + .rw-toggle-slider { background: #06C755; }
.rw-toggle input:checked + .rw-toggle-slider::before { transform: translateX(20px); }
.rw-toggle-label { font-size: 13px; font-weight: 700; color: #374151; }
</style>

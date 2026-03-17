<template>
  <div>
    <main class="al-main">

      <div class="al-page-header">
        <h2 class="al-page-title">🏆 วิธีสะสมคะแนน</h2>
        <button class="al-btn al-btn-primary" @click="openAdd">+ เพิ่มกฎ</button>
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
            <!-- Color swatch + icon -->
            <div class="rw-rule-swatch" :style="{ background: r.color || '#6366F1' }">
              {{ r.icon }}
            </div>
            <div class="al-item-body">
              <div class="al-item-title">{{ r.name }}</div>
              <div class="al-item-sub">{{ r.desc }}</div>
              <div class="al-item-meta">
                <span class="al-badge" :class="r.active === 'false' ? 'al-badge-gray' : 'al-badge-green'">
                  {{ r.active === 'false' ? 'ปิด' : 'เปิด' }}
                </span>
                <span class="al-badge al-badge-blue">+{{ r.pts }} pts</span>
                <span class="al-badge al-badge-gray rw-type-badge">{{ r.type }}</span>
                <span v-if="r.subtype" class="al-badge al-badge-purple rw-type-badge">{{ r.subtype }}</span>
              </div>
            </div>
            <div class="al-item-actions">
              <button class="al-btn al-btn-edit" @click="openEdit(r)">แก้ไข</button>
              <button class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
            </div>
          </div>
        </div>
      </div>

      <div class="al-info-box">
        <div style="font-size:12px;font-weight:800;color:#3730A3;margin-bottom:6px;">ℹ️ หมายเหตุ</div>
        <ul style="font-size:12px;color:#4338CA;line-height:2;padding-left:16px;margin:0;">
          <li>type + subtype ต้องไม่ซ้ำกัน (GAS จะตรวจสอบ)</li>
          <li>subtype เว้นว่าง = กฎ default ของ type นั้น</li>
          <li>เมื่อเลือกประเภท icon และสีจะถูก auto-fill ให้อัตโนมัติ</li>
          <li>ปิด active จะหยุดมอบคะแนนทันที (GAS จะข้ามไป)</li>
        </ul>
      </div>
    </main>

    <!-- Add / Edit Modal -->
    <div v-if="modal.open" class="al-modal-overlay" @click.self="modal.open=false">
      <div class="al-modal">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">{{ modal.mode === 'add' ? '+ เพิ่มกฎใหม่' : '✏️ แก้ไขกฎคะแนน' }}</div>

        <!-- type (add only) -->
        <div v-if="modal.mode === 'add'" class="al-form-row">
          <label class="al-form-label">ประเภท <span style="color:#EF4444;">*</span></label>
          <select v-model="form.type" class="al-form-select" @change="onTypeChange">
            <option value="" disabled>เลือกประเภท...</option>
            <option
              v-for="opt in TYPE_OPTIONS"
              :key="opt.value"
              :value="opt.value"
            >{{ opt.label }}</option>
          </select>
        </div>
        <div v-if="modal.mode === 'add'" class="al-form-row">
          <label class="al-form-label">Subtype</label>
          <select v-model="form.subtype" class="al-form-select" :disabled="!form.type">
            <option v-if="!form.type" value="" disabled>เลือก type ก่อน</option>
            <option
              v-for="opt in availableSubtypes"
              :key="opt.value"
              :value="opt.value"
            >{{ opt.label }}</option>
          </select>
          <div v-if="availableSubtypes.length === 0" style="font-size:10px;color:#EF4444;margin-top:3px;">
            ⚠️ type นี้มีกฎครบทุก subtype แล้ว
          </div>
        </div>
        <div v-else class="al-form-row">
          <label class="al-form-label">ประเภท</label>
          <div class="rw-type-readonly">
            {{ TYPE_OPTIONS.find(t => t.value === form.type)?.label || form.type }}
            <span v-if="form.subtype" style="margin-left:6px;font-size:11px;opacity:0.7;">/ {{ form.subtype }}</span>
          </div>
        </div>

        <div class="al-form-row">
          <label class="al-form-label">Icon</label>
          <div class="rw-icon-picker">
            <div
              v-for="em in ICON_OPTIONS"
              :key="em"
              class="rw-icon-opt"
              :class="{ active: form.icon === em }"
              @click="form.icon = em"
            >{{ em }}</div>
          </div>
        </div>

        <div class="al-form-row">
          <label class="al-form-label">คะแนน (pts)</label>
          <input v-model.number="form.pts" type="number" min="0" max="9999" class="al-form-input" />
        </div>

        <div class="al-form-row">
          <label class="al-form-label">ชื่อ</label>
          <input v-model="form.name" class="al-form-input" maxlength="60" placeholder="ชื่อกฎ" />
        </div>
        <div class="al-form-row">
          <label class="al-form-label">คำอธิบาย</label>
          <input v-model="form.desc" class="al-form-input" maxlength="120" placeholder="รายละเอียด..." />
        </div>

        <!-- Color picker -->
        <div class="al-form-row">
          <label class="al-form-label">สี</label>
          <div class="rw-color-row">
            <input type="color" v-model="form.color" class="rw-color-input" />
            <div class="rw-color-preview" :style="{ background: form.color }">{{ form.icon || '⭐' }}</div>
          </div>
          <!-- Presets -->
          <div class="rw-color-presets">
            <div
              v-for="c in COLOR_PRESETS" :key="c"
              class="rw-color-dot"
              :class="{ active: form.color === c }"
              :style="{ background: c }"
              @click="form.color = c"
            ></div>
          </div>
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

    <!-- Delete Confirm -->
    <div v-if="delTarget" class="al-modal-overlay" @click.self="delTarget=null">
      <div class="al-modal">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">🗑️ ยืนยันการลบ</div>
        <p style="font-size:13px;color:#374151;margin:0 0 16px;">
          ลบกฎ "<strong>{{ delTarget.name }}</strong>" ({{ delTarget.type }}) ใช่หรือไม่?
        </p>
        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="delTarget=null">ยกเลิก</button>
          <button class="al-btn al-btn-delete" :disabled="deleting" @click="doDelete">
            {{ deleting ? 'กำลังลบ...' : '🗑️ ลบ' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRewardStore } from '../../stores/reward.js'
import {
  adminAddRewardRule,
  adminUpdateRewardRule,
  adminDeleteRewardRule,
} from '../../services/rewardService.js'

const reward = useRewardStore()

const loading   = ref(true)
const rules     = ref([])
const delTarget = ref(null)
const deleting  = ref(false)

const modal = reactive({ open: false, mode: 'add', saving: false, error: '' })
const form  = reactive({ id: '', type: '', subtype: '', icon: '', name: '', desc: '', pts: 0, color: '#6366F1', active: 'true' })

const COLOR_PRESETS = ['#6366F1','#EC4899','#A855F7','#06C755','#F59E0B','#EF4444','#3B82F6','#14B8A6','#F97316','#8B5CF6']

const ICON_OPTIONS = [
  '🙌','📍','📅','💌','🎂','⭐','🏆','🎯','🔥','💎',
  '👑','🎁','🎉','🎊','✅','🌟','💡','🚀','❤️','🤝',
  '📣','🎤','🎨','📚','💪','🏅','🎖️','🌱','⚡','🦋',
]

// Type options — wired in GAS addPoints() calls
const TYPE_OPTIONS = [
  { value: 'join_activity',    label: '🙌 เข้าร่วมกิจกรรม',       defaultIcon: '🙌', defaultColor: '#6366F1' },
  { value: 'activity_checkin', label: '📍 Check-in กิจกรรม',      defaultIcon: '📍', defaultColor: '#3B82F6' },
  { value: 'daily_checkin',    label: '📅 Check-in รายวัน',        defaultIcon: '📅', defaultColor: '#06C755' },
  { value: 'send_empathy',     label: '💌 ส่ง Empathy ให้เพื่อน', defaultIcon: '💌', defaultColor: '#EC4899' },
  { value: 'birthday_wish',    label: '🎂 อวยพรวันเกิดเพื่อน',    defaultIcon: '🎂', defaultColor: '#A855F7' },
]

// Subtype options per type — '' = default rule for that type
const SUBTYPE_OPTIONS = {
  join_activity: [
    { value: '',           label: '(ค่าเริ่มต้น) เข้าร่วมทั่วไป' },
    { value: 'co_host',    label: 'co_host — ผู้ร่วมจัดงาน' },
    { value: 'presenter',  label: 'presenter — วิทยากร/ผู้นำเสนอ' },
    { value: 'organizer',  label: 'organizer — ผู้จัดงานหลัก' },
  ],
  activity_checkin: [
    { value: '', label: '(ค่าเริ่มต้น) check-in กิจกรรม' },
  ],
  daily_checkin: [
    { value: '', label: '(ค่าเริ่มต้น) check-in รายวัน' },
  ],
  send_empathy: [
    { value: '', label: '(ค่าเริ่มต้น)' },
  ],
  birthday_wish: [
    { value: '', label: '(ค่าเริ่มต้น)' },
  ],
}

// Filter out subtypes already having a rule for the selected type
const availableSubtypes = computed(() => {
  const opts = SUBTYPE_OPTIONS[form.type] || [{ value: '', label: '(ค่าเริ่มต้น)' }]
  return opts.filter(opt => !rules.value.some(r => r.type === form.type && r.subtype === opt.value))
})

// Auto-fill icon/color + reset subtype when type changes
function onTypeChange() {
  const opt = TYPE_OPTIONS.find(t => t.value === form.type)
  if (opt) {
    if (!form.icon || form.icon === '⭐') form.icon = opt.defaultIcon
    form.color = opt.defaultColor
  }
  form.subtype = ''
}

onMounted(async () => {
  await reward.loadRules(true)
  rules.value   = [...reward.rules]
  loading.value = false
})

function openAdd() {
  Object.assign(form, { id: '', type: '', subtype: '', icon: '⭐', name: '', desc: '', pts: 10, color: '#6366F1', active: 'true' })
  modal.mode = 'add'; modal.error = ''; modal.open = true
}
function openEdit(r) {
  Object.assign(form, { ...r, color: r.color || '#6366F1' })
  modal.mode = 'edit'; modal.error = ''; modal.open = true
}

async function saveModal() {
  if (modal.mode === 'add' && !form.type.trim()) { modal.error = 'กรุณาเลือกประเภท (type)'; return }
  if (modal.mode === 'add' && availableSubtypes.value.length === 0) { modal.error = 'type นี้มีกฎครบทุก subtype แล้ว'; return }
  if (!form.name.trim()) { modal.error = 'กรุณากรอกชื่อกฎ'; return }
  if (!form.icon) { modal.error = 'กรุณาเลือก icon'; return }
  if (!Number.isInteger(form.pts) || form.pts < 1 || form.pts > 9999) { modal.error = 'คะแนนต้องเป็นตัวเลข 1–9999'; return }
  if (!/^#[0-9A-Fa-f]{6}$/.test(form.color)) { modal.error = 'รูปแบบสีไม่ถูกต้อง (ต้องเป็น #RRGGBB)'; return }
  modal.saving = true; modal.error = ''
  try {
    if (modal.mode === 'add') {
      const res = await adminAddRewardRule(null, {
        type: form.type.trim(), subtype: form.subtype.trim(),
        icon: form.icon, name: form.name,
        desc: form.desc, pts: String(form.pts), color: form.color, active: form.active,
      })
      rules.value.push({ ...form, id: res.id, type: form.type.trim(), subtype: form.subtype.trim() })
    } else {
      await adminUpdateRewardRule(null, form.id, {
        icon: form.icon, name: form.name, desc: form.desc,
        pts: String(form.pts), color: form.color, active: form.active,
      })
      const idx = rules.value.findIndex(r => r.id === form.id)
      if (idx >= 0) Object.assign(rules.value[idx], { ...form })
    }
    reward.rules = [...rules.value]
    modal.open = false
  } catch (e) {
    modal.error = e.message || 'เกิดข้อผิดพลาด'
  } finally {
    modal.saving = false
  }
}

function confirmDelete(r) { delTarget.value = r }
async function doDelete() {
  deleting.value = true
  try {
    await adminDeleteRewardRule(null, delTarget.value.id)
    rules.value   = rules.value.filter(r => r.id !== delTarget.value.id)
    reward.rules  = [...rules.value]
    delTarget.value = null
  } catch { } finally {
    deleting.value = false
  }
}

</script>

<style scoped>
@import './admin.css';

/* Rule item */
.rw-rule-swatch {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.rw-rule-item { align-items: center; }
.rw-type-badge { font-size: 10px !important; font-family: monospace; }
.rw-type-readonly {
  font-size: 13px;
  font-weight: 700;
  font-family: monospace;
  color: #4338CA;
  background: #EEF2FF;
  padding: 8px 12px;
  border-radius: 8px;
}

/* Icon picker */
.rw-icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.rw-icon-opt {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border-radius: 10px;
  border: 2px solid transparent;
  background: #F3F4F6;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s, transform 0.1s;
}
.rw-icon-opt:hover { background: #E5E7EB; }
.rw-icon-opt:active { transform: scale(0.9); }
.rw-icon-opt.active {
  background: #EEF2FF;
  border-color: #6366F1;
  transform: scale(1.1);
}

/* Color picker row */
.rw-color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.rw-color-input {
  width: 44px;
  height: 40px;
  border: 1.5px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  padding: 2px;
  background: white;
  flex-shrink: 0;
}
.rw-color-hex { flex: 1; font-family: monospace; }
.rw-color-preview {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

/* Color presets */
.rw-color-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.rw-color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.1s, border-color 0.1s;
}
.rw-color-dot:active { transform: scale(0.9); }
.rw-color-dot.active { border-color: #1F2937; transform: scale(1.15); }

/* Toggle */
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

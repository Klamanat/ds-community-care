<template>
  <div>
    <main class="al-main">

      <div class="al-page-header">
        <h2 class="al-page-title">🎁 ของขวัญ</h2>
        <button v-if="tab === 'gifts'" class="al-btn al-btn-primary" @click="openAdd">+ เพิ่มของขวัญ</button>
      </div>

      <!-- Tab bar -->
      <div class="gifts-tab-bar">
        <button class="gtab-btn" :class="{ active: tab === 'gifts' }" @click="tab = 'gifts'">🎁 รายการของขวัญ</button>
        <button class="gtab-btn" :class="{ active: tab === 'claims' }" @click="switchClaims">🏆 รายการที่ได้รับ <span v-if="claims.length" class="gtab-count">{{ claims.length }}</span></button>
      </div>

      <!-- ── Tab: Gift catalog ── -->
      <div v-if="tab === 'gifts'" class="al-card">
        <div class="al-card-header">
          <span class="al-card-title">รายการของขวัญ</span>
          <span class="al-badge al-badge-blue">{{ gifts.length }} รายการ</span>
        </div>

        <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
        <div v-else-if="!gifts.length" class="al-empty">📭 ยังไม่มีของขวัญ</div>

        <div v-else>
          <div class="al-item" v-for="g in gifts" :key="g.id">
            <img v-if="g.imgUrl" :src="g.imgUrl" class="al-item-thumb" @error="e => e.target.style.display='none'" />
            <div v-else class="al-item-avatar">{{ g.icon || '🎁' }}</div>
            <div class="al-item-body">
              <div class="al-item-title">{{ g.name }}</div>
              <div v-if="g.description" class="al-item-sub">{{ g.description }}</div>
              <div class="al-item-meta">
                <span v-if="g.category" class="al-badge al-badge-purple">{{ g.category }}</span>
                <span v-if="g.price != null" class="al-badge al-badge-blue">฿{{ g.price.toLocaleString() }}</span>
                <span v-if="g.quantity != null" class="al-badge al-badge-blue">คงเหลือ {{ g.quantity }}</span>
                <span v-else class="al-badge al-badge-gray">ไม่จำกัด</span>
                <span class="al-badge" :class="g.status === 'available' ? 'al-badge-green' : 'al-badge-gray'">
                  {{ g.status === 'available' ? 'พร้อมแจก' : 'ปิด' }}
                </span>
              </div>
            </div>
            <div class="al-item-actions">
              <button class="al-btn al-btn-edit" @click="openEdit(g)">แก้ไข</button>
              <button class="al-btn al-btn-delete" @click="confirmDelete(g)">ลบ</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Tab: Claims ── -->
      <div v-if="tab === 'claims'" class="al-card">
        <div class="al-card-header">
          <span class="al-card-title">รายการที่ได้รับ</span>
          <span class="al-badge al-badge-blue">{{ claims.length }} รายการ</span>
        </div>

        <div v-if="claimsLoading" class="al-loading">⏳ กำลังโหลด...</div>
        <div v-else-if="!claims.length" class="al-empty">📭 ยังไม่มีการรับของขวัญ</div>

        <div v-else>
          <!-- Year filter -->
          <div class="claims-year-bar">
            <button
              v-for="y in claimYears"
              :key="y"
              class="cy-btn"
              :class="{ active: claimYear === y }"
              @click="claimYear = y"
            >{{ y }}</button>
          </div>

          <div class="al-item" v-for="c in filteredClaims" :key="c.id">
            <div class="al-item-avatar" style="font-size:22px;">🎉</div>
            <div class="al-item-body">
              <div class="al-item-title">{{ c.employee_name || c.employee_id }}</div>
              <div class="al-item-sub" style="color:#6366F1;font-weight:700;">🎁 {{ c.gift_name || '—' }}</div>
              <div class="al-item-meta">
                <span class="al-badge al-badge-gray">ปี {{ c.claimed_year }}</span>
                <span class="al-badge al-badge-gray">{{ formatDate(c.claimed_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>

    <!-- Add / Edit Modal -->
    <div v-if="modal.open" class="al-modal-overlay" @click.self="modal.open = false">
      <div class="al-modal">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">{{ modal.mode === 'add' ? '+ เพิ่มของขวัญ' : '✏️ แก้ไขของขวัญ' }}</div>

        <div class="al-form-row">
          <label class="al-form-label">ชื่อของขวัญ <span style="color:#EF4444;">*</span></label>
          <input v-model="form.name" class="al-form-input" placeholder="เช่น กระเป๋าผ้า DS" />
        </div>

        <div class="al-form-row">
          <label class="al-form-label">หมวดหมู่</label>
          <select v-model="form.category" class="al-form-select">
            <option value="">— ไม่ระบุ —</option>
            <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="al-form-row">
          <label class="al-form-label">คำอธิบาย</label>
          <textarea v-model="form.description" class="al-form-input" rows="2" placeholder="รายละเอียดของขวัญ"></textarea>
        </div>

        <div class="al-form-row">
          <label class="al-form-label">ราคาโดยประมาณ (บาท)</label>
          <input v-model.number="form.price" type="number" min="0" class="al-form-input" placeholder="ไม่ระบุ" />
        </div>

        <div class="al-form-row">
          <label class="al-form-label">จำนวน (เว้นว่าง = ไม่จำกัด)</label>
          <input v-model.number="form.quantity" type="number" min="0" class="al-form-input" placeholder="ไม่จำกัด" />
        </div>

        <div class="al-form-row">
          <label class="al-form-label">สถานะ</label>
          <select v-model="form.status" class="al-form-select">
            <option value="available">พร้อมแจก</option>
            <option value="unavailable">ปิด (ซ่อน)</option>
          </select>
        </div>

        <!-- Icon / Image toggle -->
        <div class="al-form-row">
          <label class="al-form-label">รูปของขวัญ</label>

          <div class="gift-img-toggle">
            <button class="git-btn" :class="{ active: imgMode === 'emoji' }" @click="imgMode = 'emoji'">😊 Emoji</button>
            <button class="git-btn" :class="{ active: imgMode === 'upload' }" @click="imgMode = 'upload'">📷 อัปโหลดรูป</button>
          </div>

          <template v-if="imgMode === 'emoji'">
            <div class="gift-emoji-grid">
              <button v-for="e in GIFT_EMOJIS" :key="e" class="geg-btn" :class="{ active: form.icon === e }" @click="form.icon = e">{{ e }}</button>
            </div>
            <div v-if="form.icon" class="gift-emoji-preview">
              <span style="font-size:48px;">{{ form.icon }}</span>
              <button class="al-btn al-btn-delete" style="margin-top:4px;font-size:11px;padding:3px 10px;" @click="form.icon = ''">ล้าง</button>
            </div>
          </template>

          <template v-else>
            <div class="act-upload-zone" :style="imgUploading ? 'opacity:.6;cursor:default;' : ''" @click="!imgUploading && imgFileInput.click()">
              <img v-if="imgPreview && !imgUploading" :src="imgPreview" class="act-upload-preview" />
              <div v-else-if="imgUploading" class="act-upload-placeholder">
                <span style="font-size:22px;">⏳</span>
                <span style="font-size:12px;color:#6B7280;margin-top:4px;">กำลังอัปโหลด...</span>
              </div>
              <div v-else class="act-upload-placeholder">
                <span style="font-size:28px;">🎁</span>
                <span style="font-size:12px;color:#9CA3AF;margin-top:4px;">คลิกเพื่ออัปโหลดรูป</span>
              </div>
            </div>
            <button v-if="imgPreview && !imgUploading" class="al-btn al-btn-delete" style="margin-top:6px;width:100%;" @click.stop="clearImg">🗑️ ลบรูป</button>
            <input ref="imgFileInput" type="file" accept="image/*" style="display:none" @change="onImgChange" />
          </template>
        </div>

        <div v-if="modal.error" class="al-error">⚠️ {{ modal.error }}</div>

        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="modal.open = false">ยกเลิก</button>
          <button class="al-btn al-btn-save" :disabled="modal.saving || imgUploading" @click="saveModal">
            {{ modal.saving ? 'กำลังบันทึก...' : imgUploading ? 'รอรูป...' : '✅ บันทึก' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete confirm -->
    <div v-if="delTarget" class="al-modal-overlay" @click.self="delTarget = null">
      <div class="al-modal al-modal--sm">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">🗑️ ลบของขวัญ</div>
        <p style="font-size:14px;color:#374151;margin:12px 0;">
          ยืนยันลบ <strong>{{ delTarget.name }}</strong>?
        </p>
        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="delTarget = null">ยกเลิก</button>
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
import { fetchGifts, adminAddGift, adminUpdateGift, adminDeleteGift, fetchGiftClaims } from '../../services/giftService.js'
import { resizeToBase64 } from '../../composables/useImageCompress.js'
import { uploadImage, deleteImage } from '../../services/edgeFunctions.js'

const CATEGORIES = ['เครื่องใช้', 'อุปกรณ์สำนักงาน', 'อาหาร & เครื่องดื่ม', 'บัตรกำนัล', 'ของตกแต่ง', 'อื่นๆ']
const GIFT_EMOJIS = [
  '🎁','🎀','🎂','🏆','⭐','🌟','💎','🪙','🛍️','📦',
  '🎯','🎨','🌸','🍰','☕','🍫','🎮','📱','💻','📚',
  '🎵','✈️','🏖️','🌈','💐','🧧','🪄','🎪','🍕','🥤',
]

// ── Tabs ───────────────────────────────────────────────────────
const tab = ref('gifts')

// ── Gift catalog ───────────────────────────────────────────────
const loading = ref(true)
const gifts   = ref([])

onMounted(async () => {
  try { gifts.value = await fetchGifts() } catch {}
  loading.value = false
})

// ── Claims ─────────────────────────────────────────────────────
const claims       = ref([])
const claimsLoading = ref(false)
const claimYear    = ref(new Date().getFullYear())

const claimYears = computed(() => {
  const years = [...new Set(claims.value.map(c => c.claimed_year))].sort((a, b) => b - a)
  if (!years.includes(claimYear.value)) years.unshift(claimYear.value)
  return years
})

const filteredClaims = computed(() =>
  claims.value.filter(c => c.claimed_year === claimYear.value)
)

async function switchClaims() {
  tab.value = 'claims'
  if (claims.value.length) return
  claimsLoading.value = true
  try { claims.value = await fetchGiftClaims() } catch {}
  claimsLoading.value = false
}

const _TH_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
function formatDate(raw) {
  if (!raw) return '—'
  const d = new Date(raw)
  if (isNaN(d)) return raw
  return `${d.getDate()} ${_TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`
}

// ── Modal ──────────────────────────────────────────────────────
const modal   = reactive({ open: false, mode: 'add', saving: false, error: '' })
const form    = reactive({ id: '', name: '', description: '', category: '', icon: '', price: null, quantity: null, status: 'available', imgId: '', imgUrl: '' })
const imgMode = ref('emoji')

const imgFileInput = ref(null)
const imgPreview   = ref('')
const imgUploading = ref(false)

function openAdd() {
  Object.assign(form, { id: '', name: '', description: '', category: '', icon: '', price: null, quantity: null, status: 'available', imgId: '', imgUrl: '' })
  imgPreview.value = ''; imgUploading.value = false; imgMode.value = 'emoji'
  modal.mode = 'add'; modal.error = ''; modal.open = true
}

function openEdit(g) {
  Object.assign(form, { id: g.id, name: g.name, description: g.description, category: g.category, icon: g.icon || '', price: g.price, quantity: g.quantity, status: g.status, imgId: g.imgId, imgUrl: g.imgUrl })
  imgPreview.value = g.imgUrl || ''; imgUploading.value = false
  imgMode.value = g.imgUrl ? 'upload' : 'emoji'
  modal.mode = 'edit'; modal.error = ''; modal.open = true
}

async function onImgChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const oldId = form.imgId
  imgUploading.value = true; modal.error = ''
  try {
    const b64 = await resizeToBase64(file, 800, 800, 0.88)
    imgPreview.value = b64
    const res = await uploadImage(b64, file.name, 'gifts')
    form.imgId  = res.id
    form.imgUrl = res.url || ''
    imgPreview.value = res.url || b64
    if (oldId) deleteImage([oldId]).catch(console.warn)
  } catch (err) {
    modal.error = 'อัปโหลดรูปล้มเหลว: ' + (err.message || 'ลองใหม่')
    imgPreview.value = ''
  } finally {
    imgUploading.value = false
    e.target.value = ''
  }
}

function clearImg() {
  const oldId = form.imgId
  form.imgId = ''; form.imgUrl = ''; imgPreview.value = ''
  if (oldId) deleteImage([oldId]).catch(console.warn)
}

async function saveModal() {
  if (!form.name.trim()) { modal.error = 'กรุณากรอกชื่อของขวัญ'; return }
  modal.saving = true; modal.error = ''
  const fields = {
    name:        form.name.trim(),
    description: form.description.trim() || null,
    category:    form.category || null,
    icon:        imgMode.value === 'emoji' ? (form.icon || null) : null,
    price:       form.price    ?? null,
    quantity:    form.quantity ?? null,
    status:      form.status,
    img_id:      imgMode.value === 'upload' ? (form.imgId  || null) : null,
    img_url:     imgMode.value === 'upload' ? (form.imgUrl || null) : null,
  }
  try {
    if (modal.mode === 'add') {
      const created = await adminAddGift(fields)
      gifts.value.unshift(created)
    } else {
      const updated = await adminUpdateGift(form.id, fields)
      const idx = gifts.value.findIndex(g => g.id === form.id)
      if (idx >= 0) gifts.value.splice(idx, 1, updated)
    }
    modal.open = false
  } catch (err) {
    modal.error = err.message || 'บันทึกล้มเหลว'
  } finally {
    modal.saving = false
  }
}

// ── Delete ─────────────────────────────────────────────────────
const delTarget = ref(null)
const deleting  = ref(false)

function confirmDelete(g) { delTarget.value = g }

async function doDelete() {
  if (!delTarget.value) return
  deleting.value = true
  const target = delTarget.value
  try {
    if (target.imgId) deleteImage([target.imgId]).catch(console.warn)
    await adminDeleteGift(target.id)
    gifts.value = gifts.value.filter(g => g.id !== target.id)
    delTarget.value = null
  } catch (err) {
    alert('ลบล้มเหลว: ' + err.message)
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
@import './admin.css';

/* ── Tab bar ── */
.gifts-tab-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}
.gtab-btn {
  padding: 7px 16px;
  border-radius: 20px;
  border: 1.5px solid #E5E7EB;
  background: white;
  font-size: 12px;
  font-weight: 700;
  color: #6B7280;
  cursor: pointer;
  font-family: 'Sarabun', sans-serif;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s;
}
.gtab-btn.active {
  background: #4F46E5;
  border-color: #4F46E5;
  color: white;
}
.gtab-count {
  background: rgba(255,255,255,0.25);
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 10px;
}
.gtab-btn:not(.active) .gtab-count {
  background: #E5E7EB;
  color: #374151;
}

/* ── Year filter ── */
.claims-year-bar {
  display: flex;
  gap: 6px;
  padding: 10px 16px 6px;
  flex-wrap: wrap;
}
.cy-btn {
  padding: 4px 14px;
  border-radius: 16px;
  border: 1.5px solid #E5E7EB;
  background: white;
  font-size: 12px;
  font-weight: 700;
  color: #6B7280;
  cursor: pointer;
  font-family: 'Sarabun', sans-serif;
  transition: all 0.15s;
}
.cy-btn.active { background: #6366F1; border-color: #6366F1; color: white; }

/* ── Icon/Image mode toggle ── */
.gift-img-toggle {
  display: flex;
  background: #F3F4F6;
  border-radius: 10px;
  padding: 3px;
  gap: 3px;
  margin-bottom: 10px;
}
.git-btn {
  flex: 1;
  padding: 6px 10px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  background: transparent;
  color: #6B7280;
  transition: all 0.15s;
  font-family: 'Sarabun', sans-serif;
}
.git-btn.active { background: white; color: #4F46E5; box-shadow: 0 1px 4px rgba(0,0,0,0.12); }

/* ── Emoji picker grid ── */
.gift-emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}
.geg-btn {
  aspect-ratio: 1;
  border: 2px solid transparent;
  border-radius: 8px;
  background: #F9FAFB;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
  padding: 0;
}
.geg-btn:hover { background: #EEF2FF; border-color: #C7D2FE; }
.geg-btn.active { background: #EEF2FF; border-color: #6366F1; box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }

.gift-emoji-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: #F9FAFB;
  border-radius: 12px;
  border: 1.5px dashed #E5E7EB;
}
</style>

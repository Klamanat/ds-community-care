<template>
  <div>
    <main class="al-main">

      <div class="al-page-header">
        <h2 class="al-page-title">🎁 ของรางวัล</h2>
        <button class="al-btn al-btn-primary" @click="openAdd">+ เพิ่มของรางวัล</button>
      </div>

      <div class="al-card">
        <div class="al-card-header">
          <span class="al-card-title">รายการของรางวัล</span>
          <span class="al-badge al-badge-blue">{{ rewards.length }} รายการ</span>
        </div>

        <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
        <div v-else-if="!rewards.length" class="al-empty">📭 ยังไม่มีของรางวัล</div>

        <div v-else>
          <div class="al-item" v-for="r in rewards" :key="r.id">
            <img v-if="r.imageUrl" :src="r.imageUrl" class="al-item-thumb" />
            <div v-else class="al-item-avatar">🎁</div>
            <div class="al-item-body">
              <div class="al-item-title">{{ r.name }}</div>
              <div class="al-item-sub">{{ r.description }}</div>
              <div class="al-item-meta">
                <span v-if="r.ptsCost" class="al-badge al-badge-purple">{{ r.ptsCost }} pts</span>
                <span v-if="r.stock !== null" class="al-badge al-badge-blue">คงเหลือ {{ r.stock }}</span>
                <span v-else class="al-badge al-badge-gray">ไม่จำกัด</span>
                <span class="al-badge" :class="r.active ? 'al-badge-green' : 'al-badge-gray'">
                  {{ r.active ? 'เปิด' : 'ปิด' }}
                </span>
              </div>
            </div>
            <div class="al-item-actions">
              <button class="al-btn al-btn-edit" @click="openEdit(r)">แก้ไข</button>
              <button class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
            </div>
          </div>
        </div>
      </div>

    </main>

    <!-- Add / Edit Modal -->
    <div v-if="modal.open" class="al-modal-overlay" @click.self="modal.open = false">
      <div class="al-modal">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">{{ modal.mode === 'add' ? '+ เพิ่มของรางวัล' : '✏️ แก้ไขของรางวัล' }}</div>

        <div class="al-form-row">
          <label class="al-form-label">ชื่อของรางวัล <span style="color:#EF4444;">*</span></label>
          <input v-model="form.name" class="al-form-input" placeholder="เช่น กระเป๋า DS" />
        </div>

        <div class="al-form-row">
          <label class="al-form-label">คำอธิบาย</label>
          <textarea v-model="form.description" class="al-form-input" rows="2" placeholder="รายละเอียดของรางวัล"></textarea>
        </div>

        <div class="al-form-row">
          <label class="al-form-label">คะแนนที่ใช้แลก</label>
          <input v-model.number="form.ptsCost" type="number" min="0" class="al-form-input" placeholder="0 = ไม่จำกัดคะแนน" />
        </div>

        <div class="al-form-row">
          <label class="al-form-label">จำนวนสต็อก (เว้นว่าง = ไม่จำกัด)</label>
          <input v-model.number="form.stock" type="number" min="0" class="al-form-input" placeholder="ไม่จำกัด" />
        </div>

        <div class="al-form-row">
          <label class="al-form-label">สถานะ</label>
          <select v-model="form.active" class="al-form-select">
            <option :value="true">เปิด (แสดงในแอป)</option>
            <option :value="false">ปิด (ซ่อน)</option>
          </select>
        </div>

        <!-- Image upload -->
        <div class="al-form-row">
          <label class="al-form-label">รูปของรางวัล</label>
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
        <div class="al-modal-title">🗑️ ลบของรางวัล</div>
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
import { ref, reactive, onMounted } from 'vue'
import { adminFetchRewards, adminAddReward, adminUpdateReward, adminDeleteReward } from '../../services/rewardService.js'
import { resizeToBase64 } from '../../composables/useImageCompress.js'
import { uploadImage, deleteImage } from '../../services/edgeFunctions.js'

const loading  = ref(true)
const rewards  = ref([])

onMounted(async () => {
  try { rewards.value = await adminFetchRewards() } catch {}
  loading.value = false
})

// ── Modal ──────────────────────────────────────────────────────
const modal = reactive({ open: false, mode: 'add', saving: false, error: '' })
const form  = reactive({ id: '', name: '', description: '', ptsCost: 100, stock: null, active: true, imageId: '', imageUrl: '' })

const imgFileInput = ref(null)
const imgPreview   = ref('')
const imgUploading = ref(false)

function openAdd() {
  Object.assign(form, { id: '', name: '', description: '', ptsCost: 100, stock: null, active: true, imageId: '', imageUrl: '' })
  imgPreview.value = ''; imgUploading.value = false
  modal.mode = 'add'; modal.error = ''; modal.open = true
}

function openEdit(r) {
  Object.assign(form, { id: r.id, name: r.name, description: r.description, ptsCost: r.ptsCost, stock: r.stock, active: r.active, imageId: r.imageId, imageUrl: r.imageUrl })
  imgPreview.value = r.imageUrl || ''; imgUploading.value = false
  modal.mode = 'edit'; modal.error = ''; modal.open = true
}

async function onImgChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const oldId = form.imageId
  imgUploading.value = true
  modal.error = ''
  try {
    const b64 = await resizeToBase64(file, 800, 800, 0.88)
    imgPreview.value = b64
    const res = await uploadImage(b64, file.name, 'rewards')
    form.imageId  = res.id
    form.imageUrl = res.url || ''
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
  const oldId = form.imageId
  form.imageId = ''; form.imageUrl = ''; imgPreview.value = ''
  if (oldId) deleteImage([oldId]).catch(console.warn)
}

async function saveModal() {
  if (!form.name.trim()) { modal.error = 'กรุณากรอกชื่อของรางวัล'; return }
  modal.saving = true; modal.error = ''
  const fields = {
    name:        form.name.trim(),
    description: form.description.trim() || null,
    pts_cost:    form.ptsCost || 0,
    stock:       form.stock ?? null,
    active:      form.active,
    image_id:    form.imageId || null,
    image_url:   form.imageUrl || null,
  }
  try {
    if (modal.mode === 'add') {
      const created = await adminAddReward(fields)
      rewards.value.unshift(created)
    } else {
      const updated = await adminUpdateReward(form.id, fields)
      const idx = rewards.value.findIndex(r => r.id === form.id)
      if (idx >= 0) rewards.value.splice(idx, 1, updated)
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

function confirmDelete(r) { delTarget.value = r }

async function doDelete() {
  if (!delTarget.value) return
  deleting.value = true
  const target = delTarget.value
  try {
    if (target.imageId) deleteImage([target.imageId]).catch(console.warn)
    await adminDeleteReward(target.id)
    rewards.value = rewards.value.filter(r => r.id !== target.id)
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
</style>

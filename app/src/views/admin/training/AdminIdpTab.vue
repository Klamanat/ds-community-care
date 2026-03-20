<template>
  <div>
    <!-- Sub-tab bar -->
    <div class="aidp-subtab-bar">
      <button
        class="aidp-subtab"
        :class="{ active: subTab === 'poster' }"
        @click="switchSub('poster')"
      >📸 โปสเตอร์ ({{ posters.length }})</button>
      <button
        class="aidp-subtab"
        :class="{ active: subTab === 'video' }"
        @click="switchSub('video')"
      >🎬 วิดีโอ ({{ videos.length }})</button>
      <button class="al-btn al-btn-save aidp-add-btn" @click="openAdd">
        + {{ subTab === 'poster' ? 'เพิ่มโปสเตอร์' : 'เพิ่มวิดีโอ' }}
      </button>
    </div>

    <!-- ── Posters ── -->
    <div v-if="subTab === 'poster'">
      <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
      <div v-else-if="!posters.length" class="al-empty">📭 ยังไม่มีโปสเตอร์</div>
      <div v-else class="al-card">
        <div v-for="p in posters" :key="p.id" class="al-item">
          <div class="aidp-poster-thumb">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.title" @error="onImgError" />
            <span v-else>🖼️</span>
          </div>
          <div class="al-item-body">
            <div class="al-item-title">{{ p.title }}</div>
            <div v-if="p.date" class="al-item-sub">📅 {{ p.date }}</div>
            <div v-if="p.description" class="al-item-sub" style="color:#6B7280;">{{ p.description }}</div>
            <div class="al-item-sub aidp-url-preview">🔗 {{ p.imageUrl }}</div>
          </div>
          <div class="al-item-actions">
            <button class="al-btn al-btn-edit"   @click="openEdit(p, 'poster')">แก้ไข</button>
            <button class="al-btn al-btn-delete" @click="confirmDel(p, 'poster')">ลบ</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Videos ── -->
    <div v-else>
      <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
      <div v-else-if="!videos.length" class="al-empty">📭 ยังไม่มีวิดีโอ</div>
      <div v-else class="al-card">
        <div v-for="v in videos" :key="v.id" class="al-item">
          <div class="aidp-video-thumb">
            <img
              v-if="getYtId(v.videoUrl)"
              :src="`https://img.youtube.com/vi/${getYtId(v.videoUrl)}/default.jpg`"
              :alt="v.title"
              @error="onImgError"
            />
            <span v-else>🎬</span>
          </div>
          <div class="al-item-body">
            <div class="al-item-title">{{ v.title }}</div>
            <div v-if="v.description" class="al-item-sub" style="color:#6B7280;">{{ v.description }}</div>
            <div class="al-item-sub aidp-url-preview">🔗 {{ v.videoUrl }}</div>
          </div>
          <div class="al-item-actions">
            <button class="al-btn al-btn-edit"   @click="openEdit(v, 'video')">แก้ไข</button>
            <button class="al-btn al-btn-delete" @click="confirmDel(v, 'video')">ลบ</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Add/Edit Modal ── -->
    <div v-if="formOpen" class="al-modal-overlay" @click.self="formOpen = false">
      <div class="al-modal" style="max-height:90vh;overflow-y:auto;">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">
          {{ editTarget ? '✏️ แก้ไข' : '+ เพิ่ม' }} {{ formType === 'poster' ? 'โปสเตอร์' : 'วิดีโอ' }}
        </div>

        <!-- Poster form -->
        <template v-if="formType === 'poster'">
          <div class="al-form-row">
            <label class="al-form-label">ชื่อโปสเตอร์ *</label>
            <input class="al-form-input" v-model="form.title" placeholder="ชื่อโปสเตอร์" maxlength="200" />
          </div>
          <div class="al-form-row">
            <label class="al-form-label">รูปภาพ *</label>
            <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />
            <button class="al-btn al-btn-save aidp-upload-btn" :disabled="uploading" @click="fileInput.click()">
              {{ uploading ? '⏳ กำลังอัปโหลด...' : '📤 อัปโหลดจากเครื่อง' }}
            </button>
            <div class="aidp-or-divider">— หรือใส่ URL —</div>
            <input class="al-form-input" v-model="form.imageUrl" placeholder="https://drive.google.com/..." />
          </div>
          <div class="al-form-row">
            <label class="al-form-label">เดือน/ปี (ไม่บังคับ)</label>
            <input class="al-form-input" v-model="form.date" placeholder="2026-01" maxlength="7" />
            <small style="font-size:11px;color:#9CA3AF;margin-top:4px;display:block;">รูปแบบ: YYYY-MM เช่น 2026-03</small>
          </div>
          <div class="al-form-row">
            <label class="al-form-label">รายละเอียด</label>
            <textarea class="al-form-input" v-model="form.description" rows="2"
              placeholder="อธิบายเพิ่มเติม" maxlength="300" style="resize:none;"></textarea>
          </div>
          <!-- Preview -->
          <div v-if="form.imageUrl" class="aidp-img-preview">
            <img :src="form.imageUrl" alt="preview" @error="onImgError" />
          </div>
        </template>

        <!-- Video form -->
        <template v-else>
          <div class="al-form-row">
            <label class="al-form-label">ชื่อวิดีโอ *</label>
            <input class="al-form-input" v-model="form.title" placeholder="ชื่อวิดีโอ" maxlength="200" />
          </div>
          <div class="al-form-row">
            <label class="al-form-label">URL วิดีโอ * <small style="font-weight:400;color:#9CA3AF;">(YouTube)</small></label>
            <input class="al-form-input" v-model="form.videoUrl" placeholder="https://youtube.com/watch?v=..." />
          </div>
          <div class="al-form-row">
            <label class="al-form-label">รายละเอียด</label>
            <textarea class="al-form-input" v-model="form.description" rows="2"
              placeholder="อธิบายเนื้อหาวิดีโอ" maxlength="300" style="resize:none;"></textarea>
          </div>
          <!-- YouTube thumbnail preview -->
          <div v-if="getYtId(form.videoUrl)" class="aidp-yt-preview">
            <img :src="`https://img.youtube.com/vi/${getYtId(form.videoUrl)}/hqdefault.jpg`" alt="YouTube thumbnail" />
            <div class="aidp-yt-play">▶</div>
          </div>
        </template>

        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="formOpen = false">ยกเลิก</button>
          <button class="al-btn al-btn-save" :disabled="saving || !form.title || !fieldRequired" @click="doSave">
            {{ saving ? 'กำลังบันทึก...' : '✅ บันทึก' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Delete Confirm ── -->
    <div v-if="delRow" class="al-modal-overlay" @click.self="delRow = null">
      <div class="al-modal">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">🗑️ ยืนยันการลบ</div>
        <p style="font-size:13px;color:#374151;margin:0 0 16px;">
          ลบ "<strong>{{ delRow.title }}</strong>" ใช่หรือไม่?
        </p>
        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="delRow = null">ยกเลิก</button>
          <button class="al-btn al-btn-delete" :disabled="deleting" @click="doDelete">
            {{ deleting ? 'กำลังลบ...' : '🗑️ ลบ' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import * as svc from '../../../services/trainingService.js'
import { deleteImage } from '../../../services/edgeFunctions.js'

const subTab  = ref('poster')
const loading = ref(false)
const posters = ref([])
const videos  = ref([])

const formOpen   = ref(false)
const formType   = ref('poster')  // 'poster' | 'video'
const saving     = ref(false)
const editTarget = ref(null)
const delRow     = ref(null)
const delType    = ref('poster')
const deleting   = ref(false)

const form      = reactive({ title: '', imageUrl: '', imageId: '', videoUrl: '', description: '', date: '' })
const fileInput = ref(null)
const uploading = ref(false)

const fieldRequired = computed(() =>
  formType.value === 'poster' ? !!form.imageUrl.trim() : !!form.videoUrl.trim()
)

function getYtId(url) {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function onImgError(e) { e.target.style.display = 'none' }

async function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const oldImageId = form.imageId
  uploading.value = true
  try {
    const base64 = await new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onload  = () => res(reader.result.split(',')[1])
      reader.onerror = rej
      reader.readAsDataURL(file)
    })
    const result = await svc.adminUploadIdpImage(base64, file.type, file.name)
    form.imageUrl = result.url
    form.imageId  = result.id || ''
    if (oldImageId && oldImageId !== result.id) deleteImage([oldImageId]).catch(console.warn)
  } catch (err) {
    alert('อัปโหลดไม่สำเร็จ: ' + (err?.message || err))
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

async function loadAll() {
  loading.value = true
  try {
    const [p, v] = await Promise.all([svc.fetchIdpPosters(), svc.fetchIdpVideos()])
    posters.value = p
    videos.value  = v
  } catch {
    posters.value = []
    videos.value  = []
  } finally {
    loading.value = false
  }
}

onMounted(() => loadAll())

function switchSub(key) { subTab.value = key }

function resetForm() {
  Object.assign(form, { title: '', imageUrl: '', imageId: '', videoUrl: '', description: '', date: '' })
}

function openAdd() {
  editTarget.value = null
  formType.value   = subTab.value
  resetForm()
  formOpen.value   = true
}

function openEdit(row, type) {
  editTarget.value = row
  formType.value   = type
  Object.assign(form, {
    title:       row.title       || '',
    imageUrl:    row.imageUrl    || '',
    imageId:     row.imageId     || '',
    videoUrl:    row.videoUrl    || '',
    description: row.description || '',
    date:        row.date        || '',
  })
  formOpen.value = true
}

function confirmDel(row, type) {
  delRow.value  = row
  delType.value = type
}

async function doSave() {
  if (!form.title.trim()) return
  saving.value = true
  try {
    if (formType.value === 'poster') {
      const p = { title: form.title.trim(), imageUrl: form.imageUrl.trim(), imageId: form.imageId, description: form.description.trim(), date: form.date.trim() }
      if (editTarget.value) {
        await svc.adminUpdateIdpPoster(editTarget.value.id, p)
        Object.assign(editTarget.value, p)
      } else {
        const created = await svc.adminAddIdpPoster(p)
        posters.value.unshift(created)
      }
    } else {
      const p = { title: form.title.trim(), videoUrl: form.videoUrl.trim(), description: form.description.trim() }
      if (editTarget.value) {
        await svc.adminUpdateIdpVideo(editTarget.value.id, p)
        Object.assign(editTarget.value, p)
      } else {
        const created = await svc.adminAddIdpVideo(p)
        videos.value.unshift(created)
      }
    }
    formOpen.value = false
  } catch (e) {
    alert('เกิดข้อผิดพลาด: ' + (e?.message || e))
  } finally {
    saving.value = false
  }
}

async function doDelete() {
  deleting.value = true
  const row = delRow.value
  const type = delType.value
  try {
    if (type === 'poster') {
      if (row.imageId) deleteImage([row.imageId]).catch(console.warn)
      await svc.adminDeleteIdpPoster(row.id)
      posters.value = posters.value.filter(r => r.id !== row.id)
    } else {
      await svc.adminDeleteIdpVideo(row.id)
      videos.value = videos.value.filter(r => r.id !== row.id)
    }
    delRow.value = null
  } catch { }
  finally { deleting.value = false }
}
</script>

<style scoped>
@import '../admin.css';

.aidp-subtab-bar {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 16px; flex-wrap: wrap;
}
.aidp-subtab {
  font-size: 12px; font-weight: 800;
  padding: 8px 16px; border-radius: 20px;
  border: 1.5px solid #E5E7EB; background: #fff; color: #6B7280;
  cursor: pointer; font-family: 'Sarabun', sans-serif;
  transition: all 0.15s;
}
.aidp-subtab.active {
  background: #A855F7; color: #fff; border-color: #A855F7;
  box-shadow: 0 2px 8px rgba(168,85,247,0.3);
}
.aidp-add-btn { margin-left: auto; }

.aidp-upload-btn {
  width: 100%; margin-bottom: 8px;
  display: block;
}
.aidp-or-divider {
  text-align: center; font-size: 11px; color: #9CA3AF;
  margin-bottom: 8px;
}

.aidp-poster-thumb {
  width: 56px; height: 56px; border-radius: 8px;
  overflow: hidden; flex-shrink: 0;
  background: #F3F4F6;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
}
.aidp-poster-thumb img { width: 100%; height: 100%; object-fit: cover; }

.aidp-video-thumb {
  width: 80px; height: 56px; border-radius: 8px;
  overflow: hidden; flex-shrink: 0; position: relative;
  background: #111827;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; color: #fff;
}
.aidp-video-thumb img { width: 100%; height: 100%; object-fit: cover; }

.aidp-url-preview {
  font-size: 10px; color: #A855F7;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 200px;
}

.aidp-img-preview {
  border-radius: 10px; overflow: hidden;
  margin-top: 8px; border: 1.5px solid #E5E7EB;
  max-height: 200px; display: flex; align-items: center; justify-content: center;
  background: #FAFAFA;
}
.aidp-img-preview img { max-width: 100%; max-height: 200px; object-fit: contain; }

.aidp-yt-preview {
  position: relative; border-radius: 10px; overflow: hidden;
  margin-top: 8px; border: 1.5px solid #E5E7EB;
}
.aidp-yt-preview img { width: 100%; display: block; }
.aidp-yt-play {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.35); color: #fff; font-size: 28px;
}
</style>

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
        <h2 class="al-page-title">📚 Training & Development</h2>
        <span class="al-badge al-badge-blue">{{ rows.length }} รายการ</span>
      </div>

      <!-- Filter + Add -->
      <div class="al-filters">
        <button
          v-for="f in CATEGORY_FILTERS" :key="f"
          class="al-chip"
          :class="{ active: filterCat === f }"
          @click="filterCat = f"
        >{{ f === 'all' ? 'ทั้งหมด' : catLabel(f) }}</button>
        <button class="al-btn al-btn-save" style="margin-left:auto;" @click="openAdd">+ เพิ่ม</button>
      </div>

      <div class="al-card">
        <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
        <div v-else-if="!filtered.length" class="al-empty">📭 ไม่มีข้อมูล</div>

        <div v-else>
          <div class="al-item" v-for="r in filtered" :key="r.id">
            <div class="al-item-body">
              <div class="al-item-title">{{ r.title }}</div>
              <div class="al-item-sub">
                {{ catLabel(r.category) }}<span v-if="r.instructor"> · {{ r.instructor }}</span>
              </div>
              <div class="al-item-meta">
                <!-- Site Visit badge -->
                <template v-if="r.category === 'site'">
                  <span class="al-badge al-badge-blue">🏭 Site Visit</span>
                  <span v-if="r.capacity" class="al-badge al-badge-pending">👥 จำกัด {{ r.capacity }} คน</span>
                </template>
                <!-- Training badge -->
                <template v-else>
                  <span class="al-badge" :class="r.section ? 'al-badge-blue' : 'al-badge-pending'">
                    {{ r.section?.startsWith('train') ? `📅 เทรน ${r.section.replace('train','')}` : r.section === 'new' ? '✨ หลักสูตรใหม่' : 'ไม่มีข้อมูล' }}
                  </span>
                </template>
              </div>
            </div>
            <div class="al-item-actions">
              <button v-if="r.category === 'site'" class="al-btn al-btn-edit" @click="openVoters(r)">👥 ผู้โหวต</button>
              <button class="al-btn al-btn-edit" @click="openEdit(r)">แก้ไข</button>
              <button class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Suggestions section: shown only under Site Visit filter -->
      <template v-if="filterCat === 'site'">
        <div class="al-sug-section-hd">
          <div class="al-sug-section-hd-left">
            <span class="al-sug-icon">💡</span>
            <span class="al-sug-section-title">ข้อเสนอแนะสถานที่จากพนักงาน</span>
          </div>
          <span v-if="!suggestionsLoading" class="al-sug-count-pill">{{ suggestions.length }} รายการ</span>
        </div>

        <div v-if="suggestionsLoading" class="al-loading" style="padding:24px 0;">⏳ กำลังโหลด...</div>
        <div v-else-if="!suggestions.length" class="al-sug-empty">
          <div style="font-size:28px;margin-bottom:6px;">🏭</div>
          <div>ยังไม่มีข้อเสนอแนะจากพนักงาน</div>
        </div>
        <div v-else class="al-sug-list">
          <div v-for="(s, i) in suggestions" :key="s.id" class="al-sug-card">
            <div class="al-sug-avatar">{{ (s.employeeName || '?').charAt(0) }}</div>
            <div class="al-sug-content">
              <div class="al-sug-card-top">
                <span class="al-sug-name">{{ s.employeeName }}</span>
                <span class="al-sug-date">{{ fmtDate(s.createdAt) }}</span>
              </div>
              <div class="al-sug-text">{{ s.suggestion }}</div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- Add/Edit Modal -->
    <div v-if="formOpen" class="al-modal-overlay" @click.self="formOpen=false">
      <div class="al-modal" style="max-height:90vh;overflow-y:auto;">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">{{ editTarget ? '✏️ แก้ไข' : '+ เพิ่ม' }} {{ form.category === 'site' ? 'Site Visit' : 'หลักสูตร' }}</div>

        <div class="al-form-row">
          <label class="al-form-label">หมวดหมู่ *</label>
          <select class="al-form-select" v-model="form.category">
            <option value="">-- เลือกหมวดหมู่ --</option>
            <option v-for="c in CATEGORIES" :key="c.key" :value="c.key">{{ c.icon }} {{ c.name }}</option>
          </select>
        </div>

        <div class="al-form-row">
          <label class="al-form-label">{{ form.category === 'site' ? 'ชื่อสถานที่ *' : 'ชื่อหลักสูตร *' }}</label>
          <input class="al-form-input" v-model="form.title" :placeholder="form.category === 'site' ? 'ชื่อสถานที่ / บริษัท' : 'ชื่อหลักสูตร'" maxlength="200" />
        </div>

        <div class="al-form-row">
          <label class="al-form-label">รายละเอียด</label>
          <textarea class="al-form-input" v-model="form.description" rows="3"
            :placeholder="form.category === 'site' ? 'รายละเอียด เช่น ที่อยู่ กิจกรรม' : 'รายละเอียดหลักสูตร'"
            maxlength="500" style="resize:none;"></textarea>
        </div>

        <!-- Site Visit fields -->
        <template v-if="form.category === 'site'">
          <div class="al-form-2col">
            <div class="al-form-row">
              <label class="al-form-label">ผู้ดูแล / ติดต่อ</label>
              <input class="al-form-input" v-model="form.instructor" placeholder="ชื่อผู้ดูแล" maxlength="100" />
            </div>
            <div class="al-form-row">
              <label class="al-form-label">จำนวนที่รับ (0 = ไม่จำกัด)</label>
              <input class="al-form-input" type="number" v-model.number="form.capacity" min="0" placeholder="0" />
            </div>
          </div>
          <div class="al-form-row">
            <label class="al-form-label">สีธีม</label>
            <div class="al-color-swatches">
              <button
                v-for="c in SITE_COLORS" :key="c.value"
                class="al-color-swatch"
                :style="{ background: c.value }"
                :class="{ active: form.color === c.value }"
                :title="c.label"
                @click.prevent="form.color = c.value"
              ></button>
            </div>
          </div>
        </template>

        <!-- Training fields -->
        <template v-else>
          <div class="al-form-2col">
            <div class="al-form-row">
              <label class="al-form-label">วิทยากร</label>
              <input class="al-form-input" v-model="form.instructor" placeholder="ชื่อวิทยากร" maxlength="100" />
            </div>
            <div class="al-form-row">
              <label class="al-form-label">จัดอยู่ใน</label>
              <select class="al-form-select" v-model="form.section">
                <option value="">-- ไม่ระบุ --</option>
                <option value="train2026">📅 เทรน 2026</option>
                <option value="train2027">📅 เทรน 2027</option>
                <option value="new">✨ หลักสูตรใหม่</option>
              </select>
            </div>
          </div>
        </template>

        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="formOpen=false">ยกเลิก</button>
          <button class="al-btn al-btn-save" :disabled="saving || !form.title || !form.category" @click="doSave">
            {{ saving ? 'กำลังบันทึก...' : '✅ บันทึก' }}
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
          ลบ "<strong>{{ delTarget.title }}</strong>" ใช่หรือไม่?
        </p>
        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="delTarget=null">ยกเลิก</button>
          <button class="al-btn al-btn-delete" :disabled="deleting" @click="doDelete">
            {{ deleting ? 'กำลังลบ...' : '🗑️ ลบ' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Voters Modal (Site Visit) -->
    <div v-if="votersOpen" class="al-modal-overlay" @click.self="votersOpen=false">
      <div class="al-modal" style="max-height:80vh;overflow-y:auto;">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">👥 ผู้โหวต — {{ votersSite?.title }}</div>
        <div v-if="votersLoading" class="al-loading">⏳ กำลังโหลด...</div>
        <div v-else-if="!voters.length" class="al-empty">ยังไม่มีผู้โหวต</div>
        <div v-else>
          <div style="font-size:12px;color:#6B7280;margin-bottom:10px;">{{ voters.length }} คน</div>
          <div v-for="(v, i) in voters" :key="v.id" class="al-voter-row">
            <span class="al-voter-num">{{ i + 1 }}</span>
            <span class="al-voter-name">{{ v.employeeName || v.employeeId }}</span>
            <span class="al-voter-date">{{ fmtDate(v.registeredAt) }}</span>
          </div>
        </div>
        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="votersOpen=false">ปิด</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin.js'
import * as svc from '../../services/trainingService.js'

const admin  = useAdminStore()
const router = useRouter()

const rows      = ref([])
const loading   = ref(true)
const filterCat = ref('all')
const formOpen  = ref(false)
const saving    = ref(false)
const editTarget = ref(null)
const delTarget  = ref(null)
const deleting   = ref(false)

const votersOpen    = ref(false)
const votersSite    = ref(null)
const voters        = ref([])
const votersLoading = ref(false)

const suggestions        = ref([])
const suggestionsLoading = ref(false)
const suggestionsFetched = ref(false)

const CATEGORIES = [
  { key: 'annual',      icon: '📅', name: 'Annual Training' },
  { key: 'idp',         icon: '🎯', name: 'IDP' },
  { key: 'blog',        icon: '✍️',  name: 'Internal Blog' },
  { key: 'external',    icon: '🌐', name: 'External Training' },
  { key: 'compulsory',  icon: '📋', name: 'Compulsory Program' },
  { key: 'superskills', icon: '⭐', name: 'SuperSkills 2026' },
  { key: 'site',        icon: '🏭', name: 'Site Visit' },
  { key: 'leadership',  icon: '👑', name: 'Talent & Leadership' },
]

const CATEGORY_FILTERS = ['all', ...CATEGORIES.map(c => c.key)]

const SITE_COLORS = [
  { value: '#0EA5E9', label: 'ฟ้า' },
  { value: '#8B5CF6', label: 'ม่วง' },
  { value: '#10B981', label: 'เขียว' },
  { value: '#F59E0B', label: 'ทอง' },
  { value: '#EF4444', label: 'แดง' },
  { value: '#EC4899', label: 'ชมพู' },
  { value: '#06B6D4', label: 'ฟ้าคราม' },
  { value: '#F97316', label: 'ส้ม' },
]

const form = reactive({
  category: '', title: '', description: '', instructor: '', section: '', capacity: 0, color: '',
})

const filtered = computed(() =>
  filterCat.value === 'all' ? rows.value : rows.value.filter(r => r.category === filterCat.value)
)

function catLabel(key) {
  const c = CATEGORIES.find(c => c.key === key)
  return c ? `${c.icon} ${c.name}` : key
}

function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return isNaN(dt) ? d : dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

onMounted(async () => {
  try { rows.value = await svc.adminFetchTrainings() }
  catch { rows.value = [] }
  finally { loading.value = false }
})

function resetForm() {
  form.category = ''; form.title = ''; form.description = ''
  form.instructor = ''; form.section = ''; form.capacity = 0; form.color = ''
}

function openAdd() {
  editTarget.value = null
  resetForm()
  formOpen.value = true
}

function openEdit(r) {
  editTarget.value = r
  form.category    = r.category    || ''
  form.title       = r.title       || ''
  form.description = r.description || ''
  form.instructor  = r.instructor  || ''
  form.section     = r.section     || ''
  form.capacity    = Number(r.capacity) || 0
  form.color       = r.color       || ''
  formOpen.value   = true
}

watch(filterCat, async (val) => {
  if (val !== 'site' || suggestionsFetched.value) return
  suggestionsLoading.value = true
  try { suggestions.value = await svc.adminFetchSiteSuggestions() }
  catch { suggestions.value = [] }
  finally { suggestionsLoading.value = false; suggestionsFetched.value = true }
})

async function openVoters(site) {
  votersSite.value    = site
  votersOpen.value    = true
  votersLoading.value = true
  voters.value        = []
  try { voters.value = await svc.adminGetTrainingRegistrations(site.id) }
  catch { voters.value = [] }
  finally { votersLoading.value = false }
}

async function doSave() {
  if (!form.title.trim() || !form.category) return
  saving.value = true
  try {
    const payload = { ...form }
    if (form.category !== 'site') delete payload.capacity
    if (editTarget.value) {
      await svc.adminUpdateTraining(editTarget.value.id, payload)
      Object.assign(editTarget.value, payload)
    } else {
      const created = await svc.adminAddTraining(payload)
      rows.value.unshift({ ...created })
    }
    formOpen.value = false
  } catch (e) {
    alert('เกิดข้อผิดพลาด: ' + (e?.message || e))
  } finally {
    saving.value = false
  }
}

function confirmDelete(r) { delTarget.value = r }

async function doDelete() {
  deleting.value = true
  try {
    await svc.adminDeleteTraining(delTarget.value.id)
    rows.value = rows.value.filter(r => r.id !== delTarget.value.id)
    delTarget.value = null
  } catch { } finally {
    deleting.value = false
  }
}

function doLogout() { admin.logout(); router.push('/admin/login') }
</script>

<style scoped>
@import './admin.css';

.al-color-swatches {
  display: flex; gap: 8px; flex-wrap: wrap; padding: 4px 0;
}
.al-color-swatch {
  width: 32px; height: 32px; border-radius: 50%;
  border: 3px solid transparent; cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
  flex-shrink: 0;
}
.al-color-swatch:hover { transform: scale(1.15); }
.al-color-swatch.active {
  border-color: #1F2937;
  transform: scale(1.2);
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px currentColor;
}

/* ── Suggestions section ── */
.al-sug-section-hd {
  display: flex; align-items: center; justify-content: space-between;
  margin: 22px 0 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
  border: 1.5px solid #FCD34D;
  border-radius: 14px;
}
.al-sug-section-hd-left { display: flex; align-items: center; gap: 8px; }
.al-sug-icon { font-size: 18px; line-height: 1; }
.al-sug-section-title { font-size: 14px; font-weight: 800; color: #92400E; }
.al-sug-count-pill {
  font-size: 11px; font-weight: 700;
  background: #F59E0B; color: #fff;
  padding: 3px 10px; border-radius: 20px;
}

.al-sug-empty {
  text-align: center; padding: 28px 16px;
  font-size: 13px; color: #9CA3AF;
  background: #FFFBEB; border-radius: 12px;
  border: 1.5px dashed #FCD34D;
  margin-bottom: 16px;
}

.al-sug-list {
  display: flex; flex-direction: column; gap: 8px;
  margin-bottom: 20px;
}
.al-sug-card {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 14px;
  background: #fff;
  border: 1.5px solid #FEF3C7;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(245,158,11,0.07);
  transition: box-shadow 0.15s;
}
.al-sug-card:hover { box-shadow: 0 4px 14px rgba(245,158,11,0.14); }
.al-sug-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #FCD34D, #F59E0B);
  color: #fff; font-size: 15px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  text-transform: uppercase;
}
.al-sug-content { flex: 1; min-width: 0; }
.al-sug-card-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 4px; gap: 8px;
}
.al-sug-name { font-size: 13px; font-weight: 700; color: #111827; }
.al-sug-date { font-size: 11px; color: #9CA3AF; flex-shrink: 0; }
.al-sug-text {
  font-size: 13px; color: #374151;
  line-height: 1.5; white-space: pre-wrap;
}

.al-voter-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 4px;
  border-bottom: 1px solid #F3F4F6;
  font-size: 13px;
}
.al-voter-row:last-child { border-bottom: none; }
.al-voter-num  { width: 22px; font-size: 11px; color: #9CA3AF; font-weight: 700; flex-shrink: 0; }
.al-voter-name { flex: 1; font-weight: 600; color: #111827; }
.al-voter-date { font-size: 11px; color: #9CA3AF; flex-shrink: 0; }
</style>

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
        <span class="al-badge al-badge-blue">{{ rows.length }} หลักสูตร</span>
      </div>

      <!-- Filter + Add -->
      <div class="al-filters">
        <button
          v-for="f in CATEGORY_FILTERS" :key="f"
          class="al-chip"
          :class="{ active: filterCat === f }"
          @click="filterCat = f"
        >{{ f === 'all' ? 'ทั้งหมด' : f }}</button>
        <button class="al-btn al-btn-save" style="margin-left:auto;" @click="openAdd">+ เพิ่มหลักสูตร</button>
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
                <span class="al-badge" :class="r.section ? 'al-badge-blue' : 'al-badge-pending'">
                  {{ r.section?.startsWith('train') ? `📅 เทรน ${r.section.replace('train','')}` : r.section === 'new' ? '✨ หลักสูตรใหม่' : 'ไม่มีข้อมูล' }}
                </span>
              </div>
            </div>
            <div class="al-item-actions">
<button class="al-btn al-btn-edit"   @click="openEdit(r)">แก้ไข</button>
              <button class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Add/Edit Modal -->
    <div v-if="formOpen" class="al-modal-overlay" @click.self="formOpen=false">
      <div class="al-modal" style="max-height:90vh;overflow-y:auto;">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">{{ editTarget ? '✏️ แก้ไขหลักสูตร' : '+ เพิ่มหลักสูตร' }}</div>

        <div class="al-form-row">
          <label class="al-form-label">หมวดหมู่ *</label>
          <select class="al-form-select" v-model="form.category">
            <option value="">-- เลือกหมวดหมู่ --</option>
            <option v-for="c in CATEGORIES" :key="c.key" :value="c.key">{{ c.icon }} {{ c.name }}</option>
          </select>
        </div>

        <div class="al-form-row">
          <label class="al-form-label">ชื่อหลักสูตร *</label>
          <input class="al-form-input" v-model="form.title" placeholder="ชื่อหลักสูตร" maxlength="200" />
        </div>

        <div class="al-form-row">
          <label class="al-form-label">รายละเอียด</label>
          <textarea class="al-form-input" v-model="form.description" rows="3" placeholder="รายละเอียดหลักสูตร" maxlength="500" style="resize:none;"></textarea>
        </div>

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
          ลบหลักสูตร "<strong>{{ delTarget.title }}</strong>" ใช่หรือไม่?
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
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin.js'
import * as svc from '../../services/trainingService.js'

const admin  = useAdminStore()
const router = useRouter()

const rows     = ref([])
const loading  = ref(true)
const filterCat = ref('all')
const formOpen  = ref(false)
const saving    = ref(false)
const editTarget = ref(null)
const delTarget  = ref(null)
const deleting   = ref(false)

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

const form = reactive({
  category: '', title: '', description: '', instructor: '', section: '',
})

const filtered = computed(() =>
  filterCat.value === 'all' ? rows.value : rows.value.filter(r => r.category === filterCat.value)
)

function catLabel(key) {
  const c = CATEGORIES.find(c => c.key === key)
  return c ? `${c.icon} ${c.name}` : key
}


onMounted(async () => {
  try { rows.value = await svc.adminFetchTrainings() }
  catch { rows.value = [] }
  finally { loading.value = false }
})

function resetForm() {
  form.category = ''; form.title = ''; form.description = ''; form.instructor = ''; form.section = ''
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
  formOpen.value   = true
}

async function doSave() {
  if (!form.title.trim() || !form.category) return
  saving.value = true
  try {
    if (editTarget.value) {
      await svc.adminUpdateTraining(editTarget.value.id, { ...form })
      Object.assign(editTarget.value, { ...form })
    } else {
      const created = await svc.adminAddTraining({ ...form })
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
    rows.value  = rows.value.filter(r => r.id !== delTarget.value.id)
    delTarget.value = null
  } catch { } finally {
    deleting.value = false
  }
}

function doLogout() { admin.logout(); router.push('/admin/login') }
</script>

<style scoped>
@import './admin.css';
</style>

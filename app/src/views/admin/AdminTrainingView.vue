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
      </div>

      <!-- ── Tab bar ── -->
      <div class="atr-tabbar-wrap">
        <div class="atr-tabbar">
          <button
            v-for="t in ALL_TABS" :key="t.key"
            class="atr-tab"
            :class="{ active: activeTab === t.key }"
            @click="switchTab(t.key)"
          >
            <span class="atr-tab-icon">{{ t.icon }}</span>
            <span class="atr-tab-label">{{ t.label }}</span>
            <span v-if="tabCount(t.key)" class="atr-tab-count">{{ tabCount(t.key) }}</span>
          </button>
        </div>
      </div>

      <!-- ── Toolbar (hidden for IDP — it has its own add button inside) ── -->
      <div v-if="activeTab !== 'idp'" class="atr-toolbar">
        <span class="atr-toolbar-desc">{{ activeDef?.desc || '' }}</span>
        <button class="al-btn al-btn-save" @click="openAdd">
          + {{ activeTab === 'site' ? 'เพิ่มสถานที่' : 'เพิ่มหลักสูตร' }}
        </button>
      </div>

      <!-- ── Tab content ── -->
      <AdminSiteTab
        v-if="activeTab === 'site'"
        :rows="siteRows"
        :loading="tabLoading"
        :suggestions="suggestions"
        :sug-loading="sugLoading"
        @edit="openEdit"
        @delete="confirmDel"
      />
      <AdminIdpTab
        v-else-if="activeTab === 'idp'"
      />
      <AdminCourseTab
        v-else
        :rows="tabRows"
        :loading="tabLoading"
        @edit="openEdit"
        @delete="confirmDel"
      />
    </main>

    <!-- ── Add/Edit Modal ── -->
    <div v-if="formOpen" class="al-modal-overlay" @click.self="formOpen = false">
      <div class="al-modal" style="max-height:90vh;overflow-y:auto;">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">
          {{ editTarget ? '✏️ แก้ไข' : '+ เพิ่ม' }} {{ activeTab === 'site' ? 'Site Visit' : activeDef?.label }}
        </div>

        <!-- Site Visit form -->
        <template v-if="activeTab === 'site'">
          <div class="al-form-row">
            <label class="al-form-label">ชื่อสถานที่ *</label>
            <input class="al-form-input" v-model="form.title" placeholder="ชื่อสถานที่ / บริษัท" maxlength="200" />
          </div>
          <div class="al-form-row">
            <label class="al-form-label">รายละเอียด</label>
            <textarea class="al-form-input" v-model="form.description" rows="3"
              placeholder="รายละเอียด เช่น ที่อยู่ กิจกรรม" maxlength="500" style="resize:none;"></textarea>
          </div>
          <div class="al-form-row">
            <label class="al-form-label">ผู้ดูแล / ติดต่อ</label>
            <input class="al-form-input" v-model="form.instructor" placeholder="ชื่อผู้ดูแล" maxlength="100" />
          </div>
          <div class="al-form-row">
            <label class="al-form-label">สีธีม</label>
            <div class="al-color-swatches">
              <button v-for="c in SITE_COLORS" :key="c.value"
                class="al-color-swatch"
                :style="{ background: c.value }"
                :class="{ active: form.color === c.value }"
                :title="c.label"
                @click.prevent="form.color = c.value"
              ></button>
            </div>
          </div>
        </template>

        <!-- Course form -->
        <template v-else>
          <div class="al-form-row">
            <label class="al-form-label">ชื่อหลักสูตร *</label>
            <input class="al-form-input" v-model="form.title" placeholder="ชื่อหลักสูตร" maxlength="200" />
          </div>
          <div class="al-form-row">
            <label class="al-form-label">รายละเอียด</label>
            <textarea class="al-form-input" v-model="form.description" rows="3"
              placeholder="รายละเอียดหลักสูตร" maxlength="500" style="resize:none;"></textarea>
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
        </template>

        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="formOpen = false">ยกเลิก</button>
          <button class="al-btn al-btn-save" :disabled="saving || !form.title" @click="doSave">
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
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin.js'
import * as svc from '../../services/trainingService.js'
import AdminCourseTab from './training/AdminCourseTab.vue'
import AdminSiteTab   from './training/AdminSiteTab.vue'
import AdminIdpTab    from './training/AdminIdpTab.vue'

const admin  = useAdminStore()
const router = useRouter()

// ── Tab definitions ───────────────────────────────────────────────────────────
const ALL_TABS = [
  { key: 'annual',      icon: '📅', label: 'Annual',      desc: 'หลักสูตรฝึกอบรมประจำปี' },
  { key: 'idp',         icon: '🎯', label: 'IDP',          desc: 'แผนพัฒนาตนเองรายบุคคล' },
  { key: 'external',    icon: '🌐', label: 'External',     desc: 'อบรมภายนอก / สัมมนา' },
  { key: 'compulsory',  icon: '📋', label: 'Compulsory',   desc: 'หลักสูตรบังคับตามกฎหมาย' },
  { key: 'superskills', icon: '⭐', label: 'SuperSkills',  desc: 'คอร์สแนะนำพิเศษ 2026' },
  { key: 'leadership',  icon: '👑', label: 'Leadership',   desc: 'พัฒนาทักษะผู้นำรุ่นใหม่' },
  { key: 'site',        icon: '🏭', label: 'Site Visit',   desc: 'สถานที่เยี่ยมชม + ระบบโหวต' },
]

const activeTab = ref('annual')
const activeDef = computed(() => ALL_TABS.find(t => t.key === activeTab.value))

// ── Per-tab course cache ──────────────────────────────────────────────────────
const courseCache = reactive({})
const tabLoading  = ref(false)
const tabRows     = computed(() => courseCache[activeTab.value] || [])

function tabCount(key) {
  if (key === 'site') return siteRows.value.length || 0
  if (key === 'idp')  return null   // AdminIdpTab shows its own counts
  return (courseCache[key] || []).length || 0
}

async function loadTab(key) {
  if (key === 'site') { await loadSite(); return }
  if (key === 'idp')  return  // AdminIdpTab loads its own data
  if (courseCache[key] !== undefined) return
  tabLoading.value = true
  try {
    courseCache[key] = await svc.adminFetchTrainings(key)
  } catch {
    courseCache[key] = []
  } finally {
    tabLoading.value = false
  }
}

function switchTab(key) {
  activeTab.value = key
  loadTab(key)
}

onMounted(() => loadTab('annual'))

// ── Site Visit ────────────────────────────────────────────────────────────────
const siteRows    = ref([])
const siteReady   = ref(false)
const suggestions = ref([])
const sugLoading  = ref(false)

async function loadSite() {
  if (siteReady.value) return
  tabLoading.value = true
  sugLoading.value = true
  try {
    const [sites, sugs] = await Promise.all([
      svc.adminFetchSiteVisits(),
      svc.adminFetchSiteSuggestions(),
    ])
    siteRows.value    = sites
    suggestions.value = sugs
  } catch {
    siteRows.value    = []
    suggestions.value = []
  } finally {
    tabLoading.value = false
    sugLoading.value = false
    siteReady.value  = true
  }
}

// ── Form ──────────────────────────────────────────────────────────────────────
const formOpen   = ref(false)
const saving     = ref(false)
const editTarget = ref(null)
const delRow     = ref(null)
const deleting   = ref(false)
const form       = reactive({ title: '', description: '', instructor: '', section: '', color: '' })

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

function resetForm() {
  Object.assign(form, { title: '', description: '', instructor: '', section: '', color: '' })
}

function openAdd() {
  editTarget.value = null
  resetForm()
  formOpen.value = true
}

function openEdit(row) {
  editTarget.value = row
  Object.assign(form, {
    title:       row.title       || '',
    description: row.description || '',
    instructor:  row.instructor  || '',
    section:     row.section     || '',
    color:       row.color       || '',
  })
  formOpen.value = true
}

function confirmDel(row) { delRow.value = row }

async function doSave() {
  if (!form.title.trim()) return
  saving.value = true
  try {
    if (activeTab.value === 'site') {
      const p = { title: form.title, description: form.description, instructor: form.instructor, color: form.color }
      if (editTarget.value) {
        await svc.adminUpdateSiteVisit(editTarget.value.id, p)
        Object.assign(editTarget.value, p)
      } else {
        const created = await svc.adminAddSiteVisit(p)
        siteRows.value.unshift({ ...created, voteCount: 0 })
      }
    } else {
      const cat = activeTab.value
      const p   = { category: cat, title: form.title, description: form.description, instructor: form.instructor, section: form.section }
      if (editTarget.value) {
        await svc.adminUpdateTraining(editTarget.value.id, p)
        Object.assign(editTarget.value, p)
      } else {
        const created = await svc.adminAddTraining(p)
        if (!courseCache[cat]) courseCache[cat] = []
        courseCache[cat].unshift({ ...created })
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
  try {
    if (activeTab.value === 'site') {
      await svc.adminDeleteSiteVisit(delRow.value.id)
      siteRows.value = siteRows.value.filter(r => r.id !== delRow.value.id)
    } else {
      const cat = activeTab.value
      await svc.adminDeleteTraining(delRow.value.id, cat)
      courseCache[cat] = (courseCache[cat] || []).filter(r => r.id !== delRow.value.id)
    }
    delRow.value = null
  } catch { }
  finally { deleting.value = false }
}

function doLogout() { admin.logout(); router.push('/admin/login') }
</script>

<style scoped>
@import './admin.css';

/* ── Tab bar ── */
.atr-tabbar-wrap {
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  scrollbar-width: none; margin: 0 -16px; padding: 0 16px;
}
.atr-tabbar-wrap::-webkit-scrollbar { display: none; }
.atr-tabbar {
  display: flex; gap: 6px; padding-bottom: 4px;
  width: max-content; min-width: 100%;
}
.atr-tab {
  display: flex; align-items: center; gap: 5px;
  padding: 8px 14px; border-radius: 20px;
  border: 1.5px solid #E5E7EB; background: white;
  font-size: 12px; font-weight: 700;
  font-family: 'Sarabun', sans-serif;
  color: #6B7280; cursor: pointer; transition: all 0.15s;
  white-space: nowrap; flex-shrink: 0;
}
.atr-tab:hover  { border-color: #6366F1; color: #4F46E5; }
.atr-tab.active {
  background: linear-gradient(135deg, #6366F1, #4F46E5);
  border-color: #4F46E5; color: white;
  box-shadow: 0 2px 8px rgba(99,102,241,0.3);
}
.atr-tab-icon  { font-size: 14px; line-height: 1; }
.atr-tab-label { font-size: 12px; }
.atr-tab-count {
  font-size: 10px; font-weight: 800;
  background: rgba(0,0,0,0.1); padding: 1px 6px; border-radius: 10px;
  min-width: 16px; text-align: center;
}
.atr-tab.active .atr-tab-count { background: rgba(255,255,255,0.25); }

/* ── Toolbar ── */
.atr-toolbar {
  display: flex; align-items: center;
  justify-content: space-between; gap: 10px;
}
.atr-toolbar-desc { font-size: 12px; color: #9CA3AF; font-weight: 600; }

/* ── Color swatches (in form modal) ── */
.al-color-swatches { display: flex; gap: 8px; flex-wrap: wrap; padding: 4px 0; }
.al-color-swatch {
  width: 30px; height: 30px; border-radius: 50%;
  border: 3px solid transparent; cursor: pointer;
  transition: transform 0.15s, border-color 0.15s; flex-shrink: 0;
}
.al-color-swatch:hover  { transform: scale(1.15); }
.al-color-swatch.active {
  border-color: #1F2937; transform: scale(1.2);
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px currentColor;
}
</style>

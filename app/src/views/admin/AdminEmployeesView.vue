<template>
  <div class="al-wrap">
    <header class="al-header">
      <div class="al-logo">🛡️ DS Admin</div>
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:13px;color:#6B7280;">สวัสดี, <strong>{{ admin.adminName }}</strong></span>
        <button class="al-logout-btn" @click="doLogout">ออกจากระบบ</button>
      </div>
    </header>

    <main class="al-main">
      <a class="al-back" @click="router.push('/admin')">← กลับ Dashboard</a>
      <h2 class="al-page-title">👥 จัดการพนักงาน</h2>

      <div class="al-card">
        <div class="al-card-header">
          <span class="al-card-title">รายชื่อพนักงาน ({{ rows.length }})</span>
          <button class="al-btn al-btn-primary" @click="openAdd">+ เพิ่มพนักงาน</button>
        </div>

        <div v-if="loading" class="al-loading">กำลังโหลด...</div>
        <div v-else-if="rows.length === 0" class="al-empty">ไม่มีข้อมูล</div>
        <div v-else class="al-table-wrap">
          <table class="al-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ชื่อ</th>
                <th>Role</th>
                <th>Dept</th>
                <th>inTeam</th>
                <th>StarGang</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.id">
                <td style="color:#9CA3AF;font-size:11px;">{{ r.id }}</td>
                <td style="font-weight:700;">{{ r.name }}</td>
                <td>{{ r.role }}</td>
                <td>{{ r.dept }}</td>
                <td>
                  <span class="al-badge" :class="r.inTeam === 'true' || r.inTeam === true ? 'al-badge-yes' : 'al-badge-no'">
                    {{ r.inTeam === 'true' || r.inTeam === true ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td>
                  <span class="al-badge" :class="r.inStarGang === 'true' || r.inStarGang === true ? 'al-badge-yes' : 'al-badge-no'">
                    {{ r.inStarGang === 'true' || r.inStarGang === true ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td style="display:flex;gap:6px;flex-wrap:wrap;">
                  <button class="al-btn al-btn-edit" @click="openEdit(r)">แก้ไข</button>
                  <button class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Edit/Add Modal -->
    <div v-if="modal.open" class="al-modal-overlay" @click.self="modal.open=false">
      <div class="al-modal">
        <div class="al-modal-title">{{ modal.mode === 'add' ? '+ เพิ่มพนักงาน' : '✏️ แก้ไขพนักงาน' }}</div>

        <div class="al-form-row">
          <label class="al-form-label">Name *</label>
          <input v-model="form.name" class="al-form-input" placeholder="ชื่อพนักงาน" />
        </div>
        <div class="al-form-row">
          <label class="al-form-label">Role</label>
          <input v-model="form.role" class="al-form-input" placeholder="ตำแหน่ง" />
        </div>
        <div class="al-form-row">
          <label class="al-form-label">Dept</label>
          <input v-model="form.dept" class="al-form-input" placeholder="แผนก" />
        </div>
        <div class="al-form-row">
          <label class="al-form-label">Image URL</label>
          <input v-model="form.imgUrl" class="al-form-input" placeholder="URL รูปภาพ" />
        </div>
        <div class="al-form-row">
          <label class="al-form-label">inTeam</label>
          <select v-model="form.inTeam" class="al-form-select">
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div class="al-form-row">
          <label class="al-form-label">inStarGang</label>
          <select v-model="form.inStarGang" class="al-form-select">
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div v-if="modal.error" style="color:#DC2626;font-size:12px;margin-bottom:10px;">{{ modal.error }}</div>

        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
          <button class="al-btn" style="background:#F3F4F6;color:#374151;" @click="modal.open=false">ยกเลิก</button>
          <button class="al-btn al-btn-save" :disabled="modal.saving" @click="saveModal">
            {{ modal.saving ? 'กำลังบันทึก...' : 'บันทึก' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="delTarget" class="al-modal-overlay" @click.self="delTarget=null">
      <div class="al-modal" style="max-width:360px;">
        <div class="al-modal-title">🗑️ ยืนยันการลบ</div>
        <p style="font-size:13px;color:#374151;margin:0 0 16px;">
          ลบพนักงาน "<strong>{{ delTarget.name }}</strong>" ใช่หรือไม่?<br>
          <span style="color:#DC2626;font-size:12px;">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
        </p>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button class="al-btn" style="background:#F3F4F6;color:#374151;" @click="delTarget=null">ยกเลิก</button>
          <button class="al-btn al-btn-delete" :disabled="deleting" @click="doDelete">
            {{ deleting ? 'กำลังลบ...' : 'ลบ' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin.js'
import * as svc from '../../services/adminService.js'

const admin  = useAdminStore()
const router = useRouter()

const rows    = ref([])
const loading = ref(true)

const modal = reactive({ open: false, mode: 'add', saving: false, error: '' })
const form  = reactive({ id:'', name:'', role:'', dept:'', imgUrl:'', inTeam:'true', inStarGang:'false' })

const delTarget = ref(null)
const deleting  = ref(false)

const SEED = [
  { id:'1', name:'นก', role:'Marketing Manager', dept:'Marketing', inTeam:'true', inStarGang:'true' },
  { id:'2', name:'น้ำส้ม', role:'Graphic Designer', dept:'Creative', inTeam:'true', inStarGang:'false' },
  { id:'3', name:'วุฒิ', role:'Developer', dept:'Tech', inTeam:'true', inStarGang:'false' },
]

onMounted(async () => {
  try {
    const data = await svc.getAll('Employees')
    rows.value = data.length ? data : SEED
  } catch {
    rows.value = SEED
  } finally {
    loading.value = false
  }
})

function openAdd() {
  Object.assign(form, { id:'', name:'', role:'', dept:'', imgUrl:'', inTeam:'true', inStarGang:'false' })
  modal.mode = 'add'; modal.error = ''; modal.open = true
}
function openEdit(r) {
  Object.assign(form, { ...r, inTeam: String(r.inTeam), inStarGang: String(r.inStarGang) })
  modal.mode = 'edit'; modal.error = ''; modal.open = true
}

async function saveModal() {
  if (!form.name.trim()) { modal.error = 'กรุณากรอกชื่อ'; return }
  modal.saving = true; modal.error = ''
  try {
    if (modal.mode === 'add') {
      await svc.addEmployee({ ...form })
      rows.value.push({ ...form, id: Date.now().toString() })
    } else {
      await svc.updateRow('Employees', 'id', form.id, { name:form.name, role:form.role, dept:form.dept, imgUrl:form.imgUrl, inTeam:form.inTeam, inStarGang:form.inStarGang })
      const idx = rows.value.findIndex(r => r.id === form.id)
      if (idx >= 0) Object.assign(rows.value[idx], form)
    }
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
    await svc.deleteRow('Employees', 'id', delTarget.value.id)
    rows.value = rows.value.filter(r => r.id !== delTarget.value.id)
    delTarget.value = null
  } catch { /* keep */ } finally {
    deleting.value = false
  }
}

function doLogout() { admin.logout(); router.push('/admin/login') }
</script>

<style scoped>
@import './admin.css';
</style>

<template>
  <div>
    <main class="al-main">

      <div class="al-page-header">
        <h1 class="al-page-title">📢 จัดการประกาศ</h1>
      </div>

      <div v-if="loading" class="al-loading">กำลังโหลดข้อมูล...</div>

      <template v-else>

        <!-- ── Status ──────────────────────────────────────────── -->
        <div class="al-card">
          <div class="al-card-header">
            <div class="al-card-title">สถานะ Popup</div>
            <label class="ann-toggle-wrap">
              <input type="checkbox" v-model="form.enabled" />
              <span class="ann-track"><span class="ann-thumb"></span></span>
              <span :style="`font-size:12px;font-weight:700;color:${form.enabled?'#059669':'#9CA3AF'}`">
                {{ form.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
              </span>
            </label>
          </div>
          <div
            style="padding:10px 16px;font-size:12px;"
            :style="form.enabled
              ? 'color:#059669;background:#F0FDF4;border-top:1px solid #D1FAE5;'
              : 'color:#9CA3AF;background:#F9FAFB;border-top:1px solid #F3F4F6;'"
          >
            {{ form.enabled
              ? '✓ Popup จะแสดงให้ผู้ใช้ทุกคนที่ยังไม่ปิด'
              : 'Popup จะไม่แสดง แม้มีเนื้อหาตั้งค่าไว้' }}
          </div>
        </div>

        <!-- ── Details ─────────────────────────────────────────── -->
        <div class="al-card">
          <div class="al-card-header">
            <div class="al-card-title">รายละเอียดประกาศ</div>
          </div>
          <div style="padding:16px;display:flex;flex-direction:column;gap:14px;">

            <!-- ID -->
            <div>
              <label class="al-form-label">
                Announcement ID
                <span style="color:#9CA3AF;font-weight:400;text-transform:none;letter-spacing:0;">(เปลี่ยน ID = ผู้ใช้เห็น popup อีกครั้ง)</span>
              </label>
              <div style="display:flex;gap:8px;align-items:center;">
                <input v-model="form.id" class="al-form-input" style="flex:1;" placeholder="ann_2026_03_13" />
                <button class="al-btn al-btn-edit" style="flex-shrink:0;white-space:nowrap;" @click="regenerateId">🔄 สร้างใหม่</button>
              </div>
            </div>

            <!-- Title -->
            <div>
              <label class="al-form-label">หัวข้อประกาศ</label>
              <input v-model="form.title" class="al-form-input" placeholder="เช่น ประกาศสำคัญจากทีม DS" maxlength="100" />
            </div>

            <!-- Desc -->
            <div>
              <label class="al-form-label">รายละเอียด <span style="color:#9CA3AF;font-weight:400;text-transform:none;">(ไม่บังคับ)</span></label>
              <textarea v-model="form.desc" class="al-form-textarea" rows="3" maxlength="500"
                placeholder="คำอธิบายเพิ่มเติมใต้วิดีโอ"></textarea>
            </div>

          </div>
        </div>

        <!-- ── Quiz ────────────────────────────────────────────── -->
        <div class="al-card">
          <div class="al-card-header">
            <div class="al-card-title">🎯 คำถามร่วมสนุก</div>
            <label class="ann-toggle-wrap">
              <input type="checkbox" v-model="form.quizEnabled" />
              <span class="ann-track"><span class="ann-thumb"></span></span>
              <span :style="`font-size:12px;font-weight:700;color:${form.quizEnabled?'#059669':'#9CA3AF'}`">
                {{ form.quizEnabled ? 'เปิด' : 'ปิด' }}
              </span>
            </label>
          </div>

          <template v-if="form.quizEnabled">
            <div style="padding:16px;display:flex;flex-direction:column;gap:16px;">

              <!-- Each question block -->
              <div
                v-for="(q, qi) in form.quizQuestions"
                :key="q.id"
                class="qz-question-block"
              >
                <!-- Question header -->
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                  <div style="font-size:12px;font-weight:800;color:#4338CA;">คำถามที่ {{ qi + 1 }}</div>
                  <button
                    v-if="form.quizQuestions.length > 1"
                    class="al-btn al-btn-delete"
                    style="padding:4px 10px;font-size:11px;"
                    @click="removeQuestion(qi)"
                  >🗑 ลบ</button>
                </div>

                <!-- Question text -->
                <div>
                  <label class="al-form-label">คำถาม</label>
                  <input
                    v-model="q.question"
                    class="al-form-input"
                    placeholder="เช่น ใครที่คุณนึกถึงมากที่สุดในสัปดาห์นี้?"
                    maxlength="200"
                  />
                </div>

                <!-- Type -->
                <div style="margin-top:10px;">
                  <label class="al-form-label">ประเภทคำตอบ</label>
                  <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <label class="qz-type-opt" :class="{ active: q.type === 'single' }">
                      <input type="radio" v-model="q.type" value="single" style="display:none;" />
                      ⬤ เลือกได้ 1 ข้อ
                    </label>
                    <label class="qz-type-opt" :class="{ active: q.type === 'multi' }">
                      <input type="radio" v-model="q.type" value="multi" style="display:none;" />
                      ☑ เลือกได้หลายข้อ
                    </label>
                  </div>
                </div>

                <!-- Options -->
                <div style="margin-top:10px;">
                  <label class="al-form-label">ตัวเลือก (2–4 ข้อ)</label>
                  <div style="display:flex;flex-direction:column;gap:8px;">
                    <div
                      v-for="(opt, idx) in q.options"
                      :key="opt.id"
                      style="display:flex;gap:8px;align-items:center;"
                    >
                      <div class="qz-opt-num">{{ idx + 1 }}</div>
                      <input
                        v-model="opt.text"
                        class="al-form-input"
                        :placeholder="`ตัวเลือกที่ ${idx + 1}`"
                        maxlength="100"
                        style="flex:1;"
                      />
                      <button
                        v-if="q.options.length > 2"
                        class="al-btn al-btn-delete"
                        style="padding:7px 10px;flex-shrink:0;"
                        @click="removeOption(q, idx)"
                      >✕</button>
                    </div>
                  </div>
                  <button
                    v-if="q.options.length < 4"
                    class="al-btn al-btn-edit"
                    style="margin-top:10px;"
                    @click="addOption(q)"
                  >+ เพิ่มตัวเลือก</button>
                </div>
              </div>

              <!-- Add question button -->
              <button
                v-if="form.quizQuestions.length < 5"
                class="al-btn al-btn-edit"
                style="align-self:flex-start;"
                @click="addQuestion"
              >+ เพิ่มคำถาม</button>

              <!-- Load results button -->
              <div v-if="form.id" style="display:flex;justify-content:flex-end;">
                <button class="al-btn al-btn-edit" style="font-size:11px;padding:5px 12px;" @click="loadQuizAnswers" :disabled="quizAnswersLoading">
                  {{ quizAnswersLoading ? '⏳ กำลังโหลด...' : '📊 โหลดผลโหวต' }}
                </button>
              </div>

            </div>
          </template>

          <div
            v-else
            style="padding:12px 16px;font-size:12px;color:#9CA3AF;background:#F9FAFB;border-top:1px solid #F3F4F6;"
          >
            เปิดใช้งานเพื่อเพิ่มคำถามให้ผู้ใช้ร่วมสนุกใน Popup
          </div>
        </div>

        <!-- ── Quiz Results ────────────────────────────────────── -->
        <div v-if="form.quizEnabled && totalRespondents > 0" class="al-card">
          <div class="al-card-header">
            <div class="al-card-title">📊 ผลโหวต</div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="al-badge al-badge-blue">{{ totalRespondents }} คน</span>
              <button class="al-btn al-btn-edit" style="font-size:11px;padding:5px 10px;" @click="loadQuizAnswers" :disabled="quizAnswersLoading">↻</button>
              <button class="al-btn al-btn-delete" style="font-size:11px;padding:5px 10px;" @click="resetQuiz" :disabled="quizResetting">
                {{ quizResetting ? '...' : '🗑 Reset' }}
              </button>
            </div>
          </div>

          <!-- Per-question aggregate bars -->
          <div
            v-for="(q, qi) in form.quizQuestions"
            :key="q.id"
            style="padding:12px 16px;border-bottom:1px solid #F3F4F6;"
          >
            <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:2px;">{{ qi + 1 }}. {{ q.question || `คำถามที่ ${qi + 1}` }}</div>
            <div style="font-size:11px;color:#9CA3AF;margin-bottom:8px;">{{ quizQTotal(q.id) }} คนตอบ</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <div v-for="opt in q.options" :key="opt.id" style="display:flex;align-items:center;gap:10px;">
                <div style="width:22px;height:22px;border-radius:50%;background:#EEF2FF;color:#4F46E5;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  {{ opt.id.toUpperCase() }}
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ opt.text || `ตัวเลือก ${opt.id.toUpperCase()}` }}</div>
                  <div style="height:6px;background:#F3F4F6;border-radius:4px;overflow:hidden;">
                    <div style="height:100%;border-radius:4px;background:linear-gradient(90deg,#6366F1,#A855F7);transition:width 0.6s ease;"
                         :style="{ width: quizQTotal(q.id) ? (quizOptCount(q.id, opt.id) / quizQTotal(q.id) * 100) + '%' : '0%' }"></div>
                  </div>
                </div>
                <div style="font-size:12px;font-weight:800;color:#4F46E5;flex-shrink:0;min-width:40px;text-align:right;">
                  {{ quizQTotal(q.id) ? Math.round(quizOptCount(q.id, opt.id) / quizQTotal(q.id) * 100) : 0 }}%
                  <span style="font-size:10px;color:#9CA3AF;font-weight:600;">({{ quizOptCount(q.id, opt.id) }})</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Respondents list (grouped by employee) -->
          <div style="padding:8px 0;max-height:280px;overflow-y:auto;">
            <div
              v-for="r in respondentMap"
              :key="r.name"
              style="display:flex;align-items:flex-start;gap:10px;padding:8px 16px;border-bottom:1px solid #F7F7FF;"
            >
              <div style="width:30px;height:30px;border-radius:50%;background:#EEF2FF;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#4F46E5;flex-shrink:0;margin-top:1px;">
                {{ r.name?.[0] || '?' }}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:12px;font-weight:700;color:#111827;">{{ r.name }}</div>
                <div
                  v-for="(q, qi) in form.quizQuestions"
                  :key="q.id"
                  style="font-size:11px;color:#6B7280;margin-top:2px;"
                >
                  <template v-if="r.answers[q.id]?.length">
                    {{ form.quizQuestions.length > 1 ? `Q${qi + 1}: ` : '' }}{{ (r.answers[q.id] || []).map(id => optLabel(q, id)).join(' · ') }}
                  </template>
                </div>
              </div>
              <div style="font-size:10px;color:#9CA3AF;flex-shrink:0;">{{ fmtDate(r.createdAt) }}</div>
            </div>
          </div>
        </div>

        <!-- ── Video ───────────────────────────────────────────── -->
        <div class="al-card">
          <div class="al-card-header">
            <div class="al-card-title">วิดีโอ</div>
            <div style="display:flex;align-items:center;gap:10px;">
              <label class="ann-toggle-wrap">
                <input type="checkbox" v-model="form.videoEnabled" />
                <span class="ann-track"><span class="ann-thumb"></span></span>
                <span :style="`font-size:12px;font-weight:700;color:${form.videoEnabled?'#059669':'#9CA3AF'}`">
                  {{ form.videoEnabled ? 'เปิด' : 'ปิด' }}
                </span>
              </label>
              <div style="display:flex;gap:4px;">
                <button
                  v-for="t in videoTabs" :key="t.id"
                  class="al-btn"
                  :style="videoTab===t.id
                    ? 'background:#EEF2FF;color:#4F46E5;border:1.5px solid #C7D2FE;padding:5px 12px;font-size:12px;'
                    : 'background:#F3F4F6;color:#6B7280;border:1.5px solid #E5E7EB;padding:5px 12px;font-size:12px;'"
                  @click="videoTab = t.id"
                >{{ t.label }}</button>
              </div>
            </div>
          </div>

          <div style="padding:16px;display:flex;flex-direction:column;gap:14px;">

            <!-- Link tab -->
            <template v-if="videoTab === 'link'">
              <div>
                <label class="al-form-label">URL วิดีโอ</label>
                <input v-model="form.video" class="al-form-input"
                  placeholder="https://youtu.be/xxxxx หรือ Google Drive link" />
                <div style="font-size:11px;color:#9CA3AF;margin-top:5px;">
                  รองรับ YouTube · Google Drive · ลิงก์วิดีโอทั่วไป (MP4 ฯลฯ)
                </div>
              </div>
            </template>

            <!-- Upload tab -->
            <template v-else>
              <!-- Drop zone -->
              <div
                class="ann-drop-zone"
                :class="{ 'ann-drop-active': isDragging }"
                @click="fileInput?.click()"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="onDrop"
              >
                <input ref="fileInput" type="file" accept="video/*" style="display:none;" @change="onFileChange" />
                <template v-if="!selectedFile">
                  <div style="font-size:32px;">🎬</div>
                  <div style="font-size:13px;font-weight:700;color:#374151;margin-top:8px;">คลิกหรือลากไฟล์มาวาง</div>
                  <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">MP4 · MOV · WebM · สูงสุด 35 MB</div>
                </template>
                <template v-else>
                  <div style="font-size:26px;">🎬</div>
                  <div style="font-size:13px;font-weight:700;color:#374151;margin-top:6px;word-break:break-all;text-align:center;max-width:100%;">
                    {{ selectedFile.name }}
                  </div>
                  <div style="font-size:11px;color:#6B7280;margin-top:3px;">{{ fileSizeMb }} MB</div>
                  <div v-if="selectedFile.size > 20 * 1024 * 1024"
                       style="font-size:11px;color:#D97706;margin-top:4px;">
                    ⚠️ ไฟล์ค่อนข้างใหญ่ แนะนำอัปโหลด YouTube แล้วใช้ลิงก์แทน
                  </div>
                </template>
              </div>

              <div v-if="uploadErr" class="al-error">{{ uploadErr }}</div>

              <div v-if="uploadStatus" style="font-size:12px;color:#6B7280;text-align:center;padding:2px 0;">
                {{ uploadStatus }}
              </div>

              <button
                class="al-btn al-btn-primary"
                style="width:100%;padding:11px;"
                :disabled="!selectedFile || uploading"
                @click="doUpload"
              >
                <span v-if="uploading">{{ uploadStatus || 'กำลังอัปโหลด...' }}</span>
                <span v-else>🚀 อัปโหลดสู่ Google Drive</span>
              </button>
            </template>

            <!-- Preview -->
            <template v-if="form.video">
              <div style="font-size:11px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">ตัวอย่าง</div>
              <div style="width:100%;aspect-ratio:16/9;background:#000;border-radius:10px;overflow:hidden;position:relative;">
                <iframe
                  v-if="embedUrl"
                  :src="embedUrl"
                  style="position:absolute;inset:0;width:100%;height:100%;"
                  frameborder="0"
                  allowfullscreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
                <video
                  v-else
                  :src="form.video"
                  style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;"
                  controls
                  playsinline
                ></video>
              </div>
            </template>

          </div>
        </div>

        <!-- ── Save ────────────────────────────────────────────── -->
        <div v-if="saveErr" class="al-error" style="text-align:center;">{{ saveErr }}</div>

        <!-- Success + preview button -->
        <div v-if="saveOk"
             style="background:#F0FDF4;border:1.5px solid #A7F3D0;border-radius:14px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div style="font-size:13px;font-weight:700;color:#059669;">✓ บันทึกสำเร็จแล้ว</div>
          <a href="#/" target="_blank"
             style="display:inline-flex;align-items:center;gap:5px;padding:8px 14px;background:linear-gradient(135deg,#6366F1,#A855F7);color:white;border-radius:10px;font-size:12px;font-weight:700;text-decoration:none;">
            🔍 ดูตัวอย่าง Popup
          </a>
        </div>

        <button
          class="al-btn al-btn-save"
          style="width:100%;padding:13px;font-size:14px;"
          :disabled="saving"
          @click="doSave"
        >
          {{ saving ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่า' }}
        </button>

        <!-- Info -->
        <div class="al-info-box" style="font-size:12px;color:#4338CA;line-height:1.9;">
          <div style="font-weight:800;margin-bottom:4px;">ℹ️ วิธีทดสอบ</div>
          <ul style="padding-left:16px;margin:0;">
            <li>กด <strong>บันทึก</strong> แล้วกด <strong>ดูตัวอย่าง Popup</strong> เพื่อเปิดหน้า user ในแท็บใหม่</li>
            <li>Popup แสดงเฉพาะหน้า <strong>user</strong> (ไม่แสดงในหน้า admin)</li>
            <li>ถ้า Popup ไม่ขึ้น ให้ตรวจสอบว่า <strong>เปิดใช้งาน</strong> อยู่และ login ด้วย user account ด้วย</li>
          </ul>
        </div>

      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import * as svc from '../../services/adminService.js'

// ── State ──────────────────────────────────────────────────────────
const loading           = ref(true)
const saving            = ref(false)
const saveOk            = ref(false)
const saveErr           = ref('')
const uploading         = ref(false)
const uploadStatus      = ref('')
const uploadErr         = ref('')
const videoTab          = ref('link')
const isDragging        = ref(false)
const selectedFile      = ref(null)
const fileInput         = ref(null)
const quizAnswers        = ref([])
const quizAnswersLoading = ref(false)
const quizResetting      = ref(false)

const videoTabs = [
  { id: 'link',   label: '🔗 ลิงก์'  },
  { id: 'upload', label: '📁 อัปโหลด' },
]

const form = reactive({
  enabled:      false,
  id:           '',
  title:        '',
  video:        '',
  videoEnabled: true,
  desc:         '',
  quizEnabled:   false,
  quizQuestions: [{ id: 'q1', question: '', type: 'single', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }] }],
})

// ── Computed ───────────────────────────────────────────────────────
const embedUrl = computed(() => {
  const url = form.video || ''
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`
  m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`
  return ''
})

const fileSizeMb = computed(() =>
  selectedFile.value ? (selectedFile.value.size / 1024 / 1024).toFixed(1) : '0'
)

// ── Load ───────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const rows = await svc.getAll('Settings')
    if (Array.isArray(rows)) {
      const kv = {}
      rows.forEach(r => { if (r.key) kv[r.key] = String(r.value || '') })
      form.enabled      = kv.ann_enabled?.toUpperCase() === 'TRUE'
      form.id           = kv.ann_id    || ''
      form.title        = kv.ann_title || ''
      form.video        = kv.ann_video || ''
      form.videoEnabled = kv.ann_video_enabled !== 'false'
      form.desc         = kv.ann_desc  || ''
      form.quizEnabled  = kv.ann_quiz_enabled === 'true'
      try {
        const qs = JSON.parse(kv.ann_quiz_questions || '[]')
        if (Array.isArray(qs) && qs.length > 0) form.quizQuestions = qs
      } catch {}
    }
  } catch { /* Settings sheet may not exist yet */ }
  loading.value = false
  if (form.quizEnabled && form.id) loadQuizAnswers()
})

// ── Quiz helpers ───────────────────────────────────────────────────
const OPT_IDS = ['a', 'b', 'c', 'd']

function addQuestion() {
  const used = new Set(form.quizQuestions.map(q => q.id))
  let i = 1
  while (used.has(`q${i}`)) i++
  form.quizQuestions.push({ id: `q${i}`, question: '', type: 'single', options: [{ id: 'a', text: '' }, { id: 'b', text: '' }] })
}
function removeQuestion(qi) {
  if (form.quizQuestions.length <= 1) return
  form.quizQuestions.splice(qi, 1)
}
function addOption(q) {
  if (q.options.length >= 4) return
  q.options.push({ id: OPT_IDS[q.options.length], text: '' })
}
function removeOption(q, idx) {
  if (q.options.length <= 2) return
  q.options.splice(idx, 1)
  q.options.forEach((o, i) => { o.id = OPT_IDS[i] })
}

// ── ID ─────────────────────────────────────────────────────────────
function regenerateId() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  form.id = `ann_${now.getFullYear()}_${pad(now.getMonth()+1)}_${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
}

// ── File ───────────────────────────────────────────────────────────
const MAX_BYTES = 35 * 1024 * 1024

function onFileChange(e) {
  const f = e.target.files?.[0]
  if (f) setFile(f)
}
function onDrop(e) {
  isDragging.value = false
  const f = e.dataTransfer.files?.[0]
  if (!f) return
  if (!f.type.startsWith('video/')) { uploadErr.value = 'กรุณาเลือกไฟล์วิดีโอเท่านั้น'; return }
  setFile(f)
}
function setFile(f) {
  uploadErr.value = ''
  if (f.size > MAX_BYTES) {
    uploadErr.value = `ไฟล์ใหญ่เกินไป (${(f.size/1024/1024).toFixed(1)} MB) — สูงสุด 35 MB`
    return
  }
  selectedFile.value = f
}

// ── Upload ─────────────────────────────────────────────────────────
async function doUpload() {
  if (!selectedFile.value || uploading.value) return
  uploading.value    = true
  uploadErr.value    = ''
  uploadStatus.value = 'กำลังอ่านไฟล์...'
  try {
    const base64 = await fileToBase64(selectedFile.value)
    uploadStatus.value = 'กำลังอัปโหลดสู่ Drive...'
    const result = await svc.uploadAnnouncementVideo(base64, selectedFile.value.name, selectedFile.value.type)
    if (!result?.url) throw new Error('ไม่ได้รับ URL จาก Drive')
    form.video         = result.url
    uploadStatus.value = '✓ อัปโหลดสำเร็จ'
    selectedFile.value = null
    videoTab.value     = 'link'
  } catch (e) {
    uploadErr.value    = e.message || 'อัปโหลดล้มเหลว'
    uploadStatus.value = ''
  } finally {
    uploading.value = false
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Quiz Results ───────────────────────────────────────────────────
async function resetQuiz() {
  if (!form.id || quizResetting.value) return
  if (!confirm(`ล้างคำตอบทั้งหมด ${totalRespondents.value} คนสำหรับ "${form.id}"?\n\nผู้ใช้จะสามารถโหวตใหม่ได้`)) return
  quizResetting.value = true
  try {
    await svc.deleteQuizAnswers(form.id)
    quizAnswers.value = []
  } catch (e) {
    alert('Reset ไม่สำเร็จ: ' + (e.message || e))
  } finally {
    quizResetting.value = false
  }
}

async function loadQuizAnswers() {
  if (!form.id || quizAnswersLoading.value) return
  quizAnswersLoading.value = true
  try {
    quizAnswers.value = await svc.fetchQuizAnswers(form.id)
  } catch { /* silent */ } finally {
    quizAnswersLoading.value = false
  }
}

const respondentMap = computed(() => {
  const map = {}
  quizAnswers.value.forEach(a => {
    if (!map[a.employee_name]) map[a.employee_name] = { name: a.employee_name, answers: {}, createdAt: a.created_at }
    map[a.employee_name].answers[a.question_id] = a.selected
    if (a.created_at > map[a.employee_name].createdAt) map[a.employee_name].createdAt = a.created_at
  })
  return Object.values(map).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})
const totalRespondents = computed(() => new Set(quizAnswers.value.map(a => a.employee_name)).size)

function quizOptCount(qId, optId) {
  return quizAnswers.value.filter(a => a.question_id === qId && (a.selected || []).includes(optId)).length
}
function quizQTotal(qId) {
  return new Set(quizAnswers.value.filter(a => a.question_id === qId).map(a => a.employee_name)).size
}
function optLabel(q, optId) {
  const opt = q.options.find(o => o.id === optId)
  return opt?.text || optId.toUpperCase()
}

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Save ───────────────────────────────────────────────────────────
async function doSave() {
  if (saving.value) return
  saving.value  = true
  saveErr.value = ''
  saveOk.value  = false
  try {
    if (!form.id) regenerateId()
    await svc.saveAnnouncement({
      enabled:      form.enabled ? 'TRUE' : 'FALSE',
      id:           form.id,
      title:        form.title,
      video:        form.video,
      videoEnabled: form.videoEnabled,
      desc:         form.desc,
      quizEnabled:   form.quizEnabled,
      quizQuestions: form.quizQuestions
        .map(q => ({ ...q, options: q.options.filter(o => o.text.trim()) }))
        .filter(q => q.question.trim() && q.options.length >= 2),
    })
    saveOk.value = true
    setTimeout(() => saveOk.value = false, 5000)
    if (form.quizEnabled && form.id) loadQuizAnswers()

    // 1) เขียน cache ใหม่ทันที → popup อ่านจาก localStorage ได้เลยโดยไม่รอ GAS
    const annData = { id: form.id, title: form.title, videoUrl: form.video, desc: form.desc }
    try {
      if (form.enabled && form.id) {
        localStorage.setItem('dsc_ann_data', JSON.stringify(annData))
      } else {
        localStorage.removeItem('dsc_ann_data')
      }
    } catch {}

    // 2) ล้าง "seen" record ของ ID นี้ → popup จะแสดงอีกครั้ง
    try {
      const seen = JSON.parse(localStorage.getItem('dsc_ann_seen') || '{}')
      delete seen[form.id]
      localStorage.setItem('dsc_ann_seen', JSON.stringify(seen))
    } catch {}
  } catch (e) {
    saveErr.value = e.message || 'บันทึกล้มเหลว'
  } finally {
    saving.value = false
  }
}

</script>

<style scoped>
@import './admin.css';

/* ── Toggle switch ── */
.ann-toggle-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.ann-toggle-wrap input { display: none; }
.ann-track {
  width: 42px;
  height: 24px;
  border-radius: 12px;
  background: #D1D5DB;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}
.ann-toggle-wrap input:checked + .ann-track { background: #10B981; }
.ann-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
  transition: transform 0.2s;
}
.ann-toggle-wrap input:checked + .ann-track .ann-thumb { transform: translateX(18px); }

/* ── Quiz editor ── */
.qz-type-opt {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 10px;
  border: 1.5px solid #E5E7EB;
  background: #F9FAFB;
  color: #6B7280;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}
.qz-type-opt.active {
  background: #EEF2FF;
  border-color: #6366F1;
  color: #4338CA;
}
.qz-opt-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #EEF2FF;
  color: #4F46E5;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Question block ── */
.qz-question-block {
  background: #F9FAFB;
  border: 1.5px solid #E5E7EB;
  border-radius: 12px;
  padding: 14px;
}

/* ── Drop zone ── */
.ann-drop-zone {
  border: 2px dashed #D1D5DB;
  border-radius: 12px;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  min-height: 100px;
}
.ann-drop-zone:hover,
.ann-drop-active { border-color: #6366F1; background: #F5F3FF; }
</style>

<template>
  <div>
    <AdminPageHeader title="📢 ประกาศ / Popup" sub="Announcement" />
    <main class="al-main">
      <div class="al-body">

      <div v-if="loading" class="al-loading-skeletons">
        <SkeletonCard height="80px" />
        <SkeletonCard height="80px" />
      </div>

      <template v-else>

        <!-- ── Status ──────────────────────────────────────────── -->
        <div class="al-card">
          <div class="al-card-header">
            <div class="al-card-title">สถานะ Popup</div>
            <label class="ann-toggle-wrap">
              <input type="checkbox" v-model="form.enabled" />
              <span class="ann-track"><span class="ann-thumb"></span></span>
              <span class="text-xs font-bold" :class="form.enabled ? 'text-mint' : 'text-app-light'">
                {{ form.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
              </span>
            </label>
          </div>
          <div
            class="py-2.5 px-4 text-xs border-t"
            :class="form.enabled
              ? 'text-mint bg-green-50 border-green-200'
              : 'text-app-light bg-gray-50 border-gray-100'"
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
          <div class="p-4 flex flex-col gap-3.5">

            <!-- ID -->
            <div>
              <label class="al-form-label">
                Announcement ID
                <span class="text-app-light font-normal normal-case tracking-normal">(เปลี่ยน ID = ผู้ใช้เห็น popup อีกครั้ง)</span>
              </label>
              <div class="flex gap-2 items-center">
                <input v-model="form.id" class="al-form-input flex-1" placeholder="ann_2026_03_13" />
                <button class="al-btn al-btn-edit flex-shrink-0 whitespace-nowrap" @click="regenerateId">🔄 สร้างใหม่</button>
              </div>
            </div>

            <!-- Title -->
            <div>
              <label class="al-form-label">หัวข้อประกาศ</label>
              <input v-model="form.title" class="al-form-input" placeholder="เช่น ประกาศสำคัญจากทีม DS" maxlength="100" />
            </div>

            <!-- Desc -->
            <div>
              <label class="al-form-label">รายละเอียด <span class="text-app-light font-normal normal-case">(ไม่บังคับ)</span></label>
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
              <span class="text-xs font-bold" :class="form.quizEnabled ? 'text-mint' : 'text-app-light'">
                {{ form.quizEnabled ? 'เปิด' : 'ปิด' }}
              </span>
            </label>
          </div>

          <template v-if="form.quizEnabled">
            <div class="p-4 flex flex-col gap-4">

              <!-- Each question block -->
              <div
                v-for="(q, qi) in form.quizQuestions"
                :key="q.id"
                class="qz-question-block"
              >
                <!-- Question header -->
                <div class="flex items-center justify-between mb-2.5">
                  <div class="text-xs font-extrabold text-indigo/80">คำถามที่ {{ qi + 1 }}</div>
                  <button
                    v-if="form.quizQuestions.length > 1"
                    class="al-btn al-btn-delete text-[11px]"
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
                <div class="mt-2.5">
                  <label class="al-form-label">ประเภทคำตอบ</label>
                  <div class="flex gap-2.5 flex-wrap">
                    <label class="qz-type-opt" :class="{ active: q.type === 'single' }">
                      <input type="radio" v-model="q.type" value="single" class="hidden" />
                      ⬤ เลือกได้ 1 ข้อ
                    </label>
                    <label class="qz-type-opt" :class="{ active: q.type === 'multi' }">
                      <input type="radio" v-model="q.type" value="multi" class="hidden" />
                      ☑ เลือกได้หลายข้อ
                    </label>
                  </div>
                </div>

                <!-- Options -->
                <div class="mt-2.5">
                  <label class="al-form-label">ตัวเลือก (2–4 ข้อ)</label>
                  <div class="flex flex-col gap-2">
                    <div
                      v-for="(opt, idx) in q.options"
                      :key="opt.id"
                      class="flex gap-2 items-center"
                    >
                      <div class="qz-opt-num">{{ idx + 1 }}</div>
                      <input
                        v-model="opt.text"
                        class="al-form-input flex-1"
                        :placeholder="`ตัวเลือกที่ ${idx + 1}`"
                        maxlength="100"
                      />
                      <button
                        v-if="q.options.length > 2"
                        class="al-btn al-btn-delete flex-shrink-0"
                        @click="removeOption(q, idx)"
                      >✕</button>
                    </div>
                  </div>
                  <button
                    v-if="q.options.length < 4"
                    class="al-btn al-btn-edit mt-2.5"
                    @click="addOption(q)"
                  >+ เพิ่มตัวเลือก</button>
                </div>
              </div>

              <!-- Add question button -->
              <button
                v-if="form.quizQuestions.length < 5"
                class="al-btn al-btn-edit self-start"
                @click="addQuestion"
              >+ เพิ่มคำถาม</button>

              <!-- Load results button -->
              <div v-if="form.id" class="flex justify-end">
                <button class="al-btn al-btn-edit text-[11px]" @click="loadQuizAnswers" :disabled="quizAnswersLoading">
                  {{ quizAnswersLoading ? '⏳ กำลังโหลด...' : '📊 โหลดผลโหวต' }}
                </button>
              </div>

            </div>
          </template>

          <div
            v-else
            class="py-3 px-4 text-xs text-app-light bg-gray-50 border-t border-gray-100"
          >
            เปิดใช้งานเพื่อเพิ่มคำถามให้ผู้ใช้ร่วมสนุกใน Popup
          </div>
        </div>

        <!-- ── Quiz Results ────────────────────────────────────── -->
        <div v-if="form.quizEnabled && totalRespondents > 0" class="al-card">
          <div class="al-card-header">
            <div class="al-card-title">📊 ผลโหวต</div>
            <div class="flex items-center gap-2">
              <span class="al-badge al-badge-blue">{{ totalRespondents }} คน</span>
              <button class="al-btn al-btn-edit text-[11px]" @click="loadQuizAnswers" :disabled="quizAnswersLoading">↻</button>
              <button class="al-btn al-btn-delete text-[11px]" @click="resetQuiz" :disabled="quizResetting">
                {{ quizResetting ? '...' : '🗑 Reset' }}
              </button>
            </div>
          </div>

          <!-- Per-question aggregate bars -->
          <div
            v-for="(q, qi) in form.quizQuestions"
            :key="q.id"
            class="py-3 px-4 border-b border-gray-100"
          >
            <div class="text-xs font-bold text-gray-700 mb-0.5">{{ qi + 1 }}. {{ q.question || `คำถามที่ ${qi + 1}` }}</div>
            <div class="text-[11px] text-app-light mb-2">{{ quizQTotal(q.id) }} คนตอบ</div>
            <div class="flex flex-col gap-2">
              <div v-for="opt in q.options" :key="opt.id" class="flex items-center gap-2.5">
                <div class="w-[22px] h-[22px] rounded-full bg-indigo/10 text-indigo text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                  {{ opt.id.toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-[11px] font-bold text-gray-700 mb-[3px] overflow-hidden text-ellipsis whitespace-nowrap">{{ opt.text || `ตัวเลือก ${opt.id.toUpperCase()}` }}</div>
                  <div class="h-1.5 bg-gray-100 rounded overflow-hidden">
                    <div class="h-full rounded bg-gradient-to-r from-indigo to-purple transition-[width] duration-[600ms] ease-in-out"
                         :style="{ width: quizQTotal(q.id) ? (quizOptCount(q.id, opt.id) / quizQTotal(q.id) * 100) + '%' : '0%' }"></div>
                  </div>
                </div>
                <div class="text-xs font-extrabold text-indigo flex-shrink-0 min-w-[40px] text-right">
                  {{ quizQTotal(q.id) ? Math.round(quizOptCount(q.id, opt.id) / quizQTotal(q.id) * 100) : 0 }}%
                  <span class="text-[10px] text-app-light font-semibold">({{ quizOptCount(q.id, opt.id) }})</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Respondents list (grouped by employee) -->
          <div class="py-2 max-h-[280px] overflow-y-auto">
            <div
              v-for="r in respondentMap"
              :key="r.name"
              class="flex items-start gap-2.5 py-2 px-4 border-b border-[#F7F7FF]"
            >
              <div class="w-[30px] h-[30px] rounded-full bg-indigo/10 flex items-center justify-center text-sm font-extrabold text-indigo flex-shrink-0 mt-px">
                {{ r.name?.[0] || '?' }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-bold text-gray-900">{{ r.name }}</div>
                <div
                  v-for="(q, qi) in form.quizQuestions"
                  :key="q.id"
                  class="text-[11px] text-gray-500 mt-0.5"
                >
                  <template v-if="r.answers[q.id]?.length">
                    {{ form.quizQuestions.length > 1 ? `Q${qi + 1}: ` : '' }}{{ (r.answers[q.id] || []).map(id => optLabel(q, id)).join(' · ') }}
                  </template>
                </div>
              </div>
              <div class="text-[10px] text-app-light flex-shrink-0">{{ fmtDate(r.createdAt) }}</div>
            </div>
          </div>
        </div>

        <!-- ── สื่อประกอบ ────────────────────────────────────── -->
        <div class="al-card">
          <div class="al-card-header">
            <div class="al-card-title">📎 สื่อประกอบ</div>
            <div class="flex gap-1">
              <button
                v-for="t in mediaTabs" :key="t.id"
                class="al-btn text-xs px-3 py-[5px]"
                :class="mediaType === t.id
                  ? 'bg-indigo/10 text-indigo border-indigo/30'
                  : 'bg-gray-100 text-gray-500 border-gray-200'"
                @click="mediaType = t.id"
              >{{ t.label }}</button>
            </div>
          </div>

          <!-- None -->
          <div
            v-if="mediaType === 'none'"
            class="py-3 px-4 text-xs text-app-light bg-gray-50 border-t border-gray-100"
          >
            ไม่มีสื่อประกอบ — Popup จะแสดงแค่หัวข้อและ Quiz
          </div>

          <!-- Video -->
          <template v-else-if="mediaType === 'video'">
            <div class="pt-1 px-4 flex gap-1 border-t border-gray-100">
              <button
                v-for="t in videoTabs" :key="t.id"
                class="al-btn text-xs px-3 py-[5px] mt-2.5"
                :class="videoTab === t.id
                  ? 'bg-indigo/10 text-indigo border-indigo/30'
                  : 'bg-gray-100 text-gray-500 border-gray-200'"
                @click="videoTab = t.id"
              >{{ t.label }}</button>
            </div>
            <div class="py-3 px-4 pb-4 flex flex-col gap-3.5">

              <!-- Link tab -->
              <template v-if="videoTab === 'link'">
                <div>
                  <label class="al-form-label">URL วิดีโอ</label>
                  <input v-model="form.video" class="al-form-input"
                    placeholder="https://youtu.be/xxxxx หรือ Google Drive link" />
                  <div class="text-[11px] text-app-light mt-1.5">
                    รองรับ YouTube · Google Drive · ลิงก์วิดีโอทั่วไป (MP4 ฯลฯ)
                  </div>
                </div>
              </template>

              <!-- Upload tab -->
              <template v-else>
                <div
                  class="ann-drop-zone"
                  :class="{ 'ann-drop-active': isDragging }"
                  @click="fileInput?.click()"
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop.prevent="onDrop"
                >
                  <input ref="fileInput" type="file" accept="video/*" class="hidden" @change="onFileChange" />
                  <template v-if="!selectedFile">
                    <div class="text-4xl">🎬</div>
                    <div class="text-sm font-bold text-gray-700 mt-2">คลิกหรือลากไฟล์มาวาง</div>
                    <div class="text-[11px] text-app-light mt-1">MP4 · MOV · WebM · สูงสุด 35 MB</div>
                  </template>
                  <template v-else>
                    <div class="text-3xl">🎬</div>
                    <div class="text-sm font-bold text-gray-700 mt-1.5 break-all text-center max-w-full">
                      {{ selectedFile.name }}
                    </div>
                    <div class="text-[11px] text-gray-500 mt-[3px]">{{ fileSizeMb }} MB</div>
                    <div v-if="selectedFile.size > 20 * 1024 * 1024" class="text-[11px] text-amber mt-1">
                      ⚠️ ไฟล์ค่อนข้างใหญ่ แนะนำอัปโหลด YouTube แล้วใช้ลิงก์แทน
                    </div>
                  </template>
                </div>
                <div v-if="uploadErr" class="al-error">{{ uploadErr }}</div>
                <div v-if="uploadStatus" class="text-xs text-gray-500 text-center py-0.5">{{ uploadStatus }}</div>
                <button
                  class="al-btn al-btn-primary w-full"
                  :disabled="!selectedFile || uploading"
                  @click="doUpload"
                >
                  <span v-if="uploading">{{ uploadStatus || 'กำลังอัปโหลด...' }}</span>
                  <span v-else>🚀 อัปโหลดสู่ Google Drive</span>
                </button>
              </template>

              <!-- Video preview -->
              <template v-if="form.video">
                <div class="text-[11px] font-extrabold text-app-light uppercase tracking-[1px]">ตัวอย่าง</div>
                <div class="w-full aspect-video bg-black rounded-[10px] overflow-hidden relative">
                  <iframe
                    v-if="embedUrl"
                    :src="embedUrl"
                    class="absolute inset-0 w-full h-full"
                    frameborder="0" allowfullscreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  ></iframe>
                  <video
                    v-else
                    :src="form.video"
                    class="absolute inset-0 w-full h-full object-contain"
                    controls playsinline
                  ></video>
                </div>
              </template>

            </div>
          </template>

          <!-- Image -->
          <template v-else-if="mediaType === 'image'">
            <div class="pt-1 px-4 flex gap-1 border-t border-gray-100">
              <button
                v-for="t in imageTabs" :key="t.id"
                class="al-btn text-xs px-3 py-[5px] mt-2.5"
                :class="imageTab === t.id
                  ? 'bg-indigo/10 text-indigo border-indigo/30'
                  : 'bg-gray-100 text-gray-500 border-gray-200'"
                @click="imageTab = t.id"
              >{{ t.label }}</button>
            </div>
            <div class="py-3 px-4 pb-4 flex flex-col gap-3.5">

              <!-- Link tab -->
              <template v-if="imageTab === 'link'">
                <div>
                  <label class="al-form-label">URL รูปภาพ</label>
                  <input v-model="form.image" class="al-form-input"
                    placeholder="https://example.com/image.jpg" />
                  <div class="text-[11px] text-app-light mt-1.5">
                    รองรับ JPG · PNG · GIF · WebP · ลิงก์ตรง
                  </div>
                </div>
              </template>

              <!-- Upload tab -->
              <template v-else>
                <div
                  class="ann-drop-zone"
                  :class="{ 'ann-drop-active': isImageDragging }"
                  @click="imageFileInput?.click()"
                  @dragover.prevent="isImageDragging = true"
                  @dragleave.prevent="isImageDragging = false"
                  @drop.prevent="onImageDrop"
                >
                  <input ref="imageFileInput" type="file" accept="image/*" class="hidden" @change="onImageFileChange" />
                  <template v-if="!selectedImageFile">
                    <div class="text-4xl">🖼</div>
                    <div class="text-sm font-bold text-gray-700 mt-2">คลิกหรือลากไฟล์มาวาง</div>
                    <div class="text-[11px] text-app-light mt-1">JPG · PNG · GIF · WebP · สูงสุด 5 MB</div>
                  </template>
                  <template v-else>
                    <div class="text-3xl">🖼</div>
                    <div class="text-sm font-bold text-gray-700 mt-1.5 break-all text-center max-w-full">
                      {{ selectedImageFile.name }}
                    </div>
                    <div class="text-[11px] text-gray-500 mt-[3px]">{{ imageFileSizeMb }} MB</div>
                  </template>
                </div>
                <div v-if="imageUploadErr" class="al-error">{{ imageUploadErr }}</div>
                <div v-if="imageUploadStatus" class="text-xs text-gray-500 text-center py-0.5">{{ imageUploadStatus }}</div>
                <button
                  class="al-btn al-btn-primary w-full"
                  :disabled="!selectedImageFile || imageUploading"
                  @click="doImageUpload"
                >
                  <span v-if="imageUploading">{{ imageUploadStatus || 'กำลังอัปโหลด...' }}</span>
                  <span v-else>🚀 อัปโหลดรูปภาพ</span>
                </button>
              </template>

              <!-- Image preview -->
              <template v-if="form.image">
                <div class="text-[11px] font-extrabold text-app-light uppercase tracking-[1px]">ตัวอย่าง</div>
                <div class="w-full rounded-[10px] overflow-hidden bg-gray-100">
                  <img :src="form.image" class="w-full block max-h-[300px] object-contain" />
                </div>
                <button class="al-btn al-btn-delete self-start text-xs" @click="form.image = ''">
                  🗑 ลบรูปภาพ
                </button>
              </template>

            </div>
          </template>

        </div>

        <!-- ── Save ────────────────────────────────────────────── -->
        <div v-if="saveErr" class="al-error text-center">{{ saveErr }}</div>

        <!-- Success + preview button -->
        <div v-if="saveOk" class="bg-green-50 border border-green-200 rounded-md py-3.5 px-4 flex items-center justify-between gap-2.5 flex-wrap">
          <div class="text-sm font-bold text-mint">✓ บันทึกสำเร็จแล้ว</div>
          <a href="#/" target="_blank"
             class="inline-flex items-center gap-1.5 py-2 px-3.5 bg-gradient-to-br from-indigo to-purple text-white rounded-[10px] text-xs font-bold no-underline">
            🔍 ดูตัวอย่าง Popup
          </a>
        </div>

        <button
          class="al-btn al-btn-save w-full py-3 text-sm"
          :disabled="saving"
          @click="doSave"
        >
          {{ saving ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่า' }}
        </button>

        <!-- Info -->
        <div class="al-info-box text-xs text-indigo/80 leading-loose">
          <div class="font-extrabold mb-1">ℹ️ วิธีทดสอบ</div>
          <ul class="pl-4 m-0">
            <li>กด <strong>บันทึก</strong> แล้วกด <strong>ดูตัวอย่าง Popup</strong> เพื่อเปิดหน้า user ในแท็บใหม่</li>
            <li>Popup แสดงเฉพาะหน้า <strong>user</strong> (ไม่แสดงในหน้า admin)</li>
            <li>ถ้า Popup ไม่ขึ้น ให้ตรวจสอบว่า <strong>เปิดใช้งาน</strong> อยู่และ login ด้วย user account ด้วย</li>
          </ul>
        </div>

      </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import * as svc from '../../core/services/adminService.js'
import AdminPageHeader from './AdminPageHeader.vue'
import SkeletonCard from '../../shared/components/SkeletonCard.vue'

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
const imageTab          = ref('link')
const isImageDragging   = ref(false)
const selectedImageFile = ref(null)
const imageFileInput    = ref(null)
const imageUploading    = ref(false)
const imageUploadStatus = ref('')
const imageUploadErr    = ref('')
const quizAnswers        = ref([])
const quizAnswersLoading = ref(false)
const quizResetting      = ref(false)

const mediaTabs = [
  { id: 'none',  label: 'ปิด'       },
  { id: 'video', label: '🎬 วิดีโอ'  },
  { id: 'image', label: '🖼 รูปภาพ'  },
]
const videoTabs = [
  { id: 'link',   label: '🔗 ลิงก์'  },
  { id: 'upload', label: '📁 อัปโหลด' },
]
const imageTabs = [
  { id: 'link',   label: '🔗 ลิงก์'  },
  { id: 'upload', label: '📁 อัปโหลด' },
]

const form = reactive({
  enabled:      false,
  id:           '',
  title:        '',
  video:        '',
  videoEnabled: true,
  image:        '',
  imageEnabled: true,
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
const imageFileSizeMb = computed(() =>
  selectedImageFile.value ? (selectedImageFile.value.size / 1024 / 1024).toFixed(1) : '0'
)

// ── Media type (video | image | none) — mutually exclusive ─────────
const mediaType = computed({
  get() {
    if (form.videoEnabled) return 'video'
    if (form.imageEnabled) return 'image'
    return 'none'
  },
  set(val) {
    form.videoEnabled = val === 'video'
    form.imageEnabled = val === 'image'
  },
})

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
      form.image        = kv.ann_image || ''
      form.imageEnabled = kv.ann_image_enabled !== 'false'
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

// ── Image file ─────────────────────────────────────────────────────
const IMG_MAX_BYTES = 5 * 1024 * 1024

function onImageFileChange(e) {
  const f = e.target.files?.[0]
  if (f) setImageFile(f)
}
function onImageDrop(e) {
  isImageDragging.value = false
  const f = e.dataTransfer.files?.[0]
  if (!f) return
  if (!f.type.startsWith('image/')) { imageUploadErr.value = 'กรุณาเลือกไฟล์รูปภาพเท่านั้น'; return }
  setImageFile(f)
}
function setImageFile(f) {
  imageUploadErr.value = ''
  if (f.size > IMG_MAX_BYTES) {
    imageUploadErr.value = `ไฟล์ใหญ่เกินไป (${(f.size/1024/1024).toFixed(1)} MB) — สูงสุด 5 MB`
    return
  }
  selectedImageFile.value = f
}

// ── Image upload ────────────────────────────────────────────────────
async function doImageUpload() {
  if (!selectedImageFile.value || imageUploading.value) return
  imageUploading.value    = true
  imageUploadErr.value    = ''
  imageUploadStatus.value = 'กำลังอ่านไฟล์...'
  try {
    const base64 = await fileToBase64(selectedImageFile.value)
    imageUploadStatus.value = 'กำลังอัปโหลด...'
    const result = await svc.uploadAnnouncementImage(base64, selectedImageFile.value.name)
    if (!result?.url) throw new Error('ไม่ได้รับ URL')
    form.image              = result.url
    imageUploadStatus.value = '✓ อัปโหลดสำเร็จ'
    selectedImageFile.value = null
    imageTab.value          = 'link'
  } catch (e) {
    imageUploadErr.value    = e.message || 'อัปโหลดล้มเหลว'
    imageUploadStatus.value = ''
  } finally {
    imageUploading.value = false
  }
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
      image:        form.image,
      imageEnabled: form.imageEnabled,
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
    const annData = { id: form.id, title: form.title, videoUrl: form.video, videoEnabled: form.videoEnabled, imageUrl: form.image, imageEnabled: form.imageEnabled, desc: form.desc }
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

#!/usr/bin/env node
// migrate-from-sheets.js — One-time data migration: Google Sheets → Supabase
//
// ── Setup ────────────────────────────────────────────────────────────────────
// 1. npm install googleapis @supabase/supabase-js dotenv
//    (run inside this scripts/ folder, or at repo root)
//
// 2. Google service account:
//    - Google Cloud Console → IAM → Service Accounts → Create
//    - Download JSON key → save as  scripts/service-account.json
//    - Share your Spreadsheet with the service account email (Viewer)
//
// 3. Create  scripts/.env  (copy from .env.example):
//    SUPABASE_URL=https://xxxx.supabase.co
//    SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   ← service_role key (NOT anon)
//    SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
//
// 4. node scripts/migrate-from-sheets.js
// ─────────────────────────────────────────────────────────────────────────────

import { google }        from 'googleapis'
import { createClient }  from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load .env if present (optional — you can also set env vars externally)
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '.env')
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  }
}

// Validated at runtime inside main()
let supabase, sheets, SPREADSHEET_ID

// ── Helpers ───────────────────────────────────────────────────────────────────

async function readSheet(name) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: name,
  })
  const rows = res.data.values || []
  if (rows.length < 2) return []
  const headers = rows[0]
  return rows.slice(1)
    .filter(row => row.some(v => v !== '' && v != null))
    .map(row => {
      const obj = {}
      headers.forEach((h, i) => { obj[h] = row[i] ?? '' })
      return obj
    })
}

async function batchInsert(table, rows, batchSize = 200) {
  if (!rows.length) { console.log(`  ${table}: (empty)`); return 0 }
  let n = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const { error } = await supabase.from(table).insert(rows.slice(i, i + batchSize))
    if (error) console.error(`  ⚠  ${table} batch ${Math.floor(i / batchSize)}: ${error.message}`)
    else n += Math.min(batchSize, rows.length - i)
  }
  console.log(`  ✓  ${table}: ${n} rows`)
  return n
}

const str = v => (v == null || v === '') ? null : String(v).trim()
const num = v => { const n = Number(v); return isNaN(n) ? null : n }
const bool = v => String(v).toLowerCase() === 'true'

// ══════════════════════════════════════════════════════════════════════════════
// Migration steps — run in FK-dependency order
// ══════════════════════════════════════════════════════════════════════════════

async function migrateSettings() {
  console.log('\n── Settings')
  const rows = await readSheet('Settings')
  await batchInsert('settings', rows.map(r => ({
    key:   str(r.key),
    value: str(r.value),
  })))
}

async function migrateEmployees() {
  console.log('\n── Employees')
  const rows = await readSheet('Employees')
  await batchInsert('employees', rows.map(r => ({
    id:               str(r.id),
    emp_code:         str(r.empCode),
    name:             str(r.name),
    role:             str(r.role),
    dept:             str(r.dept),
    img_url:          str(r.imgUrl),
    img_id:           str(r.imgId),
    grad:             str(r.grad),
    in_team:          bool(r.inTeam),
    in_star_gang:     bool(r.inStarGang),
    star_gang_name:   str(r.starGangName),
    star_gang_role:   str(r.starGangRole),
    star_gang_slogan: str(r.starGangSlogan),
    month_idx:        num(r.monthIdx),
    bd_date:          str(r.bdDate),
    fallback_idx:     num(r.fallbackIdx),
  })))
}

async function migrateBirthdayWishes() {
  console.log('\n── BirthdayWishes')
  const rows = await readSheet('BirthdayWishes')
  await batchInsert('birthday_wishes', rows.map(r => ({
    id:           str(r.id),
    birthday_key: str(r.birthdayKey),
    from_name:    str(r.fromName),
    from_av_idx:  num(r.fromAvIdx),
    msg:          str(r.msg),
    time:         str(r.time),
    year:         num(r.year),
    from_img_id:  str(r.fromImgId),
  })))
}

async function migrateEmpathy() {
  console.log('\n── EmpathyComments')
  const rows = await readSheet('EmpathyComments')
  await batchInsert('empathy_comments', rows.map(r => ({
    id:          str(r.id),
    post_id:     str(r.postId),
    parent_id:   str(r.parentId) || null,
    author_name: str(r.authorName),
    text:        str(r.text),
    created_at:  str(r.createdAt) || undefined,
  })))

  console.log('\n── EmpathyLikes')
  await batchInsert('empathy_likes',
    (await readSheet('EmpathyLikes')).map(r => ({
      post_id:  str(r.postId),
      user_key: str(r.userKey),
    }))
  )

  console.log('\n── CommentLikes')
  await batchInsert('comment_likes',
    (await readSheet('CommentLikes')).map(r => ({
      comment_id: str(r.commentId),
      user_key:   str(r.userKey),
    }))
  )

  console.log('\n── ChannelLikes')
  await batchInsert('channel_likes',
    (await readSheet('ChannelLikes')).map(r => ({
      channel_id: str(r.channelId),
      user_key:   str(r.userKey),
    }))
  )

  console.log('\n── EmpathyPhotos')
  // EmpathyPhotos uses empCode — look up employee.id from employees already migrated
  const photos = await readSheet('EmpathyPhotos')
  const { data: emps } = await supabase.from('employees').select('id, emp_code')
  const codeToId = Object.fromEntries((emps || []).map(e => [e.emp_code, e.id]))
  await batchInsert('empathy_photos',
    photos
      .map(r => ({
        employee_id: codeToId[r.empCode] ?? str(r.empCode),
        img_url:     str(r.imgUrl),
        updated_at:  str(r.updatedAt) || undefined,
      }))
      .filter(r => r.employee_id)
  )
}

async function migrateIdeas() {
  console.log('\n── Ideas')
  const rows = await readSheet('Ideas')
  await batchInsert('ideas', rows.map(r => ({
    id:             str(r.id),
    category:       str(r.category),
    title:          str(r.title),
    detail:         str(r.detail),
    submitter_name: str(r.submitterName),
    created_at:     str(r.createdAt) || undefined,
    status:         str(r.status) || 'pending',
  })))
}

async function migrateActivities() {
  console.log('\n── Activities')
  const rows = await readSheet('Activities')
  await batchInsert('activities', rows.map(r => ({
    id:            str(r.id),
    month_idx:     num(r.monthIdx),
    name:          str(r.name),
    emoji:         str(r.emoji),
    date:          str(r.date),
    date_end:      str(r.dateEnd),
    loc:           str(r.loc),
    desc:          str(r.desc),
    steps:         str(r.steps),
    join_url:      str(r.joinUrl),
    join_open:     r.joinOpen !== '' ? bool(r.joinOpen) : true,
    join_label:    str(r.joinLabel),
    join_open_at:  str(r.joinOpenAt),
    join_close_at: str(r.joinCloseAt),
    feedback_url:  str(r.feedbackUrl),
    img_url:       str(r.imgUrl),
    img_id:        str(r.imgId),
    created_at:    str(r.createdAt) || undefined,
  })))

  console.log('\n── ActivityJoins')
  await batchInsert('activity_joins',
    (await readSheet('ActivityJoins')).map(r => ({
      id:             str(r.id),
      activity_id:    str(r.activityId),
      activity_name:  str(r.activityName),
      employee_name:  str(r.employeeName),
      stamped_at:     str(r.stampedAt) || undefined,
      reward_claimed: bool(r.rewardClaimed),
      reward_type:    str(r.rewardType),
    }))
  )
}

async function migrateTrainings() {
  const PAIRS = [
    ['AnnualTrainings',      'annual_trainings'],
    ['IdpTrainings',         'idp_trainings'],
    ['ExternalTrainings',    'external_trainings'],
    ['CompulsoryTrainings',  'compulsory_trainings'],
    ['SuperskillsTrainings', 'superskills_trainings'],
    ['LeadershipTrainings',  'leadership_trainings'],
  ]
  for (const [sheet, table] of PAIRS) {
    console.log(`\n── ${sheet}`)
    await batchInsert(table,
      (await readSheet(sheet)).map(r => ({
        id:          str(r.id),
        title:       str(r.title),
        description: str(r.description),
        instructor:  str(r.instructor),
        section:     str(r.section),
        created_at:  str(r.createdAt) || undefined,
      }))
    )
  }

  console.log('\n── TrainingRegistrations')
  await batchInsert('training_registrations',
    (await readSheet('TrainingRegistrations')).map(r => ({
      id:            str(r.id),
      training_id:   str(r.trainingId),
      employee_id:   str(r.employeeId),
      employee_name: str(r.employeeName),
      registered_at: str(r.registeredAt) || undefined,
    }))
  )

  console.log('\n── TrainingReviews')
  await batchInsert('training_reviews',
    (await readSheet('TrainingReviews')).map(r => ({
      id:            str(r.id),
      training_id:   str(r.trainingId),
      employee_id:   str(r.employeeId),
      employee_name: str(r.employeeName),
      stars:         num(r.stars),
      comment:       str(r.comment),
      created_at:    str(r.createdAt) || undefined,
    }))
  )
}

async function migrateIdp() {
  console.log('\n── IdpPosters')
  await batchInsert('idp_posters',
    (await readSheet('IdpPosters')).map(r => ({
      id:          str(r.id),
      title:       str(r.title),
      image_url:   str(r.imageUrl),
      description: str(r.description),
      date:        str(r.date),
      created_at:  str(r.createdAt) || undefined,
    }))
  )

  console.log('\n── IdpVideos')
  await batchInsert('idp_videos',
    (await readSheet('IdpVideos')).map(r => ({
      id:          str(r.id),
      title:       str(r.title),
      video_url:   str(r.videoUrl),
      description: str(r.description),
      created_at:  str(r.createdAt) || undefined,
    }))
  )
}

async function migrateSiteVisits() {
  console.log('\n── SiteVisits')
  await batchInsert('site_visits',
    (await readSheet('SiteVisits')).map(r => ({
      id:          str(r.id),
      title:       str(r.title),
      description: str(r.description),
      instructor:  str(r.instructor),
      color:       str(r.color),
      created_at:  str(r.createdAt) || undefined,
    }))
  )

  console.log('\n── SiteVotes')
  await batchInsert('site_votes',
    (await readSheet('SiteVotes')).map(r => ({
      id:            str(r.id),
      site_id:       str(r.siteId),
      employee_id:   str(r.employeeId),
      employee_name: str(r.employeeName),
      voted_at:      str(r.votedAt) || undefined,
    }))
  )
}

async function migratePoints() {
  console.log('\n── PointRules')
  await batchInsert('point_rules',
    (await readSheet('PointRules')).map(r => ({
      id:      str(r.id),
      type:    str(r.type),
      subtype: str(r.subtype),
      icon:    str(r.icon),
      name:    str(r.name),
      desc:    str(r.desc),
      pts:     num(r.pts),
      color:   str(r.color),
      active:  r.active !== '' ? bool(r.active) : true,
    }))
  )

  console.log('\n── Points')
  await batchInsert('points',
    (await readSheet('Points')).map(r => ({
      id:            str(r.id),
      employee_name: str(r.employeeName),
      type:          str(r.type),
      subtype:       str(r.subtype),
      amount:        num(r.amount),
      desc:          str(r.desc),
      created_at:    str(r.createdAt) || undefined,
    }))
  )
}

async function migrateBlogPosts() {
  console.log('\n── BlogPosts')
  await batchInsert('blog_posts',
    (await readSheet('BlogPosts')).map(r => ({
      id:          str(r.id),
      title:       str(r.title),
      body:        str(r.body),
      category:    str(r.category),
      author_name: str(r.authorName),
      author_id:   str(r.authorId),
      created_at:  str(r.createdAt) || undefined,
    }))
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Main
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  // ── Validate config ────────────────────────────────────────────────────────
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
  SPREADSHEET_ID     = process.env.SPREADSHEET_ID
  const SA_PATH        = join(__dirname, 'service-account.json')

  if (!SUPABASE_URL || !SERVICE_KEY || !SPREADSHEET_ID) {
    console.error('❌  Missing env vars — create scripts/.env from scripts/.env.example')
    process.exit(1)
  }
  if (!existsSync(SA_PATH)) {
    console.error('❌  scripts/service-account.json not found')
    console.error('    1. Go to Google Cloud Console → IAM → Service Accounts → Create')
    console.error('    2. Download JSON key → save as  scripts/service-account.json')
    console.error('    3. Share your Spreadsheet with the service account email (Viewer)')
    process.exit(1)
  }

  // ── Init clients ───────────────────────────────────────────────────────────
  supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf8'))
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  sheets = google.sheets({ version: 'v4', auth })

  console.log('🚀  DS Community Care — Google Sheets → Supabase migration')
  console.log(`    Supabase : ${SUPABASE_URL}`)
  console.log(`    Sheet ID : ${SPREADSHEET_ID}`)

  await migrateSettings()
  await migrateEmployees()
  await migrateBirthdayWishes()
  await migrateEmpathy()
  await migrateIdeas()
  await migrateActivities()
  await migrateTrainings()
  await migrateIdp()
  await migrateSiteVisits()
  await migratePoints()
  await migrateBlogPosts()

  console.log('\n✅  Migration complete!\n')
  console.log('Next steps:')
  console.log('  1. Check row counts in Supabase Studio → Table Editor')
  console.log('  2. Create admin user in Supabase Dashboard → Authentication → Users')
  console.log('     Set user_metadata: { "role": "admin", "name": "DS Admin" }')
  console.log('  3. Fill in app/.env with real VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY')
  console.log('  4. npm run dev in app/ and test all flows')
  console.log('  5. Deploy Edge Functions: supabase functions deploy')
}

main().catch(err => {
  console.error('\n💥  Fatal error:', err.message)
  process.exit(1)
})

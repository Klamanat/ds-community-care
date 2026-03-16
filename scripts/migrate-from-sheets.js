#!/usr/bin/env node
// migrate-from-sheets.js — One-time data migration: Google Sheets → Supabase
//
// ── Setup ────────────────────────────────────────────────────────────────────
// 1. npm install @supabase/supabase-js dotenv
//    (run inside scripts/ folder)
//
// 2. Share your Spreadsheet:
//    - Click Share → Change to "Anyone with the link" → Viewer
//
// 3. Create scripts/.env:
//    SUPABASE_URL=https://xxxx.supabase.co
//    SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
//    SPREADSHEET_ID=1zH6oOEJyakWJBv0AzHo9vX4XWkSsNRFv1YSMU28apvU
//
// 4. node migrate-from-sheets.js
// ─────────────────────────────────────────────────────────────────────────────

import { createClient }  from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv             from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

const SUPABASE_URL   = process.env.SUPABASE_URL
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY
const SPREADSHEET_ID = process.env.SPREADSHEET_ID

if (!SUPABASE_URL || !SERVICE_KEY || !SPREADSHEET_ID) {
  console.error('❌  Missing env vars — need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SPREADSHEET_ID')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// ── Read sheet via CSV export (no API key needed — spreadsheet must be public) ─

async function readSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`  ⚠  ${sheetName}: HTTP ${res.status}`)
    return []
  }
  const text = await res.text()
  if (text.trimStart().startsWith('<')) {
    console.warn(`  ⚠  ${sheetName}: Google returned HTML — sheet name may not match or spreadsheet is not public`)
    return []
  }
  const rows = parseCSV(text)
  if (rows.length < 2) {
    console.warn(`  ⚠  ${sheetName}: only ${rows.length} row(s) — empty sheet?`)
    return []
  }
  const headers = rows[0]
  return rows.slice(1)
    .filter(row => row.some(v => v !== ''))
    .map(row => {
      const obj = {}
      headers.forEach((h, i) => { obj[h] = row[i] ?? '' })
      return obj
    })
}

function parseCSV(text) {
  const rows = []
  let row = [], cell = '', inQuote = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuote) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') inQuote = false
      else cell += ch
    } else {
      if (ch === '"') inQuote = true
      else if (ch === ',') { row.push(cell); cell = '' }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
      else if (ch === '\r') {}
      else cell += ch
    }
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

// ── Batch upsert ──────────────────────────────────────────────────────────────

const NO_ID_TABLES  = new Set(['empathy_likes','comment_likes','channel_likes','site_votes','empathy_photos'])
const KEY_PK_TABLES = new Set(['settings'])  // tables whose PK is 'key', not 'id'

async function batchInsert(table, rows, batchSize = 200) {
  if (!rows.length) { console.log(`  ${table}: (empty)`); return 0 }
  let n = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    let q
    if (NO_ID_TABLES.has(table))    q = supabase.from(table).upsert(batch, { ignoreDuplicates: true })
    else if (KEY_PK_TABLES.has(table)) q = supabase.from(table).upsert(batch, { onConflict: 'key' })
    else                            q = supabase.from(table).upsert(batch, { onConflict: 'id' })
    const { error } = await q
    if (error) console.error(`  ⚠  ${table}: ${error.message}`)
    else n += batch.length
  }
  console.log(`  ✓  ${table}: ${n} rows`)
  return n
}

const str  = v => (v == null || v === '') ? null : String(v).trim()
const num  = v => { const n = Number(v); return isNaN(n) ? null : n }
const bool = v => String(v).toLowerCase() === 'true'
const ts   = v => {
  if (!v) return null
  const s = String(v).trim()
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : s
}

// ══════════════════════════════════════════════════════════════════════════════
// Migration steps
// ══════════════════════════════════════════════════════════════════════════════

async function migrateSettings() {
  console.log('\n── Settings')
  await batchInsert('settings',
    (await readSheet('Settings')).map(r => ({ key: str(r.key), value: str(r.value) }))
  )
}

async function migrateEmployees() {
  console.log('\n── Employees')
  await batchInsert('employees',
    (await readSheet('Employees')).map(r => ({
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
    }))
  )
}

async function migrateBirthdayWishes() {
  console.log('\n── BirthdayWishes')
  await batchInsert('birthday_wishes',
    (await readSheet('BirthdayWishes')).map(r => ({
      id:           str(r.id),
      birthday_key: str(r.birthdayKey),
      from_name:    str(r.fromName),
      from_av_idx:  num(r.fromAvIdx),
      msg:          str(r.msg),
      time:         str(r.time),
      year:         num(r.year),
      from_img_id:  str(r.fromImgId),
    }))
  )
}

async function migrateEmpathy() {
  console.log('\n── EmpathyComments')
  await batchInsert('empathy_comments',
    (await readSheet('EmpathyComments'))
      .filter(r => r.postId && String(r.postId).trim() !== '')
      .map(r => ({
        id:          str(r.id),
        post_id:     str(r.postId),
        parent_id:   str(r.parentId) || null,
        author_name: str(r.authorName),
        text:        str(r.text),
        created_at:  ts(r.createdAt),
      }))
  )

  console.log('\n── EmpathyLikes')
  await batchInsert('empathy_likes',
    (await readSheet('EmpathyLikes')).map(r => ({ post_id: str(r.postId), user_key: str(r.userKey) }))
  )

  console.log('\n── CommentLikes')
  await batchInsert('comment_likes',
    (await readSheet('CommentLikes')).map(r => ({ comment_id: str(r.commentId), user_key: str(r.userKey) }))
  )

  console.log('\n── ChannelLikes')
  await batchInsert('channel_likes',
    (await readSheet('ChannelLikes')).map(r => ({ channel_id: str(r.channelId), user_key: str(r.userKey) }))
  )

  console.log('\n── EmpathyPhotos')
  const photos = await readSheet('EmpathyPhotos')
  const { data: emps } = await supabase.from('employees').select('id, emp_code')
  const codeToId = Object.fromEntries((emps || []).map(e => [e.emp_code, e.id]))
  await batchInsert('empathy_photos',
    photos.map(r => ({
      employee_id: codeToId[r.empCode] ?? str(r.empCode),
      img_url:     str(r.imgUrl),
      updated_at:  ts(r.updatedAt),
    })).filter(r => r.employee_id)
  )
}

async function migrateIdeas() {
  console.log('\n── Ideas')
  await batchInsert('ideas',
    (await readSheet('Ideas')).map(r => ({
      id:             str(r.id),
      category:       str(r.category),
      title:          str(r.title),
      detail:         str(r.detail),
      submitter_name: str(r.submitterName),
      created_at:     ts(r.createdAt),
      status:         str(r.status) || 'pending',
    }))
  )
}

async function migrateActivities() {
  console.log('\n── Activities')
  await batchInsert('activities',
    (await readSheet('Activities')).map(r => ({
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
      created_at:    ts(r.createdAt),
    }))
  )

  console.log('\n── ActivityJoins')
  await batchInsert('activity_joins',
    (await readSheet('ActivityJoins')).map(r => ({
      id:             str(r.id),
      activity_id:    str(r.activityId),
      activity_name:  str(r.activityName),
      employee_name:  str(r.employeeName),
      stamped_at:     ts(r.stampedAt),
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
        created_at:  ts(r.createdAt),
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
      registered_at: ts(r.registeredAt),
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
      created_at:    ts(r.createdAt),
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
      created_at:  ts(r.createdAt),
    }))
  )

  console.log('\n── IdpVideos')
  await batchInsert('idp_videos',
    (await readSheet('IdpVideos')).map(r => ({
      id:          str(r.id),
      title:       str(r.title),
      video_url:   str(r.videoUrl),
      description: str(r.description),
      created_at:  ts(r.createdAt),
    }))
  )
}

// Read a sheet where the first row has "fieldname value" cells (header+data merged)
async function readSheetInlineHeaders(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
  const res = await fetch(url)
  const text = await res.text()
  if (text.trimStart().startsWith('<')) { console.warn(`  ⚠  ${sheetName}: HTML response`); return [] }
  const allRows = parseCSV(text)
  if (!allRows.length) return []
  // Extract column names (first word of each header cell)
  const headers = allRows[0].map(h => h.split(' ')[0])
  // Reconstruct first data row from the value portion of each header cell
  const firstData = Object.fromEntries(headers.map((h, i) => {
    const raw = allRows[0][i]
    const spaceIdx = raw.indexOf(' ')
    return [h, spaceIdx >= 0 ? raw.slice(spaceIdx + 1) : '']
  }))
  const rest = allRows.slice(1)
    .filter(row => row.some(v => v !== ''))
    .map(row => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])))
  return [firstData, ...rest]
}

async function migrateSiteVisits() {
  console.log('\n── SiteVisits')
  await batchInsert('site_visits',
    (await readSheetInlineHeaders('SiteVisits')).map(r => ({
      id:          str(r.id),
      title:       str(r.title),
      description: str(r.description),
      instructor:  str(r.instructor),
      color:       str(r.color),
      created_at:  ts(r.createdAt),
    }))
  )

  console.log('\n── SiteVotes')
  await batchInsert('site_votes',
    (await readSheet('SiteVotes')).map(r => ({
      id:            str(r.id),
      site_id:       str(r.siteId),
      employee_id:   str(r.employeeId),
      employee_name: str(r.employeeName),
      voted_at:      ts(r.votedAt),
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
      created_at:    ts(r.createdAt),
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
      created_at:  ts(r.createdAt),
    }))
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Main
// ══════════════════════════════════════════════════════════════════════════════

async function checkSheets() {
  const expected = [
    'Settings','Employees','BirthdayWishes',
    'EmpathyComments','EmpathyLikes','CommentLikes','ChannelLikes','EmpathyPhotos',
    'Ideas','Activities','ActivityJoins',
    'AnnualTrainings','IdpTrainings','ExternalTrainings',
    'CompulsoryTrainings','SuperskillsTrainings','LeadershipTrainings',
    'TrainingRegistrations','TrainingReviews',
    'IdpPosters','IdpVideos','SiteVisits','SiteVotes',
    'PointRules','Points','BlogPosts',
  ]
  console.log('\n── Sheet check ──────────────────────────────────────')
  for (const name of expected) {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`
    const r = await fetch(url)
    const t = await r.text()
    if (t.trimStart().startsWith('<')) {
      console.log(`  ✗  ${name} — NOT FOUND`)
    } else {
      const rowCount = t.split('\n').filter(Boolean).length - 1
      console.log(`  ✓  ${name} — ${rowCount} rows`)
    }
  }
  console.log('─────────────────────────────────────────────────────')
}

async function main() {
  console.log('🚀  DS Community Care — Google Sheets → Supabase migration')
  console.log(`    Supabase : ${SUPABASE_URL}`)
  console.log(`    Sheet ID : ${SPREADSHEET_ID}`)

  await checkSheets()

  const args = process.argv.slice(2)
  if (args.includes('--check-only')) { console.log('\nRun without --check-only to start migration.'); process.exit(0) }

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

  console.log('\n✅  Migration complete!')
}

main().catch(err => {
  console.error('\n💥  Fatal error:', err.message)
  process.exit(1)
})

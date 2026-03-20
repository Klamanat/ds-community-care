// announcementService.js — Announcement via Supabase

import { supabase } from './supabase.js'

const ALL_KEYS = [
  'ann_enabled', 'ann_id', 'ann_title', 'ann_video', 'ann_video_enabled', 'ann_desc',
  'ann_quiz_enabled', 'ann_quiz_questions',
]

export async function fetchAnnouncement() {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ALL_KEYS)
  if (error || !data?.length) return null

  const kv = Object.fromEntries(data.map(r => [r.key, r.value]))
  if (kv.ann_enabled !== 'true') return null

  let quiz = null
  if (kv.ann_quiz_enabled === 'true') {
    let questions = []
    try { questions = JSON.parse(kv.ann_quiz_questions || '[]') } catch {}
    const valid = questions.filter(q => q.id && q.question && Array.isArray(q.options) && q.options.length >= 2)
    if (valid.length) quiz = valid
  }

  return {
    id:           kv.ann_id    || '',
    title:        kv.ann_title || '',
    videoUrl:     kv.ann_video || '',
    videoEnabled: kv.ann_video_enabled !== 'false',
    desc:         kv.ann_desc  || '',
    quiz,
  }
}

// Submit answer for one question
export async function submitQuizAnswer(annId, employeeName, questionId, selected) {
  const { error } = await supabase.from('quiz_answers').upsert(
    { ann_id: annId, employee_name: employeeName, question_id: questionId, selected },
    { onConflict: 'ann_id,employee_name,question_id' }
  )
  if (error) throw new Error(error.message)
}

// Get aggregate result counts for one question
export async function fetchQuizResults(annId, questionId) {
  const { data, error } = await supabase
    .from('quiz_answers')
    .select('selected')
    .eq('ann_id', annId)
    .eq('question_id', questionId)
  if (error || !data) return { counts: {}, total: 0 }

  const counts = {}
  data.forEach(r => {
    ;(r.selected || []).forEach(opt => { counts[opt] = (counts[opt] || 0) + 1 })
  })
  return { counts, total: data.length }
}

// Get current user's existing answer for one question (null if not answered)
export async function getMyQuizAnswer(annId, employeeName, questionId) {
  if (!annId || !employeeName || !questionId) return null
  const { data } = await supabase
    .from('quiz_answers')
    .select('selected')
    .eq('ann_id', annId)
    .eq('employee_name', employeeName)
    .eq('question_id', questionId)
    .maybeSingle()
  return data?.selected || null
}

// birthdayService.js — Birthday system via Supabase

import { supabase } from './supabase.js'
import { uploadImage } from './edgeFunctions.js'
import { fetchImages, getCached } from './imageService.js'

export async function fetchMonth(monthIdx) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, emp_code, name, role, img_url, img_id, month_idx, bd_date, fallback_idx')
    .eq('month_idx', monthIdx)
    .not('bd_date', 'is', null)
    .order('bd_date', { ascending: true })
  if (error) throw new Error(error.message)

  const people = (data || []).map(e => {
    const imgId = e.img_id || (e.img_url?.startsWith('drive:') ? e.img_url.slice(6) : '')
    return {
      key:         `bday_${e.id}`,
      employeeId:  e.id,
      empCode:     e.emp_code || '',
      name:        e.name,
      role:        e.role || '',
      date:        e.bd_date || '',
      monthIdx:    e.month_idx,
      fallbackIdx: Number(e.fallback_idx) || 0,
      photo:       (e.img_url?.startsWith('http') ? e.img_url : '') || getCached(imgId) || '',
      imgId,
      wishes:      [],
    }
  })

  // Fetch wish counts for all people this month in one query (awaited so count is ready on first render)
  if (people.length) {
    const keys = people.map(p => p.key)
    const { data: wdata } = await supabase
      .from('birthday_wishes')
      .select('birthday_key')
      .in('birthday_key', keys)
    if (wdata?.length) {
      const countMap = {}
      wdata.forEach(w => { countMap[w.birthday_key] = (countMap[w.birthday_key] || 0) + 1 })
      people.forEach(p => {
        const n = countMap[p.key] || 0
        if (n > 0) p.wishes = Array.from({ length: n }, () => ({}))
      })
    }
  }

  const ids = [...new Set(people.map(p => p.imgId).filter(Boolean))]
  if (ids.length) fetchImages(ids).then(map => {
    people.forEach(p => { if (p.imgId && map[p.imgId]) p.photo = map[p.imgId] })
  }).catch(() => {})

  return people
}

export async function fetchWishes(birthdayKey) {
  const { data, error } = await supabase
    .from('birthday_wishes')
    .select('*')
    .eq('birthday_key', birthdayKey)
    .order('time', { ascending: false })
  if (error) throw new Error(error.message)

  const wishes = (data || []).map(w => ({
    id:        w.id,
    from:      w.from_name,
    avIdx:     w.from_av_idx,
    fromImgId: w.from_img_id || '',
    photo:     getCached(w.from_img_id) || '',
    msg:       w.msg,
    time:      w.time,
  }))

  const ids = [...new Set(wishes.map(w => w.fromImgId).filter(Boolean))]
  if (ids.length) {
    const map = await fetchImages(ids).catch(() => ({}))
    wishes.forEach(w => { if (w.fromImgId && map[w.fromImgId]) w.photo = map[w.fromImgId] })
  }
  return wishes
}

export async function deleteWish(id, fromName = null) {
  let q = supabase.from('birthday_wishes').delete().eq('id', id)
  if (fromName) q = q.eq('from_name', fromName)
  const { error } = await q
  if (error) throw new Error(error.message)
}

export async function updateWish(id, msg) {
  const { error } = await supabase.from('birthday_wishes').update({ msg }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function uploadPhoto(birthdayKey, imageBase64) {
  return uploadImage(imageBase64, `birthday_${birthdayKey}_${Date.now()}.jpg`, 'profiles')
}

export async function fetchEmployeeProfile(empCode) {
  const { data } = await supabase
    .from('employees')
    .select('id, emp_code, name, role, img_url, img_id, fallback_idx')
    .eq('emp_code', empCode)
    .maybeSingle()
  if (!data) return null
  const imgId = data.img_id || (data.img_url?.startsWith('drive:') ? data.img_url.slice(6) : '')
  const photo = (data.img_url?.startsWith('http') ? data.img_url : '') || getCached(imgId) || ''
  const ids = imgId ? [imgId] : []
  if (ids.length) fetchImages(ids).then(map => {
    if (map[imgId]) data._photo = map[imgId]
  }).catch(() => {})
  return {
    employeeId:  data.id,
    empCode:     data.emp_code || '',
    name:        data.name || '',
    role:        data.role || '',
    fallbackIdx: Number(data.fallback_idx) || 0,
    photo,
    imgId,
  }
}

export async function addWish(birthdayKey, msg, fromName, fromAvIdx, fromImgId = '') {
  const { data, error } = await supabase
    .from('birthday_wishes')
    .insert({
      birthday_key: birthdayKey,
      from_name:    fromName,
      from_av_idx:  fromAvIdx || 0,
      msg:          msg.slice(0, 500),
      time:         new Date().toISOString(),
      year:         new Date().getFullYear(),
      from_img_id:  fromImgId || null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

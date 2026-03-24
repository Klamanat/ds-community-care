// teamService.js — Employee / team data via Supabase
// Replaces GAS getEmployees, addTeamMember, joinStarGang, updateEmployeeSelf

import { supabase } from './supabase.js'

// Convert employee row (snake_case) → camelCase object
function mapEmp(e) {
  const imgId = e.img_id || (e.img_url?.startsWith('drive:') ? e.img_url.slice(6) : '')
  return {
    id:             e.id,
    empCode:        e.emp_code  || '',
    name:           e.name      || '',
    role:           e.role      || '',
    dept:           e.dept      || '',
    grad:           e.grad      || '',
    imgUrl:         e.img_url?.startsWith('drive:') ? '' : (e.img_url || ''),
    imgId,
    inTeam:         !!e.in_team,
    inStarGang:     !!e.in_star_gang,
    starGangName:   e.star_gang_name   || '',
    starGangRole:   e.star_gang_role   || '',
    starGangSlogan: e.star_gang_slogan || '',
    monthIdx:       e.month_idx   != null ? Number(e.month_idx)   : null,
    bdDate:         e.bd_date     || '',
    fallbackIdx:    e.fallback_idx != null ? Number(e.fallback_idx) : 0,
  }
}

export async function fetchAllEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name')
  if (error) throw new Error(error.message)
  return (data || []).map(mapEmp)
}

export const fetchDirectory = fetchAllEmployees

export async function fetchTeam() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('in_team', true)
    .order('name')
  if (error) throw new Error(error.message)
  return (data || []).map(mapEmp)
}

export async function fetchStarGang() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('in_star_gang', true)
    .order('name')
  if (error) throw new Error(error.message)
  return (data || []).map(mapEmp)
}

export async function joinStarGang(fields) {
  const { data, error } = await supabase
    .from('employees')
    .upsert({
      id:           fields.id,
      name:         fields.name,
      role:         fields.role || '',
      in_star_gang: true,
    }, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapEmp(data)
}

export async function addToTeam(fields) {
  const { data, error } = await supabase
    .from('employees')
    .upsert({
      id:      fields.id,
      name:    fields.name,
      role:    fields.role || '',
      dept:    fields.dept || '',
      in_team: true,
    }, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapEmp(data)
}

export async function updateSelf(empCode, fields) {
  const payload = {}
  if (fields.name           != null) payload.name             = fields.name
  if (fields.role           != null) payload.role             = fields.role
  if (fields.dept           != null) payload.dept             = fields.dept
  if (fields.imgUrl         != null) payload.img_url          = fields.imgUrl
  if (fields.imgId          != null) payload.img_id           = fields.imgId
  if (fields.starGangSlogan != null) payload.star_gang_slogan = fields.starGangSlogan
  const { data, error } = await supabase
    .from('employees')
    .update(payload)
    .eq('emp_code', String(empCode).trim())
    .select()
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapEmp(data) : null
}

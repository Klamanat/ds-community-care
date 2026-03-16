// teamService.js — Employee / team data via Supabase
// Replaces GAS getEmployees, addTeamMember, joinStarGang, updateEmployeeSelf

import { supabase } from './supabase.js'

export async function fetchAllEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name')
  if (error) throw new Error(error.message)
  return data || []
}

export async function fetchTeam() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('in_team', true)
    .order('name')
  if (error) throw new Error(error.message)
  return data || []
}

export async function fetchStarGang() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('in_star_gang', true)
    .order('name')
  if (error) throw new Error(error.message)
  return data || []
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
  return data
}

export async function updateSelf(employeeId, fields) {
  const { data, error } = await supabase
    .from('employees')
    .update({
      name:              fields.name,
      role:              fields.role,
      dept:              fields.dept,
      img_url:           fields.imgUrl,
      img_id:            fields.imgId,
      star_gang_slogan:  fields.starGangSlogan,
    })
    .eq('id', employeeId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

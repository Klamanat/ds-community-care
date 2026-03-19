// plansService.js — Monthly Plans via Supabase

import { supabase } from './supabase.js'
import { uploadImage as edgeUpload } from './edgeFunctions.js'

function mapPlan(p) {
  return {
    id:          p.id,
    yearMonth:   p.year_month  || '',
    title:       p.title       || '',
    description: p.description || '',
    posterUrl:   p.poster_url  || '',
    posterId:    p.poster_id   || '',
    createdAt:   p.created_at  || '',
  }
}

export async function fetchAll() {
  const { data, error } = await supabase
    .from('monthly_plans')
    .select('*')
    .order('year_month', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(mapPlan)
}

export async function addPlan(fields) {
  const { data, error } = await supabase
    .from('monthly_plans')
    .insert({
      year_month:  fields.yearMonth,
      title:       fields.title,
      description: fields.description,
      poster_url:  fields.posterUrl,
      poster_id:   fields.posterId,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapPlan(data)
}

export async function updatePlan(id, fields) {
  const { data, error } = await supabase
    .from('monthly_plans')
    .update({
      year_month:  fields.yearMonth,
      title:       fields.title,
      description: fields.description,
      poster_url:  fields.posterUrl,
      poster_id:   fields.posterId,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapPlan(data)
}

export async function deletePlan(id) {
  const { error } = await supabase.from('monthly_plans').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function uploadImage(base64, fileName) {
  return edgeUpload(base64, fileName || 'plan.jpg', 'plans')
}

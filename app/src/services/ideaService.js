// ideaService.js — Ideas via Supabase

import { supabase } from './supabase.js'

export async function fetchIdeas() {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function submitIdea(idea) {
  const { data, error } = await supabase
    .from('ideas')
    .insert({
      category:       idea.category,
      title:          idea.title.slice(0, 200),
      detail:         (idea.detail || '').slice(0, 500),
      submitter_name: idea.submitterName,
      status:         'pending',
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

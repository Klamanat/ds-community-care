// blogService.js — Blog via Supabase

import { supabase } from './supabase.js'

function mapPost(p) {
  return {
    id:         p.id,
    title:      p.title      || '',
    body:       p.body       || '',
    category:   p.category   || '',
    authorName: p.author_name || '',
    authorId:   p.author_id  || '',
    createdAt:  p.created_at || '',
  }
}

export async function fetchBlogPosts(category) {
  let q = supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
  if (category) q = q.eq('category', category)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data || []).map(mapPost)
}

export async function submitBlogPost(fields) {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      title:       fields.title,
      body:        fields.body,
      category:    fields.category,
      author_name: fields.authorName,
      author_id:   fields.authorId,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function adminGetBlogPosts() {
  return fetchBlogPosts()
}

export async function adminDeleteBlogPost(id) {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function adminUpdateBlogPost(id, fields) {
  const { data, error } = await supabase
    .from('blog_posts')
    .update({ title: fields.title, body: fields.body, category: fields.category })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

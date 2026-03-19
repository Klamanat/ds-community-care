// empathyService.js — Empathy system via Supabase
// Replaces all GAS empathy endpoints

import { supabase } from './supabase.js'
import { uploadImage } from './edgeFunctions.js'

export async function fetchPeople() {
  const { data, error } = await supabase.rpc('get_empathy_people')
  if (error) throw new Error(error.message)
  // Map snake_case → camelCase for store compatibility
  return (data || []).map(p => {
    const imgId = p.img_id || (p.img_url?.startsWith('drive:') ? p.img_url.slice(6) : '')
    return {
      id:           p.id,
      empCode:      p.emp_code,
      name:         p.name,
      role:         p.role,
      imgUrl:       p.img_url?.startsWith('drive:') ? '' : (p.img_url || ''),
      imgId,
      commentCount: Number(p.comment_count) || 0,
    }
  })
}

export async function fetchComments(postId, userKey = '') {
  const { data: rows, error } = await supabase
    .from('empathy_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at')
  if (error) throw new Error(error.message)

  // Fetch like counts for these comments
  const ids = (rows || []).map(r => r.id)
  let likeMap = {}
  if (ids.length) {
    const { data: likes } = await supabase
      .from('comment_likes')
      .select('comment_id, user_key')
      .in('comment_id', ids)
    ;(likes || []).forEach(l => {
      likeMap[l.comment_id] = likeMap[l.comment_id] || { count: 0, userLiked: false }
      likeMap[l.comment_id].count++
      if (userKey && l.user_key === userKey) likeMap[l.comment_id].userLiked = true
    })
  }

  return (rows || []).map(r => ({
    id:        r.id,
    postId:    r.post_id,
    parentId:  r.parent_id || '',
    name:      r.author_name,
    text:      r.text,
    time:      r.created_at,
    likeCount: likeMap[r.id]?.count    || 0,
    _liked:    likeMap[r.id]?.userLiked || false,
  }))
}

export async function addComment(postId, text, authorName, parentId = '') {
  const { data, error } = await supabase
    .from('empathy_comments')
    .insert({ post_id: postId, text, author_name: authorName, parent_id: parentId || null })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return { id: data.id, postId: data.post_id, parentId: data.parent_id || '', name: data.author_name, text: data.text, time: data.created_at }
}

export async function toggleLike(postId, userKey) {
  console.log('[toggleLike] called', postId, userKey)
  const { data, error } = await supabase.rpc('toggle_empathy_like', {
    p_post_id:  postId,
    p_user_key: userKey || 'anonymous',
  })
  if (error) { console.error('[toggleLike]', error); throw new Error(error.message) }
  const row = data?.[0] || {}
  return { postId, liked: row.liked, likeCount: Number(row.like_count) || 0 }
}

export async function toggleCommentLike(commentId, userKey) {
  console.log('[toggleCommentLike] called', commentId, userKey)
  const { data, error } = await supabase.rpc('toggle_comment_like', {
    p_comment_id: commentId,
    p_user_key:   userKey || 'anonymous',
  })
  if (error) { console.error('[toggleCommentLike]', error); throw new Error(error.message) }
  const row = data?.[0] || {}
  return { commentId, liked: row.liked, likeCount: Number(row.like_count) || 0 }
}

export async function toggleChannelLike(channelId, userKey) {
  console.log('[toggleChannelLike] called', channelId, userKey)
  const { data, error } = await supabase.rpc('toggle_channel_like', {
    p_channel_id: channelId,
    p_user_key:   userKey || 'anonymous',
  })
  if (error) { console.error('[toggleChannelLike]', error); throw new Error(error.message) }
  const row = data?.[0] || {}
  return { channelId, liked: row.liked, likeCount: Number(row.like_count) || 0 }
}

export async function fetchChannelLike(channelId, userKey) {
  const { data, error } = await supabase
    .from('channel_likes')
    .select('user_key')
    .eq('channel_id', channelId)
  if (error) throw new Error(error.message)
  const likes = data || []
  return {
    channelId,
    liked:     !!likes.find(l => l.user_key === userKey),
    likeCount: likes.length,
  }
}

export async function fetchChannelLikeCounts(channelIds, userKey = '') {
  const { data } = await supabase
    .from('channel_likes')
    .select('channel_id, user_key')
    .in('channel_id', channelIds)
  const map = {}
  ;(data || []).forEach(l => {
    map[l.channel_id] = map[l.channel_id] || { count: 0, liked: false }
    map[l.channel_id].count++
    if (userKey && l.user_key === userKey) map[l.channel_id].liked = true
  })
  return map
}

export async function uploadEmpathyPhoto(base64, fileName) {
  return uploadImage(base64, fileName, 'empathy')
}

export async function setEmpathyPhoto(employeeId, imgUrl) {
  const { error } = await supabase
    .from('empathy_photos')
    .upsert({ employee_id: employeeId, img_url: imgUrl, updated_at: new Date().toISOString() },
             { onConflict: 'employee_id' })
  if (error) throw new Error(error.message)
  return { employeeId, updated: true }
}

// Legacy — kept for EmpathyBoard backward compat
export async function fetchPosts(userKey = '') {
  return []   // EmpathyBoard now uses fetchPeople() + fetchComments() path
}
export async function createPost() { return null }
export async function ensurePost() { return null }

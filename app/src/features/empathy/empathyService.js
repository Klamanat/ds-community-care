// empathyService.js — Empathy system via Supabase
// All data from Supabase (GAS fully removed)

import { supabase } from '../../core/services/supabase.js'
import { uploadImage } from '../../core/services/edgeFunctions.js'

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

// One card per post (not aggregated per person) — for the Home page grid.
// A person praised multiple times shows up as multiple distinct cards.
export async function fetchPostCards(userKey = '') {
  const { data, error } = await supabase.rpc('get_empathy_post_cards')
  if (error) throw new Error(error.message)
  if (!data?.length) return []

  const ids = data.map(p => p.id)

  const { data: comments } = await supabase
    .from('empathy_comments')
    .select('empathy_post_id')
    .in('empathy_post_id', ids)
  const commentCountMap = {}
  ;(comments || []).forEach(c => {
    commentCountMap[c.empathy_post_id] = (commentCountMap[c.empathy_post_id] || 0) + 1
  })

  const { data: likes } = await supabase
    .from('comment_likes')
    .select('comment_id, user_key')
    .in('comment_id', ids)
  const likeMap = {}
  ;(likes || []).forEach(l => {
    likeMap[l.comment_id] = likeMap[l.comment_id] || { count: 0, userLiked: false }
    likeMap[l.comment_id].count++
    if (userKey && l.user_key === userKey) likeMap[l.comment_id].userLiked = true
  })

  return data.map(p => {
    const imgId = p.img_id || (p.img_url?.startsWith('drive:') ? p.img_url.slice(6) : '')
    return {
      id:           p.id,
      channelId:    p.channel_id,
      empCode:      p.emp_code,
      recName:      p.rec_name,
      recRole:      p.rec_role,
      imgUrl:       p.img_url?.startsWith('drive:') ? '' : (p.img_url || ''),
      imgId,
      authorName:   p.author_name,
      text:         p.text,
      time:         p.created_at,
      likeCount:    likeMap[p.id]?.count || 0,
      _liked:       likeMap[p.id]?.userLiked || false,
      commentCount: commentCountMap[p.id] || 0,
    }
  })
}

// Full wall for a channel — merges legacy empathy_comments (old top-level
// kudos + their replies) with real empathy_posts (new kudos, which own
// their own content and live in a separate table) so the thread view shows
// everything in one place, old and new.
export async function fetchComments(postId, userKey = '') {
  const { data: rows, error } = await supabase
    .from('empathy_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at')
  if (error) throw new Error(error.message)

  const { data: posts } = await supabase
    .from('empathy_posts')
    .select('*')
    .eq('channel_id', postId)
    .not('author_name', 'is', null)

  let postReplies = []
  if (posts?.length) {
    const postIds = posts.map(p => p.id)
    const { data: replies } = await supabase
      .from('empathy_comments')
      .select('*')
      .in('empathy_post_id', postIds)
    postReplies = replies || []
  }

  const commentIds = (rows || []).map(r => r.id)
  const replyIds    = postReplies.map(r => r.id)
  const postIds     = (posts || []).map(p => p.id)
  const allLikeIds  = [...commentIds, ...replyIds, ...postIds]

  let likeMap = {}
  if (allLikeIds.length) {
    const { data: likes } = await supabase
      .from('comment_likes')
      .select('comment_id, user_key')
      .in('comment_id', allLikeIds)
    ;(likes || []).forEach(l => {
      likeMap[l.comment_id] = likeMap[l.comment_id] || { count: 0, userLiked: false }
      likeMap[l.comment_id].count++
      if (userKey && l.user_key === userKey) likeMap[l.comment_id].userLiked = true
    })
  }

  const mappedComments = (rows || []).map(r => ({
    id:            r.id,
    postId:        r.post_id,
    parentId:      r.parent_id || '',
    empathyPostId: r.empathy_post_id || '',
    name:          r.author_name,
    text:          r.text,
    time:          r.created_at,
    likeCount:     likeMap[r.id]?.count    || 0,
    _liked:        likeMap[r.id]?.userLiked || false,
  }))

  // New posts appear as pseudo top-level "comments" (isPost: true tells the
  // UI to route edits/deletes to the post, not the comment, API)
  const mappedPosts = (posts || []).map(p => ({
    id:            p.id,
    postId:        p.channel_id,
    parentId:      '',
    empathyPostId: p.id,
    isPost:        true,
    name:          p.author_name,
    text:          p.text,
    time:          p.created_at,
    likeCount:     likeMap[p.id]?.count    || 0,
    _liked:        likeMap[p.id]?.userLiked || false,
  }))

  // Their replies nest under the pseudo post entry (direct replies to a
  // post have parent_id null in the DB — map them to the post's id so the
  // 1-level tree-building UI groups them correctly)
  const mappedPostReplies = postReplies.map(r => ({
    id:            r.id,
    postId:        r.post_id,
    parentId:      r.parent_id || r.empathy_post_id,
    empathyPostId: r.empathy_post_id || '',
    name:          r.author_name,
    text:          r.text,
    time:          r.created_at,
    likeCount:     likeMap[r.id]?.count    || 0,
    _liked:        likeMap[r.id]?.userLiked || false,
  }))

  return [...mappedComments, ...mappedPosts, ...mappedPostReplies]
}

// Flat comments/replies attached directly to one real post (empathy_post_id).
// Used by the Facebook-style single-post detail view.
export async function fetchPostComments(postId, userKey = '') {
  const { data: rows, error } = await supabase
    .from('empathy_comments')
    .select('*')
    .eq('empathy_post_id', postId)
    .order('created_at')
  if (error) throw new Error(error.message)

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
    id:            r.id,
    parentId:      r.parent_id || '',
    empathyPostId: r.empathy_post_id,
    name:          r.author_name,
    text:          r.text,
    time:          r.created_at,
    likeCount:     likeMap[r.id]?.count    || 0,
    _liked:        likeMap[r.id]?.userLiked || false,
  }))
}

// Flat feed of kudos posts across all people, newest first.
// Posts own their content directly (author_name/text) — new posts get one
// message each; old (backfilled) posts aggregate a whole channel's history
// and have no single author_name/text of their own.
export async function fetchFeed(limit = 15, before = null, userKey = '') {
  let q = supabase
    .from('empathy_posts')
    .select('*')
  if (before) q = q.lt('created_at', before)
  const { data: posts, error } = await q
    .limit(limit)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  if (!posts?.length) return []

  const postIds = posts.map(p => p.id)

  const { data: comments } = await supabase
    .from('empathy_comments')
    .select('empathy_post_id')
    .in('empathy_post_id', postIds)
  const commentCountMap = {}
  ;(comments || []).forEach(c => {
    commentCountMap[c.empathy_post_id] = (commentCountMap[c.empathy_post_id] || 0) + 1
  })

  const { data: likes } = await supabase
    .from('comment_likes')
    .select('comment_id, user_key')
    .in('comment_id', postIds)
  const likeMap = {}
  ;(likes || []).forEach(l => {
    likeMap[l.comment_id] = likeMap[l.comment_id] || { count: 0, userLiked: false }
    likeMap[l.comment_id].count++
    if (userKey && l.user_key === userKey) likeMap[l.comment_id].userLiked = true
  })

  return posts.map(p => ({
    id:           p.id,
    postId:       p.channel_id,
    name:         p.author_name,
    text:         p.text,
    time:         p.created_at,
    likeCount:    likeMap[p.id]?.count || 0,
    _liked:       likeMap[p.id]?.userLiked || false,
    commentCount: commentCountMap[p.id] || 0,
  }))
}

// Single post, for the detail view — not assumed to already be in the feed
// cache (e.g. opened via a notification deep-link).
export async function fetchPostById(postId, userKey = '') {
  const { data: p, error } = await supabase
    .from('empathy_posts')
    .select('*')
    .eq('id', postId)
    .single()
  if (error) throw new Error(error.message)

  const { count: commentCount } = await supabase
    .from('empathy_comments')
    .select('id', { count: 'exact', head: true })
    .eq('empathy_post_id', postId)

  const { data: likes } = await supabase
    .from('comment_likes')
    .select('user_key')
    .eq('comment_id', postId)

  return {
    id:           p.id,
    postId:       p.channel_id,
    name:         p.author_name,
    text:         p.text,
    time:         p.created_at,
    likeCount:    likes?.length || 0,
    _liked:       userKey ? !!likes?.find(l => l.user_key === userKey) : false,
    commentCount: commentCount || 0,
  }
}

// Create a brand new post (top-level kudos) — the message lives on the post.
export async function createPost(channelId, authorName, text) {
  const { data, error } = await supabase
    .from('empathy_posts')
    .insert({ channel_id: channelId, author_name: authorName, text })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return {
    id:     data.id,
    postId: data.channel_id,
    name:   data.author_name,
    text:   data.text,
    time:   data.created_at,
  }
}

export async function addComment(channelId, empathyPostId, text, authorName, parentId = '') {
  const { data, error } = await supabase
    .from('empathy_comments')
    .insert({
      post_id:         channelId,
      empathy_post_id: empathyPostId || null,
      text,
      author_name:     authorName,
      parent_id:       parentId || null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return {
    id:            data.id,
    postId:        data.post_id,
    parentId:      data.parent_id || '',
    empathyPostId: data.empathy_post_id || '',
    name:          data.author_name,
    text:          data.text,
    time:          data.created_at,
  }
}

export async function updatePost(id, text) {
  const { error } = await supabase
    .from('empathy_posts')
    .update({ text })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deletePost(id) {
  const { error } = await supabase
    .from('empathy_posts')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateComment(id, text) {
  const { error } = await supabase
    .from('empathy_comments')
    .update({ text })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteComment(id) {
  const { error } = await supabase
    .from('empathy_comments')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
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

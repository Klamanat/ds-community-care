import { gasGet } from './api.js'

export async function fetchIdeas() {
  const r = await gasGet('getIdeas')
  return r.data
}

export async function submitIdea(idea) {
  const r = await gasGet('submitIdea', {
    category: idea.category,
    title: idea.title.slice(0, 200),
    detail: (idea.detail || '').slice(0, 500),
    submitterName: idea.submitterName
  })
  return r.data
}

import { gasGet } from './api.js'

// ── Shared employee dedup cache ───────────────────────────────────────────────
// Concurrent calls with the same action+params share ONE in-flight HTTP request.
// Subsequent calls within DEDUP_TTL return the cached promise (no new GAS call).
// Used by: teamService (fetchTeam/StarGang/Directory), mental.js, userAuth.js
// ─────────────────────────────────────────────────────────────────────────────
const _inflight = {}
const DEDUP_TTL = 30000   // 30 s

function _dedup(action, params) {
  const key = action + '?' + new URLSearchParams(params || {}).toString()
  const now = Date.now()
  if (_inflight[key] && now - _inflight[key].ts < DEDUP_TTL) return _inflight[key].p
  _inflight[key] = { ts: now, p: gasGet(action, params).then(r => r.data || []).catch(() => []) }
  return _inflight[key].p
}

// Exported so mental.js, userAuth.js can share the same dedup'd call
export const fetchAllEmployees = () => _dedup('getEmployees')

export async function fetchTeam() {
  return _dedup('getEmployees', { inTeam: 'true' })
}

export async function fetchStarGang() {
  return _dedup('getEmployees', { inStarGang: 'true' })
}

export async function fetchDirectory() {
  return fetchAllEmployees()
}

export async function addTeamMember(member) {
  const r = await gasGet('addTeamMember', {
    id: member.id,
    name: member.name,
    role: member.role,
    dept: member.dept || '',
    imgUrl: member.imgUrl || ''
  })
  return r.data
}

export async function joinStarGang(member) {
  const r = await gasGet('joinStarGang', { name: member.name, role: member.role })
  return r.data
}

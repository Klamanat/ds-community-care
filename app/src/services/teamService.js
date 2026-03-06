import { gasGet } from './api.js'

export async function fetchTeam() {
  const r = await gasGet('getEmployees', { filter: 'inTeam' })
  return r.data
}

export async function fetchDirectory() {
  const r = await gasGet('getEmployees')
  return r.data
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

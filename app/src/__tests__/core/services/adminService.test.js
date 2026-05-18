// Unit tests for core/services/adminService.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────

const chainMethods = ['select', 'insert', 'update', 'delete', 'upsert',
  'eq', 'neq', 'not', 'order', 'single', 'maybeSingle', 'rpc', 'in', 'from']

vi.mock('../../../core/services/supabase.js', () => {
  const buildChain = () => {
    const chain = () => chain
    for (const m of ['select', 'insert', 'update', 'delete', 'upsert',
      'eq', 'neq', 'not', 'order', 'single', 'maybeSingle', 'rpc', 'in', 'from']) {
      chain[m] = vi.fn(() => chain)
    }
    chain.auth = {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    }
    return chain
  }
  const supabase = buildChain()
  return { supabase }
})

vi.mock('../../../core/services/edgeFunctions.js', () => ({
  uploadImage: vi.fn(),
}))

import { supabase } from '../../../core/services/supabase.js'
import { uploadImage } from '../../../core/services/edgeFunctions.js'
import * as svc from '../../../core/services/adminService.js'

// ── Helpers ──────────────────────────────────────────────────────────

function resetChain() {
  for (const m of chainMethods) {
    supabase[m] = vi.fn(() => supabase)
  }
  supabase.auth.signInWithPassword = vi.fn()
  supabase.auth.signOut = vi.fn()
}

// ── Tests ────────────────────────────────────────────────────────────

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChain()
  })

  // ── Auth ──────────────────────────────────────────────────────────

  describe('login', () => {
    it('logs in successfully with username', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { user_metadata: { role: 'admin', name: 'Admin One' } } },
        error: null,
      })
      const result = await svc.login('admin1', 'pass123')
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'admin1@ds.internal',
        password: 'pass123',
      })
      expect(result).toEqual({ name: 'Admin One' })
    })

    it('logs in successfully with email', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { user_metadata: { role: 'admin', name: 'Big Boss' } } },
        error: null,
      })
      const result = await svc.login('boss@ds.internal', 'pass456')
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'boss@ds.internal',
        password: 'pass456',
      })
      expect(result).toEqual({ name: 'Big Boss' })
    })

    it('falls back to username when no metadata name', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { user_metadata: { role: 'admin' } } },
        error: null,
      })
      const result = await svc.login('admin1', 'pass')
      expect(result).toEqual({ name: 'admin1' })
    })

    it('throws when role is not admin', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { user_metadata: { role: 'user' } } },
        error: null,
      })
      await expect(svc.login('user1', 'pass')).rejects.toThrow('ไม่มีสิทธิ์ admin')
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('throws on auth error', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid credentials'),
      })
      await expect(svc.login('bad', 'wrong')).rejects.toThrow('Invalid credentials')
    })
  })

  // ── Images ────────────────────────────────────────────────────────

  describe('uploadProfileImage', () => {
    it('uploads and updates employee record', async () => {
      uploadImage.mockResolvedValue({ id: 'img1', url: 'https://cdn.example.com/pic.jpg' })
      supabase.from().update().eq.mockResolvedValue({ error: null })

      const result = await svc.uploadProfileImage('emp1', 'base64data')

      expect(uploadImage).toHaveBeenCalledWith('base64data', 'profile.jpg', 'profiles')
      expect(supabase.from).toHaveBeenCalledWith('employees')
      expect(result).toEqual({ id: 'img1', url: 'https://cdn.example.com/pic.jpg' })
    })

    it('uses custom fileName', async () => {
      uploadImage.mockResolvedValue({ id: 'img2', url: 'https://cdn.example.com/custom.jpg' })
      supabase.from().update().eq.mockResolvedValue({ error: null })

      const result = await svc.uploadProfileImage('emp1', 'base64', 'custom.jpg')
      expect(uploadImage).toHaveBeenCalledWith('base64', 'custom.jpg', 'profiles')
      expect(result.id).toBe('img2')
    })

    it('throws on update error', async () => {
      uploadImage.mockResolvedValue({ id: 'img1', url: 'https://cdn.example.com/pic.jpg' })
      supabase.from().update().eq.mockResolvedValue({ error: new Error('DB error') })

      await expect(svc.uploadProfileImage('emp1', 'base64')).rejects.toThrow('DB error')
    })
  })

  // ── Employees ─────────────────────────────────────────────────────

  describe('getEmployees', () => {
    it('returns mapped employees sorted by name', async () => {
      supabase.from().select().order.mockResolvedValue({
        data: [
          { id: 'e1', emp_code: 'EMP01', name: 'Alice', role: 'Dev', dept: 'IT', grad: 'L3',
            img_url: 'https://pic.com/a.jpg', img_id: 'i1', in_team: true, in_star_gang: false,
            star_gang_name: '', star_gang_role: '', star_gang_slogan: '',
            month_idx: 5, bd_date: '2026-05-15', fallback_idx: null },
          { id: 'e2', emp_code: 'EMP02', name: 'Bob', role: 'QA', dept: 'IT', grad: 'L2',
            img_url: null, img_id: null, in_team: false, in_star_gang: true,
            star_gang_name: 'StarTeam', star_gang_role: 'Lead', star_gang_slogan: 'Go!',
            month_idx: null, bd_date: null, fallback_idx: 3 },
        ],
        error: null,
      })

      const result = await svc.getEmployees()

      expect(supabase.from).toHaveBeenCalledWith('employees')
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        id: 'e1', empCode: 'EMP01', name: 'Alice', dept: 'IT', inTeam: true, monthIdx: 5, bdDate: '2026-05-15',
      })
      expect(result[1]).toMatchObject({
        id: 'e2', empCode: 'EMP02', name: 'Bob', inStarGang: true, starGangName: 'StarTeam',
        fallbackIdx: 3, monthIdx: null, bdDate: '',
      })
    })

    it('uses img_id when img_url starts with drive:', async () => {
      supabase.from().select().order.mockResolvedValue({
        data: [{ id: 'e1', emp_code: 'EMP01', name: 'Alice', role: '', dept: '', grad: '',
          img_url: 'drive:d123', img_id: 'd123', in_team: false, in_star_gang: false,
          star_gang_name: '', star_gang_role: '', star_gang_slogan: '',
          month_idx: null, bd_date: null, fallback_idx: null }],
        error: null,
      })
      const result = await svc.getEmployees()
      expect(result[0].imgUrl).toBe('')
      expect(result[0].imgId).toBe('d123')
    })

    it('returns empty array on null data', async () => {
      supabase.from().select().order.mockResolvedValue({ data: null, error: null })
      expect(await svc.getEmployees()).toEqual([])
    })

    it('throws on error', async () => {
      supabase.from().select().order.mockResolvedValue({ data: null, error: new Error('Fail') })
      await expect(svc.getEmployees()).rejects.toThrow('Fail')
    })
  })

  describe('addEmployee', () => {
    it('inserts with snake_case conversion and returns data', async () => {
      supabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'e1', emp_code: 'EMP10', name: 'Charlie' },
        error: null,
      })

      const result = await svc.addEmployee({ empCode: 'EMP10', name: 'Charlie', dept: 'HR' })

      expect(supabase.from).toHaveBeenCalledWith('employees')
      expect(supabase.insert).toHaveBeenCalledWith({ emp_code: 'EMP10', name: 'Charlie', dept: 'HR' })
      expect(result).toMatchObject({ id: 'e1', name: 'Charlie' })
    })

    it('throws on error', async () => {
      supabase.from().insert().select().single.mockResolvedValue({
        data: null, error: new Error('Duplicate'),
      })
      await expect(svc.addEmployee({ empCode: 'X' })).rejects.toThrow('Duplicate')
    })
  })

  describe('updateEmployee', () => {
    it('updates and returns data', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({
        data: { id: 'e1', name: 'Updated' },
        error: null,
      })

      const result = await svc.updateEmployee('e1', { name: 'Updated' })

      expect(supabase.from).toHaveBeenCalledWith('employees')
      expect(supabase.eq).toHaveBeenCalledWith('id', 'e1')
      expect(result).toMatchObject({ id: 'e1', name: 'Updated' })
    })

    it('throws on error', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({
        data: null, error: new Error('Not found'),
      })
      await expect(svc.updateEmployee('x', {})).rejects.toThrow('Not found')
    })
  })

  describe('deleteEmployee', () => {
    it('deletes by id', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: null })
      await svc.deleteEmployee('e1')
      expect(supabase.from).toHaveBeenCalledWith('employees')
      expect(supabase.eq).toHaveBeenCalledWith('id', 'e1')
    })

    it('throws on error', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: new Error('FK violation') })
      await expect(svc.deleteEmployee('e1')).rejects.toThrow('FK violation')
    })
  })

  // ── Birthdays ─────────────────────────────────────────────────────

  describe('getBirthdays', () => {
    it('returns mapped birthdays with key prefix', async () => {
      supabase.from().select().not().order.mockResolvedValue({
        data: [
          { id: 'e1', name: 'Alice', role: 'Dev', month_idx: 5, bd_date: '2026-05-15', img_id: 'i1', img_url: 'https://pic.com/a.jpg' },
          { id: 'e2', name: 'Bob', role: 'QA', month_idx: null, bd_date: '', img_id: null, img_url: null },
        ],
        error: null,
      })

      const result = await svc.getBirthdays()

      expect(supabase.from).toHaveBeenCalledWith('employees')
      expect(supabase.not).toHaveBeenCalledWith('bd_date', 'is', null)
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ key: 'bday_e1', employeeId: 'e1', name: 'Alice', monthIdx: 5, bdDate: '2026-05-15' })
      expect(result[1]).toMatchObject({ key: 'bday_e2', employeeId: 'e2', monthIdx: null, bdDate: '' })
    })

    it('throws on error', async () => {
      supabase.from().select().not().order.mockResolvedValue({ data: null, error: new Error('DB err') })
      await expect(svc.getBirthdays()).rejects.toThrow('DB err')
    })
  })

  describe('addBirthday', () => {
    it('updates bd_date and month_idx', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({
        data: { id: 'e1', bd_date: '2026-05-15', month_idx: 5 },
        error: null,
      })

      const result = await svc.addBirthday({ employeeId: 'e1', bdDate: '2026-05-15', monthIdx: 5 })

      expect(supabase.update).toHaveBeenCalledWith({ bd_date: '2026-05-15', month_idx: 5 })
      expect(supabase.eq).toHaveBeenCalledWith('id', 'e1')
      expect(result).toBeDefined()
    })

    it('throws on error', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({
        data: null, error: new Error('Fail'),
      })
      await expect(svc.addBirthday({ employeeId: 'e1' })).rejects.toThrow('Fail')
    })
  })

  // ── Ideas ─────────────────────────────────────────────────────────

  describe('getAdminIdeas', () => {
    it('returns mapped ideas sorted by created_at desc', async () => {
      supabase.from().select().order.mockResolvedValue({
        data: [
          { id: 'i1', category: 'tech', title: 'New tool', detail: 'Useful', submitter_name: 'Alice', created_at: '2026-05-10T00:00:00Z', status: 'pending' },
          { id: 'i2', category: 'culture', title: 'Team outing', detail: 'Fun', submitter_name: 'Bob', created_at: '2026-05-09T00:00:00Z', status: 'approved' },
        ],
        error: null,
      })

      const result = await svc.getAdminIdeas()

      expect(supabase.from).toHaveBeenCalledWith('ideas')
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({ id: 'i1', category: 'tech', title: 'New tool', submitterName: 'Alice', status: 'pending' })
      expect(result[1].status).toBe('approved')
    })

    it('returns empty array on null data', async () => {
      supabase.from().select().order.mockResolvedValue({ data: null, error: null })
      expect(await svc.getAdminIdeas()).toEqual([])
    })

    it('throws on error', async () => {
      supabase.from().select().order.mockResolvedValue({ data: null, error: new Error('Fail') })
      await expect(svc.getAdminIdeas()).rejects.toThrow('Fail')
    })
  })

  describe('updateIdea', () => {
    it('updates status and returns data', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({
        data: { id: 'i1', status: 'approved' },
        error: null,
      })

      const result = await svc.updateIdea('i1', 'approved')

      expect(supabase.update).toHaveBeenCalledWith({ status: 'approved' })
      expect(supabase.eq).toHaveBeenCalledWith('id', 'i1')
      expect(result.status).toBe('approved')
    })

    it('throws on error', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({
        data: null, error: new Error('Not found'),
      })
      await expect(svc.updateIdea('i1', 'rejected')).rejects.toThrow('Not found')
    })
  })

  // ── Empathy ───────────────────────────────────────────────────────

  describe('deletePost', () => {
    it('deletes from empathy_comments by id', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: null })
      await svc.deletePost('post1')
      expect(supabase.from).toHaveBeenCalledWith('empathy_comments')
      expect(supabase.eq).toHaveBeenCalledWith('id', 'post1')
    })

    it('throws on error', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: new Error('Fail') })
      await expect(svc.deletePost('x')).rejects.toThrow('Fail')
    })
  })

  describe('deleteComment', () => {
    it('deletes from empathy_replies by id', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: null })
      await svc.deleteComment('c1')
      expect(supabase.from).toHaveBeenCalledWith('empathy_replies')
      expect(supabase.eq).toHaveBeenCalledWith('id', 'c1')
    })

    it('throws on error', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: new Error('Fail') })
      await expect(svc.deleteComment('x')).rejects.toThrow('Fail')
    })
  })

  describe('deleteChannel', () => {
    it('deletes comments and likes for the channel', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: null })

      await svc.deleteChannel('ch1')

      expect(supabase.from).toHaveBeenCalledWith('empathy_comments')
      expect(supabase.from).toHaveBeenCalledWith('channel_likes')
      expect(supabase.eq).toHaveBeenCalledWith('post_id', 'ch1')
      expect(supabase.eq).toHaveBeenCalledWith('channel_id', 'ch1')
    })

    it('throws if first delete fails', async () => {
      supabase.from().delete().eq
        .mockResolvedValueOnce({ error: new Error('First fail') })

      await expect(svc.deleteChannel('ch1')).rejects.toThrow('First fail')
    })

    it('throws if second delete fails', async () => {
      supabase.from().delete().eq
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: new Error('Second fail') })

      await expect(svc.deleteChannel('ch1')).rejects.toThrow('Second fail')
    })
  })

  // ── Announcement ──────────────────────────────────────────────────

  describe('saveAnnouncement', () => {
    it('upserts all setting rows', async () => {
      supabase.from().upsert.mockResolvedValue({ error: null })

      await svc.saveAnnouncement({
        enabled: true,
        title: 'Welcome',
        desc: 'Hello everyone',
        video: 'vid1',
        videoEnabled: true,
        quizEnabled: false,
        image: 'img1',
        imageEnabled: false,
      })

      expect(supabase.from).toHaveBeenCalledWith('settings')
      const rows = supabase.upsert.mock.calls[0][0]
      expect(rows).toEqual(expect.arrayContaining([
        expect.objectContaining({ key: 'ann_enabled', value: 'true' }),
        expect.objectContaining({ key: 'ann_title', value: 'Welcome' }),
        expect.objectContaining({ key: 'ann_desc', value: 'Hello everyone' }),
        expect.objectContaining({ key: 'ann_video', value: 'vid1' }),
        expect.objectContaining({ key: 'ann_video_enabled', value: 'true' }),
        expect.objectContaining({ key: 'ann_quiz_enabled', value: 'false' }),
        expect.objectContaining({ key: 'ann_image', value: 'img1' }),
        expect.objectContaining({ key: 'ann_image_enabled', value: 'false' }),
      ]))
    })

    it('generates ann_id with timestamp when not provided', async () => {
      supabase.from().upsert.mockResolvedValue({ error: null })
      const now = Date.now()
      vi.setSystemTime(now)

      await svc.saveAnnouncement({ enabled: true })
      const rows = supabase.upsert.mock.calls[0][0]
      expect(rows.find(r => r.key === 'ann_id').value).toBe(`ann_${now}`)
    })

    it('serializes quizQuestions as JSON', async () => {
      supabase.from().upsert.mockResolvedValue({ error: null })
      const questions = [{ q: 'Q1?', options: ['A', 'B'] }]

      await svc.saveAnnouncement({ enabled: true, quizEnabled: true, quizQuestions: questions })
      const rows = supabase.upsert.mock.calls[0][0]
      expect(rows.find(r => r.key === 'ann_quiz_questions').value).toBe(JSON.stringify(questions))
    })

    it('throws on error', async () => {
      supabase.from().upsert.mockResolvedValue({ error: new Error('Upsert failed') })
      await expect(svc.saveAnnouncement({ enabled: true })).rejects.toThrow('Upsert failed')
    })
  })

  describe('uploadAnnouncementVideo', () => {
    it('calls uploadImage with correct args', async () => {
      uploadImage.mockResolvedValue({ id: 'v1', url: 'https://cdn.example.com/vid.mp4' })
      const result = await svc.uploadAnnouncementVideo('base64vid', 'vid.mp4', 'video/mp4')
      expect(uploadImage).toHaveBeenCalledWith('base64vid', 'vid.mp4', 'announcements')
      expect(result.url).toBe('https://cdn.example.com/vid.mp4')
    })
  })

  describe('uploadAnnouncementImage', () => {
    it('calls uploadImage with correct args', async () => {
      uploadImage.mockResolvedValue({ id: 'img1', url: 'https://cdn.example.com/pic.jpg' })
      const result = await svc.uploadAnnouncementImage('base64img', 'photo.jpg')
      expect(uploadImage).toHaveBeenCalledWith('base64img', 'photo.jpg', 'announcements')
      expect(result.url).toBe('https://cdn.example.com/pic.jpg')
    })
  })

  describe('fetchQuizAnswers', () => {
    it('fetches answers by ann_id ordered by created_at desc', async () => {
      supabase.from().select().eq().order.mockResolvedValue({
        data: [
          { employee_name: 'Alice', question_id: 1, selected: 'A', created_at: '2026-05-10T00:00:00Z' },
        ],
        error: null,
      })

      const result = await svc.fetchQuizAnswers('ann1')

      expect(supabase.from).toHaveBeenCalledWith('quiz_answers')
      expect(supabase.eq).toHaveBeenCalledWith('ann_id', 'ann1')
      expect(result).toHaveLength(1)
      expect(result[0].employee_name).toBe('Alice')
    })

    it('throws on error', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: null, error: new Error('Fail') })
      await expect(svc.fetchQuizAnswers('ann1')).rejects.toThrow('Fail')
    })
  })

  describe('deleteQuizAnswers', () => {
    it('deletes quiz answers by ann_id', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: null })
      await svc.deleteQuizAnswers('ann1')
      expect(supabase.from).toHaveBeenCalledWith('quiz_answers')
      expect(supabase.eq).toHaveBeenCalledWith('ann_id', 'ann1')
    })

    it('throws on error', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: new Error('Fail') })
      await expect(svc.deleteQuizAnswers('ann1')).rejects.toThrow('Fail')
    })
  })

  // ── Mental Advisors ───────────────────────────────────────────────

  describe('getMentalAdvisors', () => {
    it('returns mapped advisors ordered by order', async () => {
      supabase.from().select().order.mockResolvedValue({
        data: [
          { id: 'a1', name: 'Dr. Smith', role: 'Psychologist', employee_id: 'emp1',
            img_id: 'img1', img_url: 'https://pic.com/doc.jpg', order: 1,
            card_bg_type: 'color', card_bg_value: '#ff0', card_bg_id: '', card_bg_emoji: '' },
        ],
        error: null,
      })

      const result = await svc.getMentalAdvisors()

      expect(supabase.from).toHaveBeenCalledWith('mental_advisors')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'a1', name: 'Dr. Smith', employeeId: 'emp1', imgId: 'img1',
        order: 1, cardBgType: 'color', cardBgValue: '#ff0',
      })
    })

    it('throws on error', async () => {
      supabase.from().select().order.mockResolvedValue({ data: null, error: new Error('Fail') })
      await expect(svc.getMentalAdvisors()).rejects.toThrow('Fail')
    })
  })

  describe('addMentalAdvisor', () => {
    it('inserts and returns mapped data', async () => {
      supabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'a1', name: 'New Advisor', role: 'Counselor', employee_id: 'emp2',
          img_id: '', img_url: '', order: 2, card_bg_type: null, card_bg_value: null,
          card_bg_id: null, card_bg_emoji: null },
        error: null,
      })

      const result = await svc.addMentalAdvisor({ name: 'New Advisor', role: 'Counselor', employeeId: 'emp2', order: 2 })

      expect(supabase.from).toHaveBeenCalledWith('mental_advisors')
      expect(result).toMatchObject({ name: 'New Advisor', employeeId: 'emp2', order: 2 })
    })

    it('throws on error', async () => {
      supabase.from().insert().select().single.mockResolvedValue({
        data: null, error: new Error('Duplicate'),
      })
      await expect(svc.addMentalAdvisor({ name: 'X' })).rejects.toThrow('Duplicate')
    })
  })

  describe('updateMentalAdvisor', () => {
    it('updates and returns mapped data', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({
        data: { id: 'a1', name: 'Updated', role: 'Senior', employee_id: 'emp1',
          img_id: '', img_url: '', order: 1, card_bg_type: 'gradient', card_bg_value: 'blue-pink',
          card_bg_id: '', card_bg_emoji: '' },
        error: null,
      })

      const result = await svc.updateMentalAdvisor('a1', {
        name: 'Updated', role: 'Senior', employeeId: 'emp1', order: 1,
        cardBgType: 'gradient', cardBgValue: 'blue-pink',
      })

      expect(supabase.eq).toHaveBeenCalledWith('id', 'a1')
      expect(result).toMatchObject({ name: 'Updated', cardBgType: 'gradient', cardBgValue: 'blue-pink' })
    })

    it('throws on error', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({
        data: null, error: new Error('Not found'),
      })
      await expect(svc.updateMentalAdvisor('x', { name: 'X' })).rejects.toThrow('Not found')
    })
  })

  describe('deleteMentalAdvisor', () => {
    it('deletes by id', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: null })
      await svc.deleteMentalAdvisor('a1')
      expect(supabase.from).toHaveBeenCalledWith('mental_advisors')
      expect(supabase.eq).toHaveBeenCalledWith('id', 'a1')
    })

    it('throws on error', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: new Error('FK violation') })
      await expect(svc.deleteMentalAdvisor('a1')).rejects.toThrow('FK violation')
    })
  })

  // ── Consult Requests ──────────────────────────────────────────────

  describe('getConsultRequests', () => {
    it('returns mapped requests ordered by created_at desc', async () => {
      supabase.from().select().order.mockResolvedValue({
        data: [
          { id: 'r1', counselor_employee_id: 'c1', message: 'Need help', employee_id: 'e1',
            employee_name: 'Alice', created_at: '2026-05-10T00:00:00Z', is_read: true,
            reply: 'Sure', counselor_name: 'Dr. Smith', replied_at: '2026-05-11T00:00:00Z' },
        ],
        error: null,
      })

      const result = await svc.getConsultRequests()

      expect(supabase.from).toHaveBeenCalledWith('consult_requests')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'r1', counselorEmployeeId: 'c1', message: 'Need help',
        employeeName: 'Alice', isRead: true, reply: 'Sure', counselorName: 'Dr. Smith',
      })
    })

    it('throws on error', async () => {
      supabase.from().select().order.mockResolvedValue({ data: null, error: new Error('Fail') })
      await expect(svc.getConsultRequests()).rejects.toThrow('Fail')
    })
  })

  // ── Generic (legacy compat) ───────────────────────────────────────

  describe('getAll', () => {
    it('fetches all from mapped table name', async () => {
      supabase.from().select.mockResolvedValue({ data: [{ id: 1 }], error: null })

      const result = await svc.getAll('Employees')

      expect(supabase.from).toHaveBeenCalledWith('employees')
      expect(result).toEqual([{ id: 1 }])
    })

    it('falls back to lowercase when no TABLE_MAP entry', async () => {
      supabase.from().select.mockResolvedValue({ data: [{ id: 1 }], error: null })

      const result = await svc.getAll('custom_table')

      expect(supabase.from).toHaveBeenCalledWith('custom_table')
      expect(result).toEqual([{ id: 1 }])
    })

    it('returns empty array on null data', async () => {
      supabase.from().select.mockResolvedValue({ data: null, error: null })
      expect(await svc.getAll('Ideas')).toEqual([])
    })

    it('throws on error', async () => {
      supabase.from().select.mockResolvedValue({ data: null, error: new Error('Fail') })
      await expect(svc.getAll('Activities')).rejects.toThrow('Fail')
    })
  })

  describe('updateRow', () => {
    it('updates with snake_case conversion and returns data', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({
        data: { id: 1, name: 'Updated' },
        error: null,
      })

      const result = await svc.updateRow('Employees', 'id', 1, { name: 'Updated', inTeam: true })

      expect(supabase.update).toHaveBeenCalledWith({ name: 'Updated', in_team: true })
      expect(supabase.eq).toHaveBeenCalledWith('id', 1)
      expect(result).toMatchObject({ id: 1, name: 'Updated' })
    })

    it('throws on error', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({
        data: null, error: new Error('Fail'),
      })
      await expect(svc.updateRow('Ideas', 'id', 1, {})).rejects.toThrow('Fail')
    })
  })

  describe('deleteRow', () => {
    it('deletes with snake_case key column', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: null })
      await svc.deleteRow('BlogPosts', 'id', 'p1')
      expect(supabase.from).toHaveBeenCalledWith('blog_posts')
      expect(supabase.eq).toHaveBeenCalledWith('id', 'p1')
    })

    it('throws on error', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: new Error('Fail') })
      await expect(svc.deleteRow('BlogPosts', 'id', 'p1')).rejects.toThrow('Fail')
    })

    it('converts camelCase keyCol to snake_case', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: null })
      await svc.deleteRow('Activities', 'someKey', 'val')
      expect(supabase.eq).toHaveBeenCalledWith('some_key', 'val')
    })
  })
})

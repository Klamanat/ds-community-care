// Unit tests for core/stores/ui.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from '../../../core/stores/ui.js'

describe('useUiStore', () => {
  let ui

  beforeEach(() => {
    setActivePinia(createPinia())
    ui = useUiStore()
    document.body.classList.remove('modal-open')
  })

  describe('openModal', () => {
    it('opens a modal by key and increments its key counter', () => {
      ui.openModal('modal-test')
      expect(ui.activeModal).toBe('modal-test')
      expect(ui.modalKeys['modal-test']).toBe(1)
    })

    it('increments key counter on re-open', () => {
      ui.openModal('modal-test')
      ui.closeModal()
      ui.openModal('modal-test')
      expect(ui.modalKeys['modal-test']).toBe(2)
    })

    it('adds modal-open class to body', () => {
      ui.openModal('modal-emp')
      expect(document.body.classList.contains('modal-open')).toBe(true)
    })
  })

  describe('closeModal', () => {
    it('clears active modal', () => {
      ui.openModal('modal-bday')
      ui.closeModal()
      expect(ui.activeModal).toBeNull()
    })

    it('removes modal-open class from body', () => {
      ui.openModal('modal-bday')
      ui.closeModal()
      expect(document.body.classList.contains('modal-open')).toBe(false)
    })
  })

  describe('openMonthModal', () => {
    it('sets selectedMonthIdx and opens modal-month', () => {
      ui.openMonthModal(5)
      expect(ui.selectedMonthIdx).toBe(5)
      expect(ui.activeModal).toBe('modal-month')
    })
  })

  describe('showToast', () => {
    it('shows a toast with message', () => {
      ui.showToast('Hello!')
      expect(ui.toast.msg).toBe('Hello!')
      expect(ui.toast.visible).toBe(true)
    })

    it('auto-hides toast after duration using real timers', () => {
      ui.showToast('Temp', 100)
      expect(ui.toast.visible).toBe(true)
      return new Promise(resolve => {
        setTimeout(() => {
          expect(ui.toast.visible).toBe(false)
          expect(ui.toast.msg).toBe('')
          resolve()
        }, 150)
      })
    })

    it('clears previous timer when called again', () => {
      ui.showToast('First', 500)
      ui.showToast('Second', 100)
      return new Promise(resolve => {
        setTimeout(() => {
          expect(ui.toast.visible).toBe(false)
          resolve()
        }, 150)
      })
    })
  })

  describe('notifBadge', () => {
    it('starts at 0', () => {
      expect(ui.notifBadge).toBe(0)
    })

    it('clearNotifBadge resets to 0', () => {
      ui.notifBadge = 5
      ui.clearNotifBadge()
      expect(ui.notifBadge).toBe(0)
    })
  })

  describe('currentUser', () => {
    it('has default values', () => {
      expect(ui.currentUser).toEqual({
        id: '', name: '', role: '', img: '', dept: '', emoji: '😊',
      })
    })
  })
})

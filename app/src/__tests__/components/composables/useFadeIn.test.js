import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'

// ── Mock classes ──────────────────────────────────────────────────────

const mockObserve = vi.fn()
const mockUnobserve = vi.fn()
const mockDisconnect = vi.fn()

let ioCallback = null
class MockIntersectionObserver {
  constructor(callback, options) {
    ioCallback = callback
    this.options = options
    this.observe = mockObserve
    this.unobserve = mockUnobserve
    this.disconnect = mockDisconnect
  }
}

const mockMutateObserve = vi.fn()
const mockMutateDisconnect = vi.fn()

let moCallback = null
class MockMutationObserver {
  constructor(callback) {
    moCallback = callback
    this.observe = mockMutateObserve
    this.disconnect = mockMutateDisconnect
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

function createTestComp(selector, rootElRef) {
  return defineComponent({
    setup() {
      const { useFadeIn } = require('../../../core/composables/useFadeIn.js')
      useFadeIn(selector, rootElRef)
    },
    render() { return h('div') },
  })
}

describe('useFadeIn', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    vi.stubGlobal('MutationObserver', MockMutationObserver)
    ioCallback = null
    moCallback = null
    mockObserve.mockClear()
    mockUnobserve.mockClear()
    mockDisconnect.mockClear()
    mockMutateObserve.mockClear()
    mockMutateDisconnect.mockClear()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ── Existing tests (preserved and refined) ─────────────────────────

  it('observes existing .fade-in elements on mount', () => {
    document.body.innerHTML = '<div class="fade-in">Hello</div>'

    mount(createTestComp(), { attachTo: document.body })

    expect(mockObserve).toHaveBeenCalled()
    const observedEl = mockObserve.mock.calls[0][0]
    expect(observedEl.classList.contains('fade-in')).toBe(true)
    expect(mockMutateObserve).toHaveBeenCalled()
  })

  it('does not observe elements that do not match the selector', () => {
    document.body.innerHTML = '<div class="other-class">Hello</div>'

    mount(createTestComp(), { attachTo: document.body })

    const observedCalls = mockObserve.mock.calls.length
    expect(observedCalls).toBe(0)
    expect(mockMutateObserve).toHaveBeenCalled()
  })

  it('disconnects observers on unmount', () => {
    const wrapper = mount(createTestComp(), { attachTo: document.body })
    wrapper.unmount()

    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockMutateDisconnect).toHaveBeenCalled()
  })

  it('adds visible class when element is intersecting', () => {
    document.body.innerHTML = '<div class="fade-in">Hello</div>'

    mount(createTestComp(), { attachTo: document.body })

    const el = document.querySelector('.fade-in')

    // Simulate intersection
    ioCallback([{ isIntersecting: true, target: el }])

    expect(el.classList.contains('visible')).toBe(true)
  })

  it('uses custom selector when provided', () => {
    document.body.innerHTML = '<div class="custom-fade">Hello</div>'

    mount(createTestComp('.custom-fade'), { attachTo: document.body })

    expect(mockObserve).toHaveBeenCalled()
    const observedEl = mockObserve.mock.calls[0][0]
    expect(observedEl.classList.contains('custom-fade')).toBe(true)
  })

  // ── New tests for uncovered paths ─────────────────────────────────

  describe('observe early return', () => {
    it('does not observe elements that already have the visible class', () => {
      document.body.innerHTML = '<div class="fade-in visible">Already visible</div>'

      mount(createTestComp(), { attachTo: document.body })

      // The observe() function should return early without calling io.observe
      expect(mockObserve).not.toHaveBeenCalled()
    })
  })

  describe('rootEl parameter', () => {
    it('uses a custom root element instead of document', () => {
      const rootEl = document.createElement('div')
      rootEl.innerHTML = '<div class="fade-in">Inside custom root</div>'
      document.body.appendChild(rootEl)
      const rootRef = ref(rootEl)

      mount(createTestComp(undefined, rootRef), { attachTo: document.body })

      // Should observe the element inside the custom root
      expect(mockObserve).toHaveBeenCalled()
      const observedEl = mockObserve.mock.calls[0][0]
      expect(observedEl.classList.contains('fade-in')).toBe(true)

      // MutationObserver should observe the custom root, not document.body
      expect(mockMutateObserve).toHaveBeenCalledWith(rootEl, {
        childList: true,
        subtree: true,
      })
    })

    it('falls back to document when rootEl is null', () => {
      document.body.innerHTML = '<div class="fade-in">Hello</div>'

      mount(createTestComp(), { attachTo: document.body })

      // MutationObserver should be set on document.body
      expect(mockMutateObserve).toHaveBeenCalledWith(document.body, {
        childList: true,
        subtree: true,
      })
    })
  })

  describe('MutationObserver handling', () => {
    it('observes added nodes that match the selector', () => {
      mount(createTestComp(), { attachTo: document.body })

      // Simulate a MutationRecord with an added node matching .fade-in
      const addedNode = document.createElement('div')
      addedNode.className = 'fade-in'

      moCallback([{ addedNodes: [addedNode] }])

      expect(mockObserve).toHaveBeenCalledWith(addedNode)
    })

    it('observes children of added nodes that match the selector', () => {
      mount(createTestComp(), { attachTo: document.body })

      const container = document.createElement('div')
      const child = document.createElement('div')
      child.className = 'fade-in'
      container.appendChild(child)

      moCallback([{ addedNodes: [container] }])

      expect(mockObserve).toHaveBeenCalledWith(child)
    })

    it('skips non-element nodes (nodeType !== 1)', () => {
      mount(createTestComp(), { attachTo: document.body })

      // Text nodes have nodeType 3
      const textNode = document.createTextNode('hello')
      // Comment nodes have nodeType 8
      const commentNode = document.createComment('comment')

      moCallback([{ addedNodes: [textNode, commentNode] }])

      // observe should not be called for non-element nodes
      expect(mockObserve).not.toHaveBeenCalled()
    })

    it('skips added elements that do not match the selector', () => {
      mount(createTestComp(), { attachTo: document.body })

      const nonMatching = document.createElement('div')
      nonMatching.className = 'other-class'

      moCallback([{ addedNodes: [nonMatching] }])

      expect(mockObserve).not.toHaveBeenCalled()
    })

    it('observes an added node that directly matches via matches()', () => {
      mount(createTestComp('.custom-selector'), { attachTo: document.body })

      const el = document.createElement('div')
      el.className = 'custom-selector'

      moCallback([{ addedNodes: [el] }])

      expect(mockObserve).toHaveBeenCalledWith(el)
    })
  })

  describe('IntersectionObserver callback', () => {
    it('does nothing for non-intersecting entries', () => {
      document.body.innerHTML = '<div class="fade-in">Hello</div>'

      mount(createTestComp(), { attachTo: document.body })

      const el = document.querySelector('.fade-in')

      ioCallback([{ isIntersecting: false, target: el }])

      // Class should NOT be added
      expect(el.classList.contains('visible')).toBe(false)
      // unobserve should NOT be called
      expect(mockUnobserve).not.toHaveBeenCalled()
    })

    it('unobserves element after adding visible class', () => {
      document.body.innerHTML = '<div class="fade-in">Hello</div>'

      mount(createTestComp(), { attachTo: document.body })

      const el = document.querySelector('.fade-in')

      ioCallback([{ isIntersecting: true, target: el }])

      expect(el.classList.contains('visible')).toBe(true)
      expect(mockUnobserve).toHaveBeenCalledWith(el)
    })

    it('handles multiple entries in a single callback', () => {
      document.body.innerHTML = `
        <div class="fade-in" id="a">A</div>
        <div class="fade-in" id="b">B</div>
      `

      mount(createTestComp(), { attachTo: document.body })

      const elA = document.querySelector('#a')
      const elB = document.querySelector('#b')

      // First intersecting, second not
      ioCallback([
        { isIntersecting: true, target: elA },
        { isIntersecting: false, target: elB },
      ])

      expect(elA.classList.contains('visible')).toBe(true)
      expect(elB.classList.contains('visible')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('uses document when rootEl is a ref with null value', () => {
      document.body.innerHTML = '<div class="fade-in">Hello</div>'
      const nullRef = ref(null)

      mount(createTestComp(undefined, nullRef), { attachTo: document.body })

      // Should observe element on document.body
      expect(mockObserve).toHaveBeenCalled()
      // MutationObserver should observe document.body (root === document)
      expect(mockMutateObserve).toHaveBeenCalledWith(document.body, {
        childList: true,
        subtree: true,
      })
    })

    it('handles empty DOM with no matching elements', () => {
      // No elements in DOM
      mount(createTestComp(), { attachTo: document.body })

      // Observe should not have been called for any element
      expect(mockObserve).not.toHaveBeenCalled()
      // But MutationObserver should still be observing
      expect(mockMutateObserve).toHaveBeenCalled()
    })

    it('calls disconnect on both observers when unmounted', () => {
      const wrapper = mount(createTestComp(), { attachTo: document.body })
      expect(mockMutateObserve).toHaveBeenCalled()

      wrapper.unmount()

      expect(mockDisconnect).toHaveBeenCalled()
      expect(mockMutateDisconnect).toHaveBeenCalled()
    })
  })
})

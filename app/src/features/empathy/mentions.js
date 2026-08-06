// Lightweight @mention support for empathy posts/comments.
// Mentions are stored inline in the text itself as "@[Name]" tokens —
// no schema change needed, existing text columns already carry them.
import { ref, computed, nextTick, reactive } from 'vue'

const MENTION_TOKEN = /@\[([^\]]+)\]/g

export function renderMentionsHtml(text) {
  if (!text) return ''
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.replace(MENTION_TOKEN, '<span class="mention">@$1</span>')
}

// Attach to a textarea (via v-model textRef + @input handler) to get an
// inline "@name" autocomplete backed by directoryRef (array of {name, role}).
export function useMentionPicker(textRef, directoryRef) {
  const mentionQuery = ref(null) // null = picker closed
  const start = ref(0)
  const end   = ref(0)

  const mentionMatches = computed(() => {
    if (mentionQuery.value === null) return []
    const q = mentionQuery.value.toLowerCase()
    return (directoryRef.value || [])
      .filter(p => p.name?.toLowerCase().includes(q))
      .slice(0, 6)
  })

  function onMentionInput(e) {
    const el = e.target
    const pos = el.selectionStart
    const before = el.value.slice(0, pos)
    const m = before.match(/@([^\s@[\]]*)$/)
    if (m) {
      mentionQuery.value = m[1]
      start.value = pos - m[0].length
      end.value   = pos
    } else {
      mentionQuery.value = null
    }
  }

  function pickMention(person, el) {
    const full   = textRef.value
    const before = full.slice(0, start.value)
    const after  = full.slice(end.value)
    const insert = `@[${person.name}] `
    textRef.value = before + insert + after
    mentionQuery.value = null
    nextTick(() => {
      const pos = before.length + insert.length
      el?.setSelectionRange?.(pos, pos)
      el?.focus?.()
    })
  }

  function closeMention() { mentionQuery.value = null }

  return reactive({ mentionQuery, mentionMatches, onMentionInput, pickMention, closeMention })
}

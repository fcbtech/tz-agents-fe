import { useRef } from 'react'
import { Extension } from '@tiptap/core'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createMentionExtension } from './MentionExtension'
import type { Mention } from '@/lib/types/chat'
import type { MasterDataEntityType } from '@/lib/types/master-data'

interface Props {
  onSend: (text: string, mentions: Mention[]) => void
  disabled: boolean
}

/**
 * Extract plain text and structured mentions from Tiptap's JSON document.
 */
function extractMentions(json: Record<string, unknown>): {
  text: string
  mentions: Mention[]
} {
  const mentions: Mention[] = []
  let text = ''

  function walk(node: Record<string, unknown>) {
    if (node.type === 'mention') {
      const attrs = node.attrs as Record<string, unknown>
      const category = attrs.category as string | undefined
      const metadata = attrs.metadata as Record<string, unknown> | undefined
      mentions.push({
        type: (category ?? 'counterparty') as MasterDataEntityType,
        id: (attrs.id as string | undefined) ?? '',
        displayName: attrs.label as string,
        metadata: metadata ?? {},
      })
      text += `@${attrs.label}`
    } else if (node.type === 'text') {
      text += node.text as string
    } else if (node.type === 'paragraph' || node.type === 'doc') {
      const content = node.content as Record<string, unknown>[] | undefined
      if (content) content.forEach(walk)
      if (node.type === 'paragraph') text += '\n'
    }
  }

  walk(json)
  return { text: text.trim(), mentions }
}

export default function ChatInput({ onSend, disabled }: Props) {
  const onSendRef = useRef(onSend)
  const disabledRef = useRef(disabled)
  onSendRef.current = onSend
  disabledRef.current = disabled

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
      }),
      Placeholder.configure({
        placeholder: 'Type a message... Use @ to mention master data',
      }),
      createMentionExtension(),
      // Low-priority extension so mention suggestion handles Enter first
      Extension.create({
        name: 'submitOnEnter',
        priority: 1,
        addKeyboardShortcuts() {
          return {
            Enter: ({ editor: ed }) => {
              if (disabledRef.current || ed.isEmpty) return false
              const json = ed.getJSON()
              const { text, mentions } = extractMentions(
                json as Record<string, unknown>,
              )
              if (!text) return false
              onSendRef.current(text, mentions)
              ed.commands.clearContent()
              return true
            },
          }
        },
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[40px] max-h-[120px] overflow-y-auto',
      },
    },
  })

  const handleSend = () => {
    if (editor.isEmpty || disabled) return

    const json = editor.getJSON()
    const { text, mentions } = extractMentions(json as Record<string, unknown>)

    if (!text) return

    onSend(text, mentions)
    editor.commands.clearContent()
  }

  return (
    <div className="flex items-end gap-2 max-w-3xl mx-auto">
      <div className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400">
        <EditorContent editor={editor} />
      </div>
      <Button
        size="icon"
        onClick={handleSend}
        disabled={disabled}
        className="rounded-xl bg-gray-400 hover:bg-gray-700"
      >
        <Send size={20} />
      </Button>
    </div>
  )
}

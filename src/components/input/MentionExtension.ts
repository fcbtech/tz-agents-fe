import Mention from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import type { Instance } from 'tippy.js'
import tippy from 'tippy.js'
import MentionDropdown from './MentionDropdown'

export function createMentionExtension() {
  const CustomMention = Mention.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        category: { default: null },
        metadata: { default: {} },
      }
    },
  })

  return CustomMention.configure({
    HTMLAttributes: {
      class:
        'mention-chip bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md text-sm font-medium',
    },
    suggestion: {
      char: '@',
      items: () => {
        // Actual data fetching happens inside MentionDropdown
        // We return empty here; the component handles everything
        return []
      },
      render: () => {
        let component: ReactRenderer | undefined
        let popup: Instance[] | undefined

        return {
          onStart: (props) => {
            component = new ReactRenderer(MentionDropdown, {
              props,
              editor: props.editor,
            })

            if (!props.clientRect) return

            popup = tippy('body', {
              getReferenceClientRect: props.clientRect as () => DOMRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
              maxWidth: 320,
            })
          },
          onUpdate: (props) => {
            component?.updateProps(props)
            if (props.clientRect && popup?.[0]) {
              popup[0].setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              })
            }
          },
          onKeyDown: (props) => {
            if (props.event.key === 'Escape') {
              popup?.[0]?.hide()
              return true
            }
            return (
              component?.ref as
                | { onKeyDown: (props: unknown) => boolean }
                | undefined
            )?.onKeyDown(props) ?? false
          },
          onExit: () => {
            popup?.[0]?.destroy()
            component?.destroy()
          },
        }
      },
    },
  })
}

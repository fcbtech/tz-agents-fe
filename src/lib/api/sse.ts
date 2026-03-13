import { useAuthStore } from '@/lib/store/auth-store'
import { API_BASE_URL } from '@/lib/constants'
import { getValidToken, refreshAccessToken } from './auth'

export interface SSEEvent {
  event: string
  data: string
}

export async function* streamSSE(
  path: string,
  body: Record<string, unknown>,
): AsyncGenerator<SSEEvent> {
  const token = await getValidToken()
  let response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  if (response.status === 401) {
    const newToken = await refreshAccessToken()
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
      },
      body: JSON.stringify(body),
    })
  }

  if (!response.ok) {
    if (response.status === 401) useAuthStore.getState().logout()
    throw new Error(`Chat request failed: ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = 'message'
  let currentData = ''

  for (
    let result = await reader.read();
    !result.done;
    result = await reader.read()
  ) {
    buffer += decoder.decode(result.value, { stream: true })
    // Normalize \r\n to \n (sse-starlette sends \r\n line endings)
    const lines = buffer.replace(/\r\n/g, '\n').split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        currentData = line.slice(6)
      } else if (line === '') {
        if (currentData) {
          yield { event: currentEvent, data: currentData }
          currentEvent = 'message'
          currentData = ''
        }
      }
    }
  }
}

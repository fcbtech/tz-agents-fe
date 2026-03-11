import axios from 'axios'

const AUTH_URL = import.meta.env.VITE_AUTH_URL as string

export const authClient = axios.create({
  baseURL: AUTH_URL,
  headers: { 'Content-Type': 'application/json' },
})

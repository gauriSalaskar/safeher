'use client'

import { getSupabaseClient } from '@/lib/supabase/client'

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private stream: MediaStream | null = null
  private isRecording = false

  async start(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })
      this.chunks = []
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data)
      }
      this.mediaRecorder.start(1000) // collect chunks every second
      this.isRecording = true
      return true
    } catch (error) {
      console.error('Failed to start recording:', error)
      return false
    }
  }

  stop(): Blob | null {
    if (!this.mediaRecorder || !this.isRecording) return null
    this.mediaRecorder.stop()
    this.stream?.getTracks().forEach(t => t.stop())
    this.isRecording = false
    const blob = new Blob(this.chunks, { type: 'audio/webm' })
    this.chunks = []
    return blob
  }

  async stopAndUpload(userId: string, alertId: string): Promise<string | null> {
    // Wait for final chunks to be collected
    await new Promise<void>((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) { resolve(); return }
      this.mediaRecorder.addEventListener('stop', () => resolve(), { once: true })
      this.mediaRecorder.stop()
      this.stream?.getTracks().forEach(t => t.stop())
      this.isRecording = false
    })
    
    const blob = new Blob(this.chunks, { type: 'audio/webm' })
    this.chunks = []
    console.log('Audio blob size:', blob.size)
    if (!blob || blob.size === 0) return null

    try {
      const supabase = getSupabaseClient()
      const fileName = `${userId}/${alertId}_${Date.now()}.webm`
      const { data, error } = await supabase.storage
        .from('emergency-recordings')
        .upload(fileName, blob, { contentType: 'audio/webm', upsert: false })

      if (error) { console.error('Upload error:', error); return null }

      const { data: urlData } = supabase.storage
        .from('emergency-recordings')
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Upload failed:', error)
      return null
    }
  }

  get active() { return this.isRecording }
}

// Singleton
let recorder: AudioRecorder | null = null

export function getAudioRecorder(): AudioRecorder {
  if (!recorder) recorder = new AudioRecorder()
  return recorder
}

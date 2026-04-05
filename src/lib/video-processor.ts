/**
 * Video Processing Utility
 *
 * Extracts key frames from video files for Claude analysis.
 * Note: In production, this would use FFmpeg or a cloud service.
 * For now, we provide client-side frame extraction using canvas and video element.
 */

export interface ExtractedFrame {
  base64: string
  timestamp: string
}

export interface VideoFramesResult {
  frames: ExtractedFrame[]
  duration: number
  resolution: { width: number; height: number }
}

export interface VideoMetadata {
  duration: number
  resolution: { width: number; height: number }
  hasAudio: boolean
  fileSize: number
  format: string
}

/**
 * Extracts key frames from a video file
 * @param file - The video file from input
 * @param numFrames - Number of frames to extract (default: 5)
 * @returns Promise with extracted frames and metadata
 */
export async function extractVideoFrames(
  file: File,
  numFrames: number = 5
): Promise<VideoFramesResult> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    const url = URL.createObjectURL(file)
    video.src = url

    video.onloadedmetadata = () => {
      const duration = video.duration
      const { videoWidth, videoHeight } = video

      canvas.width = videoWidth
      canvas.height = videoHeight

      const frames: ExtractedFrame[] = []
      const interval = duration / (numFrames + 1) // Spread frames evenly

      let framesExtracted = 0

      const extractFrame = (index: number) => {
        if (index > numFrames) {
          URL.revokeObjectURL(url)
          resolve({
            frames,
            duration: Math.round(duration),
            resolution: { width: videoWidth, height: videoHeight },
          })
          return
        }

        video.currentTime = interval * index

        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight)
          const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
          const timestamp = formatTimestamp(interval * index)

          frames.push({
            base64,
            timestamp,
          })

          extractFrame(index + 1)
        }
      }

      extractFrame(1)
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video'))
    }
  })
}

/**
 * Extracts video metadata without extracting frames
 * @param file - The video file
 * @returns Promise with video metadata
 */
export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.src = url

    video.onloadedmetadata = () => {
      const metadata: VideoMetadata = {
        duration: Math.round(video.duration),
        resolution: {
          width: video.videoWidth,
          height: video.videoHeight,
        },
        hasAudio: video.mozHasAudio !== false, // Default to true if unsure
        fileSize: file.size,
        format: file.type,
      }

      URL.revokeObjectURL(url)
      resolve(metadata)
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video metadata'))
    }
  })
}

/**
 * Formats seconds to timestamp string (MM:SS)
 */
function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Validates if a file is a valid video format
 */
export function isValidVideoFormat(file: File): boolean {
  const validTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
  ]

  // Check MIME type
  if (validTypes.includes(file.type)) {
    return true
  }

  // Fallback: check extension
  const validExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv']
  const name = file.name.toLowerCase()
  return validExtensions.some(ext => name.endsWith(ext))
}

/**
 * Gets human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

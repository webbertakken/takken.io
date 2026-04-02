export interface Video {
  id: string
  title: string
  label: string
  thumbnailUrl?: string
  youtubeUrl?: string
}

export type TrackColour = 'human' | 'developer' | 'deep-dive'

export interface Track {
  id: string
  title: string
  colour: TrackColour
  videos: Video[]
}

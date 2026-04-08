export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      courses: {
        Row: Course
        Insert: Omit<Course, 'id' | 'created_at'>
        Update: Partial<Omit<Course, 'id'>>
      }
      rounds: {
        Row: Round
        Insert: Omit<Round, 'id' | 'created_at'>
        Update: Partial<Omit<Round, 'id'>>
      }
      hole_scores: {
        Row: HoleScore
        Insert: Omit<HoleScore, 'id'>
        Update: Partial<Omit<HoleScore, 'id'>>
      }
      leagues: {
        Row: League
        Insert: Omit<League, 'id' | 'created_at'>
        Update: Partial<Omit<League, 'id'>>
      }
      league_members: {
        Row: LeagueMember
        Insert: LeagueMember
        Update: Partial<LeagueMember>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: 'player' | 'commissioner' | 'admin'
  created_at: string
}

export interface Course {
  id: string
  name: string
  city: string | null
  state: string | null
  par: number
  hole_pars: number[] // array of 18 pars
  lat: number | null
  lng: number | null
  created_at: string
}

export interface Round {
  id: string
  user_id: string
  course_id: string
  date: string
  total_score: number
  total_putts: number | null
  fairways_hit: number | null
  greens_in_regulation: number | null
  notes: string | null
  is_locked: boolean
  created_at: string
  // joined
  course?: Course
  profile?: Profile
  hole_scores?: HoleScore[]
}

export interface HoleScore {
  id: string
  round_id: string
  hole_number: number
  strokes: number
  putts: number | null
  fairway_hit: boolean | null
  gir: boolean | null
}

export interface League {
  id: string
  name: string
  commissioner_id: string
  season_start: string
  season_end: string
  settings: Record<string, unknown>
  created_at: string
}

export interface LeagueMember {
  league_id: string
  user_id: string
  joined_at: string
  profile?: Profile
}

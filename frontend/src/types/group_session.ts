export enum GroupSessionStatus {
  OPEN = 'OPEN',
  FULL = 'FULL',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum GroupParticipantStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface GroupParticipantStudent {
  id: number;
  full_name?: string;
  email: string;
  avatar_url?: string;
}

export interface GroupSessionParticipant {
  id: number;
  session_id: number;
  student_id: number;
  status: GroupParticipantStatus;
  amount_paid: number;
  student_note?: string;
  checked_in_at?: string;
  joined_at: string;
  student?: GroupParticipantStudent;
}

export interface GroupSessionExpert {
  id: number;
  user_id: number;
  user?: GroupParticipantStudent;
}

export interface GroupSession {
  id: number;
  expert_id: number;
  title: string;
  description?: string;
  session_date: string; // YYYY-MM-DD
  start_time: string;  // HH:MM
  end_time: string;    // HH:MM
  max_participants: number;
  price_per_participant: number;
  status: GroupSessionStatus;
  meeting_url?: string;
  current_participants: number;
  available_slots: number;
  created_at: string;
  expert?: GroupSessionExpert;
  participants?: GroupSessionParticipant[];
}

export interface GroupSessionCreate {
  title: string;
  description?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  price_per_participant: number;
}

export interface GroupSessionUpdate {
  title?: string;
  description?: string;
  session_date?: string;
  start_time?: string;
  end_time?: string;
  max_participants?: number;
  price_per_participant?: number;
  meeting_url?: string;
  status?: GroupSessionStatus;
}

export interface StudentSessionSummary {
  student_id: number;
  student_name?: string;
  student_email: string;
  student_avatar?: string;
  total_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  last_joined_at?: string;
  recent_sessions: GroupSession[];
}
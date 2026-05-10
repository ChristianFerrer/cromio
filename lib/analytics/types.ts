export type EventKind =
  | "page_view"
  | "session_start"
  | "signup_done"
  | "onboarding_done"
  | "first_cromo_added"
  | "sticker_changed"
  | "match_seen"
  | "chat_opened"
  | "message_sent"
  | "meeting_proposed"
  | "meeting_confirmed"
  | "meeting_completed"
  | "rating_submitted"
  | "push_enabled"
  | "profile_updated"
  | "client_error"
  | "admin_action"
  | "favorite_added"
  | "favorite_removed";

export type TrackPayload = {
  kind: EventKind;
  path?: string;
  metadata?: Record<string, unknown>;
};

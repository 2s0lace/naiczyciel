export const QUIZ_ONBOARDING_STORAGE_KEY = "e8_quiz_onboarding_seen_v1";
export const QUIZ_ONBOARDING_SESSION_STORAGE_KEY = "e8_quiz_onboarding_seen_session_v1";
export const QUIZ_CLIENT_PROGRESS_KEY_PREFIX = "e8_quiz_progress_v1_";
export const QUIZ_ACTIVE_SESSION_STORAGE_KEY = "e8_quiz_active_session_v1";

export type ActiveQuizSessionMap = Record<
  string,
  {
    sessionId: string;
    updatedAt: string;
  }
>;

export function getProgressStorageKey(sessionId: string) {
  return `${QUIZ_CLIENT_PROGRESS_KEY_PREFIX}${sessionId}`;
}

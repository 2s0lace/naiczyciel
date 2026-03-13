"use client";

export type QuizSoundKey = "click" | "success" | "error" | "completion";

type PlayOptions = {
  minIntervalMs?: number;
};

const SOUND_SRC: Record<QuizSoundKey, string> = {
  click: "/audio/click.mp3",
  success: "/audio/success.mp3",
  error: "/audio/error.mp3",
  completion: "/audio/completion.wav",
};

const SOUND_VOLUME: Record<QuizSoundKey, number> = {
  click: 0.32,
  success: 0.38,
  error: 0.18,
  completion: 0.44,
};

export const QUIZ_SOUND_MUTED_STORAGE_KEY = "e8_quiz_sound_muted";

class QuizSoundManager {
  private enabled = true;
  private unlocked = false;
  private audioByKey: Partial<Record<QuizSoundKey, HTMLAudioElement>> = {};
  private lastPlayedAt: Partial<Record<QuizSoundKey, number>> = {};

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  unlock() {
    this.unlocked = true;
  }

  stopAll() {
    for (const audio of Object.values(this.audioByKey)) {
      if (!audio) {
        continue;
      }

      audio.pause();
      audio.currentTime = 0;
    }
  }

  play(key: QuizSoundKey, options: PlayOptions = {}) {
    if (typeof window === "undefined" || !this.enabled || !this.unlocked) {
      return;
    }

    const now = Date.now();
    const minInterval = options.minIntervalMs ?? 70;
    const previous = this.lastPlayedAt[key] ?? 0;

    if (now - previous < minInterval) {
      return;
    }

    if (key === "success") {
      this.stop("error");
    } else if (key === "error") {
      this.stop("success");
    } else if (key === "completion") {
      this.stop("click");
      this.stop("success");
      this.stop("error");
    }

    const audio = this.ensureAudio(key);

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    this.lastPlayedAt[key] = now;
    const playPromise = audio.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Ignore playback promise rejections (e.g. gesture restrictions).
      });
    }
  }

  private stop(key: QuizSoundKey) {
    const audio = this.audioByKey[key];

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
  }

  private ensureAudio(key: QuizSoundKey): HTMLAudioElement | null {
    if (typeof window === "undefined") {
      return null;
    }

    const existing = this.audioByKey[key];

    if (existing) {
      return existing;
    }

    const audio = new Audio(SOUND_SRC[key]);
    audio.preload = "auto";
    audio.volume = SOUND_VOLUME[key];
    audio.loop = false;

    this.audioByKey[key] = audio;
    return audio;
  }
}

export const quizSoundManager = new QuizSoundManager();


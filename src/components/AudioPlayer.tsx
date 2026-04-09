import { useEffect, useRef, useState } from "react";
import "./AudioPlayer.css";

interface AudioPlayerProps {
  audioUrl: string | null;
  isPlaying: boolean;
  onEnded?: () => void;
  autoPlay?: boolean;
}

export function AudioPlayer({
  audioUrl,
  isPlaying,
  onEnded,
  autoPlay = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      setIsLoading(false);
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      onEnded?.();
    });

    audio.addEventListener("canplaythrough", () => {
      if (autoPlay && isPlaying) {
        audio.play().catch(console.error);
      }
    });

    setIsLoading(true);

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [audioUrl, autoPlay, isPlaying, onEnded]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!audioUrl) return null;

  return (
    <div className="audio-player">
      {isLoading && <span className="loading-text">Loading audio...</span>}
      {!isLoading && duration > 0 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default AudioPlayer;
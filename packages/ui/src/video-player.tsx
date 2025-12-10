"use client";

import * as React from "react";
import { cn } from "./index";

interface VideoPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  poster?: string;
  title?: string;
  aspectRatio?: "16:9" | "4:3" | "1:1" | "9:16";
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
}

const aspectRatioClasses = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
};

function getVideoType(src: string): "youtube" | "vimeo" | "mux" | "native" {
  if (src.includes("youtube.com") || src.includes("youtu.be")) {
    return "youtube";
  }
  if (src.includes("vimeo.com")) {
    return "vimeo";
  }
  if (src.includes("mux.com") || src.includes("stream.mux.com")) {
    return "mux";
  }
  return "native";
}

function getYouTubeEmbedUrl(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2].length === 11 ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

function getVimeoEmbedUrl(url: string): string {
  const regExp = /vimeo\.com\/(?:video\/)?(\d+)/;
  const match = url.match(regExp);
  const videoId = match ? match[1] : null;
  return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
}

export function VideoPlayer({
  src,
  poster,
  title,
  aspectRatio = "16:9",
  autoPlay = false,
  muted = false,
  controls = true,
  loop = false,
  onEnded,
  onTimeUpdate,
  onPlay,
  onPause,
  className,
  ...props
}: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const videoType = getVideoType(src);

  const handleTimeUpdate = () => {
    if (videoRef.current && onTimeUpdate) {
      onTimeUpdate(videoRef.current.currentTime, videoRef.current.duration);
    }
  };

  if (videoType === "youtube" || videoType === "vimeo") {
    const embedUrl =
      videoType === "youtube" ? getYouTubeEmbedUrl(src) : getVimeoEmbedUrl(src);

    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-lg bg-muted",
          aspectRatioClasses[aspectRatio],
          className,
        )}
        {...props}
      >
        <iframe
          src={`${embedUrl}?autoplay=${autoPlay ? 1 : 0}&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}`}
          title={title || "Video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted",
        aspectRatioClasses[aspectRatio],
        className,
      )}
      {...props}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        controls={controls}
        loop={loop}
        onEnded={onEnded}
        onTimeUpdate={handleTimeUpdate}
        onPlay={onPlay}
        onPause={onPause}
        className="absolute inset-0 h-full w-full object-cover"
      >
        <track kind="captions" />
      </video>
    </div>
  );
}

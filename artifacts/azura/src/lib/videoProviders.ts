/**
 * Video URL Provider Parser
 * Extracts embeddable URLs from various video platforms
 */

export type VideoProvider = "youtube" | "instagram" | "facebook" | "google_drive" | "direct" | "unknown";

export interface ParsedVideo {
  provider: VideoProvider;
  embedUrl: string;
  thumbnail: string;
  title: string;
  isEmbeddable: boolean;
}

// YouTube
export function parseYouTube(url: string): ParsedVideo | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const videoId = match[1];
      return {
        provider: "youtube",
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        title: "YouTube Video",
        isEmbeddable: true,
      };
    }
  }
  return null;
}

// Instagram
export function parseInstagram(url: string): ParsedVideo | null {
  if (url.includes("instagram.com")) {
    const reelMatch = url.match(/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/);
    const tvMatch = url.match(/instagram\.com\/tv\/([a-zA-Z0-9_-]+)/);
    const postMatch = url.match(/instagram\.com\/p\/([a-zA-Z0-9_-]+)/);
    
    if (reelMatch || tvMatch) {
      // Instagram Reels/TV are embeddable
      return {
        provider: "instagram",
        embedUrl: url.split("?")[0] + "?__a=1", // Will need backend proxy for embed
        thumbnail: "",
        title: "Instagram Reel",
        isEmbeddable: true, // Requires proxy for actual embedding
      };
    }
    return {
      provider: "instagram",
      embedUrl: url,
      thumbnail: "",
      title: "Instagram Post",
      isEmbeddable: false,
    };
  }
  return null;
}

// Facebook
export function parseFacebook(url: string): ParsedVideo | null {
  if (url.includes("facebook.com") || url.includes("fb.watch")) {
    return {
      provider: "facebook",
      embedUrl: url,
      thumbnail: "",
      title: "Facebook Video",
      isEmbeddable: true, // Facebook has oEmbed but requires app approval
    };
  }
  return null;
}

// Google Drive
export function parseGoogleDrive(url: string): ParsedVideo | null {
  if (url.includes("drive.google.com")) {
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const previewMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
    
    if (fileMatch) {
      const fileId = fileMatch[1];
      return {
        provider: "google_drive",
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w640`,
        title: "Google Drive Video",
        isEmbeddable: true,
      };
    }
    if (previewMatch) {
      const fileId = previewMatch[1];
      return {
        provider: "google_drive",
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w640`,
        title: "Google Drive Video",
        isEmbeddable: true,
      };
    }
  }
  return null;
}

// Direct video URL
export function parseDirectVideo(url: string): ParsedVideo | null {
  const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
  const isVideo = videoExtensions.some(ext => url.toLowerCase().includes(ext));
  
  if (isVideo || url.startsWith("data:video/")) {
    return {
      provider: "direct",
      embedUrl: url,
      thumbnail: "",
      title: "Direct Video",
      isEmbeddable: true,
    };
  }
  return null;
}

// Main parser function
export function parseVideoUrl(url: string): ParsedVideo {
  // Clean URL
  const cleanUrl = url.trim().split("?")[0];
  
  // Try each provider
  const youtube = parseYouTube(cleanUrl);
  if (youtube) return youtube;
  
  const googleDrive = parseGoogleDrive(cleanUrl);
  if (googleDrive) return googleDrive;
  
  const instagram = parseInstagram(cleanUrl);
  if (instagram) return instagram;
  
  const facebook = parseFacebook(cleanUrl);
  if (facebook) return facebook;
  
  const direct = parseDirectVideo(cleanUrl);
  if (direct) return direct;
  
  // Unknown provider
  return {
    provider: "unknown",
    embedUrl: url,
    thumbnail: "",
    title: "External Video",
    isEmbeddable: false,
  };
}

// Get embed iframe HTML
export function getEmbedHtml(video: ParsedVideo, width = "100%" as string | number, height = "100%" as string | number): string {
  switch (video.provider) {
    case "youtube":
      return `<iframe width="${width}" height="${height}" src="${video.embedUrl}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" loading="lazy"></iframe>`;
    
    case "google_drive":
      return `<iframe src="${video.embedUrl}" width="${width}" height="${height}" allow="autoplay" loading="lazy"></iframe>`;
    
    case "instagram":
      return `<blockquote class="instagram-media" data-instgrm-permalink="${video.embedUrl.split("?__a=1")[0]}" data-instgrm-version="14"></blockquote><script async src="//www.instagram.com/embed.js"></script>`;
    
    case "facebook":
      return `<div id="fb-root"></div><script async defer src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v14.0"></script><div class="fb-video" data-href="${video.embedUrl}" data-width="${width}" data-show-text="false"></div>`;
    
    case "direct":
      return `<video src="${video.embedUrl}" controls style="width:${width};height:${height};"></video>`;
    
    default:
      return `<a href="${video.embedUrl}" target="_blank" rel="noopener noreferrer">Watch Video</a>`;
  }
}

// Get provider icon
export function getProviderIcon(provider: VideoProvider): string {
  switch (provider) {
    case "youtube": return "▶️";
    case "instagram": return "📸";
    case "facebook": return "👤";
    case "google_drive": return "📁";
    case "direct": return "🎬";
    default: return "🔗";
  }
}

// Get provider name
export function getProviderName(provider: VideoProvider): string {
  switch (provider) {
    case "youtube": return "YouTube";
    case "instagram": return "Instagram";
    case "facebook": return "Facebook";
    case "google_drive": return "Google Drive";
    case "direct": return "Direct Link";
    default: return "External";
  }
}
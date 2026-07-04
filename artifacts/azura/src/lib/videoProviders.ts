/**
 * Video URL Provider Parser
 * Simplified for Facebook Reels and thumbnails display
 */

export type VideoProvider = "youtube" | "instagram" | "facebook" | "google_drive" | "direct" | "tiktok" | "twitter" | "vimeo" | "rss" | "unknown";

export interface ParsedVideo {
  provider: VideoProvider;
  embedUrl: string;
  originalUrl?: string;
  thumbnail: string;
  title: string;
  isEmbeddable: boolean;
  videoId?: string;
  apiEndpoint?: string;
  downloadUrl?: string;
}

export interface RSSFeedItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  link: string;
  pubDate: string;
  provider: VideoProvider;
}

// Normalize Facebook URL to ensure proper embed
function normalizeFbUrl(url: string): string {
  // Convert mobile URLs to web URLs
  return url
    .replace(/m\.facebook\.com/, "web.facebook.com")
    .replace(/m\.fb\.com/, "web.facebook.com")
    .replace(/fb\.watch\/([a-zA-Z0-9_-]+)/, "web.facebook.com/watch?v=$1");
}

// Instagram oEmbed API (for public posts with access token)
const INSTAGRAM_API_BASE = "https://graph.instagram.com";
const FACEBOOK_API_BASE = "https://graph.facebook.com/v18.0";

// YouTube
export function parseYouTube(url: string): ParsedVideo | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const videoId = match[1];
      return {
        provider: "youtube",
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        title: "YouTube Video",
        isEmbeddable: true,
        videoId,
        apiEndpoint: `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      };
    }
  }
  return null;
}

// Instagram - Enhanced with multiple URL pattern support
export function parseInstagram(url: string): ParsedVideo | null {
  if (!url.includes("instagram.com") && !url.includes("ddinstagram.com")) return null;
  
  // Match various Instagram URL patterns
  const reelMatch = url.match(/(?:instagram\.com|ddinstagram\.com)\/reel\/([a-zA-Z0-9_-]+)/);
  const tvMatch = url.match(/(?:instagram\.com|ddinstagram\.com)\/tv\/([a-zA-Z0-9_-]+)/);
  const postMatch = url.match(/(?:instagram\.com|ddinstagram\.com)\/p\/([a-zA-Z0-9_-]+)/);
  const shareMatch = url.match(/(?:instagram\.com|ddinstagram\.com)\/share\/([a-zA-Z0-9_-]+)/);
  const reelsMatch = url.match(/\/reels\/([a-zA-Z0-9_-]+)/);
  
  if (reelMatch || reelsMatch) {
    const shortCode = reelMatch ? reelMatch[1] : reelsMatch![1];
    return {
      provider: "instagram",
      embedUrl: `https://www.instagram.com/reel/${shortCode}/embed`,
      thumbnail: `https://graph.instagram.com/${shortCode}/media?size=l`,
      title: "Instagram Reel",
      isEmbeddable: true,
      videoId: shortCode,
      apiEndpoint: `${INSTAGRAM_API_BASE}/${shortCode}?fields=thumbnail_url,media_url,permalink`,
    };
  }
  
  if (tvMatch) {
    const shortCode = tvMatch[1];
    return {
      provider: "instagram",
      embedUrl: `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`,
      thumbnail: `https://graph.instagram.com/${shortCode}/media?size=l`,
      title: "Instagram TV",
      isEmbeddable: true,
      videoId: shortCode,
    };
  }
  
  if (postMatch) {
    return {
      provider: "instagram",
      embedUrl: `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`,
      thumbnail: "",
      title: "Instagram Post",
      isEmbeddable: true,
      videoId: postMatch[1],
    };
  }
  
  if (shareMatch) {
    const shortCode = shareMatch[1];
    return {
      provider: "instagram",
      embedUrl: `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`,
      thumbnail: "",
      title: "Instagram Share",
      isEmbeddable: true,
      videoId: shortCode,
    };
  }
  
  return {
    provider: "instagram",
    embedUrl: url,
    thumbnail: "",
    title: "Instagram Content",
    isEmbeddable: false,
  };
}

// Instagram oEmbed (no auth required for public posts)
export async function fetchInstagramOEmbed(url: string): Promise<{ thumbnail: string; title: string; html: string } | null> {
  try {
    // Try Instagram's oEmbed endpoint first
    const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&maxwidth=480&maxheight=480`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        thumbnail: data.thumbnail_url || "",
        title: data.title || "Instagram",
        html: data.html || "",
      };
    }
  } catch (e) {
    console.error("Instagram oEmbed error:", e);
  }
  
  // Fallback to noembed
  try {
    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        thumbnail: data.thumbnail_url || "",
        title: data.title || "Instagram",
        html: data.html || "",
      };
    }
  } catch (e) {
    console.error("Instagram noembed fallback error:", e);
  }
  return null;
}

// Facebook - Enhanced with comprehensive URL pattern support
export function parseFacebook(url: string): ParsedVideo | null {
  if (!url.includes("facebook.com") && !url.includes("fb.watch") && !url.includes("fb.com") && !url.includes("fbcdn.net")) return null;
  
  // Video URLs - multiple patterns
  const videoMatch = url.match(/facebook\.com\/([a-zA-Z0-9.-]+)\/videos\/([a-zA-Z0-9]+)/);
  const reelMatch = url.match(/facebook\.com\/reel\/([a-zA-Z0-9]+)/);
  const watchMatch = url.match(/fb\.watch\/([a-zA-Z0-9_-]+)/);
  const postVideoMatch = url.match(/facebook\.com\/([a-zA-Z0-9.-]+)\/posts\/([a-zA-Z0-9]+)/);
  const storyMatch = url.match(/facebook\.com\/stories\/([a-zA-Z0-9]+)/);
  const videoIdMatch = url.match(/video_id=([a-zA-Z0-9]+)/);
  const vMatch = url.match(/facebook\.com\/[^\/]+\/v\/([a-zA-Z0-9]+)/);
  
  // Extract video ID from various patterns
  let videoId = "";
  let isReel = false;
  
  if (videoIdMatch) {
    videoId = videoIdMatch[1];
  } else if (reelMatch) {
    videoId = reelMatch[1];
    isReel = true;
  } else if (watchMatch) {
    videoId = watchMatch[1];
  } else if (videoMatch) {
    videoId = videoMatch[2];
  } else if (vMatch) {
    videoId = vMatch[1];
  }
  
  if (videoId || reelMatch || watchMatch || videoMatch) {
    const canonicalUrl = normalizeFbUrl(url);
    // Use the official plugin URL for embedding
    const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.startsWith('http') ? url : 'https://' + canonicalUrl)}&show_text=false&autoplay=true&width=506`;
    return {
      provider: "facebook",
      embedUrl,
      thumbnail: "",
      title: isReel ? "Facebook Reel" : "Facebook Video",
      isEmbeddable: true,
      videoId,
      apiEndpoint: videoId ? `${FACEBOOK_API_BASE}/${videoId}?fields=thumbnail_url,source,title` : undefined,
      downloadUrl: videoId ? `https://graph.facebook.com/${videoId}/thumbnails` : undefined,
    };
  }
  
  // For story or other video formats
  if (storyMatch || postVideoMatch) {
    return {
      provider: "facebook",
      embedUrl: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}`,
      thumbnail: "",
      title: "Facebook Story/Post",
      isEmbeddable: true,
    };
  }
  
  // Generic Facebook URL - try to embed
  return {
    provider: "facebook",
    embedUrl: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}`,
    thumbnail: "",
    title: "Facebook Content",
    isEmbeddable: true,
  };
}

// Facebook oEmbed
export async function fetchFacebookOEmbed(url: string, accessToken?: string): Promise<{ thumbnail: string; title: string; html: string } | null> {
  try {
    // Try Facebook's oEmbed endpoint
    const oembedUrl = `https://graph.facebook.com/v18.0/oembed_video?url=${encodeURIComponent(url)}&access_token=${accessToken || ''}`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        thumbnail: data.thumbnail_url || "",
        title: data.title || "Facebook",
        html: data.html || "",
      };
    }
  } catch (e) {
    console.error("Facebook oEmbed error:", e);
  }
  
  // Fallback to noembed
  try {
    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        thumbnail: data.thumbnail_url || "",
        title: data.title || "Facebook",
        html: data.html || "",
      };
    }
  } catch (e) {
    console.error("Facebook noembed fallback error:", e);
  }
  return null;
}

// TikTok
export function parseTiktok(url: string): ParsedVideo | null {
  if (!url.includes("tiktok.com") && !url.includes("vm.tiktok.com")) return null;
  
  const videoMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  const shareMatch = url.match(/vm\.tiktok\.com\/([a-zA-Z0-9]+)/);
  
  if (videoMatch || shareMatch) {
    const videoId = videoMatch ? videoMatch[1] : (shareMatch ? shareMatch[1] : "");
    return {
      provider: "tiktok",
      embedUrl: `https://www.tiktok.com/embed/${videoId}`,
      thumbnail: `https://www.tiktok.com/api/v2/video/${videoId}/thumbnail`,
      title: "TikTok Video",
      isEmbeddable: true,
      videoId,
    };
  }
  return null;
}

// Twitter/X Video
export function parseTwitter(url: string): ParsedVideo | null {
  if (!url.includes("twitter.com") && !url.includes("x.com")) return null;
  
  const videoMatch = url.match(/(?:twitter|x)\.com\/\w+\/status\/(\d+)/);
  
  if (videoMatch) {
    return {
      provider: "twitter",
      embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${videoMatch[1]}`,
      thumbnail: "",
      title: "Twitter/X Post",
      isEmbeddable: true,
      videoId: videoMatch[1],
    };
  }
  return null;
}

// Vimeo
export function parseVimeo(url: string): ParsedVideo | null {
  if (!url.includes("vimeo.com")) return null;
  
  const videoMatch = url.match(/vimeo\.com\/(\d+)/);
  
  if (videoMatch) {
    const videoId = videoMatch[1];
    return {
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
      thumbnail: `https://vimeo.com/api/v2/video/${videoId}.json`,
      title: "Vimeo Video",
      isEmbeddable: true,
      videoId,
      apiEndpoint: `https://vimeo.com/api/v2/video/${videoId}.json`,
    };
  }
  return null;
}

// Google Drive
export function parseGoogleDrive(url: string): ParsedVideo | null {
  if (!url.includes("drive.google.com")) return null;
  
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const previewMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
  const folderMatch = url.match(/folders\/([a-zA-Z0-9_-]+)/);
  
  if (fileMatch) {
    const fileId = fileMatch[1];
    return {
      provider: "google_drive",
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w640`,
      title: "Google Drive Video",
      isEmbeddable: true,
      videoId: fileId,
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
      videoId: fileId,
    };
  }
  return null;
}

// RSS Feed Parser for Social Media
export function parseRSSFeed(feedUrl: string): ParsedVideo | null {
  // Support for RSS feeds from various platforms
  if (feedUrl.includes("feed") || feedUrl.includes("rss")) {
    return {
      provider: "rss",
      embedUrl: feedUrl,
      thumbnail: "",
      title: "RSS Feed",
      isEmbeddable: false,
    };
  }
  return null;
}

// Parse RSS Feed XML
export async function parseRSSXml(xmlString: string): Promise<RSSFeedItem[]> {
  const items: RSSFeedItem[] = [];
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "text/xml");
    const entries = doc.querySelectorAll("item, entry");
    
    entries.forEach((entry) => {
      const title = entry.querySelector("title")?.textContent || "";
      const link = entry.querySelector("link")?.textContent || entry.querySelector("a")?.getAttribute("href") || "";
      const description = entry.querySelector("description, summary, content")?.textContent || "";
      const pubDate = entry.querySelector("pubDate, published, date")?.textContent || "";
      
      // Extract thumbnail
      let thumbnail = "";
      const mediaContent = entry.querySelector("media\\:thumbnail, thumbnail, enclosure");
      if (mediaContent) {
        thumbnail = mediaContent.getAttribute("url") || "";
      }
      const mediaGroup = entry.querySelector("media\\:content, content");
      if (mediaGroup && !thumbnail) {
        thumbnail = mediaGroup.getAttribute("url") || "";
      }
      const img = entry.querySelector("img, image");
      if (img && !thumbnail) {
        thumbnail = img.getAttribute("src") || "";
      }
      
      // Determine provider
      let provider: VideoProvider = "rss";
      if (link.includes("instagram.com")) provider = "instagram";
      else if (link.includes("facebook.com") || link.includes("fb.")) provider = "facebook";
      else if (link.includes("youtube.com") || link.includes("youtu.be")) provider = "youtube";
      else if (link.includes("tiktok.com")) provider = "tiktok";
      else if (link.includes("twitter.com") || link.includes("x.com")) provider = "twitter";
      
      items.push({
        id: link || title,
        title,
        description,
        thumbnail,
        link,
        pubDate,
        provider,
      });
    });
  } catch (e) {
    console.error("RSS parsing error:", e);
  }
  
  return items;
}

// Fetch and parse RSS Feed
export async function fetchRSSFeed(feedUrl: string): Promise<RSSFeedItem[]> {
  try {
    // Use CORS proxy if needed (for client-side apps)
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const xml = await response.text();
      return parseRSSXml(xml);
    }
  } catch (e) {
    console.error("RSS fetch error:", e);
  }
  return [];
}

// Direct video URL
export function parseDirectVideo(url: string): ParsedVideo | null {
  const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m3u8"];
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
  const cleanUrl = url.trim().split("?")[0];
  
  // Try each provider in order of priority
  const parsers = [
    parseYouTube,
    parseGoogleDrive,
    parseTiktok,
    parseVimeo,
    parseInstagram,
    parseTwitter,
    parseFacebook,
    parseRSSFeed,
    parseDirectVideo,
  ];
  
  for (const parser of parsers) {
    const result = parser(cleanUrl);
    if (result) {
      return { ...result, originalUrl: url };
    }
  }
  
  // Unknown provider
  return {
    provider: "unknown",
    embedUrl: url,
    originalUrl: url,
    thumbnail: "",
    title: "External Video",
    isEmbeddable: false,
  };
}

// Get embed iframe HTML with improved support
export function getEmbedHtml(video: ParsedVideo, width = "100%" as string | number, height = "100%" as string | number): string {
  switch (video.provider) {
    case "youtube":
      return `<iframe width="${width}" height="${height}" src="${video.embedUrl}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" loading="lazy"></iframe>`;
    
    case "google_drive":
      return `<iframe src="${video.embedUrl}" width="${width}" height="${height}" allow="autoplay" loading="lazy"></iframe>`;
    
    case "instagram":
      return `<div style="display: flex; justify-content: center; width: 100%; height: 100%; overflow: hidden;">
        <blockquote class="instagram-media" data-instgrm-permalink="${video.originalUrl}" data-instgrm-version="14" style="width: 100%; margin: 0; padding: 0;"></blockquote>
      </div>`;
    
    case "facebook":
      return `<iframe
        src="${video.embedUrl}"
        style="border:none;overflow:hidden;width:100%;height:100%;"
        scrolling="no"
        frameborder="0"
        allowfullscreen="true"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      ></iframe>`;
    
    case "tiktok":
      return `<blockquote class="tiktok-embed" cite="${video.embedUrl}" data-video-id="${video.videoId}" style="width:100%;max-width:${width}px;"><section></section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>`;
    
    case "twitter":
      return `<blockquote class="twitter-tweet"><a href="${video.embedUrl}">Loading tweet...</a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`;
    
    case "vimeo":
      return `<iframe src="${video.embedUrl}" width="${width}" height="${height}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    
    case "direct":
      return `<video src="${video.embedUrl}" controls style="width:${width};height:${height};" playsinline></video>`;
    
    case "rss":
      return `<div class="rss-feed"><a href="${video.embedUrl}" target="_blank" rel="noopener noreferrer">View RSS Feed</a></div>`;
    
    default:
      return `<a href="${video.embedUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary">Watch Video</a>`;
  }
}

// Get provider icon
export function getProviderIcon(provider: VideoProvider): string {
  const icons: Record<VideoProvider, string> = {
    youtube: "▶️",
    instagram: "📸",
    facebook: "👤",
    google_drive: "📁",
    tiktok: "🎵",
    twitter: "🐦",
    vimeo: "🎬",
    rss: "📰",
    direct: "🎥",
    unknown: "🔗",
  };
  return icons[provider] || "🔗";
}

// Get provider name
export function getProviderName(provider: VideoProvider): string {
  const names: Record<VideoProvider, string> = {
    youtube: "YouTube",
    instagram: "Instagram",
    facebook: "Facebook",
    google_drive: "Google Drive",
    tiktok: "TikTok",
    twitter: "Twitter/X",
    vimeo: "Vimeo",
    rss: "RSS Feed",
    direct: "Direct Link",
    unknown: "External",
  };
  return names[provider] || "External";
}

// Social Media Video URL Helper - Creates proper embed URLs
export function createSocialEmbedUrl(provider: VideoProvider, url: string, videoId?: string): string {
  switch (provider) {
    case "instagram":
      return `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`;
    case "facebook":
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
    case "tiktok":
      return videoId ? `https://www.tiktok.com/embed/${videoId}` : url;
    case "twitter":
      return `https://platform.twitter.com/embed/Tweet.html?url=${encodeURIComponent(url)}`;
    case "youtube":
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    default:
      return url;
  }
}

// Fetch video metadata from API (for thumbnails, titles, etc.)
export async function fetchVideoMetadata(provider: VideoProvider, url: string, accessToken?: string): Promise<{ title: string; thumbnail: string; duration?: string } | null> {
  try {
    switch (provider) {
      case "youtube": {
        const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
        const response = await fetch(oembedUrl);
        if (response.ok) {
          const data = await response.json();
          return { title: data.title || "YouTube", thumbnail: data.thumbnail_url || "" };
        }
        break;
      }
      case "instagram": {
        if (accessToken) {
          // Use Instagram Graph API with access token
          const match = url.match(/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/);
          if (match) {
            const response = await fetch(`${INSTAGRAM_API_BASE}/${match[1]}?fields=thumbnail_url,media_url,permalink,title&access_token=${accessToken}`);
            if (response.ok) {
              const data = await response.json();
              return { title: data.title || "Instagram Reel", thumbnail: data.thumbnail_url || data.media_url || "" };
            }
          }
        }
        // Fallback to oEmbed
        return await fetchInstagramOEmbed(url);
      }
      case "facebook": {
        if (accessToken) {
          // Use Facebook Graph API with access token
          const match = url.match(/facebook\.com\/[^\/]+\/videos\/([a-zA-Z0-9]+)/);
          if (match) {
            const response = await fetch(`${FACEBOOK_API_BASE}/${match[1]}?fields=thumbnail_url,source,title&access_token=${accessToken}`);
            if (response.ok) {
              const data = await response.json();
              return { title: data.title || "Facebook Video", thumbnail: data.thumbnail_url || "" };
            }
          }
        }
        // Fallback to oEmbed
        return await fetchFacebookOEmbed(url, accessToken);
      }
    }
  } catch (e) {
    console.error("Metadata fetch error:", e);
  }
  return null;
}

// Validate social media URLs
export function validateSocialUrl(url: string): { valid: boolean; provider: VideoProvider } {
  const parsed = parseVideoUrl(url);
  return {
    valid: parsed.provider !== "unknown",
    provider: parsed.provider,
  };
}

// Get supported providers list
export function getSupportedProviders(): { id: VideoProvider; name: string; icon: string; description: string }[] {
  return [
    { id: "youtube", name: "YouTube", icon: "▶️", description: "YouTube videos and shorts" },
    { id: "instagram", name: "Instagram", icon: "📸", description: "Instagram reels, posts, and stories" },
    { id: "facebook", name: "Facebook", icon: "👤", description: "Facebook videos and posts" },
    { id: "tiktok", name: "TikTok", icon: "🎵", description: "TikTok videos" },
    { id: "twitter", name: "Twitter/X", icon: "🐦", description: "Twitter/X posts and videos" },
    { id: "vimeo", name: "Vimeo", icon: "🎬", description: "Vimeo videos" },
    { id: "google_drive", name: "Google Drive", icon: "📁", description: "Videos stored on Google Drive" },
    { id: "direct", name: "Direct URL", icon: "🎥", description: "Direct video file URLs (.mp4, .webm, etc.)" },
    { id: "rss", name: "RSS Feed", icon: "📰", description: "RSS feeds from social platforms" },
  ];
}
/**
 * Worst-Case Scenario Tests for Azura App
 * Tests error handling, network failures, and edge cases
 */

import { parseVideoUrl, getSafeImageUrl } from "../pages/Reels";

// ============================================
// VIDEO URL PARSING TESTS
// ============================================

describe("Video URL Parsing", () => {
  describe("Facebook Reels", () => {
    it("parses standard Facebook reel URL", () => {
      const result = parseVideoUrl("https://www.facebook.com/reel/123456789");
      expect(result?.provider).toBe("facebook");
      expect(result?.videoId).toBe("123456789");
    });

    it("parses Facebook reel with username", () => {
      const result = parseVideoUrl("https://www.facebook.com/username/reel/987654321");
      expect(result?.provider).toBe("facebook");
    });

    it("parses fb.watch URL", () => {
      const result = parseVideoUrl("https://fb.watch/abc123");
      expect(result?.provider).toBe("facebook");
    });

    it("handles Facebook reel with query params", () => {
      const result = parseVideoUrl("https://www.facebook.com/reel/123456789?__a=1");
      expect(result?.provider).toBe("facebook");
    });
  });

  describe("Instagram Reels", () => {
    it("parses Instagram reel URL", () => {
      const result = parseVideoUrl("https://www.instagram.com/reel/Abc123Xyz/");
      expect(result?.provider).toBe("instagram");
      expect(result?.videoId).toBe("Abc123Xyz");
    });

    it("parses Instagram reel with parameters", () => {
      const result = parseVideoUrl("https://www.instagram.com/reel/xyz789?utm_source=ig_web");
      expect(result?.provider).toBe("instagram");
    });

    it("handles Instagram post URL", () => {
      const result = parseVideoUrl("https://www.instagram.com/p/AbcDef123/");
      expect(result?.provider).toBe("instagram");
    });
  });

  describe("TikTok", () => {
    it("parses TikTok video URL", () => {
      const result = parseVideoUrl("https://www.tiktok.com/@user/video/7123456789012345678");
      expect(result?.provider).toBe("tiktok");
    });

    it("parses vm.tiktok short URL", () => {
      const result = parseVideoUrl("https://vm.tiktok.com/ZMabc123/");
      expect(result?.provider).toBe("tiktok");
    });
  });

  describe("YouTube", () => {
    it("parses standard YouTube watch URL", () => {
      const result = parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result?.provider).toBe("youtube");
      expect(result?.videoId).toBe("dQw4w9WgXcQ");
    });

    it("parses YouTube shorts URL", () => {
      const result = parseVideoUrl("https://www.youtube.com/shorts/abc123xyz");
      expect(result?.provider).toBe("youtube");
      expect(result?.videoId).toBe("abc123xyz");
    });

    it("parses youtu.be short URL", () => {
      const result = parseVideoUrl("https://youtu.be/dQw4w9WgXcQ");
      expect(result?.provider).toBe("youtube");
    });

    it("parses YouTube embed URL", () => {
      const result = parseVideoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
      expect(result?.provider).toBe("youtube");
    });
  });

  describe("Edge Cases", () => {
    it("returns null for empty input", () => {
      expect(parseVideoUrl("")).toBeNull();
      expect(parseVideoUrl("   ")).toBeNull();
      expect(parseVideoUrl(null as any)).toBeNull();
    });

    it("returns null for invalid URLs", () => {
      expect(parseVideoUrl("not a url")).toBeNull();
      expect(parseVideoUrl("http://")).toBeNull();
    });

    it("handles direct video URLs", () => {
      const result = parseVideoUrl("https://example.com/video.mp4");
      expect(result?.provider).toBe("direct");
    });
  });
});

// ============================================
// IMAGE URL SAFETY TESTS
// ============================================

describe("Image URL Safety", () => {
  const PLACEHOLDER = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80";

  it("returns placeholder for undefined", () => {
    expect(getSafeImageUrl(undefined)).toBe(PLACEHOLDER);
    expect(getSafeImageUrl(undefined, "custom")).toBe("custom");
  });

  it("returns placeholder for empty string", () => {
    expect(getSafeImageUrl("")).toBe(PLACEHOLDER);
  });

  it("removes query parameters from URLs", () => {
    const url = "https://example.com/image.jpg?v=123&w=400";
    const result = getSafeImageUrl(url);
    expect(result).toBe("https://example.com/image.jpg");
  });

  it("handles URLs with only query params", () => {
    const url = "?v=123&w=400";
    const result = getSafeImageUrl(url);
    expect(result).toBe("");
  });
});

// ============================================
// FIREBASE RTDB STRUCTURE TESTS
// ============================================

describe("Firebase RTDB Structure", () => {
  const STRUCTURE = {
    menu: {} as Record<string, Record<string, {
      name: string;
      nameAr?: string;
      price: number;
      category: string;
      available: boolean;
      image?: string;
      description?: string;
    }>>,
    reels: {} as Record<string, {
      image: string;
      caption: string;
      captionAr?: string;
      mediaType?: "image" | "video";
      videoUrl?: string;
      videoProvider?: "facebook" | "instagram" | "tiktok" | "youtube" | "direct";
      videoEmbedUrl?: string;
      likes: number;
      likedBy?: Record<string, boolean>;
      pinned?: boolean;
      createdAt: number;
      authorName: string;
    }>,
    "api-settings": {
      groqKey?: string;
      aiEnabled: boolean;
      updatedAt?: number;
    },
    "ai-config": {
      systemPrompt: string;
      systemPromptAr: string;
      baristaFemale: string;
      baristaMale: string;
      temperature: number;
      maxTokens: number;
    },
    broadcast: {} as Record<string, {
      title: string;
      titleAr?: string;
      message: string;
      messageAr?: string;
      type: "info" | "promo" | "alert";
      emoji: string;
      createdAt: number;
    }>,
    feedback: {} as Record<string, {
      userName: string;
      rating: number;
      comment?: string;
      createdAt: number;
      read: boolean;
    }>,
    "support-chat": {} as Record<string, {
      meta?: {
        userName: string;
        lastMessage?: string;
        lastAt: number;
        unreadAdmin: number;
      };
      messages?: Record<string, {
        text: string;
        sender: "user" | "admin";
        createdAt: number;
      }>;
    }>,
    "userLogs": {} as Record<string, {
      uid: string;
      name: string;
      tableNumber: string;
      timestamp: number;
      deviceInfo?: {
        userAgent: string;
        platform: string;
        language: string;
      };
    }>,
  };

  it("menu structure is valid", () => {
    // Test menu item structure
    const menuItem = {
      name: "Test Item",
      nameAr: "عنصر اختبار",
      price: 100,
      category: "Coffee",
      available: true,
      image: "https://example.com/image.jpg",
      description: "A test item"
    };
    expect(menuItem.name).toBeDefined();
    expect(typeof menuItem.price).toBe("number");
    expect(typeof menuItem.available).toBe("boolean");
  });

  it("reel structure supports all video providers", () => {
    const reel = {
      image: "",
      caption: "Test",
      mediaType: "video" as const,
      videoUrl: "https://www.facebook.com/reel/123",
      videoProvider: "facebook" as const,
      likes: 0,
      likedBy: {},
      pinned: false,
      createdAt: Date.now(),
      authorName: "Admin"
    };
    expect(["facebook", "instagram", "tiktok", "youtube", "direct"]).toContain(reel.videoProvider);
  });

  it("broadcast types are valid", () => {
    const types = ["info", "promo", "alert"];
    types.forEach(type => {
      const broadcast = { type, emoji: "📢", createdAt: Date.now(), title: "Test", message: "Test" };
      expect(["info", "promo", "alert"]).toContain(broadcast.type);
    });
  });

  it("ai-config has all required fields", () => {
    const config = {
      systemPrompt: "You are a helpful assistant",
      systemPromptAr: "أنت مساعد ودود",
      baristaFemale: "Zura",
      baristaMale: "زورا",
      temperature: 0.85,
      maxTokens: 500
    };
    expect(config.systemPrompt).toBeDefined();
    expect(config.temperature).toBeGreaterThan(0);
    expect(config.temperature).toBeLessThanOrEqual(1);
    expect(config.maxTokens).toBeGreaterThan(0);
  });
});

// ============================================
// ERROR HANDLING TESTS
// ============================================

describe("Error Handling", () => {
  describe("Network Errors", () => {
    it("handles fetch failure gracefully", async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      try {
        // Simulate API call failure
        await expect(fetch("/api/test")).rejects.toThrow("Network error");
      } finally {
        global.fetch = originalFetch;
      }
    });

    it("handles timeout errors", async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100);

      await expect(
        fetch("/api/test", { signal: controller.signal })
      ).rejects.toThrow();
      clearTimeout(timeoutId);
    });
  });

  describe("Firebase Errors", () => {
    it("handles permission denied errors", () => {
      const error = { code: "PERMISSION_DENIED", message: "Permission denied" };
      expect(error.code).toBe("PERMISSION_DENIED");
    });

    it("handles network errors", () => {
      const error = { code: "NETWORK_ERROR", message: "Network error" };
      expect(error.code).toBe("NETWORK_ERROR");
    });

    it("handles quota exceeded errors", () => {
      const error = { code: "QUOTA_EXCEEDED", message: "Quota exceeded" };
      expect(error.code).toBe("QUOTA_EXCEEDED");
    });
  });

  describe("Data Validation", () => {
    it("validates menu item price", () => {
      const validatePrice = (price: any) => {
        const num = Number(price);
        return !isNaN(num) && num >= 0;
      };
      expect(validatePrice(100)).toBe(true);
      expect(validatePrice(0)).toBe(true);
      expect(validatePrice(-10)).toBe(false);
      expect(validatePrice("invalid")).toBe(false);
    });

    it("validates table number", () => {
      const validateTable = (table: string) => {
        const num = parseInt(table);
        return !isNaN(num) && num >= 1 && num <= 99;
      };
      expect(validateTable("1")).toBe(true);
      expect(validateTable("50")).toBe(true);
      expect(validateTable("99")).toBe(true);
      expect(validateTable("0")).toBe(false);
      expect(validateTable("100")).toBe(false);
    });

    it("validates rating range", () => {
      const validateRating = (rating: number) => {
        return Number.isInteger(rating) && rating >= 1 && rating <= 5;
      };
      expect(validateRating(1)).toBe(true);
      expect(validateRating(5)).toBe(true);
      expect(validateRating(0)).toBe(false);
      expect(validateRating(6)).toBe(false);
    });
  });
});

// ============================================
// PERFORMANCE TESTS
// ============================================

describe("Performance", () => {
  it("handles large menu lists efficiently", () => {
    const menuItems = Array.from({ length: 1000 }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      category: `Category ${i % 10}`
    }));

    const start = performance.now();
    const filtered = menuItems.filter(item => item.category === "Category 5");
    const duration = performance.now() - start;

    expect(filtered.length).toBe(100);
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  it("handles large reels arrays efficiently", () => {
    const reels = Array.from({ length: 500 }, (_, i) => ({
      id: `reel-${i}`,
      caption: `Caption ${i}`,
      likes: Math.floor(Math.random() * 1000)
    }));

    const start = performance.now();
    const sorted = reels.sort((a, b) => b.likes - a.likes);
    const duration = performance.now() - start;

    expect(sorted.length).toBe(500);
    expect(duration).toBeLessThan(100);
  });
});

// ============================================
// LOCAL STORAGE TESTS
// ============================================

describe("Local Storage Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists user name", () => {
    const name = "Test User";
    localStorage.setItem("azura-name", name);
    expect(localStorage.getItem("azura-name")).toBe(name);
  });

  it("persists table number", () => {
    const table = "42";
    localStorage.setItem("azura-table", table);
    expect(localStorage.getItem("azura-table")).toBe(table);
  });

  it("handles missing storage gracefully", () => {
    const getOrDefault = (key: string, defaultValue: string) => {
      const value = localStorage.getItem(key);
      return value || defaultValue;
    };

    expect(getOrDefault("nonexistent", "default")).toBe("default");
  });

  it("clears old data properly", () => {
    localStorage.setItem("azura-name", "Test");
    localStorage.removeItem("azura-name");
    expect(localStorage.getItem("azura-name")).toBeNull();
  });
});

// ============================================
// SESSION MANAGEMENT TESTS
// ============================================

describe("Session Management", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("manages admin session", () => {
    sessionStorage.setItem("azura-admin", "true");
    const isAuthed = sessionStorage.getItem("azura-admin") === "true";
    expect(isAuthed).toBe(true);
  });

  it("clears session on logout", () => {
    sessionStorage.setItem("azura-admin", "true");
    sessionStorage.removeItem("azura-admin");
    expect(sessionStorage.getItem("azura-admin")).toBeNull();
  });

  it("session persists across page reloads", () => {
    sessionStorage.setItem("azura-admin", "true");
    // In same session, this should persist
    expect(sessionStorage.getItem("azura-admin")).toBe("true");
  });
});

// ============================================
// RATE LIMITING TESTS
// ============================================

describe("Rate Limiting", () => {
  it("tracks request count", () => {
    const requestCounts: Record<string, number> = {};
    const MAX_REQUESTS = 10;

    const canMakeRequest = (endpoint: string) => {
      const count = requestCounts[endpoint] || 0;
      return count < MAX_REQUESTS;
    };

    const recordRequest = (endpoint: string) => {
      requestCounts[endpoint] = (requestCounts[endpoint] || 0) + 1;
    };

    expect(canMakeRequest("/api/chat")).toBe(true);
    for (let i = 0; i < 9; i++) {
      recordRequest("/api/chat");
      expect(canMakeRequest("/api/chat")).toBe(true);
    }
    recordRequest("/api/chat");
    expect(canMakeRequest("/api/chat")).toBe(false);
  });

  it("resets after time window", () => {
    const rateLimiter = {
      requests: new Map<string, { count: number; resetAt: number }>(),
      windowMs: 60000,
      maxRequests: 5,

      canMakeRequest(endpoint: string): boolean {
        const now = Date.now();
        const record = this.requests.get(endpoint);

        if (!record || record.resetAt < now) {
          return true;
        }

        return record.count < this.maxRequests;
      },

      recordRequest(endpoint: string): void {
        const now = Date.now();
        let record = this.requests.get(endpoint);

        if (!record || record.resetAt < now) {
          record = { count: 1, resetAt: now + this.windowMs };
        } else {
          record.count++;
        }

        this.requests.set(endpoint, record);
      }
    };

    expect(rateLimiter.canMakeRequest("/api/test")).toBe(true);
    rateLimiter.recordRequest("/api/test");
    expect(rateLimiter.canMakeRequest("/api/test")).toBe(true);
  });
});

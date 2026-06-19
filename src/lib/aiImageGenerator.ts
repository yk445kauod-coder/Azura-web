/**
 * AI Image Generation Utility
 * Generates images for menu items using free AI services
 */

import { db, ref, push, set, get } from "@/lib/firebase";

// Pollinations AI - Free image generation (no API key required)
const POLLINATIONS_API = "https://image.pollinations.ai/prompt/";

// Image generation prompts for different food categories
const CATEGORY_PROMPTS: Record<string, string> = {
  coffee: "professional coffee shop latte art, warm lighting, top-down view, restaurant quality, 4k photo",
  beverages: "refreshing beverage in elegant glass, professional food photography, bright natural light, 4k photo",
  food: "gourmet food plate, professional photography, restaurant quality, top-down view, 4k photo",
  desserts: "beautiful dessert, professional food photography, studio lighting, overhead view, 4k photo",
  shisha: "elegant hookah setup on comfortable sofa, restaurant atmosphere, warm ambient lighting, 4k photo",
  sandwiches: "gourmet sandwich cut in half showing layers, professional food photo, 4k photo",
  burgers: "juicy burger with melted cheese, professional food photography, overhead view, 4k photo",
  hot_drinks: "steaming hot drink in elegant ceramic cup, coffee shop atmosphere, warm tones, 4k photo",
  cold_drinks: "refreshing cold drink with ice and colorful garnish, bright tropical background, 4k photo",
  fresh: "fresh juice with fruit garnish in tall glass, healthy lifestyle, bright natural light, 4k photo",
  milkshake: "thick creamy milkshake with whipped cream and cherry, dessert photography, 4k photo",
  mains: "main course dish beautifully plated, professional restaurant photography, elegant plating, 4k photo",
  drinks: "soft drink or beverage, casual dining photography, 4k photo",
  extras: "side dish or accompaniment, professional food photography, 4k photo",
  default: "restaurant quality food photography, professional lighting, overhead view, 4k photo",
};

// Generate image URL using Pollinations AI (free, no API key)
export async function generateImageForItem(itemName: string, category: string): Promise<string | null> {
  try {
    // Construct prompt based on item name and category
    const basePrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.default;
    const prompt = `${itemName}, ${basePrompt}`;
    
    // Encode the prompt for URL
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Generate image URL using Pollinations AI
    // Returns a URL that will generate the image
    const imageUrl = `${POLLINATIONS_API}${encodedPrompt}?width=600&height=600&nologo=true`;
    
    return imageUrl;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}

// Generate image and return both URL and base64 for storage
export async function generateAndStoreImage(itemName: string, category: string): Promise<{ url: string; base64?: string } | null> {
  try {
    const imageUrl = await generateImageForItem(itemName, category);
    if (!imageUrl) return null;
    
    return { url: imageUrl };
  } catch (error) {
    console.error("Error generating and storing image:", error);
    return null;
  }
}

// Generate multiple image suggestions for an item
export async function getImageSuggestions(itemName: string, category: string): Promise<string[]> {
  const suggestions: string[] = [];
  
  // Category-specific Unsplash image collections (as fallbacks)
  const categoryImages: Record<string, string[]> = {
    coffee: [
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80",
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
      "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&q=80",
    ],
    beverages: [
      "https://images.unsplash.com/photo-1546173159-315724a31696?w=400&q=80",
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80",
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80",
      "https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=400&q=80",
    ],
    food: [
      "https://images.unsplash.com/photo-1568471173242-461f0a730452?w=400&q=80",
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80",
    ],
    desserts: [
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80",
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80",
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80",
      "https://images.unsplash.com/photo-1558320355-09d12f95e3b2?w=400&q=80",
    ],
    shisha: [
      "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=400&q=80",
      "https://images.unsplash.com/photo-1605792657660-596af9009f82?w=400&q=80",
      "https://images.unsplash.com/photo-1582284540020-4a4c9b7f5b0c?w=400&q=80",
      "https://images.unsplash.com/photo-1568613802138-c97e4c3c2d18?w=400&q=80",
    ],
    default: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80",
    ],
  };
  
  // First, try to generate an AI image
  try {
    const aiImageUrl = await generateImageForItem(itemName, category);
    if (aiImageUrl) {
      suggestions.push(aiImageUrl);
    }
  } catch (e) {
    console.warn("AI image generation failed, using fallback");
  }
  
  // Then add fallback images
  const images = categoryImages[category] || categoryImages.default;
  images.forEach((url) => {
    suggestions.push(url);
  });
  
  return suggestions.slice(0, 5);
}

// Save generated image to Firebase
export async function saveGeneratedImage(itemId: string, category: string, imageUrl: string): Promise<boolean> {
  try {
    await set(ref(db, `generated-images/${itemId}`), {
      url: imageUrl,
      category,
      generatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error("Error saving generated image:", error);
    return false;
  }
}

// Get all items without images and generate suggestions
export async function findAndGenerateImagesForItems(): Promise<Record<string, { name: string; suggestions: string[] }[]>> {
  try {
    const snap = await get(ref(db, "menu"));
    if (!snap.exists()) return {};
    
    const data = snap.val();
    const itemsWithoutImages: Record<string, { name: string; suggestions: string[] }[]> = {};
    
    const processCategory = (category: string, items: Record<string, any>) => {
      if (!items || typeof items !== "object") return;
      
      Object.entries(items).forEach(([itemId, item]) => {
        if (item && typeof item === "object" && !item.image) {
          if (!itemsWithoutImages[category]) {
            itemsWithoutImages[category] = [];
          }
          itemsWithoutImages[category].push({
            name: item.name || item.nameAr || itemId,
            suggestions: [],
          });
        }
      });
    };
    
    // Process all categories
    Object.entries(data).forEach(([category, items]) => {
      if (items && typeof items === "object") {
        // Check if it's a direct item or a category with items
        const firstItem = Object.values(items)[0] as any;
        if (firstItem && (firstItem.price !== undefined || firstItem.name)) {
          // Direct items
          processCategory(category, items);
        } else {
          // Nested category
          Object.entries(items).forEach(([subCat, subItems]) => {
            if (subItems && typeof subItems === "object") {
              processCategory(subCat, subItems as Record<string, any>);
            }
          });
        }
      }
    });
    
    // Generate image suggestions for each item
    for (const category in itemsWithoutImages) {
      for (const item of itemsWithoutImages[category]) {
        item.suggestions = await getImageSuggestions(item.name, category);
      }
    }
    
    return itemsWithoutImages;
  } catch (error) {
    console.error("Error finding items without images:", error);
    return {};
  }
}

export default {
  generateImageForItem,
  generateAndStoreImage,
  getImageSuggestions,
  saveGeneratedImage,
  findAndGenerateImagesForItems,
};
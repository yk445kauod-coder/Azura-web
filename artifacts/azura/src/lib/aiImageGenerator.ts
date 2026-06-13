/**
 * AI Image Generation Utility
 * Generates images for menu items using AI services
 */

import { db, ref, push, set, get } from "@/lib/firebase";

// Image generation prompts for different food categories
const CATEGORY_PROMPTS: Record<string, string> = {
  coffee: "professional coffee shop latte art, warm lighting, top-down view, restaurant quality",
  beverages: "refreshing beverage, professional food photography, bright natural light",
  food: "gourmet food plate, professional photography, restaurant quality, top-down view",
  desserts: "beautiful dessert, professional food photography, studio lighting, overhead view",
  shisha: "elegant hookah setup, restaurant atmosphere, warm ambient lighting",
  sandwiches: "gourmet sandwich, cut in half showing layers, professional food photo",
  burgers: "juicy burger with melted cheese, professional food photography, overhead view",
  hot_drinks: "steaming hot drink in elegant cup, coffee shop atmosphere, warm tones",
  cold_drinks: "refreshing cold drink with ice and garnish, bright tropical background",
  fresh: "fresh juice with fruit garnish, healthy lifestyle, bright natural light",
  milkshake: "thick creamy milkshake with whipped cream and cherry, dessert photography",
  mains: "main course dish, professional restaurant photography, elegant plating",
  drinks: "soft drink or beverage, casual dining photography",
  extras: "side dish or accompaniment, professional food photography",
  default: "restaurant quality food photography, professional lighting, overhead view",
};

// Generate image URL using AI service (placeholder - would need actual API integration)
export async function generateImageForItem(itemName: string, category: string): Promise<string | null> {
  try {
    // Construct prompt based on item name and category
    const basePrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.default;
    const prompt = `${itemName}, ${basePrompt}, high quality food photography`;
    
    // Generate image URL using a placeholder image service
    // In production, this would call an actual AI image generation API
    // such as OpenAI DALL-E, Stability AI, or similar
    
    // For now, use Unsplash Source for placeholder images based on keywords
    const searchTerm = itemName.toLowerCase().replace(/\s+/g, '-');
    const categorySearch = category.toLowerCase();
    
    // Try to get a relevant image from Unsplash
    const imageUrls = [
      `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80`, // Coffee
      `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80`, // Food
      `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80`, // Salad
      `https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80`, // Pancakes
      `https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=80`, // Burger
      `https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80`, // Cake
      `https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=400&q=80`, // Shisha
    ];
    
    // Return a relevant placeholder image
    const randomIndex = Math.floor(Math.random() * imageUrls.length);
    return imageUrls[randomIndex];
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}

// Generate multiple image suggestions for an item
export async function getImageSuggestions(itemName: string, category: string): Promise<string[]> {
  const suggestions: string[] = [];
  
  // Category-specific Unsplash image collections
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
  
  const images = categoryImages[category] || categoryImages.default;
  
  // Add variations with slight delays for visual interest
  images.forEach((url, index) => {
    // Add cache-busting query parameter for variety
    const variedUrl = `${url.split('?')[0]}?random=${Date.now()}_${index}`;
    suggestions.push(url);
  });
  
  return suggestions.slice(0, 4);
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
  getImageSuggestions,
  saveGeneratedImage,
  findAndGenerateImagesForItems,
};
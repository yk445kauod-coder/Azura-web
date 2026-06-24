import { db, ref, set, push } from "./artifacts/azura/src/lib/firebase";

async function seedReel() {
  const reelsRef = ref(db, "reels");
  const newReel = {
    authorName: "Azura Official",
    caption: "Try our new Chocolate Butterfly! 🦋",
    captionAr: "جرب تشيكن باترفلاي الجديدة! 🦋",
    createdAt: Date.now(),
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80",
    likes: 42,
    videoUrl: "https://www.facebook.com/reel/123456789", // Placeholder for test
    videoProvider: "facebook"
  };
  await push(reelsRef, newReel);
  print("Seed successful");
}
// This is a browser-side file, I can't run it with node directly easily because of imports.
// I'll use a simpler way to seed if I can.

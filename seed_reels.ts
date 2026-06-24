import { db, ref, set, push } from "./artifacts/azura/src/lib/firebase";

async function seed() {
  try {
    const reelsRef = ref(db, "reels");
    await push(reelsRef, {
      authorName: "Azura",
      caption: "Our Delicious Burgers! 🍔",
      captionAr: "برجر أزورا اللذيذ! 🍔",
      createdAt: Date.now(),
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      likes: 120,
      videoUrl: "https://www.facebook.com/facebook/videos/10153231339981729/", // Public FB video
      videoProvider: "facebook"
    });
    console.log("Reel seeded successfully");
  } catch (e) {
    console.error("Seeding failed", e);
  }
}

seed();

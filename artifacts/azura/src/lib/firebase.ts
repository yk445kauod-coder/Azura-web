import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  onValue,
  off,
  update,
  remove,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBr0a3R8wTSJ3qAPEuRRDosP7seMZK6iPQ",
  authDomain: "azura-cafe-55897.firebaseapp.com",
  databaseURL: "https://azura-cafe-55897-default-rtdb.firebaseio.com",
  projectId: "azura-cafe-55897",
  messagingSenderId: "183645729963",
  appId: "1:183645729963:web:0240db967365a56af033ee",
};

/*
  Recommended Firebase RTDB Security Rules:
  {
    "rules": {
      "menu": { ".read": true, ".write": "auth != null && root.child('admins').child(auth.uid).exists()" },
      "orders": {
        "$orderId": {
          ".read": "auth != null && (data.child('userId').val() === auth.uid || root.child('admins').child(auth.uid).exists())",
          ".write": "auth != null"
        }
      },
      "users": {
        "$uid": {
          ".read": "$uid === auth.uid || root.child('admins').child(auth.uid).exists()",
          ".write": "$uid === auth.uid"
        }
      },
      "staff": { ".read": true, ".write": "root.child('admins').child(auth.uid).exists()" },
      "ai-config": { ".read": true, ".write": "root.child('admins').child(auth.uid).exists()" },
      "notifications": {
        "$uid": {
          ".read": "$uid === auth.uid",
          ".write": "root.child('admins').child(auth.uid).exists() || $uid === auth.uid"
        }
      },
      "conversations": {
        "$uid": { ".read": "$uid === auth.uid", ".write": "$uid === auth.uid" }
      },
      "admins": { ".read": "root.child('admins').child(auth.uid).exists()", ".write": false }
    }
  }
*/

const app = initializeApp(firebaseConfig);
const authInstance = getAuth(app);
const dbInstance = getDatabase(app);

export const auth = authInstance;
export const db = dbInstance;
export const googleProvider = new GoogleAuthProvider();

// Ensure db is always defined
if (!dbInstance) {
  console.error("Firebase database initialization failed");
}

export {
  signInAnonymously,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  ref,
  set,
  get,
  push,
  onValue,
  off,
  update,
  remove,
};

export type { User };

export async function seedMenuIfEmpty() {
  const menuRef = ref(db, "menu");
  const snap = await get(menuRef);
  if (snap.exists()) return;

  const menuData = {
    coffee: {
      "espresso": { name: "Espresso", nameAr: "إسبريسو", description: "Rich & bold single shot", descriptionAr: "شوت إسبريسو غني وقوي", price: 35, category: "coffee", available: true, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80" },
      "cappuccino": { name: "Cappuccino", nameAr: "كابتشينو", description: "Espresso with steamed milk foam", descriptionAr: "إسبريسو مع رغوة الحليب", price: 65, category: "coffee", available: true, image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80" },
      "latte": { name: "Latte", nameAr: "لاتيه", description: "Smooth espresso with steamed milk", descriptionAr: "إسبريسو ناعم مع الحليب", price: 70, category: "coffee", available: true, image: "https://images.unsplash.com/photo-1561882468-9110d70d8f4d?w=400&q=80" },
      "turkish": { name: "Turkish Coffee", nameAr: "قهوة تركية", description: "Traditional Egyptian-style coffee", descriptionAr: "قهوة على الطريقة المصرية التقليدية", price: 40, category: "coffee", available: true, image: "https://images.unsplash.com/photo-1578374173713-b8e700b4f5f9?w=400&q=80" },
      "cold-brew": { name: "Cold Brew", nameAr: "كولد برو", description: "Slow-steeped cold coffee", descriptionAr: "قهوة باردة تُنقع ببطء", price: 75, category: "coffee", available: true, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80" },
      "mocha": { name: "Mocha", nameAr: "موكا", description: "Chocolate espresso delight", descriptionAr: "إسبريسو بالشوكولاتة اللذيذة", price: 75, category: "coffee", available: true, image: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4f?w=400&q=80" },
    },
    beverages: {
      "matcha": { name: "Matcha Latte", nameAr: "ماتشا لاتيه", description: "Japanese green tea with milk", descriptionAr: "شاي أخضر ياباني مع الحليب", price: 80, category: "beverages", available: true, image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=80" },
      "hibiscus": { name: "Hibiscus Tea", nameAr: "كركديه", description: "Egyptian rose-hip iced tea", descriptionAr: "كركديه مصري مثلج", price: 45, category: "beverages", available: true, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80" },
      "mint-tea": { name: "Mint Tea", nameAr: "شاي بالنعناع", description: "Fresh mint herbal infusion", descriptionAr: "نقيع نعناع طازج", price: 40, category: "beverages", available: true, image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&q=80" },
      "fresh-juice": { name: "Fresh Orange Juice", nameAr: "عصير برتقال طازج", description: "Freshly squeezed orange", descriptionAr: "برتقال معصور طازج", price: 60, category: "beverages", available: true, image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80" },
    },
    food: {
      "croissant": { name: "Butter Croissant", nameAr: "كروسان زبدة", description: "Flaky, buttery French pastry", descriptionAr: "معجنات فرنسية هشة بالزبدة", price: 55, category: "food", available: true, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80" },
      "avocado-toast": { name: "Avocado Toast", nameAr: "توست أفوكادو", description: "Sourdough with smashed avocado", descriptionAr: "خبز بالحامض مع الأفوكادو المهروس", price: 95, category: "food", available: true, image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400&q=80" },
      "eggs-benedict": { name: "Eggs Benedict", nameAr: "بيض بنديكت", description: "Poached eggs with hollandaise", descriptionAr: "بيض مسلوق مع صوص هولنديز", price: 110, category: "food", available: true, image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&q=80" },
      "club-sandwich": { name: "Club Sandwich", nameAr: "كلوب سندوتش", description: "Classic triple decker sandwich", descriptionAr: "ساندوتش كلاسيكي ثلاثي الطوابق", price: 120, category: "food", available: true, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80" },
    },
    desserts: {
      "tiramisu": { name: "Tiramisu", nameAr: "تيراميسو", description: "Classic Italian coffee dessert", descriptionAr: "تيراميسو إيطالي كلاسيكي", price: 85, category: "desserts", available: true, image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80" },
      "cheesecake": { name: "Cheesecake", nameAr: "تشيزكيك", description: "Creamy New York cheesecake", descriptionAr: "تشيزكيك نيويورك كريمي", price: 90, category: "desserts", available: true, image: "https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&q=80" },
      "kunafa": { name: "Kunafa", nameAr: "كنافة", description: "Traditional Egyptian cheese pastry", descriptionAr: "كنافة مصرية تقليدية", price: 75, category: "desserts", available: true, image: "https://images.unsplash.com/photo-1579888944880-d98341245702?w=400&q=80" },
      "baklava": { name: "Baklava", nameAr: "بقلاوة", description: "Honey & pistachio layers", descriptionAr: "طبقات العسل والفستق الحلبي", price: 65, category: "desserts", available: true, image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&q=80" },
    },
  };

  await set(ref(db, "menu"), menuData);

  const staffData = {
    "ahmed": { name: "Ahmed Hassan", nameAr: "أحمد حسن", role: "Head Barista", roleAr: "كبير الباريستا", bio: "10 years of coffee expertise, champion of Egyptian barista competitions.", bioAr: "10 سنوات من الخبرة في القهوة، بطل مسابقات الباريستا المصرية.", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80" },
    "nour": { name: "Nour El-Din", nameAr: "نور الدين", role: "Pastry Chef", roleAr: "شيف المعجنات", bio: "Trained in Paris, brings French technique to Egyptian flavors.", bioAr: "تدرب في باريس، يجمع بين التقنية الفرنسية والنكهات المصرية.", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80" },
    "sara": { name: "Sara Khaled", nameAr: "سارة خالد", role: "Cafe Manager", roleAr: "مديرة المقهى", bio: "Ensures every guest at Azura feels at home. Hospitality is her passion.", bioAr: "تحرص على أن يشعر كل ضيف في أزورا بالراحة. الضيافة شغفها.", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80" },
    "omar": { name: "Omar Farouk", nameAr: "عمر فاروق", role: "Barista", roleAr: "باريستا", bio: "Specializes in latte art and specialty drinks. Creative coffee enthusiast.", bioAr: "متخصص في فن اللاتيه والمشروبات المميزة. مهووس بالقهوة الإبداعية.", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80" },
    "layla": { name: "Layla Mansour", nameAr: "ليلى منصور", role: "Waitress", roleAr: "نادلة", bio: "Fluent in Arabic, English & French. Makes every visit special.", bioAr: "تتحدث العربية والإنجليزية والفرنسية. تجعل كل زيارة مميزة.", photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&q=80" },
  };

  await set(ref(db, "staff"), staffData);

  const aiConfig = {
    systemPrompt: `You are Zura (or Zure), a friendly and knowledgeable AI barista at Azura Cafe & Restaurant, located in Tivoli Dome, Alexandria, Egypt. You are warm, helpful, and passionate about coffee and food. You help customers explore the menu, make recommendations based on their preferences, and assist with placing orders. When speaking Arabic, use Egyptian dialect (العامية المصرية). Always be welcoming and personable. You can discuss: menu items, ingredients, preparation methods, café ambiance, and local Alexandria culture. Keep responses concise and friendly. When recommending items, mention prices in Egyptian Pounds (EGP).`,
    systemPromptAr: `أنت زورا (أو زور)، باريستا ذكاء اصطناعي ودود وعالم في مقهى أزورا للمأكولات والمشروبات، في التيفولي دوم، الإسكندرية، مصر. أنت دافئ ومفيد ومتحمس للقهوة والطعام. تساعد العملاء في استكشاف القائمة وتقديم التوصيات وتقديم الطلبات. تكلم بالعامية المصرية. كن مرحبًا وودودًا. يمكنك مناقشة: القائمة، المكونات، طرق التحضير، أجواء المقهى والثقافة الإسكندرانية.`,
    baristaFemale: "Zura",
    barista_female_name: "زورا",
    barista_male: "Zure",
    barista_male_name: "زور",
  };

  await set(ref(db, "ai-config"), aiConfig);
}

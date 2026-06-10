import { initializeApp } from "firebase/app";
import { fullMenuData } from "./fullMenu";
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
  Recommended Firebase RTDB Security Rules with Performance Indexes:
  {
    "rules": {
      "menu": { 
        ".read": true, 
        ".write": "auth != null && root.child('admins').child(auth.uid).exists()",
        ".indexOn": ["category", "available", "price"]
      },
      "menu_by_category": {
        ".read": true,
        ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
      },
      "orders": {
        "$orderId": {
          ".read": "auth != null && (data.child('userId').val() === auth.uid || root.child('admins').child(auth.uid).exists())",
          ".write": "auth != null"
        },
        ".indexOn": ["userId", "status", "createdAt"]
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
  
  Performance Tips:
  1. Use shallow queries for lists: ?shallow=true
  2. Paginate large datasets with limitToFirst/last
  3. Denormalize data for read-heavy operations
  4. Use compound indexes for filtered queries
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

  // Use the full menu from db_menu.json
  await set(ref(db, "menu"), fullMenuData);

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

// Function to add shisha items to existing menu
export async function seedShishaItems() {
  const menuRef = ref(db, "menu/shisha");
  const shishaData = {
    "double-apple": { name: "Double Apple", nameAr: "تفاحتين", description: "Classic Egyptian shisha with sweet apple flavor", descriptionAr: "شيشة مصرية كلاسيكية بنكهة التفاح الحلو", price: 120, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
    "grape-mint": { name: "Grape Mint", nameAr: "عنب نعناع", description: "Refreshing grape with cool mint blend", descriptionAr: "عنب منعش مع مزيج النعناع البارد", price: 130, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
    "mint-tea": { name: "Mint Tea Shisha", nameAr: "شيشة شاي نعناع", description: "Unique mint tea flavor, Egyptian style", descriptionAr: "نكهة شاي النعناع الفريدة على الطريقة المصرية", price: 125, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
    "lemon-mint": { name: "Lemon Mint", nameAr: "ليمون نعناع", description: "Tangy lemon with refreshing mint", descriptionAr: "ليمون حامض مع نعناع منعش", price: 130, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
    "watermelon": { name: "Watermelon", nameAr: "بطيخ", description: "Sweet summer watermelon flavor", descriptionAr: "نكهة البطيخ الصيفي الحلو", price: 125, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
    "mango": { name: "Mango", nameAr: "مانجو", description: "Tropical mango explosion", descriptionAr: "انفجار المانجو الاستوائية", price: 135, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
    "orange": { name: "Orange", nameAr: "برتقال", description: "Fresh citrus orange flavor", descriptionAr: "نكهة البرتقال الحمضية الطازجة", price: 125, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
    "berry-mix": { name: "Berry Mix", nameAr: "مزيج التوت", description: "Mixed berries with sweet finish", descriptionAr: "توت مشكل بنهاية حلوة", price: 140, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
    "gum": { name: "Gum", nameAr: "لبان", description: "Chewing gum flavor with cool sensation", descriptionAr: "نكهة اللبان مع شعور بارد", price: 130, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
    "chocolate-mint": { name: "Chocolate Mint", nameAr: "شوكولاتة نعناع", description: "Rich chocolate with cool mint", descriptionAr: "شوكولاتة غنية مع نعناع بارد", price: 140, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
    "vienna": { name: "Vienna", nameAr: "فيينا", description: "Creamy caramel vanilla mix", descriptionAr: "مزيج الكارميل والفانيليا الكريمي", price: 145, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
    "dessert": { name: "Dessert", nameAr: "ديسرت", description: "Sweet dessert flavor with cream", descriptionAr: "نكهة حلوى حلوة مع الكريمة", price: 140, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
    "hazelnut": { name: "Hazelnut", nameAr: "هازيلنات", description: "Nutty hazelnut with sweet notes", descriptionAr: "هازيلنت بطعم المكسرات مع لمسة حلوة", price: 135, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
    "pineapple": { name: "Pineapple", nameAr: "أناناس", description: "Tropical pineapple freshness", descriptionAr: "انتعاش الأناناس الاستوائي", price: 130, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
    "blueberry": { name: "Blueberry", nameAr: "توت أزرق", description: "Sweet blueberry flavor", descriptionAr: "نكهة التوت الأزرق الحلوة", price: 140, category: "shisha", available: true, image: "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=400" },
  };
  await set(menuRef, shishaData);
  console.log("Shisha items added successfully!");
}

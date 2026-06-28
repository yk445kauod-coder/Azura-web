import re

with open('artifacts/azura/src/lib/fullMenu.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update specific smoothies to cocktails category
to_cocktails = [
    "strawberry-banana-smoothie",
    "mango-kiwi-smoothie",
    "copa-cabana-smoothie",
    "white-mountain-smoothie",
    "strawberry-lemonade-smoothie",
    "yellow-and-green-smoothie",
    "pina-colada-smoothie",
    "mango-peach-smoothie"
]

for item_id in to_cocktails:
    pattern = rf'"{item_id}": \{{(.*?)"category": "smoothies",(.*?)\}}'
    replacement = rf'"{item_id}": {{\1"category": "cocktails",\2}}'
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# 2. Add missing sections before the final closure
new_sections = """
  },
  "soft_drinks": {
    "pepsi": {
      "name": "Pepsi / Cola",
      "nameAr": "بيبسي / كولا",
      "description": "Chilled soft drink",
      "descriptionAr": "مشروب غازي بارد",
      "price": 68,
      "category": "soft_drinks",
      "categoryAr": "مشروبات غازية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1629203851022-36c64237d951?w=600&q=80"
    },
    "sprite-mirinda": {
      "name": "Sprite / Mirinda",
      "nameAr": "سبرايت / ميريندا",
      "description": "Chilled lemon-lime or orange soda",
      "descriptionAr": "سبرايت أو ميريندا باردة",
      "price": 68,
      "category": "soft_drinks",
      "categoryAr": "مشروبات غازية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1622708782596-13d974530562?w=600&q=80"
    },
    "fayrouz": {
      "name": "Fayrouz",
      "nameAr": "فيروز",
      "description": "Sparkling malt beverage",
      "descriptionAr": "مشروب شعير فوار",
      "price": 68,
      "category": "soft_drinks",
      "categoryAr": "مشروبات غازية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80"
    },
    "redbull": {
      "name": "Red Bull",
      "nameAr": "ريد بول",
      "description": "Energy drink",
      "descriptionAr": "مشروب طاقة",
      "price": 135,
      "category": "soft_drinks",
      "categoryAr": "مشروبات غازية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1613143300521-729227184241?w=600&q=80"
    },
    "birell": {
      "name": "Birell",
      "nameAr": "بيريل",
      "description": "Classic malt beverage",
      "descriptionAr": "مشروب شعير كلاسيكي",
      "price": 68,
      "category": "soft_drinks",
      "categoryAr": "مشروبات غازية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80"
    },
    "schweppes-gold": {
      "name": "Schweppes Gold",
      "nameAr": "شويبس جولد",
      "description": "Sparkling fruit beverage",
      "descriptionAr": "مشروب شويبس فوار",
      "price": 68,
      "category": "soft_drinks",
      "categoryAr": "مشروبات غازية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80"
    },
    "soda-tonic": {
      "name": "Soda / Tonic",
      "nameAr": "صودا / تونيك",
      "description": "Refreshing sparkling water",
      "descriptionAr": "مياه فوارة منعشة",
      "price": 75,
      "category": "soft_drinks",
      "categoryAr": "مشروبات غازية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551446591-142875a901a1?w=600&q=80"
    },
    "water-small": {
      "name": "Small Water",
      "nameAr": "مياه صغيرة",
      "description": "Bottled mineral water",
      "descriptionAr": "مياه معدنية",
      "price": 40,
      "category": "soft_drinks",
      "categoryAr": "مشروبات غازية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1560023907-5f339617ea30?w=600&q=80"
    },
    "water-large": {
      "name": "Large Water",
      "nameAr": "مياه كبيرة",
      "description": "Bottled mineral water",
      "descriptionAr": "مياه معدنية كبيرة",
      "price": 50,
      "category": "soft_drinks",
      "categoryAr": "مشروبات غازية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1560023907-5f339617ea30?w=600&q=80"
    }
  },
  "waffle": {
    "classic-waffle": {
      "name": "Classic Waffle",
      "nameAr": "وافل كلاسيك",
      "description": "Freshly baked waffle with honey or syrup",
      "descriptionAr": "وافل طازج مع العسل أو السيرب",
      "price": 140,
      "category": "waffle",
      "categoryAr": "وافل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=80"
    },
    "chocolate-waffle": {
      "name": "Chocolate Waffle",
      "nameAr": "وافل شوكولاتة",
      "description": "Waffle topped with Belgian chocolate",
      "descriptionAr": "وافل مغطى بالشوكولاتة البلجيكية",
      "price": 160,
      "category": "waffle",
      "categoryAr": "وافل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=80"
    },
    "mix-chocolate-waffle": {
      "name": "Mix Chocolate Waffle",
      "nameAr": "وافل ميكس شوكولاتة",
      "description": "Waffle with dark, milk, and white chocolate",
      "descriptionAr": "وافل مع ثلاث أنواع شوكولاتة",
      "price": 180,
      "category": "waffle",
      "categoryAr": "وافل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=80"
    },
    "lotus-waffle": {
      "name": "Lotus Waffle",
      "nameAr": "وافل لوتس",
      "description": "Waffle with Lotus Biscoff spread and crumbs",
      "descriptionAr": "وافل بزبدة اللوتس وبسكويت اللوتس",
      "price": 175,
      "category": "waffle",
      "categoryAr": "وافل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=80"
    },
    "fruit-waffle": {
      "name": "Fruit Waffle",
      "nameAr": "وافل فواكه",
      "description": "Waffle topped with seasonal fresh fruits",
      "descriptionAr": "وافل مع فواكه الموسم الطازجة",
      "price": 190,
      "category": "waffle",
      "categoryAr": "وافل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=80"
    }
  }
};
"""

# Replace the last closure with the new sections
content = re.sub(r'\s*\}\s*\}\s*;\s*$', new_sections, content)

# 3. Add herbal teas to hot_drinks
herbal_teas = """
    "green-tea": {
      "name": "Green Tea",
      "nameAr": "شاي أخضر",
      "description": "Pure green tea",
      "descriptionAr": "شاي أخضر نقي",
      "price": 40,
      "category": "hot_drinks",
      "categoryAr": "مشروبات ساخنة",
      "available": true,
      "image": "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=600&q=80"
    },
    "anise": {
      "name": "Anise",
      "nameAr": "ينسون",
      "description": "Hot anise drink",
      "descriptionAr": "ينسون ساخن",
      "price": 40,
      "category": "hot_drinks",
      "categoryAr": "مشروبات ساخنة",
      "available": true,
      "image": "https://images.unsplash.com/photo-1594631252845-29fc4586d52c?w=600&q=80"
    },
    "hibiscus": {
      "name": "Hibiscus (Karkade)",
      "nameAr": "كركديه",
      "description": "Egyptian hibiscus drink",
      "descriptionAr": "كركديه مصري",
      "price": 35,
      "category": "hot_drinks",
      "categoryAr": "مشروبات ساخنة",
      "available": true,
      "image": "https://images.unsplash.com/photo-1550853024-fae8cd4be477?w=600&q=80"
    },
"""

# Insert herbal teas into hot_drinks
content = re.sub(r'("categoryAr": "هوت درينكس",\s*"available": true,\s*"image": ".*?"\s*\})', r'\1,\n' + herbal_teas.strip(), content)

with open('artifacts/azura/src/lib/fullMenu.ts', 'w', encoding='utf-8') as f:
    f.write(content)

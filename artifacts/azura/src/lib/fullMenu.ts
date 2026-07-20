// Full Azura Cafe Menu — 250 items across 30 categories
// Generated from official menu JSON — DO NOT edit manually, use admin panel to update Firebase

export const fullMenuData: Record<string, Record<string, {
    name: string; nameAr: string; description: string; descriptionAr: string;
    price: number; category: string; categoryAr: string; available: boolean; image: string; recommended?: boolean;
    ingredients?: string[]; ingredientsAr?: string[];
  }>> = {
  "add_ons": {
    "extra-beef": {
      "name": "Extra Beef",
      "nameAr": "اكسترا بيف",
      "description": "Extra Beef",
      "descriptionAr": "اكسترا بيف",
      "price": 70,
      "category": "add_ons",
      "categoryAr": "اد اونس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "extra-bread": {
      "name": "Extra Bread",
      "nameAr": "اكسترا بريد",
      "description": "Extra Bread",
      "descriptionAr": "اكسترا بريد",
      "price": 25,
      "category": "add_ons",
      "categoryAr": "اد اونس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "extra-cheese": {
      "name": "Extra Cheese",
      "nameAr": "اكسترا تشيز",
      "description": "Extra Cheese",
      "descriptionAr": "اكسترا تشيز",
      "price": 35,
      "category": "add_ons",
      "categoryAr": "اد اونس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "extra-chicken": {
      "name": "Extra Chicken",
      "nameAr": "اكسترا تشيكن",
      "description": "Extra Chicken",
      "descriptionAr": "اكسترا تشيكن",
      "price": 50,
      "category": "add_ons",
      "categoryAr": "اد اونس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "extra-fries": {
      "name": "Extra Fries",
      "nameAr": "اكسترا فرايز",
      "description": "Extra Fries",
      "descriptionAr": "اكسترا فرايز",
      "price": 60,
      "category": "add_ons",
      "categoryAr": "اد اونس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "extra-jalapeno": {
      "name": "Extra Jalapeno",
      "nameAr": "اكسترا هالبينو",
      "description": "Extra Jalapeno",
      "descriptionAr": "اكسترا هالبينو",
      "price": 20,
      "category": "add_ons",
      "categoryAr": "اد اونس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "extra-mushroom": {
      "name": "Extra Mushroom",
      "nameAr": "اكسترا مشروم",
      "description": "Extra Mushroom",
      "descriptionAr": "اكسترا مشروم",
      "price": 40,
      "category": "add_ons",
      "categoryAr": "اد اونس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "extra-rice": {
      "name": "Extra Rice",
      "nameAr": "اكسترا رايس",
      "description": "Extra Rice",
      "descriptionAr": "اكسترا رايس",
      "price": 45,
      "category": "add_ons",
      "categoryAr": "اد اونس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "extra-sauce": {
      "name": "Extra Sauce",
      "nameAr": "اكسترا صوص",
      "description": "Extra Sauce",
      "descriptionAr": "اكسترا صوص",
      "price": 35,
      "category": "add_ons",
      "categoryAr": "اد اونس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "extra-sweet-pepper": {
      "name": "Extra Sweet Pepper",
      "nameAr": "اكسترا سويت بيبر",
      "description": "Extra Sweet Pepper",
      "descriptionAr": "اكسترا سويت بيبر",
      "price": 25,
      "category": "add_ons",
      "categoryAr": "اد اونس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    }
  },
  "appetizers": {
    "azura-plate": {
      "name": "Azura Plate",
      "nameAr": "ازورا بليت",
      "description": "Mozzarella sticks, strips, onion rings, fries, nachos with three sauces",
      "descriptionAr": "موتزريلا ستيك، ستربس، حلقات بصل، فرايز، ناتشوز مع ثلاث صوصات من اختيارك",
      "price": 256,
      "category": "appetizers",
      "categoryAr": "ابيتيزرز",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80",
      "ingredients": [
        "Mozzarella sticks",
        "strips",
        "onion rings",
        "fries",
        "nachos with three sauces"
      ],
      "ingredientsAr": [
        "موتزريلا ستيك",
        "ستربس",
        "حلقات بصل",
        "فرايز",
        "ناتشوز مع ثلاث صوصات من اختيارك"
      ],
      "recommended": true
    },
    "azura-potato": {
      "name": "Azura Potato",
      "nameAr": "ازورا بوتيتو",
      "description": "Mash Potato, Smoked Turkey, Olives, Cheddar Mix, Mozzarella, Ranch Sauce",
      "descriptionAr": "ماش بوتيتو، سموك تركي، زيتون، ميكس شيدر، موتزريلا، صوص رانش",
      "price": 123,
      "category": "appetizers",
      "categoryAr": "ابيتيزرز",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80",
      "ingredients": [
        "Mash Potato",
        "Smoked Turkey",
        "Olives",
        "Cheddar Mix",
        "Mozzarella",
        "Ranch Sauce"
      ],
      "ingredientsAr": [
        "ماش بوتيتو",
        "سموك تركي",
        "زيتون",
        "ميكس شيدر",
        "موتزريلا",
        "صوص رانش"
      ]
    },
    "baked-potato": {
      "name": "Baked Potato",
      "nameAr": "بيكد بوتيتو",
      "description": "Baked Potato",
      "descriptionAr": "بيكد بوتيتو",
      "price": 92,
      "category": "appetizers",
      "categoryAr": "ابيتيزرز",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "beef-quesadilla": {
      "name": "Beef Quesadilla",
      "nameAr": "بيف كاسديا",
      "description": "Beef Quesadilla",
      "descriptionAr": "بيف كاسديا",
      "price": 211,
      "category": "appetizers",
      "categoryAr": "ابيتيزرز",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "cheese-fries": {
      "name": "Cheese Fries",
      "nameAr": "تشيز فرايز",
      "description": "Cheese Fries",
      "descriptionAr": "تشيز فرايز",
      "price": 106,
      "category": "appetizers",
      "categoryAr": "ابيتيزرز",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "chicken-fries": {
      "name": "Chicken Fries",
      "nameAr": "تشيكن فرايز",
      "description": "Crispy chicken, fries, honey mustard sauce, cheese sauce",
      "descriptionAr": "تشيكن كريسبي، فرايز، هوني ماسترد صوص، صوص جبنه",
      "price": 202,
      "category": "appetizers",
      "categoryAr": "ابيتيزرز",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80",
      "ingredients": [
        "Crispy chicken",
        "fries",
        "honey mustard sauce",
        "cheese sauce"
      ],
      "ingredientsAr": [
        "تشيكن كريسبي",
        "فرايز",
        "هوني ماسترد صوص",
        "صوص جبنه"
      ]
    },
    "chicken-quesadilla": {
      "name": "Chicken Quesadilla",
      "nameAr": "تشيكن كاسديا",
      "description": "Chicken Quesadilla",
      "descriptionAr": "تشيكن كاسديا",
      "price": 212,
      "category": "appetizers",
      "categoryAr": "ابيتيزرز",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "chili-texas-fries": {
      "name": "Chili Texas Fries",
      "nameAr": "شيلي تكساس فرايز",
      "description": "Beef bacon, jalapenos, fries, sweet chili sauce, cheese sauce, Texas sauce",
      "descriptionAr": "بيف بيكون، هالبينو، فرايز، سويت شيلي صوص، صوص جبنه، صوص تكساس",
      "price": 159,
      "category": "appetizers",
      "categoryAr": "ابيتيزرز",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80",
      "ingredients": [
        "Beef bacon",
        "jalapenos",
        "fries",
        "sweet chili sauce",
        "cheese sauce",
        "Texas sauce"
      ],
      "ingredientsAr": [
        "بيف بيكون",
        "هالبينو",
        "فرايز",
        "سويت شيلي صوص",
        "صوص جبنه",
        "صوص تكساس"
      ]
    },
    "mozzarella-sticks": {
      "name": "Mozzarella Sticks",
      "nameAr": "موتزريلا استيك",
      "description": "Mozzarella Sticks",
      "descriptionAr": "موتزريلا استيك",
      "price": 96,
      "category": "appetizers",
      "categoryAr": "ابيتيزرز",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "nachos": {
      "name": "Nachos",
      "nameAr": "ناتشوز",
      "description": "Dorito Chips, Beef Bacon, Ranch, Cheddar Mix, Cheese Sauce",
      "descriptionAr": "دوريتو شيبس، بيف بيكون، رانش، ميكس شيدر، صوص جينه",
      "price": 128,
      "category": "appetizers",
      "categoryAr": "ابيتيزرز",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80",
      "ingredients": [
        "Dorito Chips",
        "Beef Bacon",
        "Ranch",
        "Cheddar Mix",
        "Cheese Sauce"
      ],
      "ingredientsAr": [
        "دوريتو شيبس",
        "بيف بيكون",
        "رانش",
        "ميكس شيدر",
        "صوص جينه"
      ]
    },
    "onion-rings": {
      "name": "Onion Rings",
      "nameAr": "اونيون رينجز",
      "description": "Onion Rings",
      "descriptionAr": "اونيون رينجز",
      "price": 88,
      "category": "appetizers",
      "categoryAr": "ابيتيزرز",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    },
    "strips": {
      "name": "Strips",
      "nameAr": "ستربس",
      "description": "Strips",
      "descriptionAr": "ستربس",
      "price": 189,
      "category": "appetizers",
      "categoryAr": "ابيتيزرز",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80"
    }
  },
  "boba_tea": {
    "blueberry-boba-tea": {
      "name": "Blueberry Boba Tea",
      "nameAr": "بلوبيري بوبه تي",
      "description": "Blueberry Boba Tea",
      "descriptionAr": "بلوبيري بوبه تي",
      "price": 159,
      "category": "boba_tea",
      "categoryAr": "بوبه تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=600&q=80"
    },
    "green-apple-boba-tea": {
      "name": "Green Apple Boba Tea",
      "nameAr": "جرين ابل بوبه تي",
      "description": "Green Apple Boba Tea",
      "descriptionAr": "جرين ابل بوبه تي",
      "price": 169,
      "category": "boba_tea",
      "categoryAr": "بوبه تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=600&q=80"
    },
    "passion-fruit-boba-tea": {
      "name": "Passion Fruit Boba Tea",
      "nameAr": "باشون فروت بوبه تي",
      "description": "Passion Fruit Boba Tea",
      "descriptionAr": "باشون فروت بوبه تي",
      "price": 164,
      "category": "boba_tea",
      "categoryAr": "بوبه تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=600&q=80"
    },
    "strawberry-boba-tea": {
      "name": "Strawberry Boba Tea",
      "nameAr": "ستروبري بوبه تي",
      "description": "Strawberry Boba Tea",
      "descriptionAr": "ستروبري بوبه تي",
      "price": 169,
      "category": "boba_tea",
      "categoryAr": "بوبه تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=600&q=80"
    }
  },
  "breakfast": {
    "azura-breakfast": {
      "name": "Azura Breakfast",
      "nameAr": "ازورا بريك فاست",
      "description": "Cheese Omelette, Hot Dog, Fries, Smoked Turkey, Toast",
      "descriptionAr": "تشيز اومليت، هوت دوج، فرايز، سموك تركي، توست",
      "price": 204,
      "category": "breakfast",
      "categoryAr": "بريك فاست",
      "available": true,
      "image": "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80",
      "ingredients": [
        "Cheese Omelette",
        "Hot Dog",
        "Fries",
        "Smoked Turkey",
        "Toast"
      ],
      "ingredientsAr": [
        "تشيز اومليت",
        "هوت دوج",
        "فرايز",
        "سموك تركي",
        "توست"
      ]
    },
    "greek-breakfast": {
      "name": "Greek Breakfast",
      "nameAr": "جريك بريك فاست",
      "description": "Spanish omelet, feta cheese slices, roasted potatoes with mushrooms and olives, toast",
      "descriptionAr": "اسبانيش اومليت، جبنه فيتا قطع، بطاطس روستيد بالمشروم والزيتون، توست",
      "price": 189,
      "category": "breakfast",
      "categoryAr": "بريك فاست",
      "available": true,
      "image": "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80",
      "ingredients": [
        "Spanish omelet",
        "feta cheese slices",
        "roasted potatoes with mushrooms and olives",
        "toast"
      ],
      "ingredientsAr": [
        "اسبانيش اومليت",
        "جبنه فيتا قطع",
        "بطاطس روستيد بالمشروم والزيتون",
        "توست"
      ]
    },
    "mexican-breakfast": {
      "name": "Mexican Breakfast",
      "nameAr": "ميكسيكان بريك فاست",
      "description": "Omelette, Mexican hot dog, Baked potatoes, Toast",
      "descriptionAr": "اومليت، ميكسكان هوت دوج، بطاطس بيكد، توست",
      "price": 174,
      "category": "breakfast",
      "categoryAr": "بريك فاست",
      "available": true,
      "image": "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80",
      "ingredients": [
        "Omelette",
        "Mexican hot dog",
        "Baked potatoes",
        "Toast"
      ],
      "ingredientsAr": [
        "اومليت",
        "ميكسكان هوت دوج",
        "بطاطس بيكد",
        "توست"
      ]
    }
  },
  "burgers": {
    "bbq-burger": {
      "name": "BBQ Burger",
      "nameAr": "باربيكيو برجر",
      "description": "Burger, BBQ sauce, beef bacon, lettuce, tomato, cheese sauce",
      "descriptionAr": "برجر، صوص باربيكيو، بيف بيكون، خس، طماطم، صوص جبنه",
      "price": 244,
      "category": "burgers",
      "categoryAr": "برجر",
      "available": true,
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      "ingredients": [
        "Burger",
        "BBQ sauce",
        "beef bacon",
        "lettuce",
        "tomato",
        "cheese sauce"
      ],
      "ingredientsAr": [
        "برجر",
        "صوص باربيكيو",
        "بيف بيكون",
        "خس",
        "طماطم",
        "صوص جبنه"
      ]
    },
    "cheese-burger": {
      "name": "Cheese Burger",
      "nameAr": "تشيز برجر",
      "description": "Texas sauce, lettuce, tomato, cheddar slices, cheese sauce, beef burger",
      "descriptionAr": "تكساس، خس، طماطم، شرايح شيدر، صوص جبنه، برجر لحمه",
      "price": 238,
      "category": "burgers",
      "categoryAr": "برجر",
      "available": true,
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      "ingredients": [
        "Texas sauce",
        "lettuce",
        "tomato",
        "cheddar slices",
        "cheese sauce",
        "beef burger"
      ],
      "ingredientsAr": [
        "تكساس",
        "خس",
        "طماطم",
        "شرايح شيدر",
        "صوص جبنه",
        "برجر لحمه"
      ]
    },
    "classic-burger": {
      "name": "Classic Burger",
      "nameAr": "كلاسيك برجر",
      "description": "Beef burger, lettuce, tomato, Thousand Island sauce, cucumber",
      "descriptionAr": "برجر لحم، خس، طماطم، صوص تاوزن ايلاند، خيار",
      "price": 228,
      "category": "burgers",
      "categoryAr": "برجر",
      "available": true,
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      "ingredients": [
        "Beef burger",
        "lettuce",
        "tomato",
        "Thousand Island sauce",
        "cucumber"
      ],
      "ingredientsAr": [
        "برجر لحم",
        "خس",
        "طماطم",
        "صوص تاوزن ايلاند",
        "خيار"
      ]
    },
    "fire-burger": {
      "name": "Fire Burger",
      "nameAr": "فاير برجر",
      "description": "Sweet chili, jalapeno, lettuce, tomato, burger, cheese sauce",
      "descriptionAr": "سويت شيلي، هالبينو، خس، طماطم، برجر، صوص جبنه",
      "price": 237,
      "category": "burgers",
      "categoryAr": "برجر",
      "available": true,
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      "ingredients": [
        "Sweet chili",
        "jalapeno",
        "lettuce",
        "tomato",
        "burger",
        "cheese sauce"
      ],
      "ingredientsAr": [
        "سويت شيلي",
        "هالبينو",
        "خس",
        "طماطم",
        "برجر",
        "صوص جبنه"
      ]
    },
    "smoke-burger": {
      "name": "Smoke Burger",
      "nameAr": "سموك برجر",
      "description": "Texas sauce, burger, smoked turkey, smoked bacon, lettuce, tomato, cheese sauce",
      "descriptionAr": "صوص تكساس، برجر، سموك تركي، سموك بيكون، خس، طماطم، صوص جبنة",
      "price": 264,
      "category": "burgers",
      "categoryAr": "برجر",
      "available": true,
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      "ingredients": [
        "Texas sauce",
        "burger",
        "smoked turkey",
        "smoked bacon",
        "lettuce",
        "tomato",
        "cheese sauce"
      ],
      "ingredientsAr": [
        "صوص تكساس",
        "برجر",
        "سموك تركي",
        "سموك بيكون",
        "خس",
        "طماطم",
        "صوص جبنة"
      ]
    },
    "texas-burger": {
      "name": "Texas Burger",
      "nameAr": "تيكساس برجر",
      "description": "Burger, caramelized onion, caramelized mushroom, Texas sauce, lettuce, tomato",
      "descriptionAr": "برجر، بصل مكرمل، مشروم مكرمل، صوص تكساس، خس، طماطم",
      "price": 273,
      "category": "burgers",
      "categoryAr": "برجر",
      "available": true,
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      "ingredients": [
        "Burger",
        "caramelized onion",
        "caramelized mushroom",
        "Texas sauce",
        "lettuce",
        "tomato"
      ],
      "ingredientsAr": [
        "برجر",
        "بصل مكرمل",
        "مشروم مكرمل",
        "صوص تكساس",
        "خس",
        "طماطم"
      ]
    }
  },
  "coffee": {
    "americano": {
      "name": "Americano",
      "nameAr": "امريكانو",
      "description": "Americano",
      "descriptionAr": "امريكانو",
      "price": 71,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "bon-bon-coffee": {
      "name": "Bon Bon Coffee",
      "nameAr": "بون بون كوفي",
      "description": "Bon Bon Coffee",
      "descriptionAr": "بون بون كوفي",
      "price": 85,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "cappuccino": {
      "name": "Cappuccino",
      "nameAr": "كابتشينو",
      "description": "Cappuccino",
      "descriptionAr": "كابتشينو",
      "price": 104,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "caramel-macchiato": {
      "name": "Caramel Macchiato",
      "nameAr": "كراميل ميكاتو",
      "description": "Caramel Macchiato",
      "descriptionAr": "كراميل ميكاتو",
      "price": 105,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "double-turkish-coffee": {
      "name": "Double Turkish Coffee",
      "nameAr": "قهوة تركي د",
      "description": "Traditional double Turkish coffee",
      "descriptionAr": "قهوة تركي دبل تقليدية",
      "price": 65,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1579992357154-faf4bfe95b3d?w=600&q=80"
    },
    "espresso-affogato": {
      "name": "Espresso Affogato",
      "nameAr": "اسبريسو افوجادوه",
      "description": "Espresso Affogato",
      "descriptionAr": "اسبريسو افوجادوه",
      "price": 84,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "espresso-con-panna": {
      "name": "Espresso Con Panna",
      "nameAr": "اسبريسو كون بانا",
      "description": "Espresso Con Panna",
      "descriptionAr": "اسبريسو كون بانا",
      "price": 78,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "espresso-double": {
      "name": "Espresso Double",
      "nameAr": "اسبريسو دبل",
      "description": "Espresso Double",
      "descriptionAr": "اسبريسو دبل",
      "price": 80,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
      "recommended": true
    },
    "espresso-single": {
      "name": "Espresso Single",
      "nameAr": "اسبريسو سنجل",
      "description": "Espresso Single",
      "descriptionAr": "اسبريسو سنجل",
      "price": 58,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "flat-white": {
      "name": "Flat White",
      "nameAr": "فلات وايت",
      "description": "Flat White",
      "descriptionAr": "فلات وايت",
      "price": 110,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "hazelnut-caramel": {
      "name": "Hazelnut Caramel",
      "nameAr": "هازلنت كراميل",
      "description": "Hazelnut Caramel",
      "descriptionAr": "هازلنت كراميل",
      "price": 108,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "hazelnut-mocha": {
      "name": "Hazelnut Mocha",
      "nameAr": "هازلنت موكا",
      "description": "Hazelnut Mocha",
      "descriptionAr": "هازلنت موكا",
      "price": 110,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "hazelnut-spanish-latte": {
      "name": "Hazelnut Spanish Latte",
      "nameAr": "هازلنت سبانش لاتيه",
      "description": "Hazelnut Spanish Latte",
      "descriptionAr": "هازلنت سبانش لاتيه",
      "price": 135,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "latte": {
      "name": "Latte",
      "nameAr": "لاتيه",
      "description": "Latte",
      "descriptionAr": "لاتيه",
      "price": 88,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "lotus-latte": {
      "name": "Lotus Latte",
      "nameAr": "لوتس لاتيه",
      "description": "Lotus Latte",
      "descriptionAr": "لوتس لاتيه",
      "price": 125,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "macchiato-single": {
      "name": "Macchiato Single",
      "nameAr": "ميكاتو سنجل",
      "description": "Macchiato Single",
      "descriptionAr": "ميكاتو سنجل",
      "price": 65,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "marshmallow-mocha": {
      "name": "Marshmallow Mocha",
      "nameAr": "مارشميلو موكا",
      "description": "Marshmallow Mocha",
      "descriptionAr": "مارشميلو موكا",
      "price": 125,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "mint-mocha": {
      "name": "Mint Mocha",
      "nameAr": "مينت موكا",
      "description": "Mint Mocha",
      "descriptionAr": "مينت موكا",
      "price": 107,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "mocha": {
      "name": "Mocha",
      "nameAr": "موكا",
      "description": "Mocha",
      "descriptionAr": "موكا",
      "price": 105,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "nescafe": {
      "name": "Nescafe",
      "nameAr": "نسكافيه",
      "description": "Nescafe",
      "descriptionAr": "نسكافيه",
      "price": 80,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "single-turkish-coffee": {
      "name": "Single Turkish Coffee",
      "nameAr": "قهوة تركي س",
      "description": "Traditional single Turkish coffee",
      "descriptionAr": "قهوة تركي سنجل تقليدية",
      "price": 45,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1579992357154-faf4bfe95b3d?w=600&q=80"
    },
    "spanish-latte": {
      "name": "Spanish Latte",
      "nameAr": "سبانش لاتيه",
      "description": "Spanish Latte",
      "descriptionAr": "سبانش لاتيه",
      "price": 115,
      "category": "coffee",
      "categoryAr": "كوفي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    }
  },
  "corto": {
    "black-corto": {
      "name": "Black Corto",
      "nameAr": "بلاك كورتو",
      "description": "Black Corto",
      "descriptionAr": "بلاك كورتو",
      "price": 114,
      "category": "corto",
      "categoryAr": "كورتو",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "caramel-corto": {
      "name": "Caramel Corto",
      "nameAr": "كراميل كورتو",
      "description": "Caramel Corto",
      "descriptionAr": "كراميل كورتو",
      "price": 119,
      "category": "corto",
      "categoryAr": "كورتو",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "classic-corto": {
      "name": "Classic Corto",
      "nameAr": "كلاسيك كورتو",
      "description": "Classic Corto",
      "descriptionAr": "كلاسيك كورتو",
      "price": 97,
      "category": "corto",
      "categoryAr": "كورتو",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "mocha-corto": {
      "name": "Mocha Corto",
      "nameAr": "موكا كورتو",
      "description": "Mocha Corto",
      "descriptionAr": "موكا كورتو",
      "price": 119,
      "category": "corto",
      "categoryAr": "كورتو",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    }
  },
  "crepes": {
    "banana-caramel": {
      "name": "Banana Caramel",
      "nameAr": "بنانا كراميل",
      "description": "Crepes filled with bananas and topped with caramel sauce",
      "descriptionAr": "كريب محشو موز ومغطى بصوص الكراميل",
      "price": 180,
      "category": "crepes",
      "categoryAr": "كريب",
      "available": true,
      "image": "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=80",
      "ingredients": [
        "Crepes filled with bananas and topped with caramel sauce"
      ],
      "ingredientsAr": [
        "كريب محشو موز ومغطى بصوص الكراميل"
      ]
    },
    "cheesecake-crepe": {
      "name": "Cheesecake Crepe",
      "nameAr": "تشيز كيك كريب",
      "description": "Cheesecake-filled crepe with a choice of sauce",
      "descriptionAr": "كريب محشو تشيز كيك مع اختيار الصوص",
      "price": 218,
      "category": "crepes",
      "categoryAr": "كريب",
      "available": true,
      "image": "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=80",
      "ingredients": [
        "Cheesecake-filled crepe with a choice of sauce"
      ],
      "ingredientsAr": [
        "كريب محشو تشيز كيك مع اختيار الصوص"
      ]
    },
    "crepe-brownies": {
      "name": "Crepe Brownies",
      "nameAr": "براوني كريب",
      "description": "Crepes filled with brownies and mixed chocolate",
      "descriptionAr": "كريب محشو براونيز مع ميكس شوكلت",
      "price": 224,
      "category": "crepes",
      "categoryAr": "كريب",
      "available": true,
      "image": "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=80",
      "ingredients": [
        "Crepes filled with brownies and mixed chocolate"
      ],
      "ingredientsAr": [
        "كريب محشو براونيز مع ميكس شوكلت"
      ]
    },
    "lotus-crepe": {
      "name": "Lotus Crepe",
      "nameAr": "لوتس كريب",
      "description": "Crepes filled with Lotus biscuits and nuts, topped with Lotus sauce",
      "descriptionAr": "كريب محشو ببسكويت اللوتس والمكسرات ومغطى بصوص اللوتس",
      "price": 195,
      "category": "crepes",
      "categoryAr": "كريب",
      "available": true,
      "image": "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=80",
      "ingredients": [
        "Crepes filled with Lotus biscuits and nuts",
        "topped with Lotus sauce"
      ],
      "ingredientsAr": [
        "كريب محشو ببسكويت اللوتس والمكسرات ومغطى بصوص اللوتس"
      ]
    },
    "pistachio-crepe": {
      "name": "Pistachio Crepe",
      "nameAr": "بيستاشيو كريب",
      "description": "Crepes filled with pistachio sauce",
      "descriptionAr": "كريب محشو بصوص البيستاشيو",
      "price": 225,
      "category": "crepes",
      "categoryAr": "كريب",
      "available": true,
      "image": "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=80",
      "ingredients": [
        "Crepes filled with pistachio sauce"
      ],
      "ingredientsAr": [
        "كريب محشو بصوص البيستاشيو"
      ]
    },
    "strawberry-chocolate": {
      "name": "Strawberry Chocolate",
      "nameAr": "ستروبري شوكلت",
      "description": "Crepes rolled and topped with chocolate sauce",
      "descriptionAr": "كريب ملفوف ومغطى بصوص الشوكلت",
      "price": 180,
      "category": "crepes",
      "categoryAr": "كريب",
      "available": true,
      "image": "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=80",
      "ingredients": [
        "Crepes rolled and topped with chocolate sauce"
      ],
      "ingredientsAr": [
        "كريب ملفوف ومغطى بصوص الشوكلت"
      ]
    }
  },
  "croissant": {
    "azura-croissant": {
      "name": "Azura Croissant",
      "nameAr": "ازورا كرواسون",
      "description": "Lettuce, Smoked Turkey, Pepperoni, Cheddar",
      "descriptionAr": "خس، سموك تركي، ببروني، شيدر",
      "price": 149,
      "category": "croissant",
      "categoryAr": "كرواسون",
      "available": true,
      "image": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "Smoked Turkey",
        "Pepperoni",
        "Cheddar"
      ],
      "ingredientsAr": [
        "خس",
        "سموك تركي",
        "ببروني",
        "شيدر"
      ]
    },
    "classic": {
      "name": "Classic",
      "nameAr": "كلاسيك",
      "description": "Classic",
      "descriptionAr": "كلاسيك",
      "price": 71,
      "category": "croissant",
      "categoryAr": "كرواسون",
      "available": true,
      "image": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80"
    },
    "mix-cheese-croissant": {
      "name": "Mix Cheese Croissant",
      "nameAr": "ميكس تشيز كرواسون",
      "description": "Cheddar, cheese sauce",
      "descriptionAr": "شيدر، صوص جبنه",
      "price": 114,
      "category": "croissant",
      "categoryAr": "كرواسون",
      "available": true,
      "image": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80",
      "ingredients": [
        "Cheddar",
        "cheese sauce"
      ],
      "ingredientsAr": [
        "شيدر",
        "صوص جبنه"
      ]
    }
  },
  "desserts": {
    "brownies": {
      "name": "Brownies",
      "nameAr": "براونيز",
      "description": "Brownies",
      "descriptionAr": "براونيز",
      "price": 114,
      "category": "desserts",
      "categoryAr": "ديسيرتس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80"
    },
    "cheese-cake": {
      "name": "Cheese Cake",
      "nameAr": "تشيز كيك",
      "description": "Cheese Cake",
      "descriptionAr": "تشيز كيك",
      "price": 144,
      "category": "desserts",
      "categoryAr": "ديسيرتس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80"
    },
    "fruit-salad": {
      "name": "Fruit Salad",
      "nameAr": "فروت سالاد",
      "description": "Fruit Salad",
      "descriptionAr": "فروت سالاد",
      "price": 109,
      "category": "desserts",
      "categoryAr": "ديسيرتس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80"
    },
    "fruit-salad-with-ice-cream": {
      "name": "Fruit Salad with Ice Cream",
      "nameAr": "فروت سالاد وذ ايس كريم",
      "description": "Fruit Salad with Ice Cream",
      "descriptionAr": "فروت سالاد وذ ايس كريم",
      "price": 134,
      "category": "desserts",
      "categoryAr": "ديسيرتس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80"
    },
    "ice-cream-scoop": {
      "name": "Ice Cream Scoop",
      "nameAr": "ايس كريم سكوب",
      "description": "Ice Cream Scoop",
      "descriptionAr": "ايس كريم سكوب",
      "price": 35,
      "category": "desserts",
      "categoryAr": "ديسيرتس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80"
    },
    "molten-cake": {
      "name": "Molten Cake",
      "nameAr": "مولتن كيك",
      "description": "Molten Cake",
      "descriptionAr": "مولتن كيك",
      "price": 159,
      "category": "desserts",
      "categoryAr": "ديسيرتس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80"
    },
    "san-sebastian": {
      "name": "San Sebastian",
      "nameAr": "سان سيباستيان",
      "description": "San Sebastian",
      "descriptionAr": "سان سيباستيان",
      "price": 184,
      "category": "desserts",
      "categoryAr": "ديسيرتس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80"
    },
    "san-sebastian-pistachio": {
      "name": "San Sebastian Pistachio",
      "nameAr": "سان سيباستيان بيستاشيو",
      "description": "San Sebastian Pistachio",
      "descriptionAr": "سان سيباستيان بيستاشيو",
      "price": 204,
      "category": "desserts",
      "categoryAr": "ديسيرتس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80"
    }
  },
  "frappuccino": {
    "blueberry-vanilla-frappe": {
      "name": "Blueberry Vanilla Frappe",
      "nameAr": "بلوبيري فانيليا فرابيه",
      "description": "Blueberry Vanilla Frappe",
      "descriptionAr": "بلوبيري فانيليا فرابيه",
      "price": 159,
      "category": "frappuccino",
      "categoryAr": "فرابتشينو اند فرابيه",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "caramel-macchiato-frappe": {
      "name": "Caramel Macchiato Frappe",
      "nameAr": "كراميل ميكاتو فرابيه",
      "description": "Caramel Macchiato Frappe",
      "descriptionAr": "كراميل ميكاتو فرابيه",
      "price": 169,
      "category": "frappuccino",
      "categoryAr": "فرابتشينو اند فرابيه",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "chocolate-frappe": {
      "name": "Chocolate Frappe",
      "nameAr": "شوكلت فرابيه",
      "description": "Chocolate Frappe",
      "descriptionAr": "شوكلت فرابيه",
      "price": 164,
      "category": "frappuccino",
      "categoryAr": "فرابتشينو اند فرابيه",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "frappe-strong": {
      "name": "Frappe Strong",
      "nameAr": "فرابيه سترونج",
      "description": "Frappe Strong",
      "descriptionAr": "فرابيه سترونج",
      "price": 159,
      "category": "frappuccino",
      "categoryAr": "فرابتشينو اند فرابيه",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "frappuccino": {
      "name": "Frappuccino",
      "nameAr": "فرابتشينو",
      "description": "Frappuccino",
      "descriptionAr": "فرابتشينو",
      "price": 143,
      "category": "frappuccino",
      "categoryAr": "فرابتشينو اند فرابيه",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "hazelnut-frappe": {
      "name": "Hazelnut Frappe",
      "nameAr": "هازلنت فرابيه",
      "description": "Hazelnut Frappe",
      "descriptionAr": "هازلنت فرابيه",
      "price": 149,
      "category": "frappuccino",
      "categoryAr": "فرابتشينو اند فرابيه",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "lotus-frappe": {
      "name": "Lotus Frappe",
      "nameAr": "لوتس فرابيه",
      "description": "Lotus Frappe",
      "descriptionAr": "لوتس فرابيه",
      "price": 195,
      "category": "frappuccino",
      "categoryAr": "فرابتشينو اند فرابيه",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "marshmallow-mocha-frappe": {
      "name": "Marshmallow Mocha Frappe",
      "nameAr": "مارشميلو موكا فرابيه",
      "description": "Marshmallow Mocha Frappe",
      "descriptionAr": "مارشميلو موكا فرابيه",
      "price": 194,
      "category": "frappuccino",
      "categoryAr": "فرابتشينو اند فرابيه",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "mocha-frappe": {
      "name": "Mocha Frappe",
      "nameAr": "موكا فرابيه",
      "description": "Mocha Frappe",
      "descriptionAr": "موكا فرابيه",
      "price": 174,
      "category": "frappuccino",
      "categoryAr": "فرابتشينو اند فرابيه",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "oreo-frappe": {
      "name": "Oreo Frappe",
      "nameAr": "اوريو فرابيه",
      "description": "Oreo Frappe",
      "descriptionAr": "اوريو فرابيه",
      "price": 164,
      "category": "frappuccino",
      "categoryAr": "فرابتشينو اند فرابيه",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "strawberry-vanilla-frappe": {
      "name": "Strawberry Vanilla Frappe",
      "nameAr": "ستروبري فانيليا فرابيه",
      "description": "Strawberry Vanilla Frappe",
      "descriptionAr": "ستروبري فانيليا فرابيه",
      "price": 159,
      "category": "frappuccino",
      "categoryAr": "فرابتشينو اند فرابيه",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "white-mocha-frappe": {
      "name": "White Mocha Frappe",
      "nameAr": "وايت موكا فرابيه",
      "description": "White Mocha Frappe",
      "descriptionAr": "وايت موكا فرابيه",
      "price": 174,
      "category": "frappuccino",
      "categoryAr": "فرابتشينو اند فرابيه",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    }
  },
  "fresh_juices": {
    "guava-juice": {
      "name": "Guava Juice",
      "nameAr": "جوافه جوس",
      "description": "Guava Juice",
      "descriptionAr": "جوافه جوس",
      "price": 133,
      "category": "fresh_juices",
      "categoryAr": "فريش جوس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1621506289937-4f14df5a0534?w=600&q=80"
    },
    "lemon-juice": {
      "name": "Lemon Juice",
      "nameAr": "ليمون جوس",
      "description": "Lemon Juice",
      "descriptionAr": "ليمون جوس",
      "price": 93,
      "category": "fresh_juices",
      "categoryAr": "فريش جوس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1621506289937-4f14df5a0534?w=600&q=80"
    },
    "lemon-mint-juice": {
      "name": "Lemon Mint Juice",
      "nameAr": "ليمون مينت جوس",
      "description": "Lemon Mint Juice",
      "descriptionAr": "ليمون مينت جوس",
      "price": 99,
      "category": "fresh_juices",
      "categoryAr": "فريش جوس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1621506289937-4f14df5a0534?w=600&q=80"
    },
    "mango-juice": {
      "name": "Mango Juice",
      "nameAr": "مانجو جوس",
      "description": "Mango Juice",
      "descriptionAr": "مانجو جوس",
      "price": 134,
      "category": "fresh_juices",
      "categoryAr": "فريش جوس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1621506289937-4f14df5a0534?w=600&q=80"
    },
    "orange-juice": {
      "name": "Orange Juice",
      "nameAr": "اورانج جوس",
      "description": "Orange Juice",
      "descriptionAr": "اورانج جوس",
      "price": 121,
      "category": "fresh_juices",
      "categoryAr": "فريش جوس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1621506289937-4f14df5a0534?w=600&q=80"
    },
    "pineapple-juice": {
      "name": "Pineapple Juice",
      "nameAr": "باين ابل جوس",
      "description": "Pineapple Juice",
      "descriptionAr": "باين ابل جوس",
      "price": 130,
      "category": "fresh_juices",
      "categoryAr": "فريش جوس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1621506289937-4f14df5a0534?w=600&q=80"
    },
    "pomegranate-juice": {
      "name": "Pomegranate Juice",
      "nameAr": "بومجرانيت جوس",
      "description": "Pomegranate Juice",
      "descriptionAr": "بومجرانيت جوس",
      "price": 118,
      "category": "fresh_juices",
      "categoryAr": "فريش جوس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1621506289937-4f14df5a0534?w=600&q=80"
    },
    "strawberry-juice": {
      "name": "Strawberry Juice",
      "nameAr": "ستروبري جوس",
      "description": "Strawberry Juice",
      "descriptionAr": "ستروبري جوس",
      "price": 125,
      "category": "fresh_juices",
      "categoryAr": "فريش جوس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1621506289937-4f14df5a0534?w=600&q=80"
    },
    "watermelon-juice": {
      "name": "Watermelon Juice",
      "nameAr": "واتر ميلون جوس",
      "description": "Watermelon Juice",
      "descriptionAr": "واتر ميلون جوس",
      "price": 127,
      "category": "fresh_juices",
      "categoryAr": "فريش جوس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1621506289937-4f14df5a0534?w=600&q=80"
    }
  },
  "fried_chicken": {
    "classic-fried-chicken": {
      "name": "Classic Fried Chicken",
      "nameAr": "كلاسيك فرايد تشيكن",
      "description": "Lettuce, tomato, honey mustard, crispy chicken",
      "descriptionAr": "خس، طماطم، هوني ماسترد، فراخ كريسبي",
      "price": 216,
      "category": "fried_chicken",
      "categoryAr": "فرايد تشيكن",
      "available": true,
      "image": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "tomato",
        "honey mustard",
        "crispy chicken"
      ],
      "ingredientsAr": [
        "خس",
        "طماطم",
        "هوني ماسترد",
        "فراخ كريسبي"
      ]
    },
    "fire-fried-chicken": {
      "name": "Fire Fried Chicken",
      "nameAr": "فاير فرايد تشيكن",
      "description": "Sweet chili, Texas, jalapeno, crispy chicken, lettuce, tomato",
      "descriptionAr": "سويت شيلي، تكساس، هالبينو، فراخ كريسبي، خس، طماطم",
      "price": 221,
      "category": "fried_chicken",
      "categoryAr": "فرايد تشيكن",
      "available": true,
      "image": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&q=80",
      "ingredients": [
        "Sweet chili",
        "Texas",
        "jalapeno",
        "crispy chicken",
        "lettuce",
        "tomato"
      ],
      "ingredientsAr": [
        "سويت شيلي",
        "تكساس",
        "هالبينو",
        "فراخ كريسبي",
        "خس",
        "طماطم"
      ]
    },
    "fried-festival": {
      "name": "Fried Festival",
      "nameAr": "فرايد فيستيفال",
      "description": "Crispy chicken, mozzarella stick, onion rings, smoked turkey, ranch, cheese sauce, nachos",
      "descriptionAr": "فراخ كريسبي، موتزريلا ستيك، حلقات بصل، سموك تركي، رائنش، صوص جبنه، ناتشوز",
      "price": 265,
      "category": "fried_chicken",
      "categoryAr": "فرايد تشيكن",
      "available": true,
      "image": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&q=80",
      "ingredients": [
        "Crispy chicken",
        "mozzarella stick",
        "onion rings",
        "smoked turkey",
        "ranch",
        "cheese sauce",
        "nachos"
      ],
      "ingredientsAr": [
        "فراخ كريسبي",
        "موتزريلا ستيك",
        "حلقات بصل",
        "سموك تركي",
        "رائنش",
        "صوص جبنه",
        "ناتشوز"
      ]
    },
    "smoke-fried-chicken": {
      "name": "Smoke Fried Chicken",
      "nameAr": "سموك فرايد تشيكن",
      "description": "Crispy chicken, Texas, lettuce, tomato, smoked turkey, smoked bacon",
      "descriptionAr": "فراخ كريسبي، تكساس، خس، طماطم، سموك تركي، سموك بيكون",
      "price": 249,
      "category": "fried_chicken",
      "categoryAr": "فرايد تشيكن",
      "available": true,
      "image": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&q=80",
      "ingredients": [
        "Crispy chicken",
        "Texas",
        "lettuce",
        "tomato",
        "smoked turkey",
        "smoked bacon"
      ],
      "ingredientsAr": [
        "فراخ كريسبي",
        "تكساس",
        "خس",
        "طماطم",
        "سموك تركي",
        "سموك بيكون"
      ]
    }
  },
  "fries": {
    "fries": {
      "name": "Fries",
      "nameAr": "فرايز",
      "description": "Fries",
      "descriptionAr": "فرايز",
      "price": 86,
      "category": "fries",
      "categoryAr": "فرايز",
      "available": true,
      "image": "https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&q=80",
      "recommended": true
    }
  },
  "hot_chocolate": {
    "cinnabon-hot-chocolate": {
      "name": "Cinnabon Hot Chocolate",
      "nameAr": "سينابون هوت شوكلت",
      "description": "Cinnabon Hot Chocolate",
      "descriptionAr": "سينابون هوت شوكلت",
      "price": 169,
      "category": "hot_chocolate",
      "categoryAr": "هوت شوكلت",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544787210-2211d7c309c7?w=600&q=80"
    },
    "classic-hot-chocolate": {
      "name": "Classic Hot Chocolate",
      "nameAr": "كلاسيك هوت شوكلت",
      "description": "Classic Hot Chocolate",
      "descriptionAr": "كلاسيك هوت شوكلت",
      "price": 144,
      "category": "hot_chocolate",
      "categoryAr": "هوت شوكلت",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544787210-2211d7c309c7?w=600&q=80"
    },
    "dark-hot-chocolate": {
      "name": "Dark Hot Chocolate",
      "nameAr": "دارك هوت شوكلت",
      "description": "Dark Hot Chocolate",
      "descriptionAr": "دارك هوت شوكلت",
      "price": 169,
      "category": "hot_chocolate",
      "categoryAr": "هوت شوكلت",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544787210-2211d7c309c7?w=600&q=80"
    },
    "hot-chocolate-marshmallow": {
      "name": "Hot Chocolate Marshmallow",
      "nameAr": "هوت شوكلت مارشميلو",
      "description": "Hot Chocolate Marshmallow",
      "descriptionAr": "هوت شوكلت مارشميلو",
      "price": 169,
      "category": "hot_chocolate",
      "categoryAr": "هوت شوكلت",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544787210-2211d7c309c7?w=600&q=80"
    },
    "hot-lotus": {
      "name": "Hot Lotus",
      "nameAr": "هوت لوتس",
      "description": "Hot Lotus",
      "descriptionAr": "هوت لوتس",
      "price": 169,
      "category": "hot_chocolate",
      "categoryAr": "هوت شوكلت",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544787210-2211d7c309c7?w=600&q=80"
    },
    "hot-pistachio": {
      "name": "Hot Pistachio",
      "nameAr": "هوت بيستاشيو",
      "description": "Hot Pistachio",
      "descriptionAr": "هوت بيستاشيو",
      "price": 179,
      "category": "hot_chocolate",
      "categoryAr": "هوت شوكلت",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544787210-2211d7c309c7?w=600&q=80"
    },
    "milk-hot-chocolate": {
      "name": "Milk Hot Chocolate",
      "nameAr": "ميلك هوت شوكلت",
      "description": "Milk Hot Chocolate",
      "descriptionAr": "ميلك هوت شوكلت",
      "price": 169,
      "category": "hot_chocolate",
      "categoryAr": "هوت شوكلت",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544787210-2211d7c309c7?w=600&q=80"
    },
    "oreo-hot-chocolate": {
      "name": "Oreo Hot Chocolate",
      "nameAr": "اوريو هوت شوكلت",
      "description": "Oreo Hot Chocolate",
      "descriptionAr": "اوريو هوت شوكلت",
      "price": 169,
      "category": "hot_chocolate",
      "categoryAr": "هوت شوكلت",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544787210-2211d7c309c7?w=600&q=80"
    }
  },
  "hot_drinks": {
    "americano-white-black": {
      "name": "Americano (white-black)",
      "nameAr": "أمريكانو (وايت-بلاك)",
      "description": "Americano white-black style",
      "descriptionAr": "أمريكانو ستايل وايت-بلاك",
      "price": 91,
      "category": "hot_drinks",
      "categoryAr": "هوت درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "flavor-tea": {
      "name": "Flavor Tea",
      "nameAr": "فليفر تي",
      "description": "Flavor Tea",
      "descriptionAr": "فليفر تي",
      "price": 55,
      "category": "hot_drinks",
      "categoryAr": "هوت درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "french-coffee": {
      "name": "French Coffee",
      "nameAr": "فرنش كوفي",
      "description": "French Coffee",
      "descriptionAr": "فرنش كوفي",
      "price": 65,
      "category": "hot_drinks",
      "categoryAr": "هوت درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "hazelnut-coffee": {
      "name": "Hazelnut Coffee",
      "nameAr": "هازلنت كوفي",
      "description": "Hazelnut Coffee",
      "descriptionAr": "هازلنت كوفي",
      "price": 95,
      "category": "hot_drinks",
      "categoryAr": "هوت درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "hot-cider": {
      "name": "Hot Cider",
      "nameAr": "هوت سيدر",
      "description": "Hot Cider",
      "descriptionAr": "هوت سيدر",
      "price": 55,
      "category": "hot_drinks",
      "categoryAr": "هوت درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "mix-herbs": {
      "name": "Mix Herbs",
      "nameAr": "ميكس هيربس",
      "description": "Mix Herbs",
      "descriptionAr": "ميكس هيربس",
      "price": 60,
      "category": "hot_drinks",
      "categoryAr": "هوت درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    },
    "zarda-tea": {
      "name": "Zarda Tea",
      "nameAr": "زرده تي",
      "description": "Zarda Tea",
      "descriptionAr": "زرده تي",
      "price": 65,
      "category": "hot_drinks",
      "categoryAr": "هوت درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
    }
  },
  "iced_coffee": {
    "blue-coffee-ice": {
      "name": "Blue Coffee Ice",
      "nameAr": "بلو كوفي ايس",
      "description": "Blue Coffee Ice",
      "descriptionAr": "بلو كوفي ايس",
      "price": 179,
      "category": "iced_coffee",
      "categoryAr": "ايس كوفي اند تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "iced-boba-coffee": {
      "name": "Iced Boba Coffee",
      "nameAr": "ايس بوبا كوفي",
      "description": "Iced Boba Coffee",
      "descriptionAr": "ايس بوبا كوفي",
      "price": 189,
      "category": "iced_coffee",
      "categoryAr": "ايس كوفي اند تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "iced-cappuccino": {
      "name": "Iced Cappuccino",
      "nameAr": "ايس كابتشينو",
      "description": "Iced Cappuccino",
      "descriptionAr": "ايس كابتشينو",
      "price": 119,
      "category": "iced_coffee",
      "categoryAr": "ايس كوفي اند تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "iced-caramel-macchiato": {
      "name": "Iced Caramel Macchiato",
      "nameAr": "ايس كراميل ميكاتو",
      "description": "Iced Caramel Macchiato",
      "descriptionAr": "ايس كراميل ميكاتو",
      "price": 139,
      "category": "iced_coffee",
      "categoryAr": "ايس كوفي اند تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "iced-hazelnut-spanish-latte": {
      "name": "Iced Hazelnut Spanish Latte",
      "nameAr": "ايس هازلنت سبانش لاتيه",
      "description": "Iced Hazelnut Spanish Latte",
      "descriptionAr": "ايس هازلنت سبانش لاتيه",
      "price": 149,
      "category": "iced_coffee",
      "categoryAr": "ايس كوفي اند تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "iced-mocha": {
      "name": "Iced Mocha",
      "nameAr": "ايس موكا",
      "description": "Iced Mocha",
      "descriptionAr": "ايس موكا",
      "price": 139,
      "category": "iced_coffee",
      "categoryAr": "ايس كوفي اند تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "iced-rose-latte": {
      "name": "Iced Rose Latte",
      "nameAr": "ايس روز لاتيه",
      "description": "Iced Rose Latte",
      "descriptionAr": "ايس روز لاتيه",
      "price": 154,
      "category": "iced_coffee",
      "categoryAr": "ايس كوفي اند تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "iced-spanish-latte": {
      "name": "Iced Spanish Latte",
      "nameAr": "ايس سبانش لاتيه",
      "description": "Iced Spanish Latte",
      "descriptionAr": "ايس سبانش لاتيه",
      "price": 149,
      "category": "iced_coffee",
      "categoryAr": "ايس كوفي اند تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "iced-tea-black": {
      "name": "Iced Tea Black",
      "nameAr": "ايس تي بلاك",
      "description": "Iced Tea Black",
      "descriptionAr": "ايس تي بلاك",
      "price": 174,
      "category": "iced_coffee",
      "categoryAr": "ايس كوفي اند تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "iced-tea-peach": {
      "name": "Iced Tea Peach",
      "nameAr": "ايس تي بيتش",
      "description": "Iced Tea Peach",
      "descriptionAr": "ايس تي بيتش",
      "price": 174,
      "category": "iced_coffee",
      "categoryAr": "ايس كوفي اند تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "iced-white-mocha": {
      "name": "Iced White Mocha",
      "nameAr": "ايس وايت موكا",
      "description": "Iced White Mocha",
      "descriptionAr": "ايس وايت موكا",
      "price": 154,
      "category": "iced_coffee",
      "categoryAr": "ايس كوفي اند تي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    }
  },
  "main_dishes": {
    "beef-fillet": {
      "name": "Beef Fillet",
      "nameAr": "بيف فيليه",
      "description": "Grilled beef fillet with your choice of sauce (Pepper, Mushroom, or Blue Cheese)",
      "descriptionAr": "فيليه لحم جريل مع اختيارك من الصوص (فلفل، مشروم، أو بلو تشيز)",
      "price": 429,
      "category": "main_dishes",
      "categoryAr": "أطباق رئيسية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1632778149975-4abc9507963e?w=600&q=80",
      "ingredients": [
        "Grilled beef fillet with your choice of sauce (Pepper",
        "Mushroom",
        "or Blue Cheese)"
      ],
      "ingredientsAr": [
        "فيليه لحم جريل مع اختيارك من الصوص (فلفل",
        "مشروم",
        "أو بلو تشيز)"
      ]
    },
    "beef-mushroom": {
      "name": "Beef Mushroom",
      "nameAr": "بيف مشروم",
      "description": "Grilled beef fillet with mushroom sauce",
      "descriptionAr": "فيليه لحم جريل مع صوص المشروم",
      "price": 389,
      "category": "main_dishes",
      "categoryAr": "أطباق رئيسية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1632778149975-4abc9507963e?w=600&q=80",
      "ingredients": [
        "Grilled beef fillet with mushroom sauce"
      ],
      "ingredientsAr": [
        "فيليه لحم جريل مع صوص المشروم"
      ]
    },
    "beef-stroganoff": {
      "name": "Beef Stroganoff",
      "nameAr": "بيف ستراجنوف",
      "description": "Beef strips with mushroom, onion, and creamy sauce",
      "descriptionAr": "شرايح لحم مع مشروم وبصل وصوص كريمي",
      "price": 389,
      "category": "main_dishes",
      "categoryAr": "أطباق رئيسية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1632778149975-4abc9507963e?w=600&q=80",
      "ingredients": [
        "Beef strips with mushroom",
        "onion",
        "and creamy sauce"
      ],
      "ingredientsAr": [
        "شرايح لحم مع مشروم وبصل وصوص كريمي"
      ]
    },
    "chicken-cordon-bleu": {
      "name": "Chicken Cordon Bleu",
      "nameAr": "تشيكن كوردون بلو",
      "description": "Fried chicken breast stuffed with smoked turkey, smoked beef, and cheese mix",
      "descriptionAr": "صدور فراخ مقلية محشوة سموك تركي، سموك بيف، وميكس جبن",
      "price": 349,
      "category": "main_dishes",
      "categoryAr": "أطباق رئيسية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1632778149975-4abc9507963e?w=600&q=80",
      "ingredients": [
        "Fried chicken breast stuffed with smoked turkey",
        "smoked beef",
        "and cheese mix"
      ],
      "ingredientsAr": [
        "صدور فراخ مقلية محشوة سموك تركي",
        "سموك بيف",
        "وميكس جبن"
      ]
    },
    "chicken-curry": {
      "name": "Chicken Curry",
      "nameAr": "تشيكن كاري",
      "description": "Grilled chicken breast with curry sauce",
      "descriptionAr": "صدور فراخ جريل مع صوص الكاري",
      "price": 319,
      "category": "main_dishes",
      "categoryAr": "أطباق رئيسية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1632778149975-4abc9507963e?w=600&q=80",
      "ingredients": [
        "Grilled chicken breast with curry sauce"
      ],
      "ingredientsAr": [
        "صدور فراخ جريل مع صوص الكاري"
      ]
    },
    "chicken-lemon": {
      "name": "Chicken Lemon",
      "nameAr": "تشيكن ليمون",
      "description": "Grilled chicken breast with lemon sauce",
      "descriptionAr": "صدور فراخ جريل مع صوص الليمون",
      "price": 314,
      "category": "main_dishes",
      "categoryAr": "أطباق رئيسية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1632778149975-4abc9507963e?w=600&q=80",
      "ingredients": [
        "Grilled chicken breast with lemon sauce"
      ],
      "ingredientsAr": [
        "صدور فراخ جريل مع صوص الليمون"
      ]
    },
    "chicken-mexican": {
      "name": "Chicken Mexican",
      "nameAr": "تشيكن ميكسيكان",
      "description": "Grilled chicken with Mexican vegetables and spicy sauce",
      "descriptionAr": "فراخ جريل مع خضروات ميكسيكان وصوص حار",
      "price": 329,
      "category": "main_dishes",
      "categoryAr": "أطباق رئيسية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1632778149975-4abc9507963e?w=600&q=80",
      "ingredients": [
        "Grilled chicken with Mexican vegetables and spicy sauce"
      ],
      "ingredientsAr": [
        "فراخ جريل مع خضروات ميكسيكان وصوص حار"
      ]
    },
    "chicken-mushroom": {
      "name": "Chicken Mushroom",
      "nameAr": "تشيكن مشروم",
      "description": "Grilled chicken breast with mushroom sauce",
      "descriptionAr": "صدور فراخ جريل مع صوص المشروم",
      "price": 334,
      "category": "main_dishes",
      "categoryAr": "أطباق رئيسية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1632778149975-4abc9507963e?w=600&q=80",
      "ingredients": [
        "Grilled chicken breast with mushroom sauce"
      ],
      "ingredientsAr": [
        "صدور فراخ جريل مع صوص المشروم"
      ]
    },
    "chicken-pane": {
      "name": "Chicken Pane",
      "nameAr": "تشيكن بانيه",
      "description": "Fried breaded chicken breast",
      "descriptionAr": "صدور فراخ بانيه مقلية",
      "price": 312,
      "category": "main_dishes",
      "categoryAr": "أطباق رئيسية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1632778149975-4abc9507963e?w=600&q=80",
      "ingredients": [
        "Fried breaded chicken breast"
      ],
      "ingredientsAr": [
        "صدور فراخ بانيه مقلية"
      ]
    },
    "grilled-chicken": {
      "name": "Grilled Chicken",
      "nameAr": "جريلد تشيكن",
      "description": "Grilled chicken breast with your choice of sauce (Mushroom, Pepper, Blue Cheese, Lemon, or Curry)",
      "descriptionAr": "صدور فراخ جريل مع اختيارك من الصوص (مشروم، فلفل، بلو تشيز، ليمون، أو كاري)",
      "price": 314,
      "category": "main_dishes",
      "categoryAr": "أطباق رئيسية",
      "available": true,
      "image": "https://images.unsplash.com/photo-1632778149975-4abc9507963e?w=600&q=80",
      "ingredients": [
        "Grilled chicken breast with your choice of sauce (Mushroom",
        "Pepper",
        "Blue Cheese",
        "Lemon",
        "or Curry)"
      ],
      "ingredientsAr": [
        "صدور فراخ جريل مع اختيارك من الصوص (مشروم",
        "فلفل",
        "بلو تشيز",
        "ليمون",
        "أو كاري)"
      ]
    }
  },
  "milkshakes": {
    "blueberry-milkshake": {
      "name": "Blueberry Milkshake",
      "nameAr": "بلوبيري ميلك شيك",
      "description": "Blueberry Milkshake",
      "descriptionAr": "بلوبيري ميلك شيك",
      "price": 154,
      "category": "milkshakes",
      "categoryAr": "ميلك شيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "caramel-milkshake": {
      "name": "Caramel Milkshake",
      "nameAr": "كراميل ميلك شيك",
      "description": "Caramel Milkshake",
      "descriptionAr": "كراميل ميلك شيك",
      "price": 144,
      "category": "milkshakes",
      "categoryAr": "ميلك شيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "chocolate-milkshake": {
      "name": "Chocolate Milkshake",
      "nameAr": "شوكلت ميلك شيك",
      "description": "Chocolate Milkshake",
      "descriptionAr": "شوكلت ميلك شيك",
      "price": 134,
      "category": "milkshakes",
      "categoryAr": "ميلك شيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "lotus-milkshake": {
      "name": "Lotus Milkshake",
      "nameAr": "لوتس ميلك شيك",
      "description": "Lotus Milkshake",
      "descriptionAr": "لوتس ميلك شيك",
      "price": 159,
      "category": "milkshakes",
      "categoryAr": "ميلك شيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "mango-milkshake": {
      "name": "Mango Milkshake",
      "nameAr": "مانجو ميلك شيك",
      "description": "Mango Milkshake",
      "descriptionAr": "مانجو ميلك شيك",
      "price": 144,
      "category": "milkshakes",
      "categoryAr": "ميلك شيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "oreo-milkshake": {
      "name": "Oreo Milkshake",
      "nameAr": "اوريو ميلك شيك",
      "description": "Oreo Milkshake",
      "descriptionAr": "اوريو ميلك شيك",
      "price": 144,
      "category": "milkshakes",
      "categoryAr": "ميلك شيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "pistachio-milkshake": {
      "name": "Pistachio Milkshake",
      "nameAr": "بيستاشيو ميلك شيك",
      "description": "Pistachio Milkshake",
      "descriptionAr": "بيستاشيو ميلك شيك",
      "price": 174,
      "category": "milkshakes",
      "categoryAr": "ميلك شيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "strawberry-milkshake": {
      "name": "Strawberry Milkshake",
      "nameAr": "ستروبري ميلك شيك",
      "description": "Strawberry Milkshake",
      "descriptionAr": "ستروبري ميلك شيك",
      "price": 134,
      "category": "milkshakes",
      "categoryAr": "ميلك شيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    },
    "vanilla-milkshake": {
      "name": "Vanilla Milkshake",
      "nameAr": "فانيليا ميلك شيك",
      "description": "Vanilla Milkshake",
      "descriptionAr": "فانيليا ميلك شيك",
      "price": 129,
      "category": "milkshakes",
      "categoryAr": "ميلك شيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&q=80"
    }
  },
  "mocktails": {
    "blue-passion-smoothie": {
      "name": "Blue Passion Smoothie",
      "nameAr": "بلو باشون سموزي",
      "description": "Blue Passion Smoothie",
      "descriptionAr": "بلو باشون سموزي",
      "price": 159,
      "category": "mocktails",
      "categoryAr": "موكتيل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80",
      "recommended": true
    },
    "mango-peach-smoothie": {
      "name": "Mango Peach Smoothie",
      "nameAr": "مانجو بيتش سموزي",
      "description": "Mango Peach Smoothie",
      "descriptionAr": "مانجو بيتش سموزي",
      "price": 154,
      "category": "mocktails",
      "categoryAr": "موكتيل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "pina-colada-smoothie": {
      "name": "Pina Colada Smoothie",
      "nameAr": "بينا كولادا سموزي",
      "description": "Pina Colada Smoothie",
      "descriptionAr": "بينا كولادا سموزي",
      "price": 154,
      "category": "mocktails",
      "categoryAr": "موكتيل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "strawberry-lemonade-smoothie": {
      "name": "Strawberry Lemonade Smoothie",
      "nameAr": "ستروبري ليمونيت سموزي",
      "description": "Strawberry Lemonade Smoothie",
      "descriptionAr": "ستروبري ليمونيت سموزي",
      "price": 144,
      "category": "mocktails",
      "categoryAr": "موكتيل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "lemon-mint": {
      "name": "Lemon Mint",
      "nameAr": "ليمون مينت",
      "description": "Lemon Mint",
      "descriptionAr": "ليمون مينت",
      "price": 99,
      "category": "mocktails",
      "categoryAr": "موكتيل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "lemon-passion": {
      "name": "Lemon Passion",
      "nameAr": "ليمون باشون",
      "description": "Lemon Passion",
      "descriptionAr": "ليمون باشون",
      "price": 109,
      "category": "mocktails",
      "categoryAr": "موكتيل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "lemon-pink": {
      "name": "Lemon Pink",
      "nameAr": "ليمون بينك",
      "description": "Lemon Pink",
      "descriptionAr": "ليمون بينك",
      "price": 99,
      "category": "mocktails",
      "categoryAr": "موكتيل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "lemon-strawberry": {
      "name": "Lemon Strawberry",
      "nameAr": "ليمون ستروبري",
      "description": "Lemon Strawberry",
      "descriptionAr": "ليمون ستروبري",
      "price": 99,
      "category": "mocktails",
      "categoryAr": "موكتيل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    }
  },
  "mojitos": {
    "apple-mojito": {
      "name": "Apple Mojito",
      "nameAr": "ابل موهيتو",
      "description": "Apple Mojito",
      "descriptionAr": "ابل موهيتو",
      "price": 184,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "blueberry-mojito": {
      "name": "Blueberry Mojito",
      "nameAr": "بلوبيري موهيتو",
      "description": "Blueberry Mojito",
      "descriptionAr": "بلوبيري موهيتو",
      "price": 184,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "boba-mojito": {
      "name": "Boba Mojito",
      "nameAr": "بوبه موهيتو",
      "description": "Boba Mojito",
      "descriptionAr": "بوبه موهيتو",
      "price": 224,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "cherry-cola": {
      "name": "Cherry Cola",
      "nameAr": "شيري كولا",
      "description": "Cherry Cola",
      "descriptionAr": "شيري كولا",
      "price": 139,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "classic-mojito": {
      "name": "Classic Mojito",
      "nameAr": "كلاسيك موهيتو",
      "description": "Classic Mojito",
      "descriptionAr": "كلاسيك موهيتو",
      "price": 112,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "french-cola": {
      "name": "French Cola",
      "nameAr": "فرنش كولا",
      "description": "French Cola",
      "descriptionAr": "فرنش كولا",
      "price": 144,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "mix-berry-mojito": {
      "name": "Mix Berry Mojito",
      "nameAr": "ميكس بيري موهيتو",
      "description": "Mix Berry Mojito",
      "descriptionAr": "ميكس بيري موهيتو",
      "price": 181,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "passion-blue": {
      "name": "Passion Blue",
      "nameAr": "باشون بلو",
      "description": "Passion Blue",
      "descriptionAr": "باشون بلو",
      "price": 169,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "passion-mojito": {
      "name": "Passion Mojito",
      "nameAr": "باشون موهيتو",
      "description": "Passion Mojito",
      "descriptionAr": "باشون موهيتو",
      "price": 179,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "peach-mojito": {
      "name": "Peach Mojito",
      "nameAr": "بيتش موهيتو",
      "description": "Peach Mojito",
      "descriptionAr": "بيتش موهيتو",
      "price": 189,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "pineapple-mojito": {
      "name": "Pineapple Mojito",
      "nameAr": "باين ابل موهيتو",
      "description": "Pineapple Mojito",
      "descriptionAr": "باين ابل موهيتو",
      "price": 197,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "redbull-berry": {
      "name": "Redbull Berry",
      "nameAr": "ريدبول بيري",
      "description": "Redbull Berry",
      "descriptionAr": "ريدبول بيري",
      "price": 209,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "redbull-blue": {
      "name": "Redbull Blue",
      "nameAr": "ريدبول بلو",
      "description": "Redbull Blue",
      "descriptionAr": "ريدبول بلو",
      "price": 204,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "redbull-mojito": {
      "name": "Redbull Mojito",
      "nameAr": "ريدبول موهيتو",
      "description": "Redbull Mojito",
      "descriptionAr": "ريدبول موهيتو",
      "price": 204,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    },
    "strawberry-mojito": {
      "name": "Strawberry Mojito",
      "nameAr": "ستروبري موهيتو",
      "description": "Strawberry Mojito",
      "descriptionAr": "ستروبري موهيتو",
      "price": 188,
      "category": "mojitos",
      "categoryAr": "موهيتو اند كولد درينكس",
      "available": true,
      "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80"
    }
  },
  "new_items": {
    "chicken-butterfly": {
      "name": "Chicken Butterfly",
      "nameAr": "تشيكن باترفلاي",
      "description": "Grilled chicken with butterfly sauce, served with rice, toasted bread with garlic, mushrooms, and mozzarella",
      "descriptionAr": "فراخ جريل بصوص البتر فلاي، يقدم مع الأرز وعيش محمص بالثوم والمشروم والموزاريلا",
      "price": 336,
      "category": "new_items",
      "categoryAr": "أصناف جديدة",
      "available": true,
      "image": "https://images.unsplash.com/photo-1632778149975-4abc9507963e?w=600&q=80",
      "ingredients": [
        "Grilled chicken",
        "butterfly sauce",
        "rice",
        "toasted garlic bread",
        "mushrooms",
        "mozzarella"
      ],
      "ingredientsAr": [
        "فراخ جريل",
        "صوص البتر فلاي",
        "أرز",
        "عيش محمص بالثوم",
        "مشروم",
        "موزاريلا"
      ],
      "recommended": true
    },
    "chicken-lemon-pasta": {
      "name": "Chicken Lemon Pasta",
      "nameAr": "تشيكن ليمون باستا",
      "description": "Penne pasta with creamy lemon sauce and grilled chicken pieces",
      "descriptionAr": "بنا باستا مع صوص الليمون الكريمي مع قطع الفراخ الجريل",
      "price": 234,
      "category": "new_items",
      "categoryAr": "أصناف جديدة",
      "available": true,
      "image": "https://images.unsplash.com/photo-1632778149975-4abc9507963e?w=600&q=80",
      "ingredients": [
        "Penne pasta",
        "creamy lemon sauce",
        "grilled chicken"
      ],
      "ingredientsAr": [
        "باستا بنا",
        "صوص الليمون الكريمي",
        "فراخ جريل"
      ]
    },
    "chicken-moo": {
      "name": "Chicken Moo",
      "nameAr": "تشيكن مو",
      "description": "Two grilled chicken pieces stuffed with mushrooms and caramelized onions, drowned in American cheese and Parmesan. The perfect mix of crispy, juicy, and saucy.",
      "descriptionAr": "قطعتين من الفراخ المشوية محشية مشروم مع البصل المكرمل غرقانة في الامريكان تشيز مع البارميزان 🔥 It's the perfect mix of crispy, juicy, and saucy.",
      "price": 299,
      "category": "new_items",
      "categoryAr": "أصناف جديدة",
      "available": true,
      "image": "https://images.unsplash.com/photo-1632778149975-4abc9507963e?w=600&q=80",
      "ingredients": ["Grilled chicken", "mushrooms", "caramelized onions", "American cheese", "Parmesan"],
      "ingredientsAr": ["فراخ مشوية", "مشروم", "بصل مكرمل", "امريكان تشيز", "بارميزان"]
    },
    "dynamite-chicken": {
      "name": "Dynamite Chicken",
      "nameAr": "دايناميت تشيكن",
      "description": "Chicken pieces with special dynamite sauce",
      "descriptionAr": "قطع الفراخ مع صوص الدايناميت الخاص",
      "price": 178,
      "category": "new_items",
      "categoryAr": "أصناف جديدة",
      "available": true,
      "image": "https://images.unsplash.com/photo-1632778149975-4abc9507963e?w=600&q=80",
      "ingredients": [
        "Crispy chicken pieces",
        "special dynamite sauce"
      ],
      "ingredientsAr": [
        "قطع فراخ كريسبي",
        "صوص الدايناميت الخاص"
      ]
    }
  },
  "pancakes": {
    "brownie-club": {
      "name": "Brownie Club",
      "nameAr": "براوني كلوب",
      "description": "3 layers of pancakes with brownie pieces and chocolate mix",
      "descriptionAr": "3 طبقات من البان كيك مع قطع البراونيز وميكس الشوكولاته",
      "price": 279,
      "category": "pancakes",
      "categoryAr": "بان كيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80",
      "ingredients": [
        "3 layers of pancakes with brownie pieces and chocolate mix"
      ],
      "ingredientsAr": [
        "3 طبقات من البان كيك مع قطع البراونيز وميكس الشوكولاته"
      ]
    },
    "chocolate-pancakes": {
      "name": "Chocolate Pancakes",
      "nameAr": "شوكلت بان كيك",
      "description": "3 layers of pancakes with a choice of two types of chocolate",
      "descriptionAr": "3 طبقات من البان كيك مع اختيار نوعين من الشوكولاته",
      "price": 180,
      "category": "pancakes",
      "categoryAr": "بان كيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80",
      "ingredients": [
        "3 layers of pancakes with a choice of two types of chocolate"
      ],
      "ingredientsAr": [
        "3 طبقات من البان كيك مع اختيار نوعين من الشوكولاته"
      ]
    },
    "crunchy-lotus": {
      "name": "Crunchy Lotus",
      "nameAr": "كرانشي لوتس",
      "description": "3 layers of pancakes with sauce and Lotus biscuits",
      "descriptionAr": "3 طبقات من البان كيك مع صوص وبسكويت اللوتس",
      "price": 211,
      "category": "pancakes",
      "categoryAr": "بان كيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80",
      "ingredients": [
        "3 layers of pancakes with sauce and Lotus biscuits"
      ],
      "ingredientsAr": [
        "3 طبقات من البان كيك مع صوص وبسكويت اللوتس"
      ]
    },
    "marshmallow-smores": {
      "name": "Marshmallow S'mores",
      "nameAr": "مارشميلو سمورز",
      "description": "3 layers of pancakes with marshmallows and dark chocolate, served with a scoop of ice cream",
      "descriptionAr": "3 طبقات من البان كيك مع المارشميلو والدارك شوكلت، ويقدم مع بوله ايس كريم",
      "price": 189,
      "category": "pancakes",
      "categoryAr": "بان كيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80",
      "ingredients": [
        "3 layers of pancakes with marshmallows and dark chocolate",
        "served with a scoop of ice cream"
      ],
      "ingredientsAr": [
        "3 طبقات من البان كيك مع المارشميلو والدارك شوكلت",
        "ويقدم مع بوله ايس كريم"
      ]
    },
    "mix-berry": {
      "name": "Mix Berry",
      "nameAr": "ميكس بيري",
      "description": "3 layers of pancakes with mixed berries and white chocolate",
      "descriptionAr": "3 طبقات من البان كيك مع الميكس بيري والوايت شوكلت",
      "price": 259,
      "category": "pancakes",
      "categoryAr": "بان كيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80",
      "ingredients": [
        "3 layers of pancakes with mixed berries and white chocolate"
      ],
      "ingredientsAr": [
        "3 طبقات من البان كيك مع الميكس بيري والوايت شوكلت"
      ]
    },
    "mixed-chocolate": {
      "name": "Mixed Chocolate",
      "nameAr": "ميكس شوكلت",
      "description": "3 layers of pancakes with 4 types of chocolate (Dark, Milk, White, Nutella)",
      "descriptionAr": "3 طبقات من البان كيك مع 4 أنواع من الشوكولاته (دارك، ميلك، وايت، نوتيلا)",
      "price": 234,
      "category": "pancakes",
      "categoryAr": "بان كيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80",
      "ingredients": [
        "3 layers of pancakes with 4 types of chocolate (Dark",
        "Milk",
        "White",
        "Nutella)"
      ],
      "ingredientsAr": [
        "3 طبقات من البان كيك مع 4 أنواع من الشوكولاته (دارك",
        "ميلك",
        "وايت",
        "نوتيلا)"
      ]
    },
    "pistachio": {
      "name": "Pistachio",
      "nameAr": "بيستاشيو",
      "description": "3 layers of pancakes with pistachio sauce",
      "descriptionAr": "3 طبقات من البان كيك مع صوص البيستاشيو",
      "price": 255,
      "category": "pancakes",
      "categoryAr": "بان كيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80",
      "ingredients": [
        "3 layers of pancakes with pistachio sauce"
      ],
      "ingredientsAr": [
        "3 طبقات من البان كيك مع صوص البيستاشيو"
      ]
    },
    "strawberry-chocolate": {
      "name": "Strawberry Chocolate",
      "nameAr": "ستروبري شوكلت",
      "description": "3 layers of pancakes with fresh strawberry pieces and chocolate mix",
      "descriptionAr": "3 طبقات من البان كيك مع قطع الفراولة الطازجة وميكس شوكلت",
      "price": 194,
      "category": "pancakes",
      "categoryAr": "بان كيك",
      "available": true,
      "image": "https://images.unsplash.com/photo-1551024601-bec78acc704b?w=600&q=80",
      "ingredients": [
        "3 layers of pancakes with fresh strawberry pieces and chocolate mix"
      ],
      "ingredientsAr": [
        "3 طبقات من البان كيك مع قطع الفراولة الطازجة وميكس شوكلت"
      ]
    }
  },
  "pasta": {
    "alfredo-pasta": {
      "name": "Alfredo Pasta",
      "nameAr": "الفريدو باستا",
      "description": "Creamy Alfredo pasta with Parmesan",
      "descriptionAr": "باستا بصوص الفريدو الكريمي والبارميزان",
      "price": 249,
      "category": "pasta",
      "categoryAr": "باستا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&q=80",
      "ingredients": ["Pasta", "Alfredo cream sauce", "Parmesan"],
      "ingredientsAr": ["باستا", "صوص الفريدو الكريمي", "بارميزان"]
    },
    "azura-spicy-pasta": {
      "name": "Azura Spicy Pasta",
      "nameAr": "ازورا سبايسي باستا",
      "description": "Jalapeno, Spices, White Sauce, Pepperoni, Sweet Chili",
      "descriptionAr": "هالبينو، توابل، وايت صوص، ببروني، سويت شيلي",
      "price": 189,
      "category": "pasta",
      "categoryAr": "باستا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&q=80",
      "ingredients": [
        "Jalapeno",
        "Spices",
        "White Sauce",
        "Pepperoni",
        "Sweet Chili"
      ],
      "ingredientsAr": [
        "هالبينو",
        "توابل",
        "وايت صوص",
        "ببروني",
        "سويت شيلي"
      ]
    },
    "beef-stroganoff-pasta": {
      "name": "Beef Stroganoff Pasta",
      "nameAr": "بيف ستراجنوف باستا",
      "description": "Pasta with beef strips, mushroom, onion, and creamy sauce",
      "descriptionAr": "باستا مع شرايح لحم ومشروم وبصل وصوص كريمي",
      "price": 279,
      "category": "pasta",
      "categoryAr": "باستا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&q=80",
      "ingredients": ["Pasta", "beef strips", "mushrooms", "onion", "cream sauce"],
      "ingredientsAr": ["باستا", "شرايح لحم", "مشروم", "بصل", "صوص كريمي"]
    },
    "cheese-ranch-pasta": {
      "name": "Cheese Ranch Pasta",
      "nameAr": "تشيز رانش باستا",
      "description": "Cheese mix, crispy chicken, ranch sauce",
      "descriptionAr": "ميكس جبن، فراخ كريسبي، صوص رانش",
      "price": 238,
      "category": "pasta",
      "categoryAr": "باستا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&q=80",
      "ingredients": [
        "Cheese mix",
        "crispy chicken",
        "ranch sauce"
      ],
      "ingredientsAr": [
        "ميكس جبن",
        "فراخ كريسبي",
        "صوص رانش"
      ]
    },
    "chicken-gravy-pasta": {
      "name": "Chicken Gravy Pasta",
      "nameAr": "تشيكن جريفي باستا",
      "description": "Pasta with grilled chicken and gravy sauce",
      "descriptionAr": "باستا مع فراخ جريل وصوص الجريفي",
      "price": 206,
      "category": "pasta",
      "categoryAr": "باستا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&q=80",
      "ingredients": ["Pasta", "grilled chicken", "gravy sauce"],
      "ingredientsAr": ["باستا", "فراخ جريل", "صوص الجريفي"]
    },
    "mac-and-cheese": {
      "name": "Mac and Cheese",
      "nameAr": "ماك اند تشيز",
      "description": "Macaroni with creamy cheese sauce",
      "descriptionAr": "مكرونه بصوص الجبنه الكريمي",
      "price": 247,
      "category": "pasta",
      "categoryAr": "باستا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&q=80",
      "ingredients": ["Macaroni", "cheddar cheese sauce", "mozzarella"],
      "ingredientsAr": ["مكرونه", "صوص شيدر", "موتزريلا"]
    },
    "mammo-pasta": {
      "name": "Mammo Pasta",
      "nameAr": "مامو باستا",
      "description": "Crispy chicken, red sauce spaghetti, parmesan cheese",
      "descriptionAr": "فراخ كريسبي، مكرونه ريد صوص، سباجتي، جبنه بارميزان",
      "price": 196,
      "category": "pasta",
      "categoryAr": "باستا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&q=80",
      "ingredients": [
        "Crispy chicken",
        "red sauce spaghetti",
        "parmesan cheese"
      ],
      "ingredientsAr": [
        "فراخ كريسبي",
        "مكرونه ريد صوص",
        "سباجتي",
        "جبنه بارميزان"
      ]
    },
    "negresco": {
      "name": "Negresco",
      "nameAr": "نجرسكو",
      "description": "Negresco pasta with creamy sauce",
      "descriptionAr": "باستا نجرسكو بالصوص الكريمي",
      "price": 258,
      "category": "pasta",
      "categoryAr": "باستا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&q=80",
      "ingredients": ["Pasta", "creamy Negresco sauce", "Parmesan"],
      "ingredientsAr": ["باستا", "صوص نجرسكو الكريمي", "بارميزان"]
    },
    "pasta-arrabbiata": {
      "name": "Pasta Arrabbiata",
      "nameAr": "اربيتا باستا",
      "description": "Pasta with spicy tomato sauce, garlic, and chili",
      "descriptionAr": "باستا بصوص الطماطم الحار والثوم والفلفل",
      "price": 165,
      "category": "pasta",
      "categoryAr": "باستا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&q=80",
      "ingredients": ["Pasta", "spicy tomato sauce", "garlic", "chili"],
      "ingredientsAr": ["باستا", "صوص الطماطم الحار", "ثوم", "فلفل"]
    },
    "pasta-forno": {
      "name": "Pasta Forno",
      "nameAr": "فورنو باستا",
      "description": "Baked pasta with béchamel and cheese",
      "descriptionAr": "باستا مخبوزة بصوص البيشاميل والجبنه",
      "price": 204,
      "category": "pasta",
      "categoryAr": "باستا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&q=80",
      "ingredients": ["Pasta", "béchamel sauce", "cheese", "beef"],
      "ingredientsAr": ["باستا", "صوص بيشاميل", "جبنه", "لحم"]
    },
    "pesto-pasta": {
      "name": "Pesto Pasta",
      "nameAr": "بيستو باستا",
      "description": "Pasta with basil pesto sauce and Parmesan",
      "descriptionAr": "باستا بصوص البيستو والريحان والبارميزان",
      "price": 216,
      "category": "pasta",
      "categoryAr": "باستا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&q=80",
      "ingredients": ["Pasta", "basil pesto sauce", "Parmesan", "pine nuts"],
      "ingredientsAr": ["باستا", "صوص البيستو والريحان", "بارميزان", "صنوبر"]
    },
    "spaghetti-bolognese": {
      "name": "Spaghetti Bolognese",
      "nameAr": "سباجتي بولنيز",
      "description": "Spaghetti with Bolognese meat sauce and Parmesan",
      "descriptionAr": "سباجتي بصوص البولنيز اللحم والبارميزان",
      "price": 197,
      "category": "pasta",
      "categoryAr": "باستا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&q=80",
      "ingredients": ["Spaghetti", "Bolognese meat sauce", "tomato", "Parmesan"],
      "ingredientsAr": ["سباجتي", "صوص بولنيز اللحم", "طماطم", "بارميزان"]
    }
  },
  "sahlab": {
    "classic-sahlab-nuts": {
      "name": "Classic Sahlab (Nuts)",
      "nameAr": "كلاسيك سحلب",
      "description": "Classic Sahlab (Nuts)",
      "descriptionAr": "كلاسيك سحلب",
      "price": 104,
      "category": "sahlab",
      "categoryAr": "سحلب",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544787210-2211d7c309c7?w=600&q=80"
    },
    "lotus-sahlab": {
      "name": "Lotus Sahlab",
      "nameAr": "سحلب لوتس",
      "description": "Lotus Sahlab",
      "descriptionAr": "سحلب لوتس",
      "price": 149,
      "category": "sahlab",
      "categoryAr": "سحلب",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544787210-2211d7c309c7?w=600&q=80"
    },
    "nutella-sahlab": {
      "name": "Nutella Sahlab",
      "nameAr": "سحلب نوتيلا",
      "description": "Nutella Sahlab",
      "descriptionAr": "سحلب نوتيلا",
      "price": 139,
      "category": "sahlab",
      "categoryAr": "سحلب",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544787210-2211d7c309c7?w=600&q=80"
    },
    "pistachio-sahlab": {
      "name": "Pistachio Sahlab",
      "nameAr": "سحلب بيستاشيو",
      "description": "Pistachio Sahlab",
      "descriptionAr": "سحلب بيستاشيو",
      "price": 169,
      "category": "sahlab",
      "categoryAr": "سحلب",
      "available": true,
      "image": "https://images.unsplash.com/photo-1544787210-2211d7c309c7?w=600&q=80"
    }
  },
  "salads": {
    "azura-disco-salad": {
      "name": "Azura Disco Salad",
      "nameAr": "ازورا ديسكو سالاد",
      "description": "Lettuce, Crispy Chicken, Smoked Turkey, Smoked Beef, Colored Peppers, Cheddar Mix, Nachos, Honey Mustard Sauce",
      "descriptionAr": "خس، فراخ كريسبي، سموك تركي، سموك بيف، فلفل الوان، ميكس شيدر، ناتشوز، هوني ماسترد صوص",
      "price": 248,
      "category": "salads",
      "categoryAr": "سالاد",
      "available": true,
      "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "Crispy Chicken",
        "Smoked Turkey",
        "Smoked Beef",
        "Colored Peppers",
        "Cheddar Mix",
        "Nachos",
        "Honey Mustard Sauce"
      ],
      "ingredientsAr": [
        "خس",
        "فراخ كريسبي",
        "سموك تركي",
        "سموك بيف",
        "فلفل الوان",
        "ميكس شيدر",
        "ناتشوز",
        "هوني ماسترد صوص"
      ]
    },
    "california-salad": {
      "name": "California Salad",
      "nameAr": "كاليفورنيا سالاد",
      "description": "Lettuce, colored peppers, cucumber, cheddar mix, grilled chicken, sweet corn, Hawaiian sauce",
      "descriptionAr": "خس، فلفل الوان، خيار، ميكس شيدر، فراخ جريل، سويت كورن، هاواى صوص",
      "price": 193,
      "category": "salads",
      "categoryAr": "سالاد",
      "available": true,
      "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "colored peppers",
        "cucumber",
        "cheddar mix",
        "grilled chicken",
        "sweet corn",
        "Hawaiian sauce"
      ],
      "ingredientsAr": [
        "خس",
        "فلفل الوان",
        "خيار",
        "ميكس شيدر",
        "فراخ جريل",
        "سويت كورن",
        "هاواى صوص"
      ]
    },
    "chicken-caesar-salad": {
      "name": "Chicken Caesar Salad",
      "nameAr": "تشيكن سيزر سالاد",
      "description": "Lettuce, grilled chicken, croutons, Caesar dressing, Parmesan cheese",
      "descriptionAr": "خس، فراخ جريل، عيش كريتون، صوص سيزر، جبنه بارميزان",
      "price": 204,
      "category": "salads",
      "categoryAr": "سالاد",
      "available": true,
      "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "grilled chicken",
        "croutons",
        "Caesar dressing",
        "Parmesan cheese"
      ],
      "ingredientsAr": [
        "خس",
        "فراخ جريل",
        "عيش كريتون",
        "صوص سيزر",
        "جبنه بارميزان"
      ]
    },
    "greek-salad": {
      "name": "Greek Salad",
      "nameAr": "جريك سالاد",
      "description": "Lettuce, cucumber, tomatoes, Greek cheese, thyme, olive oil",
      "descriptionAr": "خس، خيار، طماطم، جبنه جريك، زعتر، زيت زيتون",
      "price": 133,
      "category": "salads",
      "categoryAr": "سالاد",
      "available": true,
      "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "cucumber",
        "tomatoes",
        "Greek cheese",
        "thyme",
        "olive oil"
      ],
      "ingredientsAr": [
        "خس",
        "خيار",
        "طماطم",
        "جبنه جريك",
        "زعتر",
        "زيت زيتون"
      ]
    },
    "rocca-salad": {
      "name": "Rocca Salad",
      "nameAr": "روكا سالاد",
      "description": "Lettuce, arugula, hazelnuts, fresh mushrooms, colored peppers, and Parmesan cheese",
      "descriptionAr": "خس، جرجير، بندق، مشروم فريش، فلفل الوان، جبنه بارميزان",
      "price": 124,
      "category": "salads",
      "categoryAr": "سالاد",
      "available": true,
      "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "arugula",
        "hazelnuts",
        "fresh mushrooms",
        "colored peppers",
        "and Parmesan cheese"
      ],
      "ingredientsAr": [
        "خس",
        "جرجير",
        "بندق",
        "مشروم فريش",
        "فلفل الوان",
        "جبنه بارميزان"
      ]
    },
    "tuna-salad": {
      "name": "Tuna Salad",
      "nameAr": "تونه سالاد",
      "description": "Tuna, mayonnaise, colored pepper, onion, olives, lettuce",
      "descriptionAr": "تونه، ماينوز، فلفل الوان، بصل، زيتون، خس",
      "price": 206,
      "category": "salads",
      "categoryAr": "سالاد",
      "available": true,
      "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
      "ingredients": [
        "Tuna",
        "mayonnaise",
        "colored pepper",
        "onion",
        "olives",
        "lettuce"
      ],
      "ingredientsAr": [
        "تونه",
        "ماينوز",
        "فلفل الوان",
        "بصل",
        "زيتون",
        "خس"
      ]
    }
  },
  "shisha": {
    "mix-shisha": {
      "name": "Mix Shisha",
      "nameAr": "شيشة ميكس",
      "description": "Mix Shisha",
      "descriptionAr": "شيشة ميكس",
      "price": 180,
      "category": "shisha",
      "categoryAr": "شيشة",
      "available": true,
      "image": "https://images.unsplash.com/photo-1516900448138-898720b936c7?w=600&q=80"
    }
  },
  "smash_burgers": {
    "chili-ranch": {
      "name": "Chili Ranch",
      "nameAr": "تشيلى رانش",
      "description": "Lettuce, tomato, Stracha, jalapeno, cheese sauce, Doritos, ranch",
      "descriptionAr": "خس، طماطم، ستراتشا، هالبينو، صوص جبنه، دوريتوس، رانش",
      "price": 267,
      "category": "smash_burgers",
      "categoryAr": "سماش برجر",
      "available": true,
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "tomato",
        "Stracha",
        "jalapeno",
        "cheese sauce",
        "Doritos",
        "ranch"
      ],
      "ingredientsAr": [
        "خس",
        "طماطم",
        "ستراتشا",
        "هالبينو",
        "صوص جبنه",
        "دوريتوس",
        "رانش"
      ]
    },
    "classic-smash": {
      "name": "Classic Smash",
      "nameAr": "كلاسيك سماش",
      "description": "Lettuce, tomato, caramelized onion, 2 smash pieces, cheese sauce",
      "descriptionAr": "خس، طماطم، بصل مكرمل، قطعتين سماش، صوص جينه",
      "price": 227,
      "category": "smash_burgers",
      "categoryAr": "سماش برجر",
      "available": true,
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "tomato",
        "caramelized onion",
        "2 smash pieces",
        "cheese sauce"
      ],
      "ingredientsAr": [
        "خس",
        "طماطم",
        "بصل مكرمل",
        "قطعتين سماش",
        "صوص جينه"
      ]
    },
    "fire-smash-burger": {
      "name": "Fire Smash Burger",
      "nameAr": "فاير سماش برجر",
      "description": "Lettuce, tomato, sweet chili, Stracha, beef bacon with jalapeno",
      "descriptionAr": "خس، طماطم، سويت شيلي، ستراتشا، بيف بيكون مع هالبينو",
      "price": 257,
      "category": "smash_burgers",
      "categoryAr": "سماش برجر",
      "available": true,
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "tomato",
        "sweet chili",
        "Stracha",
        "beef bacon with jalapeno"
      ],
      "ingredientsAr": [
        "خس",
        "طماطم",
        "سويت شيلي",
        "ستراتشا",
        "بيف بيكون مع هالبينو"
      ]
    },
    "fried-club": {
      "name": "Fried Club",
      "nameAr": "فرايد كلوب",
      "description": "Lettuce, tomato, cheese sauce, onion rings, mozzarella stick, nachos",
      "descriptionAr": "خس، طماطم، صوض جبنه، حلقات بصل، موتزريلا استيك، ناتشوز",
      "price": 281,
      "category": "smash_burgers",
      "categoryAr": "سماش برجر",
      "available": true,
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "tomato",
        "cheese sauce",
        "onion rings",
        "mozzarella stick",
        "nachos"
      ],
      "ingredientsAr": [
        "خس",
        "طماطم",
        "صوض جبنه",
        "حلقات بصل",
        "موتزريلا استيك",
        "ناتشوز"
      ]
    },
    "oven-baked-smash": {
      "name": "Oven Baked Smash",
      "nameAr": "اوفن بيكد سماش",
      "description": "Texas, lettuce, tomato, pepperoni, mozzarella",
      "descriptionAr": "تكساس، خس، طماطم، ببروني، موتزريلا",
      "price": 279,
      "category": "smash_burgers",
      "categoryAr": "سماش برجر",
      "available": true,
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      "ingredients": [
        "Texas",
        "lettuce",
        "tomato",
        "pepperoni",
        "mozzarella"
      ],
      "ingredientsAr": [
        "تكساس",
        "خس",
        "طماطم",
        "ببروني",
        "موتزريلا"
      ]
    },
    "smash-mushroom-boom": {
      "name": "Smash Mushroom Boom",
      "nameAr": "سماش مشروم بووم",
      "description": "Lettuce, tomato, mushroom cheese sauce, caramelized onion, Texas, 2 smash pieces",
      "descriptionAr": "خس، طماطم، صوص مشروم تشيز، بصل مكرمل، تكساس، قطعتين سماش",
      "price": 252,
      "category": "smash_burgers",
      "categoryAr": "سماش برجر",
      "available": true,
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "tomato",
        "mushroom cheese sauce",
        "caramelized onion",
        "Texas",
        "2 smash pieces"
      ],
      "ingredientsAr": [
        "خس",
        "طماطم",
        "صوص مشروم تشيز",
        "بصل مكرمل",
        "تكساس",
        "قطعتين سماش"
      ]
    },
    "smoke-smash-burger": {
      "name": "Smoke Smash Burger",
      "nameAr": "سموك سماش برجر",
      "description": "Lettuce, tomato, Texas, caramelized onion, beef bacon",
      "descriptionAr": "خس، طماطم، تكساس، بصل مكرمل، بيف بيكون",
      "price": 282,
      "category": "smash_burgers",
      "categoryAr": "سماش برجر",
      "available": true,
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "tomato",
        "Texas",
        "caramelized onion",
        "beef bacon"
      ],
      "ingredientsAr": [
        "خس",
        "طماطم",
        "تكساس",
        "بصل مكرمل",
        "بيف بيكون"
      ]
    }
  },
  "smoothies": {
    "blueberry-smoothie": {
      "name": "Blueberry Smoothie",
      "nameAr": "بلوبيري سموزي",
      "description": "Blueberry Smoothie",
      "descriptionAr": "بلوبيري سموزي",
      "price": 139,
      "category": "smoothies",
      "categoryAr": "سموزي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "copa-cabana-smoothie": {
      "name": "Copa Cabana Smoothie",
      "nameAr": "كوبا كبانا سموزي",
      "description": "Copa Cabana Smoothie",
      "descriptionAr": "كوبا كبانا سموزي",
      "price": 129,
      "category": "smoothies",
      "categoryAr": "كوكتيل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "lemon-mint-smoothie": {
      "name": "Lemon Mint Smoothie",
      "nameAr": "ليمون مينت سموزي",
      "description": "Lemon Mint Smoothie",
      "descriptionAr": "ليمون مينت سموزي",
      "price": 104,
      "category": "smoothies",
      "categoryAr": "سموزي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "lemon-smoothie": {
      "name": "Lemon Smoothie",
      "nameAr": "ليمون سموزي",
      "description": "Lemon Smoothie",
      "descriptionAr": "ليمون سموزي",
      "price": 89,
      "category": "smoothies",
      "categoryAr": "سموزي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "mango-kiwi-smoothie": {
      "name": "Mango Kiwi Smoothie",
      "nameAr": "مانجو كيوي سموزي",
      "description": "Mango Kiwi Smoothie",
      "descriptionAr": "مانجو كيوي سموزي",
      "price": 154,
      "category": "smoothies",
      "categoryAr": "كوكتيل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "mango-passion-smoothie": {
      "name": "Mango Passion Smoothie",
      "nameAr": "مانجو باشون سموزي",
      "description": "Mango Passion Smoothie",
      "descriptionAr": "مانجو باشون سموزي",
      "price": 134,
      "category": "smoothies",
      "categoryAr": "سموزي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "mix-berry-smoothie": {
      "name": "Mix Berry Smoothie",
      "nameAr": "ميكس بيري سموزي",
      "description": "Mix Berry Smoothie",
      "descriptionAr": "ميكس بيري سموزي",
      "price": 144,
      "category": "smoothies",
      "categoryAr": "سموزي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "passion-fruit-smoothie": {
      "name": "Passion Fruit Smoothie",
      "nameAr": "باشون فروت سموزي",
      "description": "Passion Fruit Smoothie",
      "descriptionAr": "باشون فروت سموزي",
      "price": 144,
      "category": "smoothies",
      "categoryAr": "سموزي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "passion-strawberry-smoothie": {
      "name": "Passion Strawberry Smoothie",
      "nameAr": "باشون ستروبري سموزي",
      "description": "Passion Strawberry Smoothie",
      "descriptionAr": "باشون ستروبري سموزي",
      "price": 149,
      "category": "smoothies",
      "categoryAr": "سموزي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "pineapple-smoothie": {
      "name": "Pineapple Smoothie",
      "nameAr": "باين ابل سموزي",
      "description": "Pineapple Smoothie",
      "descriptionAr": "باين ابل سموزي",
      "price": 139,
      "category": "smoothies",
      "categoryAr": "سموزي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "strawberry-banana-smoothie": {
      "name": "Strawberry Banana Smoothie",
      "nameAr": "ستروبري بنانا سموزي",
      "description": "Strawberry Banana Smoothie",
      "descriptionAr": "ستروبري بنانا سموزي",
      "price": 137,
      "category": "smoothies",
      "categoryAr": "كوكتيل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "strawberry-smoothie": {
      "name": "Strawberry Smoothie",
      "nameAr": "ستروبري سموزي",
      "description": "Strawberry Smoothie",
      "descriptionAr": "ستروبري سموزي",
      "price": 129,
      "category": "smoothies",
      "categoryAr": "سموزي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "watermelon-smoothie": {
      "name": "Watermelon Smoothie",
      "nameAr": "واتر ميلون سموزي",
      "description": "Watermelon Smoothie",
      "descriptionAr": "واتر ميلون سموزي",
      "price": 149,
      "category": "smoothies",
      "categoryAr": "سموزي",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "white-mountain-smoothie": {
      "name": "White Mountain Smoothie",
      "nameAr": "وايت موانتين سموزي",
      "description": "White Mountain Smoothie",
      "descriptionAr": "وايت موانتين سموزي",
      "price": 139,
      "category": "smoothies",
      "categoryAr": "كوكتيل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    },
    "yellow-and-green-smoothie": {
      "name": "Yellow and Green Smoothie",
      "nameAr": "يالو اند جرين سموزي",
      "description": "Yellow and Green Smoothie",
      "descriptionAr": "يالو اند جرين سموزي",
      "price": 149,
      "category": "smoothies",
      "categoryAr": "كوكتيل",
      "available": true,
      "image": "https://images.unsplash.com/photo-1505252585441-ca40d922998a?w=600&q=80"
    }
  },
  "soft_drinks": {
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
    }
  },
  "soups": {
    "creamy-chicken": {
      "name": "Creamy Chicken Soup",
      "nameAr": "تشيكن كريمي",
      "description": "Creamy chicken soup",
      "descriptionAr": "شوربة فراخ كريمية",
      "price": 113,
      "category": "soups",
      "categoryAr": "شوربة",
      "available": true,
      "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80",
      "ingredients": ["Chicken", "cream", "spices"],
      "ingredientsAr": ["فراخ", "كريمة", "توابل"]
    },
    "creamy-chicken-mushroom": {
      "name": "Creamy Chicken Mushroom Soup",
      "nameAr": "تشيكن كريمي مشروم",
      "description": "Creamy chicken and mushroom soup",
      "descriptionAr": "شوربة فراخ ومشروم كريمية",
      "price": 149,
      "category": "soups",
      "categoryAr": "شوربة",
      "available": true,
      "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80",
      "ingredients": ["Chicken", "mushrooms", "cream", "spices"],
      "ingredientsAr": ["فراخ", "مشروم", "كريمة", "توابل"]
    },
    "mushroom-cream": {
      "name": "Mushroom Cream Soup",
      "nameAr": "كريم مشروم",
      "description": "Creamy mushroom soup",
      "descriptionAr": "شوربة مشروم كريمية",
      "price": 102,
      "category": "soups",
      "categoryAr": "شوربة",
      "available": true,
      "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80",
      "ingredients": ["Mushrooms", "cream", "onion", "spices"],
      "ingredientsAr": ["مشروم", "كريمة", "بصل", "توابل"]
    },
    "tomato-and-basil-soup": {
      "name": "Tomato and Basil Soup",
      "nameAr": "شوربة طماطم بالريحان",
      "description": "Creamy tomato soup with fresh basil",
      "descriptionAr": "شوربة طماطم كريمية بالريحان الطازج",
      "price": 93,
      "category": "soups",
      "categoryAr": "شوربة",
      "available": true,
      "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80",
      "ingredients": ["Tomato", "basil", "cream"],
      "ingredientsAr": ["طماطم", "ريحان", "كريمة"]
    }
  },
  "toast": {
    "cheese-melt": {
      "name": "Cheese Melt Toast",
      "nameAr": "توست تشيز ميلت",
      "description": "Grilled toast with melted cheese and butter",
      "descriptionAr": "خبز مشوي بالجبنه المذابة والزبدة",
      "price": 75,
      "category": "toast",
      "categoryAr": "توست",
      "available": true,
      "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80",
      "ingredients": ["Toasted bread", "melted cheese", "butter"],
      "ingredientsAr": ["خبز محمص", "جبنه مذابة", "زبدة"]
    },
    "chicken-cheese": {
      "name": "Chicken Cheese",
      "nameAr": "تشيكن تشيز",
      "description": "Grilled chicken with mushrooms, colored peppers, and mozzarella, cheddar cheese mix, cheese sauce, lettuce, tomatoes",
      "descriptionAr": "فراخ جريل مع مشروم وفلفل الوان والموتزريلا، ميكس شيدر تشيز، صوص جبنه، خس، طماطم",
      "price": 219,
      "category": "toast",
      "categoryAr": "توست",
      "available": true,
      "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80",
      "ingredients": [
        "Grilled chicken with mushrooms",
        "colored peppers",
        "and mozzarella",
        "cheddar cheese mix",
        "cheese sauce",
        "lettuce",
        "tomatoes"
      ],
      "ingredientsAr": [
        "فراخ جريل مع مشروم وفلفل الوان والموتزريلا",
        "ميكس شيدر تشيز",
        "صوص جبنه",
        "خس",
        "طماطم"
      ]
    },
    "garlic-butter": {
      "name": "Garlic Butter Toast",
      "nameAr": "توست ثوم وزبدة",
      "description": "Crispy toast with garlic butter and herbs",
      "descriptionAr": "خبز مقرمش بالثوم وزبدة والأعشاب",
      "price": 65,
      "category": "toast",
      "categoryAr": "توست",
      "available": true,
      "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80",
      "ingredients": ["Toasted bread", "garlic butter", "herbs"],
      "ingredientsAr": ["خبز محمص", "زبدة ثوم", "أعشاب"]
    },
    "honey-oats": {
      "name": "Honey Oats Toast",
      "nameAr": "توست عسل وشوفان",
      "description": "Toasted bread with honey, oats, and butter",
      "descriptionAr": "خبز محمص بالعسل والشوفان والزبدة",
      "price": 79,
      "category": "toast",
      "categoryAr": "توست",
      "available": true,
      "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80",
      "ingredients": ["Toasted bread", "honey", "oats", "butter"],
      "ingredientsAr": ["خبز محمص", "عسل", "شوفان", "زبدة"]
    },
    "mix-cheese": {
      "name": "Mix Cheese",
      "nameAr": "ميكس تشيز",
      "description": "Cheddar-Mozzarella Mix, Cheese Sauce",
      "descriptionAr": "ميكس شيدر والموتزريلا، صوص جبنه",
      "price": 147,
      "category": "toast",
      "categoryAr": "توست",
      "available": true,
      "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80",
      "ingredients": [
        "Cheddar-Mozzarella Mix",
        "Cheese Sauce"
      ],
      "ingredientsAr": [
        "ميكس شيدر والموتزريلا",
        "صوص جبنه"
      ]
    },
    "nutella-banana": {
      "name": "Nutella Banana Toast",
      "nameAr": "توست نوتيلا وموز",
      "description": "Toasted bread with Nutella and fresh banana slices",
      "descriptionAr": "خبز محمص مع نوتيلا وشرائح موز طازج",
      "price": 89,
      "category": "toast",
      "categoryAr": "توست",
      "available": true,
      "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80",
      "ingredients": ["Toasted bread", "Nutella", "fresh banana"],
      "ingredientsAr": ["خبز محمص", "نوتيلا", "موز طازج"]
    },
    "triple-s": {
      "name": "Triple S",
      "nameAr": "تريبل اس",
      "description": "Smoked Turkey, Beef Bacon, Pepperoni, Lettuce, Tomato, Cheddar Cheese Mix",
      "descriptionAr": "سموك تركي، بيف بيكون، ببروني، خس، طماطم، ميكس شيدر تشيز",
      "price": 218,
      "category": "toast",
      "categoryAr": "توست",
      "available": true,
      "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80",
      "ingredients": [
        "Smoked Turkey",
        "Beef Bacon",
        "Pepperoni",
        "Lettuce",
        "Tomato",
        "Cheddar Cheese Mix"
      ],
      "ingredientsAr": [
        "سموك تركي",
        "بيف بيكون",
        "ببروني",
        "خس",
        "طماطم",
        "ميكس شيدر تشيز"
      ]
    },
    "tuna": {
      "name": "Tuna",
      "nameAr": "تونه",
      "description": "Tuna, mayonnaise, onion, colored pepper, dill, olives",
      "descriptionAr": "تونه، مايونيز، بصل، فلفل الوان، شبت، زيتون",
      "price": 194,
      "category": "toast",
      "categoryAr": "توست",
      "available": true,
      "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80",
      "ingredients": [
        "Tuna",
        "mayonnaise",
        "onion",
        "colored pepper",
        "dill",
        "olives"
      ],
      "ingredientsAr": [
        "تونه",
        "مايونيز",
        "بصل",
        "فلفل الوان",
        "شبت",
        "زيتون"
      ]
    }
  },
  "tortilla": {
    "azura-tortilla": {
      "name": "Azura Tortilla",
      "nameAr": "ازورا تورتيلا",
      "description": "Lettuce, tomato, smoked turkey, smoked beef, cheese sauce, crispy chicken",
      "descriptionAr": "خس، طماطم، سموك تركي، سموك بيف، صوص جبنه، فراخ كريسبي",
      "price": 219,
      "category": "tortilla",
      "categoryAr": "تورتيلا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "tomato",
        "smoked turkey",
        "smoked beef",
        "cheese sauce",
        "crispy chicken"
      ],
      "ingredientsAr": [
        "خس",
        "طماطم",
        "سموك تركي",
        "سموك بيف",
        "صوص جبنه",
        "فراخ كريسبي"
      ]
    },
    "crispy-chicken-tortilla": {
      "name": "Crispy Chicken Tortilla",
      "nameAr": "كريسبي تشيكن تورتيلا",
      "description": "Lettuce, tomato, cheese sauce, honey mustard, crispy chicken",
      "descriptionAr": "خس، طماطم، صوص جبنه، هوني ماسترد، فراخ كريسبي",
      "price": 196,
      "category": "tortilla",
      "categoryAr": "تورتيلا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "tomato",
        "cheese sauce",
        "honey mustard",
        "crispy chicken"
      ],
      "ingredientsAr": [
        "خس",
        "طماطم",
        "صوص جبنه",
        "هوني ماسترد",
        "فراخ كريسبي"
      ]
    },
    "fajita-chicken-tortilla": {
      "name": "Fajita Chicken Tortilla",
      "nameAr": "فاجيتا تشيكن تورتيلا",
      "description": "Lettuce, tomato, BBQ sauce, grilled chicken, colored peppers, onion",
      "descriptionAr": "خس، طماطم، صوص باربيكيو، فراخ جريل، فلفل الوان، بصل",
      "price": 199,
      "category": "tortilla",
      "categoryAr": "تورتيلا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "tomato",
        "BBQ sauce",
        "grilled chicken",
        "colored peppers",
        "onion"
      ],
      "ingredientsAr": [
        "خس",
        "طماطم",
        "صوص باربيكيو",
        "فراخ جريل",
        "فلفل الوان",
        "بصل"
      ]
    },
    "grilled-chicken-tortilla": {
      "name": "Grilled Chicken Tortilla",
      "nameAr": "جريلد تشيكن تورتيلا",
      "description": "Lettuce, tomato, ranch, grilled chicken",
      "descriptionAr": "خس، طماطم، رانش، فراخ جريل",
      "price": 186,
      "category": "tortilla",
      "categoryAr": "تورتيلا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "tomato",
        "ranch",
        "grilled chicken"
      ],
      "ingredientsAr": [
        "خس",
        "طماطم",
        "رانش",
        "فراخ جريل"
      ]
    },
    "mexican-chicken-tortilla": {
      "name": "Mexican Chicken Tortilla",
      "nameAr": "ميكسيكان تشيكن تورتيلا",
      "description": "Lettuce, tomato, Mexican sauce, colored peppers, olives, grilled chicken",
      "descriptionAr": "خس، طماطم، صوص ميكسيكان، فلفل الوان، زيتون، فراخ جريل",
      "price": 199,
      "category": "tortilla",
      "categoryAr": "تورتيلا",
      "available": true,
      "image": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
      "ingredients": [
        "Lettuce",
        "tomato",
        "Mexican sauce",
        "colored peppers",
        "olives",
        "grilled chicken"
      ],
      "ingredientsAr": [
        "خس",
        "طماطم",
        "صوص ميكسيكان",
        "فلفل الوان",
        "زيتون",
        "فراخ جريل"
      ]
    }
  },
  "waffle": {
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
    }
  }
};
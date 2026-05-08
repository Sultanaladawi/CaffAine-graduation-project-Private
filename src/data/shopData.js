export const menuCategories = [
  {
    id: "espresso",
    label: "Coffee & Espresso",
    icon: "fa-mug-hot",
    color: "#8B5E42",
    items: [
      { id: 1, name: "Espresso", price: "£2.80", desc: "Single origin shot, clean and bright", tags: ["vegan"] },
      { id: 2, name: "Flat White", price: "£3.60", desc: "Silky microfoam with our house espresso blend", tags: ["vegetarian"] },
      { id: 3, name: "Cappuccino", price: "£3.40", desc: "Equal parts espresso, steamed milk and foam", tags: ["vegetarian"] },
      { id: 4, name: "Latte", price: "£3.80", desc: "Smooth and mellow — our most popular order", tags: ["vegetarian"] },
      { id: 5, name: "Long Black", price: "£3.00", desc: "Double espresso over hot water, bold and clean", tags: ["vegan"] },
      { id: 6, name: "Pour-Over Filter", price: "£4.50", desc: "V60 and seasonal methods. Ask us what's on today", tags: ["vegan"] },
      { id: 9, name: "British Hot Chocolate", price: "£4.00", desc: "Rich cocoa with steamed milk", tags: ["vegan"] },
    ],
  },
  {
    id: "tea",
    label: "Tea & Infusions",
    icon: "fa-leaf",
    color: "#7B9C79",
    items: [
      { id: 7, name: "Loose Leaf Tea", price: "£3.00", desc: "Rotating selection of single estate teas", tags: ["vegan"] },
      { id: 8, name: "Specialty Teas", price: "£3.50", desc: "Seasonal blends curated by our team", tags: ["vegan"] },
      { id: 15, name: "Mug of Peppermint Tea", price: "£3.50", desc: "Fresh peppermint in hot water", tags: ["vegan"] },
      { id: 23, name: "Mug of English Breakfast Tea", price: "£3.00", desc: "A strong, full-bodied black tea, perfect with milk or lemon", tags: ["vegetarian"] },
      { id: 24, name: "Pot of Peppermint Tea", price: "£5.00", desc: "A refreshing and naturally caffeine-free herbal tea", tags: ["vegan"] },
      { id: 25, name: "Pot of Breakfast Tea", price: "£4.85", desc: "A full pot of traditional English Breakfast tea, served hot", tags: ["hot"] },
    ],
  },
  {
    id: "cold",
    label: "Cold Drinks & Ice Cream",
    icon: "fa-snowflake",
    color: "#5C9EAD",
    items: [],
  },
  {
    id: "food",
    label: "Food & Brunch",
    icon: "fa-utensils",
    color: "#C49A6C",
    items: [
      { id: 12, name: "Sandwich", price: "£6.00", desc: "Seasonal fillings on artisan bread", tags: ["vegetarian"] },
      { id: 13, name: "Brunch Plate", price: "£8.50", desc: "Selected days only — follow @facultycoffee for updates", tags: ["vegetarian"] },
      { id: 14, name: "Vegan Pastry", price: "£3.50", desc: "100% plant-based daily bake", tags: ["vegan"] },
    ],
  },
  {
    id: "sweets",
    label: "Sweets & Cakes",
    icon: "fa-cookie",
    color: "#D4A5A5",
    items: [
      { id: 10, name: "Freshly Baked Pastry", price: "£3.50", desc: "Croissants, kouign-amann and daily specials", tags: ["vegetarian"] },
      { id: 11, name: "Cake of the Day", price: "£4.50", desc: "Seasonal bakes — ask the team what's in today", tags: ["vegetarian"] },
      { id: 22, name: "Raspberry & Custard laminated pastry.", price: "£3.45", desc: "Crispy, buttery laminated dough filled with smooth vanilla custard and topped with fresh raspberries", tags: ["vegetarian"] },
    ],
  },
];

export const featuredItems = [
  {
    id: 2,
    name: "Flat White",
    category: "Espresso",
    desc: "Our signature. Silky microfoam poured over a precisely extracted double ristretto.",
    price: "£3.60",
    image: "/images/flat_white.jpg",
    tag: "Most Popular",
    vegan: false,
  },
  {
    id: 4,
    name: "Latte",
    category: "Espresso",
    desc: "A smooth and creamy coffee classic made with a rich double shot of espresso and topped with a generous layer of silky steamed milk. Finished with a light touch of micro-foam, perfect for those who enjoy a milder coffee flavor",
    price: "£3.80",
    image: "/images/Latte.jpg",
    tag: "Coffee",
    vegan: false,
  },
  {
    id: 10,
    name: "Freshly Baked Pastry",
    category: "Bakery",
    desc: "Rotating daily bake. Cinnamon rolls, croissants and more — ask the team.",
    price: "£3.50",
    image: "/images/freshly_baked_pastry.webp",
    tag: "Fresh Daily",
    vegan: false,
  },
  {
    id: 11,
    name: "Sandwich",
    category: "food",
    desc: "A vibrant and wholesome plant-based masterpiece. This multi-layered sandwich features thick slices of seeded whole-wheat bread, generously layered with creamy dill-flecked plant-based cheese, followed by layers of fresh, crisp greens: watercress, spinach, and a healthy dose of mixed microgreens. Sandwiched between these greens is a bright array of colors: ripe avocado, red onion rings, and sweet yellow and red heirloom tomato slices. A feast for the eyes and the palate",
    price: "£3.00",
    image: "/images/sandwich.jpg",
    tag: "HealthyLunch",
    vegan: false,
  },
];

export const galleryImages = [
  {
    id: 1,
    src: "/images/interior-wide.png",
    alt: "Faculty Coffee — full interior view",
    size: "large",
  },
  {
    id: 2,
    src: "/images/latte.png",
    alt: "Latte art being poured",
    size: "normal",
  },
  {
    id: 3,
    src: "/images/door.png",
    alt: "Faculty Coffee entrance",
    size: "normal",
  },
  {
    id: 4,
    src: "/images/barista.png",
    alt: "Barista preparing coffee",
    size: "normal",
  },
  {
    id: 5,
    src: "/images/pastries.png",
    alt: "Freshly baked cinnamon rolls",
    size: "normal",
  },
  {
    id: 6,
    src: "/images/counter.png",
    alt: "Faculty Coffee counter",
    size: "normal",
  },
];

export const shopInfo = {
  name: "Faculty Coffee",
  tagline: "Specialty Coffee in Birmingham",
  address: "14 Piccadilly Arcade",
  city: "Birmingham B2 4HD",
  country: "United Kingdom",
  email: "hello@facultycoffee.co.uk",
  careersEmail: "careers@facultycoffee.co.uk",
  instagram: "https://instagram.com/facultycoffee",
  instagramHandle: "@facultycoffee",
  mapsUrl: "https://maps.google.com/?q=14+Piccadilly+Arcade+Birmingham+B2+4HD",
};

export const openingHours = [
  { day: "Monday – Friday", open: "07:30", close: "17:00" },
  { day: "Saturday", open: "09:00", close: "18:00" },
  { day: "Sunday", open: "10:00", close: "16:00" },
];

export const sophieKnowledge = {
  greeting: "Hi there! ☕ I'm Sophie, Faculty Coffee's barista bot. How can I help you today?",
  followUp: "I can help with our menu, opening hours, location, or anything else about the café!",
  quickReplies: [
    "What's on the menu?",
    "What are your opening hours?",
    "Where are you located?",
    "Do you have vegan options?",
    "What's your most popular drink?",
  ],
};
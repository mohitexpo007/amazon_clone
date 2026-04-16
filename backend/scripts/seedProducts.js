const pool = require("../models/db");

// Simple sample catalog for the project.
// This seed data includes well over 12 products and covers the required categories:
// Electronics, Fashion, Home, Books, and Grocery.
const sampleProducts = [
  {
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    description:
      "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear call quality.",
    price: 349.99,
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e"],
    category: "Electronics",
    stock: 24,
  },
  {
    name: "Apple Watch Series 9 GPS Smartwatch",
    description:
      "Advanced smartwatch with fitness tracking, heart rate monitoring, and seamless phone integration.",
    price: 399.0,
    images: ["https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d"],
    category: "Electronics",
    stock: 18,
  },
  {
    name: "Ninja Professional 72-Oz Countertop Blender",
    description:
      "Powerful blender with total crushing blades for smoothies, frozen drinks, and meal prep.",
    price: 129.95,
    images: ["https://images.unsplash.com/photo-1570222094114-d054a817e56b"],
    category: "Kitchen",
    stock: 30,
  },
  {
    name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker",
    description:
      "Versatile multicooker that pressure cooks, slow cooks, sautes, steams, and keeps meals warm.",
    price: 99.99,
    images: ["https://images.unsplash.com/photo-1585515656396-a9f0f500c0a2"],
    category: "Kitchen",
    stock: 20,
  },
  {
    name: "Kindle Paperwhite Signature Edition",
    description:
      "Glare-free e-reader with auto-adjusting front light, wireless charging, and weeks of battery life.",
    price: 189.99,
    images: ["https://images.unsplash.com/photo-1512820790803-83ca734da794"],
    category: "Books",
    stock: 14,
  },
  {
    name: "The Psychology of Money by Morgan Housel",
    description:
      "A bestselling personal finance book about behavior, wealth, and long-term decision making.",
    price: 18.5,
    images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f"],
    category: "Books",
    stock: 45,
  },
  {
    name: "Adidas Ultraboost Light Running Shoes",
    description:
      "Responsive running shoes with lightweight cushioning and breathable mesh upper for daily comfort.",
    price: 159.99,
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff"],
    category: "Fashion",
    stock: 28,
  },
  {
    name: "Levi's 511 Slim Fit Stretch Jeans",
    description:
      "Classic slim-fit jeans with soft stretch denim for an easy everyday look and comfortable movement.",
    price: 69.5,
    images: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246"],
    category: "Fashion",
    stock: 36,
  },
  {
    name: "Dyson V11 Cordless Vacuum Cleaner",
    description:
      "High-performance cordless vacuum with intelligent suction adjustment and up to 60 minutes of runtime.",
    price: 549.99,
    images: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952"],
    category: "Home",
    stock: 10,
  },
  {
    name: "Philips Hue White and Color Ambiance Starter Kit",
    description:
      "Smart lighting kit with app control, voice support, and millions of colors for every room.",
    price: 179.99,
    images: ["https://images.unsplash.com/photo-1513694203232-719a280e022f"],
    category: "Home",
    stock: 22,
  },
  {
    name: "Bowflex SelectTech 552 Adjustable Dumbbells",
    description:
      "Space-saving adjustable dumbbells with quick weight changes from 5 to 52.5 pounds.",
    price: 429.0,
    images: ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438"],
    category: "Fitness",
    stock: 12,
  },
  {
    name: "Fitbit Charge 6 Fitness and Health Tracker",
    description:
      "Slim fitness tracker with GPS, heart rate monitoring, sleep tracking, and smart notifications.",
    price: 159.95,
    images: ["https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6"],
    category: "Fitness",
    stock: 26,
  },
  {
    name: "Marshall Stanmore III Bluetooth Speaker",
    description:
      "Room-filling wireless speaker with iconic design, warm sound, and simple analog controls.",
    price: 379.0,
    images: ["https://images.unsplash.com/photo-1545454675-3531b543be5d"],
    category: "Electronics",
    stock: 16,
  },
  {
    name: "Canon EOS R50 Mirrorless Camera Kit",
    description:
      "Compact mirrorless camera with crisp 4K video, fast autofocus, and creator-friendly controls.",
    price: 849.0,
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32"],
    category: "Electronics",
    stock: 8,
  },
  {
    name: "Logitech MX Mechanical Wireless Keyboard",
    description:
      "Low-profile mechanical keyboard with multi-device pairing and tactile backlit keys.",
    price: 169.0,
    images: ["https://images.unsplash.com/photo-1511467687858-23d96c32e4ae"],
    category: "Office",
    stock: 25,
  },
  {
    name: "Herman Miller Inspired Ergonomic Desk Chair",
    description:
      "Breathable ergonomic office chair with adjustable lumbar support and smooth rolling casters.",
    price: 289.0,
    images: ["https://images.unsplash.com/photo-1505843513577-22bb7d21e455"],
    category: "Office",
    stock: 11,
  },
  {
    name: "Minimal Oak Study Desk Lamp",
    description:
      "Clean-lined task lamp with adjustable angle, warm light, and a compact base for small desks.",
    price: 54.99,
    images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85"],
    category: "Home",
    stock: 33,
  },
  {
    name: "Cotton Area Rug for Living Room",
    description:
      "Soft woven area rug with geometric patterning that adds texture and warmth to modern spaces.",
    price: 118.0,
    images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?fit=crop&w=900&q=80"],
    category: "Home",
    stock: 19,
  },
  {
    name: "Ceramic Vase Set for Home Decor",
    description:
      "Neutral ceramic vase pair that works beautifully with dried flowers and modern shelf styling.",
    price: 39.99,
    images: ["https://images.unsplash.com/photo-1517705008128-361805f42e86"],
    category: "Home",
    stock: 40,
  },
  {
    name: "Stoneware Dinner Plate Set",
    description:
      "Durable ceramic plate set with a matte glaze finish for everyday dining and dinner parties.",
    price: 64.0,
    images: ["https://images.unsplash.com/photo-1473093295043-cdd812d0e601"],
    category: "Kitchen",
    stock: 27,
  },
  {
    name: "Chef's Knife with Walnut Handle",
    description:
      "Balanced stainless-steel chef's knife with sharp edge retention and a comfortable wooden grip.",
    price: 72.5,
    images: ["https://images.unsplash.com/photo-1593618998160-e34014e67546"],
    category: "Kitchen",
    stock: 29,
  },
  {
    name: "Air Fryer Oven with Digital Display",
    description:
      "Compact air fryer with digital presets, crisp results, and enough room for weeknight meals.",
    price: 139.99,
    images: ["https://images.unsplash.com/photo-1585238342024-78d387f4a707"],
    category: "Kitchen",
    stock: 21,
  },
  {
    name: "Linen Blend Throw Pillow Covers",
    description:
      "Set of textured pillow covers in warm neutral tones designed for couches and bed styling.",
    price: 24.99,
    images: ["https://images.unsplash.com/photo-1582582621959-48d27397dc69"],
    category: "Home",
    stock: 44,
  },
  {
    name: "NoiseFit Arc Bluetooth Earbuds",
    description:
      "True wireless earbuds with punchy bass, touch controls, and a compact charging case.",
    price: 69.99,
    images: ["https://images.unsplash.com/photo-1606220838315-056192d5e927"],
    category: "Electronics",
    stock: 38,
  },
  {
    name: "Portable SSD 1TB USB-C Drive",
    description:
      "Fast portable SSD for creators and travelers, built with durable casing and easy plug-and-play use.",
    price: 109.0,
    images: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b"],
    category: "Electronics",
    stock: 32,
  },
  {
    name: "Nintendo Switch OLED Console",
    description:
      "Hybrid handheld console with vivid OLED display, versatile play modes, and family-friendly gaming.",
    price: 349.0,
    images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3"],
    category: "Gaming",
    stock: 13,
  },
  {
    name: "Mechanical Gaming Mouse RGB Edition",
    description:
      "Ergonomic gaming mouse with lightweight shell, programmable buttons, and fast optical tracking.",
    price: 59.99,
    images: ["https://images.unsplash.com/photo-1527814050087-3793815479db"],
    category: "Gaming",
    stock: 41,
  },
  {
    name: "Face Serum with Vitamin C and Hyaluronic Acid",
    description:
      "Lightweight brightening serum formulated to hydrate skin and support a smoother-looking finish.",
    price: 28.99,
    images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be"],
    category: "Beauty",
    stock: 35,
  },
  {
    name: "Rose Gold Hair Styling Tool Set",
    description:
      "Elegant grooming kit with modern finish designed for quick touch-ups and daily styling.",
    price: 47.5,
    images: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9"],
    category: "Beauty",
    stock: 23,
  },
  {
    name: "Women’s Crossbody Handbag in Sage Green",
    description:
      "Structured crossbody bag with soft faux leather, adjustable strap, and spacious zipped compartments.",
    price: 58.0,
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa"],
    category: "Fashion",
    stock: 31,
  },
  {
    name: "Classic White Sneakers for Everyday Wear",
    description:
      "Clean low-top sneakers with cushioned sole and timeless styling for casual daily outfits.",
    price: 74.99,
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772"],
    category: "Fashion",
    stock: 34,
  },
  {
    name: "Yoga Mat with Alignment Marks",
    description:
      "Non-slip exercise mat with alignment guides to support home workouts and stretching sessions.",
    price: 32.99,
    images: ["https://images.unsplash.com/photo-1599447421416-3414500d18a5"],
    category: "Fitness",
    stock: 42,
  },
  {
    name: "Resistance Band Set for Home Training",
    description:
      "Portable resistance bands with handles and anchors for strength, mobility, and recovery work.",
    price: 26.5,
    images: ["https://images.unsplash.com/photo-1599058917212-d750089bc07e"],
    category: "Fitness",
    stock: 39,
  },
  {
    name: "Travel Backpack with Laptop Sleeve",
    description:
      "Water-resistant travel backpack with padded laptop sleeve, organized compartments, and a sleek profile.",
    price: 84.0,
    images: ["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"],
    category: "Travel",
    stock: 17,
  },
  {
    name: "Hard Shell Cabin Luggage Spinner",
    description:
      "Lightweight cabin suitcase with smooth wheels, telescopic handle, and durable hard shell body.",
    price: 119.99,
    images: ["https://images.unsplash.com/photo-1565026057447-bc90a3dceb87"],
    category: "Travel",
    stock: 15,
  },
  {
    name: "Coffee Beans Sampler Gift Box",
    description:
      "Curated coffee box featuring multiple roast profiles for pour over, espresso, or French press brewing.",
    price: 36.99,
    images: ["https://images.unsplash.com/photo-1447933601403-0c6688de566e"],
    category: "Grocery",
    stock: 48,
  },
  {
    name: "Artisanal Chocolate Collection",
    description:
      "Assorted chocolate box with dark, milk, and nutty bites designed for gifting and sharing.",
    price: 22.0,
    images: ["https://images.unsplash.com/photo-1511381939415-e44015466834"],
    category: "Grocery",
    stock: 46,
  },
  {
    name: "Smart Air Purifier for Bedroom",
    description:
      "Quiet bedroom air purifier with HEPA filtration, timer settings, and touch-friendly controls.",
    price: 149.0,
    images: ["https://images.unsplash.com/photo-1585771724684-38269d6639fd"],
    category: "Home",
    stock: 18,
  },
  {
    name: "Wall Art Print Set for Modern Interiors",
    description:
      "Framed print set with abstract neutral artwork designed to elevate modern bedrooms and living rooms.",
    price: 67.99,
    images: ["https://images.unsplash.com/photo-1513519245088-0e12902e5a38"],
    category: "Home",
    stock: 20,
  },
  {
    name: "Premium Bed Mattress with Memory Foam Top",
    description:
      "Supportive mattress with layered foam comfort and breathable cover for better nightly recovery.",
    price: 699.0,
    images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?fit=crop&w=1200&q=80"],
    category: "Home",
    stock: 9,
  },
  {
    name: "Portable Projector for Movie Nights",
    description:
      "Compact projector with HDMI connectivity for movie nights, gaming, and casual presentations.",
    price: 219.99,
    images: ["https://images.unsplash.com/photo-1528395874238-34ebe249b3f2"],
    category: "Electronics",
    stock: 14,
  },
  {
    name: "Apple iPhone 15 128GB Black",
    description:
      "Latest-generation iPhone with Dynamic Island, advanced cameras, and fast performance for everyday use.",
    price: 59900,
    images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 18,
  },
  {
    name: "Apple iPhone 15 128GB Blue",
    description:
      "Stylish iPhone 15 in blue finish with bright display, smooth performance, and reliable battery life.",
    price: 59900,
    images: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 16,
  },
  {
    name: "Apple iPhone 15 256GB Pink",
    description:
      "Premium iPhone 15 with extra storage, vivid OLED display, and dependable day-long power.",
    price: 69900,
    images: ["https://images.unsplash.com/photo-1580910051074-3eb694886505?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 13,
  },
  {
    name: "Apple iPhone 15 Plus 128GB Green",
    description:
      "Large-screen iPhone with immersive display, lightweight body, and excellent photo quality.",
    price: 74900,
    images: ["https://images.unsplash.com/photo-1605236453806-6ff36851218e?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 12,
  },
  {
    name: "Apple iPhone 15 Plus 256GB Yellow",
    description:
      "Big-display iPhone 15 Plus with extra storage, strong battery performance, and smooth iOS experience.",
    price: 84900,
    images: ["https://images.unsplash.com/photo-1603899122634-f086ca5f5ddd?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 10,
  },
  {
    name: "Apple iPhone 15 Pro 128GB Natural Titanium",
    description:
      "Pro-grade iPhone with titanium build, powerful chip, and advanced triple-camera system.",
    price: 119900,
    images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 9,
  },
  {
    name: "Apple iPhone 15 Pro 256GB Blue Titanium",
    description:
      "Premium iPhone 15 Pro with larger storage, lightweight titanium frame, and pro-level photography tools.",
    price: 129900,
    images: ["https://images.unsplash.com/photo-1696446701796-da61225697cc?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 8,
  },
  {
    name: "Apple iPhone 15 Pro Max 256GB Black Titanium",
    description:
      "Flagship iPhone with large display, long battery life, and versatile pro camera system.",
    price: 149900,
    images: ["https://images.unsplash.com/photo-1697284959156-8ad0f0b4f3d5?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 7,
  },
  {
    name: "Apple iPhone 15 Pro Max 512GB White Titanium",
    description:
      "Top-end iPhone 15 Pro Max with ample storage, refined titanium finish, and premium performance.",
    price: 169900,
    images: ["https://images.unsplash.com/photo-1696425517567-4f2f1f1f5b8d?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 6,
  },
  {
    name: "Apple iPhone 14 128GB Midnight",
    description:
      "Reliable iPhone 14 with dual cameras, durable design, and a bright Super Retina display.",
    price: 54900,
    images: ["https://images.unsplash.com/photo-1663499482523-647a66e403f1?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 14,
  },
  {
    name: "Apple iPhone 14 256GB Purple",
    description:
      "iPhone 14 with extra storage, smooth daily performance, and excellent photo and video quality.",
    price: 64900,
    images: ["https://images.unsplash.com/photo-1678911820864-e3f6d2cb1bb3?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 11,
  },
  {
    name: "Apple iPhone 14 Plus 128GB Starlight",
    description:
      "Large-screen iPhone 14 Plus with comfortable battery life and clear, vibrant visuals.",
    price: 69900,
    images: ["https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 10,
  },
  {
    name: "Apple iPhone 14 Pro 128GB Space Black",
    description:
      "Advanced iPhone 14 Pro with Dynamic Island, pro camera features, and premium build quality.",
    price: 109900,
    images: ["https://images.unsplash.com/photo-1678911820864-e3f6d2cb1bb3?fit=crop&w=900&q=80&sat=-20"],
    category: "Electronics",
    stock: 7,
  },
  {
    name: "Apple iPhone 14 Pro Max 256GB Deep Purple",
    description:
      "Large-format iPhone 14 Pro Max built for premium photography, gaming, and battery endurance.",
    price: 139900,
    images: ["https://images.unsplash.com/photo-1664478546384-d57ffe74a8e0?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 5,
  },
  {
    name: "Apple iPhone 13 128GB Pink",
    description:
      "Trusted iPhone 13 with excellent cameras, strong battery efficiency, and a compact premium feel.",
    price: 49900,
    images: ["https://images.unsplash.com/photo-1632661674596-df8be070a5c5?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 17,
  },
  {
    name: "Apple iPhone 13 256GB Blue",
    description:
      "Popular iPhone 13 with expanded storage, smooth performance, and dependable all-day usage.",
    price: 59900,
    images: ["https://images.unsplash.com/photo-1632661674599-9d6f57c6f0b0?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 14,
  },
  {
    name: "Apple iPhone 13 Mini 128GB Green",
    description:
      "Compact iPhone with flagship-level performance, excellent cameras, and pocket-friendly size.",
    price: 46900,
    images: ["https://images.unsplash.com/photo-1632661674740-6a8f0dc08fa5?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 9,
  },
  {
    name: "Apple iPhone 13 Pro 256GB Sierra Blue",
    description:
      "Pro-level iPhone 13 with elegant design, smooth display, and advanced image capture features.",
    price: 94900,
    images: ["https://images.unsplash.com/photo-1632661674771-bc1d16f3b80b?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 8,
  },
  {
    name: "Apple iPhone 13 Pro Max 512GB Alpine Green",
    description:
      "Premium iPhone Pro Max with huge storage, stunning display, and all-day battery performance.",
    price: 124900,
    images: ["https://images.unsplash.com/photo-1640955014216-75201056c829?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 5,
  },
  {
    name: "Apple iPhone SE 128GB Red",
    description:
      "Affordable iPhone with compact design, fast processor, and familiar home-button experience.",
    price: 38900,
    images: ["https://images.unsplash.com/photo-1591337676887-a217a6970a8a?fit=crop&w=900&q=80"],
    category: "Electronics",
    stock: 20,
  },
  {
    name: "Nike Air Zoom Pegasus 40 Running Shoes",
    description:
      "Responsive running shoes with breathable upper and cushioned midsole for everyday training.",
    price: 129.99,
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 28,
  },
  {
    name: "Adidas Adizero SL Performance Running Shoes",
    description:
      "Lightweight running shoes built for speed workouts, tempo runs, and comfortable road mileage.",
    price: 139.99,
    images: ["https://images.unsplash.com/photo-1543508282-6319a3e2621f?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 24,
  },
  {
    name: "Puma Softride Premier Slip-On Sneakers",
    description:
      "Modern slip-on sneakers with soft cushioning and a versatile everyday streetwear look.",
    price: 89.99,
    images: ["https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 26,
  },
  {
    name: "New Balance 574 Core Lifestyle Shoes",
    description:
      "Classic lifestyle sneakers with timeless styling, durable materials, and comfortable support.",
    price: 109.99,
    images: ["https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 21,
  },
  {
    name: "Reebok Nano Training Shoes",
    description:
      "Stable cross-training shoes designed for gym sessions, circuits, and strength workouts.",
    price: 119.99,
    images: ["https://images.unsplash.com/photo-1608231387042-66d1773070a5?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 22,
  },
  {
    name: "Asics Gel-Kayano Support Running Shoes",
    description:
      "Premium support running shoes with reliable stability and plush cushioning for long runs.",
    price: 169.99,
    images: ["https://images.unsplash.com/photo-1605348532760-6753d2c43329?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 18,
  },
  {
    name: "Converse Chuck Taylor High Top Sneakers",
    description:
      "Iconic high-top canvas sneakers that pair easily with casual outfits year-round.",
    price: 74.99,
    images: ["https://images.unsplash.com/photo-1514989940723-e8e51635b782?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 30,
  },
  {
    name: "Vans Old Skool Classic Skate Shoes",
    description:
      "Low-top skate-inspired sneakers with signature side stripe and durable everyday comfort.",
    price: 69.99,
    images: ["https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 27,
  },
  {
    name: "Skechers Go Walk Comfort Slip-On Shoes",
    description:
      "Easy slip-on walking shoes with lightweight construction and soft insole support.",
    price: 64.99,
    images: ["https://images.unsplash.com/photo-1539185441755-769473a23570?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 25,
  },
  {
    name: "Formal Leather Oxford Shoes for Men",
    description:
      "Polished leather oxford shoes designed for office wear, events, and classic formal outfits.",
    price: 94.99,
    images: ["https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 19,
  },
  {
    name: "Women's Block Heel Sandals in Beige",
    description:
      "Elegant block heel sandals that balance style and comfort for parties and evening wear.",
    price: 54.99,
    images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 23,
  },
  {
    name: "Women's White Court Sneakers",
    description:
      "Clean minimal sneakers with cushioned footbed and sleek styling for daily casual outfits.",
    price: 59.99,
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 29,
  },
  {
    name: "Trail Running Shoes with All-Terrain Grip",
    description:
      "Outdoor performance shoes with aggressive traction and durable upper for mixed terrain runs.",
    price: 149.99,
    images: ["https://images.unsplash.com/photo-1460353581641-37baddab0fa2?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 17,
  },
  {
    name: "Basketball High Top Performance Shoes",
    description:
      "High-top court shoes with ankle support, responsive cushioning, and bold athletic styling.",
    price: 159.99,
    images: ["https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 15,
  },
  {
    name: "Men's Casual Loafers in Dark Brown",
    description:
      "Refined loafers with slip-on ease and versatile styling for smart-casual outfits.",
    price: 79.99,
    images: ["https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 20,
  },
  {
    name: "Women's Running Shoes in Coral Pink",
    description:
      "Lightweight women’s running shoes with airy mesh upper and soft cushioning for daily movement.",
    price: 99.99,
    images: ["https://images.unsplash.com/photo-1463100099107-aa0980c362e6?fit=crop&w=900&q=80"],
    category: "Fashion",
    stock: 24,
  },
];

const seedProducts = async () => {
  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query("TRUNCATE TABLE products RESTART IDENTITY CASCADE");

    const insertQuery = `
      INSERT INTO products (name, description, price, images, category, stock)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const product of sampleProducts) {
      await client.query(insertQuery, [
        product.name,
        product.description,
        product.price,
        product.images,
        product.category,
        product.stock,
      ]);
    }

    await client.query("COMMIT");
    console.log(`Seeded ${sampleProducts.length} products successfully.`);
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Error rolling back seed transaction:", rollbackError.message);
      }
    }

    console.error("Error seeding products:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) {
      client.release();
    }

    await pool.end();
  }
};

seedProducts();

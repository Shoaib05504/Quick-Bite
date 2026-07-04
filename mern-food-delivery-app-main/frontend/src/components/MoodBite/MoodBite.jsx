import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { toast as toastify } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FaHeart, FaRobot, FaShoppingCart, FaArrowRight } from "react-icons/fa";
import { StoreContext } from "../context/StoreContext";
import { assets } from "../../assets/assets";
import "./MoodBite.css";

const MOODS = [
  {
    id: "happy",
    label: "Happy",
    icon: "😊",
    keywords: ["pizza", "burger", "ice cream", "coffee", "shake", "cold coffee", "dessert", "fries", "sandwich"],
    fallbackCategories: ["dessert", "fastfood", "beverage", "snacks", "coffee", "breakfast"],
  },
  {
    id: "sad",
    label: "Sad",
    icon: "😢",
    keywords: ["cake", "brownie", "chocolate", "coffee", "dessert", "ice cream", "muffin", "pastry"],
    fallbackCategories: ["dessert", "bakery", "sweet", "coffee", "snack"],
  },
  {
    id: "stressed",
    label: "Stressed",
    icon: "😫",
    keywords: ["fries", "pasta", "comfort", "burger", "pizza", "macaroni", "rice", "coffee", "latte", "cappuccino", "espresso"],
    fallbackCategories: ["fastfood", "comfort", "italian", "snacks", "beverage"],
  },
  {
    id: "energetic",
    label: "Energetic",
    icon: "⚡",
    keywords: ["protein", "sandwich", "juice", "pasta", "bowl", "energy", "smoothie", "wrap", "rice"],
    fallbackCategories: ["healthy", "beverage", "fastfood", "juice", "protein"],
  },
  {
    id: "romantic",
    label: "Romantic",
    icon: "❤️",
    keywords: ["pasta", "cake", "mocktail", "red velvet", "chocolate", "dessert", "wine"],
    fallbackCategories: ["dessert", "italian", "beverage"],
  },
  {
    id: "chill",
    label: "Chill",
    icon: "😎",
    keywords: ["wrap", "fries", "coke", "iced", "mocktail", "sandwich", "coffee", "latte", "shake"],
    fallbackCategories: ["fastfood", "beverage", "snacks", "coffee", "dessert"],
  },
  {
    id: "hungry",
    label: "Hungry",
    icon: "🍔",
    keywords: ["large", "meal", "pizza", "burger", "wrap", "biryani", "rice", "combo"],
    fallbackCategories: ["fastfood", "maincourse", "classic", "thali"],
  },
  {
    id: "fitness",
    label: "Fitness",
    icon: "💪",
    keywords: ["salad", "protein", "healthy", "bowl", "juice", "smoothie", "wrap", "oats", "granola"],
    fallbackCategories: ["healthy", "salad", "nutrition", "juice", "protein"],
  },
  {
    id: "rainy",
    label: "Rainy Mood",
    icon: "🌧️",
    keywords: ["tea", "soup", "pakoda", "chai", "noodle", "coffee", "masala", "khichdi"],
    fallbackCategories: ["beverage", "soup", "comfort", "tea"],
  },
  {
    id: "sick",
    label: "Sick",
    icon: "🤒",
    keywords: ["soup", "khichdi", "herbal", "juice", "lemon", "ginger", "broth", "tea"],
    fallbackCategories: ["soup", "healthy", "beverage"],
  },
];

const TEXT_MESSAGES = {
  happy: "Feeling happy? Here are foods to boost your mood 😄",
  sad: "Need comfort? Sweet and soothing treats are ready for you 🍰",
  stressed: "Stress detected. Comfort foods recommended 🍕",
  energetic: "Power up with energetic, fuel-packed bites ⚡",
  romantic: "Perfect romantic picks for your evening ❤️",
  chill: "Chill vibes only. Relax with easy-going comfort foods 😎",
  hungry: "Hungry? Big satisfying meals are waiting 🍔",
  fitness: "Healthy meals selected for your fitness mood 💪",
  rainy: "Rainy mood? Warm soups and soothing sips are served 🌧️",
  sick: "Gentle nourishment for when you need comfort and care 🤒",
};

const MoodFoodCard = ({ item, onAddToCart, onOrderNow, cartCount }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const imageSrc =
    item.image && item.image.startsWith("http")
      ? item.image
      : `${API_URL}/images/${item.image}`;

  return (
    <motion.div
      className="mood-food-card"
      whileHover={{ y: -10, scale: 1.02 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="mood-food-image-wrap">
        <img src={imageSrc} alt={item.name} className="mood-food-image" />
        <div className="mood-food-favorite"> <FaHeart /> </div>
      </div>
      <div className="mood-food-body">
        <div className="mood-food-headline">
          <div>
            <h4>{item.name}</h4>
            <p>₹{item.price}</p>
          </div>
          <div className="mood-food-rating">
            <img src={assets.rating_starts} alt="rating" />
          </div>
        </div>
        <p>{item.description}</p>
        <div className="mood-food-actions">
          <button
            type="button"
            className="mood-food-add"
            onClick={() => onAddToCart(item)}
          >
            <FaShoppingCart /> Add to Cart{cartCount > 0 ? ` (${cartCount})` : ""}
          </button>
          <button
            type="button"
            className="mood-food-order"
            onClick={() => onOrderNow(item)}
          >
            Order Now <FaArrowRight />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const MOOD_RECOMMENDATIONS = {
  happy: [
    "Margherita Pizza",
    "Cheese Pizza",
    "Vanilla Ice Cream",
    "Fruit Ice Cream",
    "Vegan Cake",
    "Cup Cake",
    "Cold Coffee",
    "Chocolate Milkshake"
  ],
  sad: [
    "Chicken Pasta",
    "Creamy Pasta",
    "Buttter Noodles",
    "Cappuccino",
    "Café Latte",
    "Ripple Ice Cream",
    "Butterscotch Cake",
    "Garlic Mushroom"
  ],
  stressed: [
    "Veg Noodles",
    "Cheese Pasta",
    "Clover Salad",
    "Cold Coffee",
    "Espresso",
    "Fresh Lime Soda",
    "Grilled Sandwich",
    "Garlic Mushroom"
  ],
  energetic: [
    "Chicken Sandwich",
    "Rice Zucchini",
    "Chicken Salad",
    "Espresso",
    "Cappuccino",
    "Fresh Lime Soda",
    "Mix Veg Pulao",
    "Mango Smoothie"
  ],
  romantic: [
    "Chicken Pasta",
    "Margherita Pizza",
    "Café Latte",
    "Chocolate Milkshake",
    "Vegan Cake",
    "Ripple Ice Cream",
    "Garlic Mushroom",
    "Cold Coffee"
  ],
  chill: [
    "Veg Sandwich",
    "Bread Sandwich",
    "Tomato Pasta",
    "Cold Coffee",
    "Virgin Mojito",
    "Mango Smoothie",
    "Fruit Ice Cream",
    "Veg Noodles"
  ],
  hungry: [
    "Cheese Pizza",
    "Margherita Pizza",
    "Chicken Pasta",
    "Veg Noodles",
    "Chicken Rolls",
    "Veg Rolls",
    "Chicken Sandwich",
    "Cold Coffee"
  ],
  fitness: [
    "Greek salad",
    "Veg salad",
    "Clover Salad",
    "Chicken Salad",
    "Rice Zucchini",
    "Mix Veg Pulao",
    "Fresh Lime Soda",
    "Mango Smoothie"
  ],
  rainy: [
    "Buttter Noodles",
    "Cheese Pasta",
    "Chicken Rolls",
    "Veg Rolls",
    "Bread Sandwich",
    "Cappuccino",
    "Espresso",
    "Café Latte"
  ],
  sick: [
    "Veg salad",
    "Greek salad",
    "Clover Salad",
    "Mix Veg Pulao",
    "Rice Zucchini",
    "Fresh Lime Soda",
    "Mango Smoothie",
    "Café Latte"
  ]
};

const MoodBite = () => {
  const { food_list, addToCart, cartItems } = useContext(StoreContext);
  const navigate = useNavigate();
  const resultRef = useRef(null);
  const savedMood = localStorage.getItem("quickbite-mood") || "happy";
  const [selectedMood, setSelectedMood] = useState(savedMood);
  const [typingText, setTypingText] = useState("");
  const [activeMessage, setActiveMessage] = useState(TEXT_MESSAGES[selectedMood]);

  const moodToastMessages = [
    "Added to cart successfully 🍔",
    "Mood pick added to cart ✨",
    "Your comfort food is ready 🧡",
    "Smart choice! Your meal is in the cart 🛒",
  ];

  const getMoodToast = () =>
    moodToastMessages[Math.floor(Math.random() * moodToastMessages.length)];

  const handleAddToCart = (item) => {
    addToCart(item._id);
    toast.success(getMoodToast());
  };

  const handleOrderNow = (item) => {
    addToCart(item._id);
    toastify.success("✅ Order placed successfully! Preparing your delicious meal 🍽️", {
      position: "top-right",
      autoClose: 3000,
      pauseOnHover: false,
      closeOnClick: true,
      hideProgressBar: false,
      style: {
        background: "linear-gradient(135deg, #064E3B, #16A34A)",
        color: "#ffffff",
      },
    });
    setTimeout(() => {
      navigate("/cart");
    }, 300);
  };

  useEffect(() => {
    localStorage.setItem("quickbite-mood", selectedMood);
    setActiveMessage(TEXT_MESSAGES[selectedMood] || TEXT_MESSAGES.happy);
  }, [selectedMood]);

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }
  }, [selectedMood]);

  useEffect(() => {
    let index = 0;
    setTypingText("");
    const message = activeMessage || "Let MoodBite guide your next meal.";
    const interval = setInterval(() => {
      if (index <= message.length) {
        setTypingText(message.slice(0, index));
        index += 1;
      } else {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [activeMessage]);

  const selectedMoodConfig = useMemo(
    () => MOODS.find((mood) => mood.id === selectedMood) || MOODS[0],
    [selectedMood]
  );

  const recommendedFoods = useMemo(() => {
    if (!Array.isArray(food_list) || food_list.length === 0) {
      return [];
    }

    const expectedNames = MOOD_RECOMMENDATIONS[selectedMood] || [];
    const matchedItems = [];

    expectedNames.forEach((expectedName) => {
      const normalizedExpected = expectedName.toLowerCase().replace(/\s+/g, ' ').trim();
      const match = food_list.find((food) => {
        const normalizedFood = food.name.toLowerCase().replace(/\s+/g, ' ').trim();
        if (normalizedFood === normalizedExpected) return true;
        if (normalizedExpected === "butter noodles" && normalizedFood === "buttter noodles") return true;
        if (normalizedExpected === "buttter noodles" && normalizedFood === "butter noodles") return true;
        return false;
      });
      if (match) {
        matchedItems.push(match);
      }
    });

    return matchedItems;
  }, [food_list, selectedMood]);

  return (
    <section className="mood-bite-section" id="moodbite">
      <div className="mood-bite-backdrop" />
      <div className="mood-bite-shell">
        <div className="mood-bite-copy">
          <div className="mood-bite-header">
            <div className="mood-bite-pill">
              <FaRobot /> AI Recommendation
            </div>
            <h2>What&rsquo;s Your Mood Today?</h2>
            <p>Tell us your mood and we&rsquo;ll recommend perfect foods for you.</p>
          </div>

          <div className="mood-cards-grid">
            {MOODS.map((mood) => {
              const isSelected = mood.id === selectedMood;
              return (
                <motion.button
                  type="button"
                  key={mood.id}
                  className={`mood-card ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedMood(mood.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="mood-card-icon">{mood.icon}</span>
                  <span className="mood-card-label">{mood.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="mood-bite-results">
          <div className="mood-bite-result-panel">
            <div className="mood-bite-result-top">
              <div>
                <h3>{selectedMoodConfig.icon} {selectedMoodConfig.label} Picks</h3>
                <p className="mood-bite-subheading">Recommended because you selected this mood.</p>
              </div>
              <div className="mood-bite-badge">AI Personalized Picks ✨</div>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={activeMessage}
                className="mood-bite-message"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
              >
                {typingText || "..."}
              </motion.p>
            </AnimatePresence>

            <div ref={resultRef} className="mood-food-grid-anchor">
              <AnimatePresence mode="wait">
                {recommendedFoods.length === 0 ? (
                  <motion.div
                    key="empty"
                    className="mood-empty-state"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.35 }}
                  >
                    <p>No matching foods found yet. Exploring the menu for the best picks.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={selectedMood}
                    className="mood-food-grid"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.35 }}
                  >
                    {recommendedFoods.map((item) => (
                      <MoodFoodCard
                        key={item._id}
                        item={item}
                        onAddToCart={handleAddToCart}
                        onOrderNow={handleOrderNow}
                        cartCount={cartItems[item._id] || 0}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            background: "linear-gradient(135deg, #fff6ef, #fff1e5)",
            color: "#3c2e25",
            boxShadow: "0 20px 60px rgba(242, 142, 44, 0.14)",
            border: "1px solid rgba(255, 150, 62, 0.18)",
            borderRadius: "18px",
            padding: "14px 16px",
            fontWeight: 700,
          },
        }}
      />
    </section>
  );
};

export default MoodBite;

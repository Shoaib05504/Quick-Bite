import { useState, useContext, useMemo } from 'react';
import { StoreContext } from '../context/StoreContext';
import './Chatbot.css';
import { FaComments, FaTimes, FaPaperPlane, FaRobot } from 'react-icons/fa';

const Chatbot = () => {
  const { food_list, getTotalCartAmount, url } = useContext(StoreContext);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hi! I am QuickBite Assistant. Ask me about item prices, delivery time, or best menu recommendations.',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const foodItems = useMemo(() => food_list || [], [food_list]);

  const findMatches = (text) => {
    const query = text.toLowerCase();
    return foodItems.filter((item) => {
      const name = item.name.toLowerCase();
      const desc = item.description?.toLowerCase() || '';
      return (
        name.includes(query) ||
        item.category.toLowerCase().includes(query) ||
        desc.includes(query) ||
        query.split(' ').some((term) => name.includes(term) || desc.includes(term))
      );
    });
  };

  const filterByCategory = (category) => {
    return foodItems.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase()
    );
  };

  const filterByPrice = (minPrice, maxPrice) => {
    return foodItems.filter((item) => item.price >= minPrice && item.price <= maxPrice);
  };

  const getBestRecommendations = (limit = 3) => {
    if (!foodItems.length) return [];
    return [...foodItems]
      .sort((a, b) => b.price - a.price)
      .slice(0, limit);
  };

  const getCheapestItems = (limit = 3) => {
    if (!foodItems.length) return [];
    return [...foodItems]
      .sort((a, b) => a.price - b.price)
      .slice(0, limit);
  };

  const normalize = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '');

  const extractKeywords = (text) => {
    const lower = text.toLowerCase();
    return {
      price: /(price|cost|how much|rupee|rate|charge)/.test(lower),
      recommend: /(recommend|suggest|best|popular|try)/.test(lower),
      delivery: /(when|deliver|arrive|time|how long|track)/.test(lower),
      availability: /(available|have|stock|is there)/.test(lower),
      cheapest: /(cheap|budget|affordable|under)/.test(lower),
      cart: /(cart|total|amount|checkout)/.test(lower),
      hello: /(hi|hello|hey|good morning)/.test(lower),
      thanks: /(thank|thanks|appreciate)/.test(lower),
      help: /(help|assist|guide|what can)/.test(lower),
      info: /(open|hours|location|address|contact|payment)/.test(lower),
      special: /(special|offer|deal|discount)/.test(lower),
      quality: /(fresh|quality|taste|delicious|spicy|mild|healthy|organic)/.test(lower),
      category: /(pizza|salad|sandwich|roll|cake|desert|noodle|pasta|veg|vegetarian|non-veg|biryani)/.test(lower),
    };
  };

  const formatList = (items, limit = 3) =>
    items
      .slice(0, limit)
      .map((item) => `${item.name} (₹${item.price})`)
      .join(', ');

  const generateAnswer = (message) => {
    const lower = message.toLowerCase();
    const matches = findMatches(message);
    const keywords = extractKeywords(message);

    if (!foodItems.length) {
      return 'Loading menu details now. Ask again in a moment for accurate price and recommendation answers.';
    }

    // Greeting
    if (keywords.hello) {
      return 'Hello! I\'m QuickBite Assistant. I can help you find food items, check prices, get recommendations, track orders, and more. What can I help you with today? 🍽️';
    }

    // Thank you
    if (keywords.thanks) {
      return 'You\'re welcome! Let me know if you need help with anything else about our menu or orders. Happy to serve! 😊';
    }

    // Help / General info request
    if (keywords.help) {
      return 'I can help you with: 📍 Finding specific food items 💰 Checking prices 🎯 Getting recommendations ⏱️ Delivery time info 🛒 Your cart total 📦 Availability 🏪 Restaurant info. What would you like to know?';
    }

    // Restaurant info
    if (keywords.info) {
      if (/(open|hour|timing|when open|close)/.test(lower)) {
        return 'QuickBite is open from 10 AM to 11 PM daily. We deliver food quickly and fresh! 🕙';
      }
      if (/(phone|call|contact|number|reach)/.test(lower)) {
        return 'You can reach QuickBite support through the app anytime. Our team is available 24/7 to assist you. 📞';
      }
      if (/(location|address|where|situated|city)/.test(lower)) {
        return 'QuickBite is located in Bangalore, serving the Indiranagar, Whitefield, and BTM areas with fast delivery! 📍';
      }
      if (/(payment|pay|card|cash|upi|accept|method)/.test(lower)) {
        return 'We accept all major payment methods: Credit/Debit cards, UPI, net banking, and cash on delivery. Choose what works for you! 💳';
      }
      return 'For more information about QuickBite, check the app or contact our support team. They\'re always happy to help! 😊';
    }

    // Quality/Freshness questions
    if (keywords.quality) {
      if (/(fresh|quality)/.test(lower)) {
        return 'All our food is prepared fresh with quality ingredients! We ensure every order meets our high standards. 🥗✨';
      }
      if (/(spicy|mild|taste)/.test(lower)) {
        return 'We have options for all taste preferences - from mild to spicy! Tell me what you like and I can recommend something perfect for you. 🌶️';
      }
      if (/(healthy|organic)/.test(lower)) {
        const vegItems = filterByCategory('Pure Veg');
        if (vegItems.length > 0) {
          return `Our Pure Veg section has healthy and fresh options like ${vegItems
            .slice(0, 2)
            .map((item) => item.name)
            .join(', ')} and more! Perfect for a healthy meal. 🥗`;
        }
      }
    }

    // Price queries
    if (keywords.price) {
      if (matches.length === 1) {
        return `The ${matches[0].name} costs ₹${matches[0].price}. It\'s a delicious ${matches[0].category} item! 🍽️`;
      }
      if (matches.length > 1) {
        return `I found these items for you: ${matches
          .slice(0, 4)
          .map((item) => `${item.name} (₹${item.price})`)
          .join(', ')}. Which one interests you?`;
      }
      // Price range query
      if (/under (\d+)|less than (\d+)|(\d+) or less/.test(lower)) {
        const match = lower.match(/under (\d+)|less than (\d+)|(\d+)/);
        const maxPrice = match ? parseInt(match[1] || match[2] || match[3]) : 300;
        const affordable = filterByPrice(0, maxPrice);
        if (affordable.length > 0) {
          return `Great budget options under ₹${maxPrice}: ${affordable
            .slice(0, 4)
            .map((item) => `${item.name} (₹${item.price})`)
            .join(', ')}. 💰`;
        }
      }
      return 'Tell me an item name like "price of Pizza" or "how much is Biryani?" and I\'ll give you the exact price! 💵';
    }

    // Cheapest items
    if (keywords.cheapest) {
      const cheapest = getCheapestItems(4);
      return `Our most affordable options are: ${cheapest
        .map((item) => `${item.name} (₹${item.price})`)
        .join(', ')}. Great value for money! 💰`;
    }

    // Recommendations
    if (keywords.recommend) {
      if (/(veg|vegetarian|pure veg|no meat)/.test(lower)) {
        const vegItems = filterByCategory('Pure Veg');
        if (vegItems.length > 0) {
          const recommended = vegItems.slice(0, 3);
          return `Perfect vegetarian picks: ${recommended
            .map((item) => `${item.name} (₹${item.price})`)
            .join(', ')}. All 100% vegetarian! 🥗`;
        }
      }
      if (/(pizza|salad|sandwich|roll|cake|desert|dessert|noodle|pasta|biryani)/i.test(lower)) {
        const categoryMatch = lower.match(/(pizza|salad|sandwich|roll|cake|desert|dessert|noodle|pasta|biryani)/i)?.[1];
        const searchCategory = categoryMatch === 'dessert' ? 'Deserts' : categoryMatch?.charAt(0).toUpperCase() + categoryMatch?.slice(1);
        const categoryItems = filterByCategory(searchCategory);
        if (categoryItems.length > 0) {
          const bestInCategory = categoryItems.slice(0, 3);
          return `Try our best ${categoryMatch}s: ${bestInCategory
            .map((item) => `${item.name} (₹${item.price})`)
            .join(', ')}. You\'ll love them! 😋`;
        }
      }
      const best = getBestRecommendations(3);
      return `Here are my top recommendations: ${best
        .map((item) => `${item.name} (₹${item.price})`)
        .join(', ')}. I especially love the ${best[0].name}! ⭐`;
    }

    // Availability
    if (keywords.availability) {
      if (matches.length > 0) {
        return `Yes! ${matches.length === 1 ? matches[0].name + ' is' : 'We have'} ${matches
          .slice(0, 3)
          .map((item) => item.name)
          .join(', ')} ${matches.length > 1 ? 'are' : 'is'} in stock right now. Ready to order? 📦`;
      }
      if (keywords.category) {
        const categoryMatch = lower.match(/(pizza|salad|sandwich|roll|cake|desert|dessert|noodle|pasta|biryani|veg|vegetarian)/i)?.[1];
        if (categoryMatch) {
          const searchCategory = categoryMatch === 'dessert' ? 'Deserts' : categoryMatch?.charAt(0).toUpperCase() + categoryMatch?.slice(1);
          const categoryItems = filterByCategory(searchCategory);
          if (categoryItems.length > 0) {
            return `Yes! We have ${categoryItems.length} delicious ${categoryMatch}s available: ${categoryItems
              .slice(0, 3)
              .map((item) => item.name)
              .join(', ')} and more. Want to see them all? 📋`;
          }
        }
      }
      return 'Our entire menu is available right now! What would you like to order? 🍽️';
    }

    // Delivery/Order timing
    if (keywords.delivery) {
      if (/(how long|how soon|eta|how much time|minutes)/.test(lower)) {
        return 'Most deliveries take 25-35 minutes depending on your location and traffic. QuickBite is super fast! ⚡';
      }
      if (/(confirm|when confirm|place order|confirm order)/.test(lower)) {
        return 'Your order is confirmed instantly after payment! You\'ll see a live tracker with your delivery partner. 🗺️';
      }
      if (/(track|tracking|where|location|rider|delivery partner)/.test(lower)) {
        return 'Once your order is confirmed, you\'ll see real-time tracking showing your delivery partner\'s location on a live map. Track it anytime! 📍';
      }
      return 'Orders are confirmed instantly. Delivery typically takes 25-35 minutes. You\'ll get real-time tracking updates! 🚗';
    }

    // Cart total
    if (keywords.cart) {
      const total = getTotalCartAmount();
      if (total === 0) {
        return 'Your cart is empty! Browse our menu and add some delicious items. What sounds good to you? 🍽️';
      }
      return `Your cart total is ₹${total}. Ready to checkout? 🛒`;
    }

    // Special offers
    if (keywords.special) {
      return 'We have great deals throughout the day! Check the app for current offers, discounts, and promotional codes. Save big on your favorite meals! 🎉';
    }

    // Match any specific item mentioned
    if (matches.length === 1) {
      const item = matches[0];
      return `${item.name} is a popular ${item.category} item priced at ₹${item.price}. ${
        item.description || 'Perfect for your next order!'
      } 😋`;
    }

    if (matches.length > 1) {
      return `I found ${matches.length} items matching your search: ${matches
        .slice(0, 3)
        .map((item) => `${item.name} (₹${item.price})`)
        .join(', ')}${matches.length > 3 ? ' and more' : ''}. Which one interests you?`;
    }

    // Fallback: Try to extract meaning from any question
    if (/what|how|when|where|why|can|could|would|should|do|does|is|are|have|has|tell|about/.test(lower)) {
      const categories = ['Pizza', 'Salad', 'Sandwich', 'Roll', 'Pasta', 'Noodles', 'Cake', 'Deserts'];
      const categoryInMessage = categories.find((cat) => lower.includes(cat.toLowerCase()));
      
      if (categoryInMessage) {
        const categoryItems = filterByCategory(categoryInMessage);
        if (categoryItems.length > 0) {
          return `I found ${categoryItems.length} ${categoryInMessage} options available: ${categoryItems
            .slice(0, 2)
            .map((item) => `${item.name} (₹${item.price})`)
            .join(', ')} and more. Would you like to try any of these? 🍽️`;
        }
      }

      const randomRecommendation = getBestRecommendations(1)[0];
      if (randomRecommendation) {
        return `That\'s a great question! I\'m here to help with our menu. Speaking of which, I\'d recommend trying our ${randomRecommendation.name} (₹${randomRecommendation.price}) - it\'s amazing! 🌟 Feel free to ask about prices, recommendations, delivery, or anything else! 😊`;
      }
    }

    // Final fallback
    return 'I\'m here to help! Ask me about: 🍽️ Menu items & prices 🎯 Best recommendations 📦 Availability ⏱️ Delivery time 🛒 Your cart 📞 Restaurant info. What can I help you with?';
  };

  const systemContext = useMemo(() => {
    return `You are QuickBite Assistant, a polite and helpful automated chatbot for the QuickBite food delivery app.
Here is the current restaurant menu information:
${foodItems.map(item => `- ${item.name} (${item.category}): ₹${item.price} - ${item.description || ''}`).join('\n')}

The user's current shopping cart total is ₹${getTotalCartAmount()}.

Guidelines:
1. Always be polite, helpful, and concise.
2. Only answer based on the menu list above when the user asks about food, pricing, ingredients, or recommendations.
3. If they ask about items not in the menu, politely tell them we don't serve that item but recommend similar available items from our menu.
4. For delivery questions, mention that delivery usually takes 25-35 minutes depending on traffic and is tracked in real-time.
5. If they ask to track their orders, tell them they can view real-time maps under "My Orders".
6. Do not include internal guidelines or instructions in your response. Keep responses to under 2-3 sentences where possible for readability.`;
  }, [foodItems, getTotalCartAmount]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const nextMessages = [...messages, { role: 'user', text: userMessage }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    // Scroll immediately to make room for typing indicator
    setTimeout(() => {
      const container = document.getElementById('chatbot-messages');
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }, 50);

    try {
      // Map chat history to standard user/model roles for structured Gemini payload
      const apiMessages = nextMessages.slice(-8).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const chatToken = localStorage.getItem('token');
      const response = await fetch(
        `${url || import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chatbot/ask`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(chatToken ? { Authorization: `Bearer ${chatToken}` } : {}),
          },
          body: JSON.stringify({
            contents: apiMessages,
            systemInstruction: {
              parts: [{ text: systemContext }]
            },
            generationConfig: {
              maxOutputTokens: 500,
              temperature: 0.7,
              thinkingConfig: {
                thinkingBudget: 0
              }
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini proxy returned status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to query proxy server");
      }

      const botResponse = data.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Sorry, I am having trouble responding right now.";
      
      setMessages((prev) => [...prev, { role: 'bot', text: botResponse }]);
    } catch (error) {
      console.error("Gemini Chatbot error:", error);
      // Fallback to local rule-based generateAnswer
      const fallback = generateAnswer(userMessage);
      setMessages((prev) => [...prev, { role: 'bot', text: fallback }]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        const container = document.getElementById('chatbot-messages');
        if (container) {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`chatbot-widget ${open ? 'open' : ''}`}>
      <div className="chatbot-toggle" onClick={() => setOpen((prev) => !prev)}>
        {open ? <FaTimes /> : <FaComments />}
        <div className="chatbot-toggle-text">QuickBite Chat</div>
      </div>

      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <FaRobot className="chatbot-header-icon" />
            <div>
              <h3>QuickBite Assistant</h3>
              <p>Ask about prices, orders, or top picks.</p>
            </div>
          </div>

          <div id="chatbot-messages" className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chatbot-message ${msg.role}`}>
                <span>{msg.text}</span>
              </div>
            ))}
            {loading && (
              <div className="chatbot-message bot loading">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            )}
          </div>

          <div className="chatbot-input-row">
            <textarea
              value={input}
              placeholder="Ask me about food, price, or delivery..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={1}
            />
            <button onClick={handleSend} className="chatbot-send-btn">
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;

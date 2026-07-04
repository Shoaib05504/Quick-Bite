import { useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  ShoppingCart, 
  BarChart3, 
  Gift, 
  ShieldCheck, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  Sparkles
} from 'lucide-react';
import { StoreContext } from '../../components/context/StoreContext';
import GroupOrderModal from '../../components/GroupOrderModal/GroupOrderModal';
import './SmartSplitBill.css';

const SmartSplitBill = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const { cartItems, food_list } = useContext(StoreContext);

  const cartLines = useMemo(
    () =>
      food_list
        .filter((item) => cartItems[item._id] > 0)
        .map((item) => ({
          ...item,
          quantity: cartItems[item._id],
          lineTotal: item.price * cartItems[item._id],
        })),
    [food_list, cartItems]
  );

  const features = [
    {
      icon: <CreditCard className="feat-icon text-purple" />,
      title: 'Equal Split',
      desc: 'Divide the total order amount evenly among all members in just one tap.'
    },
    {
      icon: <ShoppingCart className="feat-icon text-pink" />,
      title: 'Order-based Split',
      desc: "Split automatically based on exactly what each individual ordered. No more manual math."
    },
    {
      icon: <BarChart3 className="feat-icon text-blue" />,
      title: 'Live Payment Progress',
      desc: 'Track who has paid their share in real-time with automatic live notifications.'
    },
    {
      icon: <Gift className="feat-icon text-orange" />,
      title: 'Automatic Group Discounts',
      desc: 'Any coupons or deals applied to the group cart are automatically split proportionally.'
    },
    {
      icon: <ShieldCheck className="feat-icon text-green" />,
      title: 'Secure Payments',
      desc: 'Individual payments are secured and processed using Stripe and Razorpay integrations.'
    },
    {
      icon: <Download className="feat-icon text-teal" />,
      title: 'Download Payment Summary',
      desc: 'Generate and download a clean PDF invoice summarizing who ordered and paid what.'
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Create a Group Order',
      desc: 'Open your Cart and toggle Group Order to generate a unique room code.'
    },
    {
      step: '02',
      title: 'Invite Friends',
      desc: 'Share the link or code with your friends via WhatsApp, Discord, or SMS.'
    },
    {
      step: '03',
      title: 'Everyone Adds Items',
      desc: 'Friends join the real-time lobby and add their favorite dishes to the shared cart.'
    },
    {
      step: '04',
      title: 'Smart Split Calculates',
      desc: 'Choose to split equally or by item. Tax, tip, and discounts are computed instantly.'
    },
    {
      step: '05',
      title: 'Everyone Pays Their Share',
      desc: 'Members pay their calculated share directly through their own devices.'
    },
    {
      step: '06',
      title: 'Checkout Together',
      desc: 'Once everyone has paid, the host completes the order and it gets dispatched!'
    }
  ];

  const faqs = [
    {
      question: 'What is Smart Split Bill?',
      answer: 'Smart Split Bill is a feature in QuickBite that allows groups ordering food together to automatically divide the bill. Members can either pay an equal share of the total or pay exactly for the items they added to the cart.'
    },
    {
      question: 'How is my share calculated?',
      answer: 'For Equal Split, the total cart amount is divided by the number of group members. For Order-based Split, we calculate the sum of your specific items, then add a proportional share of delivery fees, taxes, and any service charges, minus your portion of group discounts.'
    },
    {
      question: 'Can I switch split methods?',
      answer: 'Yes! The host can toggle between Equal Split and Order-based Split in the active lobby before checkout, and the calculations will update instantly for everyone in the room.'
    },
    {
      question: 'What happens if someone doesn\'t pay?',
      answer: 'The group order cannot be placed until all members pay their share. The host can monitor the live checkout screen to see who is still pending, or choose to remove inactive members from the lobby to proceed with checkout.'
    },
    {
      question: 'Are discounts applied automatically?',
      answer: 'Absolutely! If the group applies a discount code or enjoys a restaurant promotion, the savings are distributed fairly among all participants based on the chosen split method.'
    }
  ];

  const handleStartGroupOrder = () => {
    setShowGroupModal(true);
  };

  const handleCancelGroupModal = () => {
    setShowGroupModal(false);
    navigate('/cart');
  };

  const handleLearnMore = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="split-intro-container">
      {/* Background decoration blur circles */}
      <div className="bg-glow bg-glow-purple"></div>
      <div className="bg-glow bg-glow-pink"></div>
      <div className="bg-glow bg-glow-blue"></div>

      {/* Hero Section */}
      <section className="split-hero">
        <div className="hero-text-content">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="feature-badge"
          >
            <Sparkles size={16} className="sparkle-icon" />
            Introducing Smart Split Bill
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="hero-title"
          >
            Smart <span className="highlight-text">Split Bill</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-subtitle"
          >
            Split group food bills effortlessly with automatic calculations and real-time payment tracking. No calculator, no stress, just good food.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hero-actions"
          >
            <button className="btn-primary" onClick={handleStartGroupOrder}>
              Start Group Order <ArrowRight size={18} />
            </button>
            <button className="btn-secondary" onClick={handleLearnMore}>
              Learn More
            </button>
          </motion.div>
        </div>

        {/* Premium visual interactive illustration */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="hero-illustration-container"
        >
          <div className="glass-illustration">
            <div className="phone-mockup">
              <div className="phone-notch"></div>
              <div className="phone-screen">
                <div className="screen-header">
                  <div className="group-title">🍔 Friday Feast</div>
                  <div className="group-code">Code: QBIT-49A2</div>
                </div>
                <div className="split-visual-card">
                  <div className="split-visual-label">Equal Split Share</div>
                  <div className="split-visual-amount">₹24.50 <span className="each-label">/person</span></div>
                  <div className="members-indicator">
                    <span className="avatar av-1">A</span>
                    <span className="avatar av-2">B</span>
                    <span className="avatar av-3">C</span>
                    <span className="avatar av-4">You</span>
                  </div>
                </div>
                <div className="screen-list">
                  <div className="screen-item paid">
                    <div className="item-left">
                      <span className="avatar av-1 mini">A</span>
                      <span>Alex (Host)</span>
                    </div>
                    <span className="status-tag paid-tag">Paid</span>
                  </div>
                  <div className="screen-item paid">
                    <div className="item-left">
                      <span className="avatar av-2 mini">B</span>
                      <span>Blake</span>
                    </div>
                    <span className="status-tag paid-tag">Paid</span>
                  </div>
                  <div className="screen-item pending animate-pulse-border">
                    <div className="item-left">
                      <span className="avatar av-3 mini">C</span>
                      <span>Charlie</span>
                    </div>
                    <span className="status-tag pending-tag">Paying...</span>
                  </div>
                </div>
                <div className="screen-progress">
                  <div className="progress-label">
                    <span>Paid 2 / 3</span>
                    <span>66%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: '66%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Float elements representing items and discounts */}
            <div className="float-badge float-top-right">
              <Gift size={16} className="text-orange" />
              <span>-₹15.00 Off Applied</span>
            </div>
            <div className="float-badge float-bottom-left">
              <CreditCard size={16} className="text-pink" />
              <span>Order-based Active</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="split-features" id="features">
        <div className="section-header">
          <h2>Packed with Powerful Features</h2>
          <p>Everything you need to handle group orders without the headache.</p>
        </div>
        <div className="features-grid">
          {features.map((feat, idx) => (
            <motion.div 
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              key={idx} 
              className="feature-card"
            >
              <div className="feature-icon-wrapper">
                {feat.icon}
              </div>
              <h3>{feat.title}</h3>
              <p>{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="split-how-it-works" id="how-it-works">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Get your food and settle the bill in 6 simple, automated steps.</p>
        </div>
        <div className="steps-container">
          <div className="steps-line"></div>
          {steps.map((item, idx) => (
            <div key={idx} className="step-card-wrapper">
              <div className="step-number-node">
                <span className="step-node-text">{item.step}</span>
              </div>
              <div className="step-card">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Split Methods Comparison Card */}
      <section className="split-comparison">
        <div className="section-header">
          <h2>Compare Split Methods</h2>
          <p>Choose the option that matches your group dynamics.</p>
        </div>
        <div className="comparison-card">
          <div className="comparison-pane pane-equal">
            <div className="pane-header">
              <CreditCard className="pane-icon text-purple" size={32} />
              <h3>Equal Split</h3>
            </div>
            <p className="pane-desc">
              Divide the total cost evenly among all members in the lobby.
            </p>
            <div className="pane-details">
              <div className="detail-item">
                <strong>When to use:</strong>
                <span>Sharing appetizers, ordering pizzas, or when members order items of similar prices.</span>
              </div>
              <div className="detail-item">
                <strong>Example:</strong>
                <span className="code-example">Total bill of ₹120.00 split between 4 members = ₹30.00 each.</span>
              </div>
            </div>
          </div>

          <div className="comparison-divider-line"></div>

          <div className="comparison-pane pane-order">
            <div className="pane-header">
              <ShoppingCart className="pane-icon text-pink" size={32} />
              <h3>Order-based Split</h3>
            </div>
            <p className="pane-desc">
              Each member pays precisely for the items they added, plus their portion of tax, tip, and delivery fee.
            </p>
            <div className="pane-details">
              <div className="detail-item">
                <strong>When to use:</strong>
                <span>Large groups or when individual meal costs vary significantly (e.g., someone gets a light salad vs a steak).</span>
              </div>
              <div className="detail-item">
                <strong>Example:</strong>
                <span className="code-example">You add a ₹15 burger → you pay ₹15 + proportional share of delivery, tax &amp; tip.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="split-benefits">
        <div className="section-header">
          <h2>Benefits of Smart Split</h2>
          <p>Why users love placing Group Orders with QuickBite.</p>
        </div>
        <div className="benefits-list">
          <div className="benefit-item">
            <CheckCircle2 className="benefit-check" />
            <div className="benefit-content">
              <h4>No Manual Calculations</h4>
              <p>Forget standard calculators and notepad math. Tax, delivery fees, and tips are rounded and calculated to the penny.</p>
            </div>
          </div>
          <div className="benefit-item">
            <CheckCircle2 className="benefit-check" />
            <div className="benefit-content">
              <h4>Transparent Payments</h4>
              <p>Everyone sees who ordered what and how much they owe on their own screens, ensuring total trust and clarity.</p>
            </div>
          </div>
          <div className="benefit-item">
            <CheckCircle2 className="benefit-check" />
            <div className="benefit-content">
              <h4>Live Payment Tracking</h4>
              <p>No more reminding friends to pay. Live badges show payment states and the checkout updates automatically.</p>
            </div>
          </div>
          <div className="benefit-item">
            <CheckCircle2 className="benefit-check" />
            <div className="benefit-content">
              <h4>Automatic Discounts</h4>
              <p>Lobby promo codes and platform offers apply to the entire cart and reduce everyone&apos;s share proportionally.</p>
            </div>
          </div>
          <div className="benefit-item">
            <CheckCircle2 className="benefit-check" />
            <div className="benefit-content">
              <h4>Faster Checkout</h4>
              <p>Multiple checkout sessions merge into a single transaction, making delivery quicker and hassle-free.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="split-faq">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
          <p>Answers to common questions about Smart Split Billing.</p>
        </div>
        <div className="faq-list">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className={`faq-item ${activeFaq === idx ? 'active' : ''}`}
              onClick={() => toggleFaq(idx)}
            >
              <div className="faq-question">
                <h3>{faq.question}</h3>
                <ChevronDown size={20} className="faq-arrow" />
              </div>
              <AnimatePresence initial={false}>
                {activeFaq === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="faq-answer"
                  >
                    <p>{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="split-final-cta">
        <div className="glass-cta-card">
          <div className="cta-content">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="cta-badge"
            >
              🎉 Get Started Today
            </motion.div>
            <h2>Ready to split your next feast?</h2>
            <p>Gather your friends, create a shared cart, and experience completely frictionless bill splitting.</p>
            <button className="btn-primary btn-large" onClick={handleStartGroupOrder}>
              🚀 Start Group Order
            </button>
          </div>
        </div>
      </section>
      {showGroupModal && (
        <GroupOrderModal cartLines={cartLines} onClose={handleCancelGroupModal} />
      )}
    </div>
  );
};

export default SmartSplitBill;

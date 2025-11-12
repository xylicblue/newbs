import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-scroll";
import Web3AuthHandler from "./web3auth";

import { Link as Routerlink, useNavigate } from "react-router-dom";
import PriceIndexChart from "./chart";

import { supabase } from "./creatclient";

import AnimatedSection from "./animated";
import { motion, AnimatePresence } from "framer-motion";
import "./about.css";
import heroBackground from "./assets/bg.jpg";
import whatIsItVisual from "./assets/ai.png";
import logoImage from "./assets/logo2.png";
import ceoPortrait from "./assets/gabe.jpg";
import SectionSeparator from "./seperator";

import ProfileDropdown from "./dropdown";
// import "./trading.css";
// import { TradingDashboard } from "./tradingdash";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};
const whyNowCardsData = [
  {
    title: "Explosive Demand",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.75-2.25M21 12l-3.75 2.25"
        />
      </svg>
    ),
    summary:
      "The demand for computational resources, driven by AI and LLMs, is growing at an unprecedented rate, outstripping supply.",
    details: "No AI model or industrial process can run without compute.",
  },
  {
    title: "Market Volatility",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-6.867 8.267 8.267 0 013 2.48Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
        />
      </svg>
    ),
    summary:
      "GPU prices and cloud costs face extreme volatility and supply chain shocks, making financial planning a high-stakes gamble.",
    details:
      "Compute markets are opaque, volatile, and dominated by a few players. Supply chain disruptions, geopolitical factors, and algorithmic innovation drive cost swings.",
  },
  {
    title: "Capital Constraints",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V6.375c0-.621.504-1.125 1.125-1.125h.375m16.5 0h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m0 0h-.375a1.125 1.125 0 01-1.125-1.125V6.375c0-.621.504-1.125 1.125-1.125h.375M3 8.25v1.5m18-1.5v1.5m-12-1.5h.008v.008H9v-.008zm4.5 0h.008v.008h-.008v-.008zm4.5 0h.008v.008h-.008v-.008zm-9 4.5h.008v.008H9v-.008zm4.5 0h.008v.008h-.008v-.008zm4.5 0h.008v.008h-.008v-.008z"
        />
      </svg>
    ),
    summary:
      "Perceived risk and uncertainty in AI infrastructure leads to high financing costs, dampening long-term investment.",
    details:
      "By mitigating downside exposure, hedging instruments reduce perceived risk, lower financing costs, and unlock larger, longer-term infrastructure commitments.",
  },
  {
    title: "Need for Hedging",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z"
        />
      </svg>
    ),
    summary:
      "A futures market provides the essential financial tools for price discovery, cost certainty, and robust risk management.",
    details:
      "High-growth companies rely on steady prices to budget development. Compute infrastructure (data centers, GPUs) requires massive upfront investment and long-term planning.",
  },
];

const cardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
    },
  },
};

const cardItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const LandingPage = () => {
  // State for mobile menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedCardIndex, setExpandedCardIndex] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();

    // This listener updates the state whenever the auth state changes (e.g., login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup the subscription when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  // This effect runs whenever the session changes to fetch the user's profile
  useEffect(() => {
    // 1. Define the function to get the profile
    const getProfile = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, kyc_status, wallet_address")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.warn("Error fetching profile:", error.message);
        }
        if (data) {
          setProfile(data);
        }
      }
    };

    // 2. Call the function to get the initial profile data
    getProfile();

    // 3. Set up the Realtime subscription
    const channel = supabase
      .channel("realtime-profiles") // Give the channel a unique name
      .on(
        "postgres_changes", // Listen to database changes
        {
          event: "UPDATE", // Specifically for UPDATE events
          schema: "public",
          table: "profiles",
          filter: `id=eq.${session?.user?.id}`, // Only listen for changes on the current user's row
        },
        (payload) => {
          // This function runs when a change is detected
          console.log("Realtime update received!", payload);
          // Update the profile state with the new data from the database
          setProfile(payload.new);
        }
      )
      .subscribe();

    // 4. Cleanup function: Unsubscribe from the channel when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/"); // Navigate to home to refresh the state cleanly
  };
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    interest: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleCardExpand = (index) => {
    setExpandedCardIndex(expandedCardIndex === index ? null : index);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("interest_list").insert([formData]);
      if (error) throw error;
      alert("Thank you for your interest! We will keep you updated.");
      setFormData({ name: "", email: "", role: "", interest: "" });
    } catch (error) {
      console.error("Error submitting form:", error.message);
      alert(`Sorry, there was an error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {session && <Web3AuthHandler />}
      <title>ByteStrike</title>
      <meta
        name="description"
        content="Byte Strike is building the world's first futures market for compute."
      />
      <meta
        property="og:title"
        content="Byte Strike: The Compute Futures Exchange"
      />
      <meta
        property="og:description"
        content="Byte Strike is building the world's first futures market for compute."
      />
      <meta
        property="og:image"
        content="https://www.byte-strike.com/logo2.png"
      />
      <header className={isScrolled ? "scrolled" : ""}>
        <nav>
          <Routerlink to="/">
            <div
              className="logo"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{ cursor: "pointer" }}
            >
              <img src={logoImage} alt="Byte Strike Logo" />
            </div>
          </Routerlink>

          <div className={`nav-center-right ${isMenuOpen ? "active" : ""}`}>
            <ul className="nav-links">
              <li>
                <Routerlink to="/trade" className="trade-button-nav">
                  Trade
                </Routerlink>
              </li>
              <li>
                <Link
                  to="what-we-do"
                  smooth={true}
                  duration={500}
                  spy={true}
                  offset={-80}
                  activeClass="active"
                  onClick={handleLinkClick}
                >
                  What We're Exploring
                </Link>
              </li>
              <li>
                <Link
                  to="why-it-matters"
                  smooth={true}
                  duration={500}
                  spy={true}
                  offset={-80}
                  activeClass="active"
                  onClick={handleLinkClick}
                >
                  Why This Matters
                </Link>
              </li>
              <li>
                <Link
                  to="contact"
                  smooth={true}
                  duration={500}
                  spy={true}
                  offset={-80}
                  activeClass="active"
                  onClick={handleLinkClick}
                >
                  Your Input
                </Link>
              </li>
              <li>
                <Link
                  to="about"
                  smooth={true}
                  duration={500}
                  spy={true}
                  offset={-80}
                  activeClass="active"
                  onClick={handleLinkClick}
                >
                  About Us
                </Link>
              </li>
            </ul>

            <div className="auth-buttons">
              {session && profile ? (
                <ProfileDropdown
                  session={session}
                  profile={profile}
                  onLogout={handleLogout}
                />
              ) : (
                <>
                  <Routerlink to="/login" className="login-button">
                    Login
                  </Routerlink>
                  <Routerlink to="/signup" className="signup-button-primary">
                    Sign Up
                  </Routerlink>
                </>
              )}
            </div>
          </div>
          <button
            className={`hamburger ${isMenuOpen ? "active" : ""}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </nav>
      </header>

      <main>
        <section
          className="hero"
          style={{ backgroundImage: `url(${heroBackground})` }}
        >
          {/* <TradingDashboard /> */}
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1>A New Marketplace for Compute</h1>
            <p style={{ fontSize: 30, color: "white" }}>
              Hedge, Plan and Scale
            </p>
            <p>
              We are building the foundational infrastructure for a futures
              market where compute capacity can be priced, risk-managed, and
              traded like any other commodity.
            </p>
            <Link
              to="contact"
              smooth={true}
              duration={500}
              offset={-80}
              className="cta-button"
            >
              Join the Interest List | Get Early Updates
            </Link>
          </div>
        </section>
        <PriceIndexChart />
        <SectionSeparator></SectionSeparator>

        <AnimatedSection id="what-we-do" className="split-section">
          <div className="split-section-container">
            <motion.div
              className="split-section-text"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2>What Is a Compute Futures Exchange?</h2>
              <p>
                We are envisioning a regulated marketplace where compute
                capacity itself becomes a tradable commodity. This platform
                would enable participants to buy or sell standardized contracts
                for future compute delivery—like GPU hours or cloud capacity—at
                prices locked in today.
              </p>
              <p className="subtext-analogy">
                Think of it like the established futures markets for energy or
                agriculture. We're applying that same powerful financial model
                to the foundational resource of the 21st century.
              </p>
            </motion.div>
            <motion.div
              className="split-section-visual"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <img
                src={whatIsItVisual}
                alt="Abstract representation of compute as a commodity"
              />
            </motion.div>
          </div>
        </AnimatedSection>
        {/* <div className="separator-container">
          <motion.div
            className="section-separator"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          ></motion.div>
        </div> */}
        <SectionSeparator></SectionSeparator>
        <section
          id="why-it-matters"
          className="content-section-dark why-now-section"
        >
          <div className="content-container">
            <h2>Why Now? The Inevitable Shift</h2>
            <motion.div
              className="card-layout"
              variants={cardContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {whyNowCardsData.map((card, index) => (
                <motion.div
                  key={index}
                  className="card"
                  variants={cardItemVariants}
                  layout="position"
                >
                  <motion.div className="card-content-wrapper" layout>
                    <div className="icon-container">{card.icon}</div>
                    <h3>{card.title}</h3>
                    <p>{card.summary}</p>
                  </motion.div>

                  <AnimatePresence>
                    {expandedCardIndex === index && (
                      <motion.div
                        className="expanded-details"
                        layout="position"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p>{card.details}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    className="expand-button"
                    onClick={() => handleCardExpand(index)}
                    layout
                  >
                    <motion.svg
                      animate={{
                        rotate: expandedCardIndex === index ? 180 : 0,
                      }}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </motion.svg>
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
            <p className="subtext">{/* ... */}</p>
          </div>
        </section>

        {/* --- NEW ANIMATED SEPARATOR --- */}

        {/* <motion.div
          className="section-separator"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        ></motion.div> */}
        <SectionSeparator></SectionSeparator>

        {/* </div> */}

        <section id="contact" className="form-section">
          <div className="form-overlay"></div>
          <div className="form-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 style={{ fontSize: 30 }}>Contact</h2>
              <p>
                We are conducting market discovery to assess demand. If you are
                a potential user, supplier, or infrastructure operator, we
                invite you to share your interest.
              </p>
            </motion.div>

            <motion.form
              id="interest-form"
              onSubmit={handleSubmit}
              variants={cardContainerVariants} // Reuse the staggered container variant
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <div className="form-grid">
                {/* --- Name Input --- */}
                <motion.div className="input-group" variants={cardItemVariants}>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder=" "
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                  <label htmlFor="name">Name</label>
                </motion.div>

                {/* --- Email Input --- */}
                <motion.div className="input-group" variants={cardItemVariants}>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder=" "
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                  />
                  <label htmlFor="email">Email</label>
                </motion.div>
              </div>

              {/* --- Role Input --- */}
              <motion.div className="input-group" variants={cardItemVariants}>
                <input
                  type="text"
                  id="role"
                  name="role"
                  placeholder=" "
                  value={formData.role}
                  onChange={handleFormChange}
                />
                <label htmlFor="role">Industry / Role (optional)</label>
              </motion.div>

              {/* --- Interest Textarea --- */}
              <motion.div className="input-group" variants={cardItemVariants}>
                <textarea
                  id="interest"
                  name="interest"
                  placeholder=" "
                  value={formData.interest}
                  onChange={handleFormChange}
                ></textarea>
                <label htmlFor="interest">
                  What interests you about this project? (optional)
                </label>
              </motion.div>

              {/* --- Submit Button --- */}
              <motion.div
                variants={cardItemVariants}
                style={{ display: "flex", justifyContent: "center" }}
              >
                <button
                  type="submit"
                  className="cta-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Stay Informed"}
                </button>
              </motion.div>
            </motion.form>
          </div>
        </section>
        <SectionSeparator></SectionSeparator>
        <AnimatedSection className="legal-section">
          <h2>Important Notice</h2>
          <p>
            This website is for informational purposes only and does not offer
            or facilitate any trading, execution, or solicitation of financial
            products. We are not currently registered with, or regulated by, the
            Commodity Futures Trading Commission (CFTC) or any other regulatory
            authority. No futures contracts or other derivatives are currently
            being offered. All references to markets, contracts, or financial
            instruments are exploratory and subject to change based on
            regulatory guidance and market readiness
          </p>
        </AnimatedSection>
        <motion.section
          className="team-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
          id="about"
        >
          <div className="team-container">
            <motion.div
              className="team-photo"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <img src={ceoPortrait} alt="Gabe Jaffe, Founder & CEO" />
            </motion.div>
            <div className="team-bio">
              <h2>Meet Our Founder</h2>
              <h3>Gabe Jaffe, Founder & CEO</h3>
              <p style={{ color: "white" }}>
                Gabe Jaffe is a Sophomore student at the McDonough School of
                Business at Georgetown University. At the age of 15, he founded
                his first company, Teen Hampton and Teen NYC, a digital platform
                for teenage tutors, sports instructors, and babysitters, that
                has housed more than 100 workers and served more than 1,000
                clients. As Gabe scaled the business, he appeared on <br></br>
                <a
                  href="https://www.youtube.com/watch?v=MJko_jIdZxk"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#0274ef",
                    fontWeight: "bold",
                    textDecoration: "none",
                  }}
                >
                  Good Day New York
                </a>
                ,{" "}
                <a
                  href="https://www.foxnews.com/video/6307767277112"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#0274ef",
                    fontWeight: "bold",
                    textDecoration: "none",
                  }}
                >
                  Fox National News
                </a>
                ,{" "}
                <a
                  href="https://www.youtube.com/watch?v=stkR3mEhIAQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#0274ef",
                    fontWeight: "bold",
                    textDecoration: "none",
                  }}
                >
                  CBS Inside Edition
                </a>
                , and more to discuss his accomplishments. Now, he is working to
                build the foundations of a futures market for compute as a
                commodity to accelerate AI learning and market growth.
              </p>
              <blockquote className="quote" style={{ color: "white" }}>
                "We stand at a pivotal moment where computational power is the
                most critical resource on the planet. Our mission is to build
                the tools that will power the next century of innovation with
                stability and foresight."
              </blockquote>
              <div
                className="contact-info"
                style={{
                  marginTop: "2.5rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid #4a5568",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span style={{ fontWeight: "bold", color: "#a0aec0" }}>
                  Contact Gabe Jaffe:
                </span>
                <a
                  href="mailto:gabe.jaffe@bytestrike.com"
                  style={{
                    color: "#0274ef",
                    fontWeight: "bold",
                    //                  textDecoration: "none",
                  }}
                >
                  gabejaffe@byte-strike.com
                </a>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <footer>
        <AnimatedSection>
          <p>© {new Date().getFullYear()} Byte Strike. All rights reserved.</p>
        </AnimatedSection>
      </footer>
    </>
  );
};

export default LandingPage;

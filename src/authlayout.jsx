// src/components/AuthLayout.jsx

import React from "react";
import { motion } from "framer-motion";

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-page">
      <div className="auth-split-layout">
        {/* Left Side: The "Promo" Panel */}
        <motion.div
          className="auth-promo-panel"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="promo-bg-text">BYTE</span>
          <h1>BYTESTRIKE</h1>
          <h2>WITH THE COMPUTE ECOSYSTEM</h2>
          <p>Seamlessly Enhance The Future Through Our Exchange Technology</p>
        </motion.div>

        {/* Right Side: The Form Panel */}
        <motion.div
          className="auth-form-panel"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;

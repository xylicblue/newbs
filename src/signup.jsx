// src/pages/SignupPage.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./creatclient";
import AuthLayout from "./authlayout";
import toast from "react-hot-toast";
import "./auth.css";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  const [validation, setValidation] = useState({
    length: false,
    number: false,
    specialChar: false,
    match: false,
  });

  const navigate = useNavigate();

  // Real-time password validation
  useEffect(() => {
    setValidation({
      length: password.length >= 8,
      number: /\d/.test(password),
      specialChar: /[^A-Za-z0-9]/.test(password),
      match: password && password === confirmPassword,
    });
  }, [password, confirmPassword]);

  const isFormValid =
    email &&
    username &&
    validation.length &&
    validation.number &&
    validation.specialChar &&
    validation.match;

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    setError("");
    setUsernameError("");

    try {
      // Check if username is unique
      const { data: usernameData, error: usernameError } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .single();

      if (usernameError && usernameError.code !== "PGRST116") {
        // PGRST116 is 'not found', which is good
        throw usernameError;
      }
      // if (usernameData) {
      //   throw new Error("Username is already taken.");
      // }
      if (usernameData) {
        setUsernameError("Username is already taken.");
        setLoading(false); // Stop the process
        return; // Exit the function
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username, // This metadata will be used by our trigger
          },
        },
      });

      if (error) throw error;

      // On Supabase, a confirmation email is sent.
      toast.success(
        "Signup successful! Please check your email to confirm your account."
      );
      navigate("/login");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error.message); // Or set an error state
    }
  };

  const requirementItem = (isValid, text) => (
    <motion.li
      className={`requirement-item ${isValid ? "valid" : "invalid"}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <span className="icon">{isValid ? "✓" : "✗"}</span>
      {text}
    </motion.li>
  );

  return (
    <AuthLayout>
      <div className="auth-form-container">
        <div className="form-header">
          <h3>Create Account</h3>
        </div>
        <form onSubmit={handleSignup} className="auth-form">
          {/* --- Form fields are now slightly more compact due to CSS changes --- */}
          <div className="input-wrapper">
            <label htmlFor="email">Email</label>
            <div className="input-field">
              <svg className="input-icon" viewBox="0 0 24 24">
                <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />
              </svg>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="input-wrapper">
            <label htmlFor="username">Username</label>
            <div className="input-field">
              <svg className="input-icon" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <input
                type="text"
                id="username"
                placeholder="Choose a unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <AnimatePresence>
              {usernameError && (
                <motion.p
                  className="auth-error-inline"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  {usernameError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="input-wrapper">
            <label htmlFor="password">Password</label>
            <div className="input-field">
              <svg className="input-icon" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
              <input
                type="password"
                id="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {/* ... show/hide SVG icons ... */}
              </button>
            </div>
          </div>
          <div className="input-wrapper">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-field">
              <svg className="input-icon" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* --- CONSOLIDATED VALIDATION CHECKLIST --- */}
          <AnimatePresence>
            {(password || confirmPassword) && (
              <motion.ul
                className="password-requirements"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {requirementItem(validation.length, "At least 8 characters")}
                {requirementItem(validation.number, "Contains a number")}
                {requirementItem(
                  validation.specialChar,
                  "Contains a special character"
                )}
                {requirementItem(validation.match, "Passwords match")}
              </motion.ul>
            )}
          </AnimatePresence>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-button"
            disabled={!isFormValid || loading}
          >
            {loading ? "Creating Account..." : "Sign Up Now"}
          </button>
          {/* <div className="auth-divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="google-signin-button"
            onClick={signInWithGoogle}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign In with Google
          </button> */}
        </form>
        <p className="auth-redirect">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;

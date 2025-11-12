// src/pages/LoginPage.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "./creatclient";
import AuthLayout from "./authlayout";
import toast from "react-hot-toast";
import "./auth.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const navigate = useNavigate();

  // const signInWithGoogle = async () => {
  //   try {
  //     const { error } = await supabase.auth.signInWithOAuth({
  //       provider: "google",
  //     });
  //     if (error) throw error;
  //   } catch (error) {
  //     alert(error.message); // Or set an error state
  //   }
  // };
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // IMPORTANT: Use your production URL here when you deploy
          redirectTo: `${window.location.origin}/welcome`,
        },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error.message);
    }
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEmailNotConfirmed(false);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate("/"); // Redirect to homepage on successful login
    } catch (error) {
      if (error.message.includes("Email not confirmed")) {
        setEmailNotConfirmed(true);
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error("Please enter the email you signed up with first.");
      return;
    }

    const resendPromise = supabase.auth.resend({
      type: "signup",
      email: email,
    });

    toast.promise(resendPromise, {
      loading: "Sending confirmation email...",
      success: "Confirmation email sent! Please check your inbox.",
      error: (err) => `Error: ${err.message}`,
    });
  };

  return (
    <AuthLayout>
      {/* The form container is now the direct child of the layout */}
      <div className="auth-form-container">
        {/* REPLACED: The tab system is now a simple, elegant header */}
        <div className="form-header">
          <h3>Email account</h3>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-wrapper">
            <label htmlFor="email">Email</label>
            <div className="input-field">
              <svg className="input-icon" viewBox="0 0 24 24">
                <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />
              </svg>
              <input
                type="email"
                id="email"
                placeholder="Enter your email here"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-wrapper">
            <label htmlFor="password">Password</label>
            <div className="input-field">
              <svg className="input-icon" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                  </svg>
                )}
              </button>
            </div>
            <Link to="#" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>

          {error && <p className="auth-error">{error}</p>}
          {emailNotConfirmed && (
            <div className="auth-confirmation-error">
              <p>Email not confirmed. Please check your inbox.</p>
              <button
                type="button"
                onClick={handleResendConfirmation}
                className="resend-button"
              >
                Resend confirmation email
              </button>
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing In..." : "Sign In Now"}
          </button>
          <div className="auth-divider">
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
          </button>
        </form>
        <p className="auth-redirect">
          Don't have an account yet? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;

// src/SharedLayout.js

import React, { useState, useEffect } from "react";
import {
  Link as Routerlink,
  useNavigate,
  NavLink,
  Outlet,
} from "react-router-dom";
import { supabase } from "./creatclient";
import Web3AuthHandler from "./web3auth";

// Import Components
import ProfileDropdown from "./dropdown";
import AnimatedSection from "./animated";
import logoImage from "./assets/logo2.png";

// We've moved the TradingHeader into this file
const TradingHeader = ({ session, profile, handleLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="scrolled">
      <nav>
        <Routerlink to="/">
          <div className="logo">
            <img src={logoImage} alt="Byte Strike Logo" />
          </div>
        </Routerlink>
        <div className={`nav-center-right ${isMenuOpen ? "active" : ""}`}>
          <ul className="nav-links trading-nav-links">
            <li>
              <NavLink
                to="/trade"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Trade
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/portfolio"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Portfolio
              </NavLink>
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
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </nav>
    </header>
  );
};

const SharedLayout = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  // Standard hooks to get session and profile
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setSession(session)
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      const getProfile = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("username, kyc_status, wallet_address")
          .eq("id", session.user.id)
          .single();
        setProfile(data);
      };
      getProfile();

      const channel = supabase
        .channel("realtime-profiles")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${session.user.id}`,
          },
          (payload) => setProfile(payload.new)
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="trading-page-container">
      {session && <Web3AuthHandler />}
      <TradingHeader
        session={session}
        profile={profile}
        handleLogout={handleLogout}
      />

      {/* THIS IS THE KEY: Outlet renders the specific child page */}
      <Outlet />

      <footer>
        <AnimatedSection>
          <p>© {new Date().getFullYear()} Byte Strike. All rights reserved.</p>
        </AnimatedSection>
      </footer>
    </div>
  );
};

export default SharedLayout;

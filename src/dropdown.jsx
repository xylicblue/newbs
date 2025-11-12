// src/dropdown.js (or ProfileDropdown.js, match your filename)

import React, { useState, useRef, useEffect } from "react";
import ConnectWalletButton from "./wallet";
import { motion, AnimatePresence } from "framer-motion";
import sumsubWebSdk from "@sumsub/websdk";
import { supabase } from "./creatclient"; // Adjust path if needed
import "./dropdown.css"; // CRITICAL: Make sure your CSS file is named dropdown.css
import Portal from "./Portal";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useConnectModal, useAccountModal } from "@rainbow-me/rainbowkit";
import { FaWallet } from "react-icons/fa";

// A simple placeholder avatar
const Avatar = ({ username }) => {
  const initial = username ? username.charAt(0).toUpperCase() : "U";
  return <div className="avatar">{initial}</div>;
};

const ProfileDropdown = ({ session, profile, onLogout }) => {
  // --- STATE IS MANAGED INTERNALLY HERE ---
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isSdkActive, setIsSdkActive] = useState(false);
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal(); // Function to open the "Connect Wallet" modal
  const { openAccountModal } = useAccountModal();

  // --- LOGIC IS MANAGED INTERNALLY HERE ---
  // This effect handles closing the dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    // Add the event listener to the whole document
    document.addEventListener("mousedown", handleClickOutside);
    // Clean up the listener when the component is removed
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // The empty array means this effect runs only once

  const launchSumsubSDK = async () => {
    console.log("1. 'Verify Now' clicked.");
    setIsOpen(false);
    setIsSdkActive(true);

    try {
      console.log("2. Defining the token refresh function...");
      const getNewToken = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session)
          throw new Error("User session not found for token refresh.");

        const { data, error } = await supabase.functions.invoke(
          "get-sumsub-token",
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );

        if (error) throw error;
        if (!data.token)
          throw new Error("Access Token is missing in the server response.");

        console.log("Successfully fetched a new access token.");
        return data.token;
      };

      console.log("3. Getting initial Access Token...");
      const initialAccessToken = await getNewToken();

      console.log("4. Building Sumsub SDK instance with all handlers...");

      const sumsubSdk = sumsubWebSdk
        .init(initialAccessToken, getNewToken)
        .withConf({ lang: "en" })
        .on("idCheck.applicantStatusUpdated", (payload) => {
          // This event fires every time the user's status changes.
          // We only care about the final 'completed' status.
          if (payload.reviewStatus === "completed") {
            console.log(
              "Verification is complete. Auto-closing SDK in 3 seconds..."
            );
            // Wait 3 seconds (3000 milliseconds) before closing
            setTimeout(() => {
              setIsSdkActive(false); // This will hide the SDK container
            }, 3000);
          }
        })
        // .on("idCheck.onDone", () => {
        //   console.log("Event: idCheck.onDone - User closed SDK.");
        //   setIsSdkActive(false);
        // })
        .on("idCheck.onDone", (payload) => {
          // This event fires when the user reaches the final screen.
          console.log(
            "Verification UI is done. Auto-closing SDK in 3 seconds. Payload:",
            payload
          );

          // Wait 3 seconds (3000 milliseconds) before closing
          setTimeout(() => {
            console.log("Auto-closing SDK now.");
            setIsSdkActive(false); // This will hide the SDK container
          }, 3000);
        })
        .on("message", (type, payload) => {
          console.log(`Event: message - Type: ${type}`, payload);
        })
        .on("error", (err) => {
          console.error("SDK error:", err);
        })
        .build();

      console.log("Launching Sumsub WebSDK...");
      sumsubSdk.launch("#sumsub-websdk-container");

      console.log(
        "6. Sumsub SDK instance created and handlers are set. Waiting for 'onReady' event."
      );
    } catch (error) {
      console.error("--- CATCH BLOCK ERROR ---");
      console.error(
        "An error occurred during the verification process:",
        error.message
      );
      setIsSdkActive(false);
      alert("Could not start verification. Please try again later.");
    }
  };
  useEffect(() => {
    if (isSdkActive) {
      // When SDK is active, prevent the body from scrolling
      document.body.style.overflow = "hidden";
    } else {
      // When SDK is inactive, allow the body to scroll again
      document.body.style.overflow = "auto";
    }

    // Cleanup function to ensure scroll is restored if component unmounts
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isSdkActive]);

  const username = profile?.username || session.user.email;
  const kycStatus = profile?.kyc_status || "not_verified";

  return (
    // The ref is attached here to detect outside clicks
    <div className="profile-container" ref={dropdownRef}>
      <div className="profile-trigger-wrapper">
        <button onClick={() => setIsOpen(!isOpen)} className="profile-trigger">
          <Avatar username={username} />
          <span>{username}</span>
        </button>
        {isConnected && (
          <button
            onClick={openAccountModal}
            className="wallet-icon-button"
            title="Wallet Details"
          >
            <FaWallet />
          </button>
        )}
      </div>

      <AnimatePresence>
        {/* Visibility is controlled by the internal 'isOpen' state */}
        {isOpen && (
          <motion.div
            className="dropdown-menu"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="dropdown-header">
              <Avatar username={username} />
              <div className="user-info">
                <strong>{username}</strong>
                <small>{session.user.email}</small>
              </div>
            </div>
            <div className="dropdown-section">
              <div className="kyc-status">
                <span>KYC Status</span>
                <span className={`status-badge ${kycStatus}`}>
                  {kycStatus.replace("_", " ")}
                </span>
              </div>
              <div className="wallet-section">
                {isConnected ? (
                  <div className="wallet-connected-custom">
                    <span className="status-indicator"></span>
                    <span>Wallet Connected</span>
                  </div>
                ) : (
                  <button
                    onClick={openConnectModal}
                    className="custom-connect-button"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
              {kycStatus === "not_verified" && (
                <button onClick={launchSumsubSDK} className="verify-button">
                  Verify Now
                </button>
              )}
              {/* <ConnectWalletButton
                session={session}
                initialAddress={profile?.wallet_address}
              /> */}
              {/* <div className="wallet-section">
                <ConnectButton />
              </div> */}
              <button onClick={onLogout} className="logout-button">
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isSdkActive && (
        <Portal>
          <div id="sumsub-websdk-container" className="sdk-active"></div>
        </Portal>
      )}
    </div>
  );
};

export default ProfileDropdown;

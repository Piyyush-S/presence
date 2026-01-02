import React, { useEffect, useState } from "react";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UserInfoForm from "./pages/UserInfoForm";
import HomeDashboard from "./pages/HomeDashboard";
import FriendsPage from "./pages/FriendsPage";
import Notifications from "./pages/Notifications";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";
import ChatsPage from "./pages/ChatsPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsPage from "./pages/TermsPage";

import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import usePresence from "./hooks/usePresence";

/* =====================================================
   DEV MODE FLAG
   -----------------------------------------------------
   true  → always show Landing Page (for design/testing)
   false → normal production behavior
===================================================== */
const DEV_SHOW_LANDING = true;

export default function App() {
  const [user, setUser] = useState(null);
  const [stage, setStage] = useState("loading");
  const [isLogin, setIsLogin] = useState(true);

  /* ---------------- PRESENCE ---------------- */
  const stored =
    typeof window !== "undefined"
      ? localStorage.getItem("presenceUser")
      : null;

  const me = stored ? JSON.parse(stored) : null;
  usePresence(me?.email);

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    const init = async () => {
      try {
        /* ---------- DEV OVERRIDE ---------- */
        if (DEV_SHOW_LANDING) {
          setStage("landing");
          return;
        }

        /* ---------- NO USER ---------- */
        if (!stored) {
          setStage("landing");
          return;
        }

        const parsed = JSON.parse(stored);
        if (!parsed?.email) {
          setStage("landing");
          return;
        }

        setUser(parsed);

        const profileComplete =
          parsed.city && parsed.gender && parsed.age;

        setStage(profileComplete ? "dashboard" : "userinfo");

        /* ---------- BACKGROUND FIRESTORE SYNC ---------- */
        try {
          const ref = doc(db, "users", parsed.email);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            const fresh = snap.data();

            localStorage.setItem(
              "presenceUser",
              JSON.stringify(fresh)
            );

            setUser(fresh);

            const complete =
              fresh.city && fresh.gender && fresh.age;

            setStage(complete ? "dashboard" : "userinfo");
          }
        } catch {
          // Firestore offline → ignore silently
        }
      } catch {
        setStage("landing");
      }
    };

    init();
  }, [stored]);

  /* ---------------- AUTH HANDLERS ---------------- */

  const handleLogin = () => {
    const saved = localStorage.getItem("presenceUser");

    if (!saved) {
      setStage("auth");
      return;
    }

    const parsed = JSON.parse(saved);
    setUser(parsed);

    const complete =
      parsed.city && parsed.gender && parsed.age;

    setStage(complete ? "dashboard" : "userinfo");
  };

  const handleSignup = () => {
    const saved = localStorage.getItem("presenceUser");

    if (!saved) {
      setStage("auth");
      return;
    }

    setUser(JSON.parse(saved));
    setStage("userinfo");
  };

  const handleLogout = () => {
    localStorage.removeItem("presenceUser");
    setUser(null);
    setStage("landing");
  };

  /* ---------------- NAV HELPERS ---------------- */

  const goDashboard = () => setStage("dashboard");
  const goFriends = () => setStage("friends");
  const goNotifications = () => setStage("notifications");
  const goProfile = () => setStage("profile");
  const goChats = () => setStage("chats");

  const goChat = (email) => {
    localStorage.setItem("chatWith", email);
    setStage("chat");
  };

  /* ---------------- UI ---------------- */

  if (stage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <p className="text-gray-600 animate-pulse">
          Loading Presence Grid 🌿
        </p>
      </div>
    );
  }

  if (stage === "landing") {
    return (
      <LandingPage
        onLogin={() => {
          setIsLogin(true);
          setStage("auth");
        }}
        onSignup={() => {
          setIsLogin(false);
          setStage("auth");
        }}
        onOpenTerms={() => setStage("terms")}
        onOpenPrivacy={() => setStage("privacy")}
      />
    );
  }

  if (stage === "terms") {
    return <TermsPage onBack={() => setStage("landing")} />;
  }

  if (stage === "privacy") {
    return <PrivacyPolicy onBack={() => setStage("landing")} />;
  }

  if (stage === "auth") {
    return isLogin ? (
      <LoginPage
        onLogin={handleLogin}
        onSwitch={() => setIsLogin(false)}
      />
    ) : (
      <SignupPage
        onSignup={handleSignup}
        onSwitch={() => setIsLogin(true)}
      />
    );
  }

  if (stage === "userinfo") {
    return (
      <UserInfoForm
        email={user?.email}
        onComplete={goDashboard}
      />
    );
  }

  if (stage === "friends") {
    return (
      <FriendsPage
        onBack={goDashboard}
        onOpenChat={goChat}
      />
    );
  }

  if (stage === "notifications") {
    return <Notifications onBack={goDashboard} />;
  }

  if (stage === "profile") {
    return <ProfilePage onBack={goDashboard} />;
  }

  if (stage === "chats") {
    return (
      <ChatsPage
        onBack={goDashboard}
        onOpenChat={goChat}
      />
    );
  }

  if (stage === "chat") {
    return <ChatPage onBack={goChats} />;
  }

  if (stage === "dashboard") {
    return (
      <HomeDashboard
        onLogout={handleLogout}
        onOpenFriends={goFriends}
        onOpenNotifications={goNotifications}
        onOpenProfile={goProfile}
        onOpenChats={goChats}
      />
    );
  }

  return null;
}

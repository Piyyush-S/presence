import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

/* ================= PAGES ================= */
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

/* ================= FIREBASE ================= */
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

/* ================= PRESENCE ================= */
import usePresence from "./hooks/usePresence";

/* =====================================================
   APP CONTENT (INSIDE THEME PROVIDER)
===================================================== */
function AppContent() {
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [stage, setStage] = useState("loading");
  const [isLogin, setIsLogin] = useState(true);

  /* =====================================================
     AUTH BOOTSTRAP (SINGLE SOURCE OF TRUTH)
  ===================================================== */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      /* ---------- NOT LOGGED IN ---------- */
      if (!firebaseUser) {
        localStorage.removeItem("presenceUser");
        setUser(null);
        setStage("landing");
        return;
      }

      /* ---------- BASIC USER ---------- */
      const baseUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
      };

      setUser(baseUser);
      setStage("userinfo");

      /* ---------- TRY FIRESTORE (SAFE) ---------- */
      try {
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          // User doc not created yet (signup not completed)
          return;
        }

        const data = snap.data();
        const mergedUser = { ...baseUser, ...data };

        setUser(mergedUser);
        localStorage.setItem("presenceUser", JSON.stringify(mergedUser));

        const complete = mergedUser.city && mergedUser.gender && mergedUser.age;

        setStage(complete ? "dashboard" : "userinfo");
      } catch (err) {
        console.warn("Firestore unavailable, continuing without it");
      }
    });

    return () => unsub();
  }, []);

  /* =====================================================
     PRESENCE (SAFE)
  ===================================================== */
  usePresence(user?.email);

  /* =====================================================
     AUTH HANDLERS
  ===================================================== */
  const handleLogin = () => {
    setStage("dashboard");
  };

  const handleSignup = () => {
    setStage("userinfo");
  };

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem("presenceUser");
    setUser(null);
    setStage("landing");
  };

  /* =====================================================
     NAV HELPERS
  ===================================================== */
  const goDashboard = () => setStage("dashboard");
  const goFriends = () => setStage("friends");
  const goNotifications = () => setStage("notifications");
  const goProfile = () => setStage("profile");
  const goChats = () => setStage("chats");

  const goChat = (email) => {
    localStorage.setItem("chatWith", email);
    setStage("chat");
  };

  /* =====================================================
     UI ROUTING
  ===================================================== */
  if (stage === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{ background: theme.bg, color: theme.fg }}
      >
        <p
          className="text-sm tracking-wide"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: theme.muted,
          }}
        >
          pause…
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
      <LoginPage onLogin={handleLogin} onSwitch={() => setIsLogin(false)} />
    ) : (
      <SignupPage onSignup={handleSignup} onSwitch={() => setIsLogin(true)} />
    );
  }

  const renderStage = () => {
    switch (stage) {
      case "userinfo":
        return (
          <UserInfoForm
            uid={user?.uid}
            email={user?.email}
            onComplete={goDashboard}
          />
        );
      case "friends":
        return (
          <FriendsPage
            onBack={goDashboard}
            onOpenChat={goChat}
            onOpenFriends={goFriends}
            onOpenNotifications={goNotifications}
            onOpenProfile={goProfile}
            onOpenChats={goChats}
            onLogout={handleLogout}
          />
        );
      case "notifications":
        return (
          <Notifications
            onBack={goDashboard}
            onOpenFriends={goFriends}
            onOpenNotifications={goNotifications}
            onOpenProfile={goProfile}
            onOpenChats={goChats}
            onLogout={handleLogout}
          />
        );
      case "profile":
        return (
          <ProfilePage
            onBack={goDashboard}
            onOpenFriends={goFriends}
            onOpenNotifications={goNotifications}
            onOpenProfile={goProfile}
            onOpenChats={goChats}
            onLogout={handleLogout}
          />
        );
      case "chats":
        return (
          <ChatsPage
            onBack={goDashboard}
            onOpenChat={goChat}
            onOpenFriends={goFriends}
            onOpenNotifications={goNotifications}
            onOpenProfile={goProfile}
            onOpenChats={goChats}
            onLogout={handleLogout}
          />
        );
      case "chat":
        return <ChatPage onBack={goChats} />;
      case "dashboard":
      default:
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
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {renderStage()}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

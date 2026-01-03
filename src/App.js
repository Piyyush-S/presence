import React, { useEffect, useState } from "react";

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
   APP
===================================================== */
export default function App() {
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
        localStorage.setItem(
          "presenceUser",
          JSON.stringify(mergedUser)
        );

        const complete =
          mergedUser.city &&
          mergedUser.gender &&
          mergedUser.age;

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="opacity-60">Loading Pause…</p>
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
        uid={user?.uid}
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

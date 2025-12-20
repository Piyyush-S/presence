import React, { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UserInfoForm from "./pages/UserInfoForm";
import HomeDashboard from "./pages/HomeDashboard";
import FriendsPage from "./pages/FriendsPage";
import Notifications from "./pages/Notifications";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";
import ChatsPage from "./pages/ChatsPage"; // ✅ fixed import
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import usePresence from "./hooks/usePresence";

export default function App() {
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [stage, setStage] = useState("loading");

  // 🔥 Presence
  const saved = typeof window !== "undefined" ? localStorage.getItem("presenceUser") : null;
  const me = saved ? JSON.parse(saved) : null;
  usePresence(me?.email);

  // ⚡ Load user
  useEffect(() => {
    const init = async () => {
      try {
        const saved = localStorage.getItem("presenceUser");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.email) {
            setUser(parsed);
            setStage("dashboard");
          }
        } else setStage("auth");

        // 🔄 Firestore sync
        if (saved) {
          const parsed = JSON.parse(saved);
          const ref = doc(db, "users", parsed.email);
          const snapshot = await getDoc(ref);

          if (snapshot.exists()) {
            const data = snapshot.data();
            localStorage.setItem("presenceUser", JSON.stringify(data));
            setUser(data);
            setStage(data.gender && data.city && data.age && data.mood ? "dashboard" : "userinfo");
          } else setStage("auth");
        }
      } catch {
        setStage("auth");
      }
    };
    init();
  }, []);

  // Navigation handlers
  const handleLogin = async () => {
    const saved = localStorage.getItem("presenceUser");
    if (!saved) return setStage("auth");
    const parsed = JSON.parse(saved);
    const ref = doc(db, "users", parsed.email);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return setStage("auth");
    const data = snapshot.data();
    setUser(data);
    setStage(data.gender && data.city && data.age && data.mood ? "dashboard" : "userinfo");
  };

  const handleSignup = () => {
    const saved = localStorage.getItem("presenceUser");
    if (!saved) return setStage("auth");
    setUser(JSON.parse(saved));
    setStage("userinfo");
  };

  const handleLogout = () => {
    localStorage.removeItem("presenceUser");
    setUser(null);
    setStage("auth");
    setIsLogin(true);
  };

  const handleUserInfoComplete = () => setStage("dashboard");
  const handleOpenFriends = () => setStage("friends");
  const handleOpenNotifications = () => setStage("notifications");
  const handleOpenProfile = () => setStage("profile");
  const handleOpenChats = () => setStage("chats");
  const handleOpenChat = (email) => {
    localStorage.setItem("chatWith", email);
    setStage("chat");
  };
  const handleBackToDashboard = () => setStage("dashboard");

  // Loading
  if (stage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <p className="text-gray-600 text-lg animate-pulse">Loading Presence Grid 🌿...</p>
      </div>
    );
  }

  // Routing (UI stages)
  if (stage === "auth") {
    return isLogin ? (
      <LoginPage onLogin={handleLogin} onSwitch={() => setIsLogin(false)} />
    ) : (
      <SignupPage onSignup={handleSignup} onSwitch={() => setIsLogin(true)} />
    );
  }

  if (stage === "userinfo") {
    return <UserInfoForm email={user?.email} onComplete={handleUserInfoComplete} />;
  }

  // 👥 Friends
if (stage === "friends") {
  return (
    <FriendsPage
      onBack={handleBackToDashboard}
      onOpenChat={(email) => {
        localStorage.setItem("chatWith", email);
        setStage("chat");
      }}
    />
  );
}


  if (stage === "notifications") {
    return <Notifications onBack={handleBackToDashboard} />;
  }

  if (stage === "profile") {
    return <ProfilePage onBack={handleBackToDashboard} />;
  }

  if (stage === "chats") {
    return <ChatsPage onBack={handleBackToDashboard} onOpenChat={handleOpenChat} />;
  }

  if (stage === "chat") {
    return <ChatPage onBack={() => setStage("chats")} />;
  }

  if (stage === "dashboard") {
    return (
      <HomeDashboard
        onLogout={handleLogout}
        onOpenFriends={handleOpenFriends}
        onOpenNotifications={handleOpenNotifications}
        onOpenProfile={handleOpenProfile}
        onOpenChats={handleOpenChats}
      />
    );
  }

  return null;
}
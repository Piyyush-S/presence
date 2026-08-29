import { useState } from "react";
import LandingPage from "./LandingPage";
import UserInfoForm from "./pages/UserInfoForm";
import { motion, AnimatePresence } from "framer-motion";

export default function PresenceGridPrototype() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState("");
  const [message, setMessage] = useState("");
  const [reflection, setReflection] = useState("");
  const [user, setUser] = useState(null);

  const fade = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.4, ease: "easeOut" },
  };

  const startPrototype = (formData) => {
    setUser(formData);
    setStarted(true);
    setStep(1);
  };

  const startSession = () => setStep(2);
  const selectMood = (m) => {
    setMood(m);
    setStep(3);
  };
  const endSession = () => setStep(4);
  const finishReflection = () => setStep(5);

  // ✅ Fixed reset logic
  const reset = () => {
    setStep(1); // return to hero screen
    setMood("");
    setMessage("");
    setReflection("");
    // keep user info so form isn't asked again
    setStarted(true);
  };

  // Before anything else, if no user info → show info form
  if (!started && !user) return <UserInfoForm onSubmit={startPrototype} />;

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center text-gray-800 p-6 relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
    >
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="landing" {...fade}>
            <LandingPage onStart={() => setStep(1)} />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="hero" {...fade} className="text-center max-w-xl z-10">
            <h1 className="text-4xl font-bold mb-4">
              Feel Seen, Not Just Connected
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              A calm space to exchange real presence — one short, human moment at
              a time.
            </p>
            {user && (
              <p className="text-md text-gray-500 mb-2">
                Welcome back, <span className="font-semibold">{user.name}</span> 👋
              </p>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={startSession}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-md hover:bg-indigo-700 transition"
            >
              Start Presence Session
            </motion.button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="pulse" {...fade} className="text-center max-w-xl z-10">
            <h2 className="text-3xl font-semibold mb-6">Choose Your Pulse</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
               "Calm ☁️",
               "Lonely 💭",
               "Open to talk 💬",
               "Need silence 🌙",
               "Anxious ⚡",
               "Happy ☀️",
               "Overwhelmed 🌊",
               "Curious 🔍",
               "Lost 💫",
               "Grateful 🌻",
               ]
                .map(
                (m) => (
                  <button
                    key={m}
                    onClick={() => selectMood(m)}
                    className={`px-6 py-4 bg-white rounded-2xl shadow hover:shadow-lg transition text-lg ${
                      mood === m ? "ring-2 ring-indigo-500" : ""
                    }`}
                  >
                    {m}
                  </button>
                )
              )}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="session" {...fade} className="text-center max-w-md z-10">
            <h2 className="text-3xl font-semibold mb-4">Presence Session</h2>
            <p className="text-lg text-gray-600 mb-6">
              You’re sharing this moment as:{" "}
              <span className="font-medium">{mood}</span>
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your thoughts here..."
              className="w-full h-32 p-4 border border-gray-300 rounded-2xl mb-6 focus:ring-2 focus:ring-indigo-400 outline-none"
            ></textarea>
            <button
              onClick={endSession}
              disabled={!message.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-md hover:bg-indigo-700 transition disabled:opacity-40"
            >
              End Session
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="reflect" {...fade} className="text-center max-w-md z-10">
            <h2 className="text-3xl font-semibold mb-4">Reflect</h2>
            <p className="text-lg text-gray-600 mb-6">
              How do you feel after sharing?
            </p>
            <div className="flex flex-col gap-3 mb-6">
              {["Calm", "Neutral", "Uncomfortable"].map((r) => (
                <button
                  key={r}
                  onClick={() => setReflection(r)}
                  className={`px-6 py-3 rounded-2xl border ${
                    reflection === r
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700"
                  } hover:bg-indigo-100 transition`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={finishReflection}
              disabled={!reflection}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-md hover:bg-indigo-700 transition disabled:opacity-40"
            >
              Finish
            </button>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="thanks" {...fade} className="text-center max-w-xl z-10">
            <h2 className="text-3xl font-semibold mb-4">Thank You 🌿</h2>
            <p className="text-lg text-gray-600 mb-8">
              You’ve just shared a moment of real presence. Imagine a world where
              every connection felt this genuine.
            </p>
            <a
              href="https://forms.gle/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-md hover:bg-indigo-700 transition"
            >
              Join Waitlist
            </a>
            <div className="mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={reset}
                className="text-indigo-600 hover:underline transition-all duration-300"
              >
                Back to Home
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

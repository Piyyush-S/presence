// src/pages/UserInfoForm.jsx
import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../firebase";

/* ---------- TOAST ---------- */
function Toast({ show, text }) {
  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2
        px-5 py-3 rounded-xl text-sm text-white
        bg-indigo-600 shadow-lg
        transition-all duration-300
        ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
      `}
    >
      {text}
    </div>
  );
}

/* ---------- TOOLTIP ---------- */
function Tooltip({ text }) {
  return (
    <span className="group relative inline-block ml-2">
      <span className="cursor-help text-indigo-500 font-bold">?</span>
      <span
        className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          w-56 text-xs text-white bg-slate-900 px-3 py-2 rounded-lg
          opacity-0 group-hover:opacity-100 transition
          pointer-events-none z-10
        "
      >
        {text}
      </span>
    </span>
  );
}

export default function UserInfoForm({ email, onComplete }) {
  const storedUser = JSON.parse(localStorage.getItem("presenceUser") || "{}");

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [imgFile, setImgFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(false);

  /* ---------- FIRE & FORGET FIREBASE ---------- */
  const syncToFirebase = async (profile) => {
    try {
      let imgUrl = profile.img || "";

      if (imgFile) {
        const storage = getStorage();
        const imgRef = ref(storage, `profilePics/${email}`);
        await uploadBytes(imgRef, imgFile);
        imgUrl = await getDownloadURL(imgRef);
      }

      await setDoc(
        doc(db, "users", email),
        {
          ...profile,
          img: imgUrl,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // silent fail
    }
  };

  /* ---------- SUBMIT ---------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !city) {
      alert("Please fill required fields.");
      return;
    }

    setLoading(true);
    setToast(true);

    const profile = {
      email,
      username: storedUser.username,
      name,
      age,
      city,
      gender,
      img: preview || "",
    };

    localStorage.setItem("presenceUser", JSON.stringify(profile));

    setTimeout(() => onComplete?.(), 500);
    syncToFirebase(profile);

    setTimeout(() => setToast(false), 1200);
    setLoading(false);
  };

  return (
    <>
      <Toast show={toast} text="Saving profile…" />

      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <form
          onSubmit={handleSubmit}
          className="
            w-full max-w-md p-8 rounded-3xl
            bg-white shadow-xl
          "
        >
          {/* STEP */}
          <p className="text-xs text-indigo-500 font-medium text-center mb-2">
            STEP 2 OF 3
          </p>

          {/* HEADER */}
          <h1 className="text-3xl font-bold text-center text-indigo-700">
            Complete your profile
          </h1>
          <p className="text-center text-sm text-slate-500 mt-2 mb-8">
            This helps people recognize you as a real person
          </p>

          {/* AVATAR */}
          <div className="flex justify-center mb-8">
            <label className="cursor-pointer group">
              <div
                className="
                  w-28 h-28 rounded-full bg-indigo-100
                  flex items-center justify-center overflow-hidden
                  group-hover:scale-105 transition
                "
              >
                {preview ? (
                 <img
  src={preview}
  alt="Profile preview"
  className="w-full h-full object-cover"
/>

                ) : (
                  <span className="text-indigo-500 text-sm">Upload photo</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setImgFile(file);
                  if (file) setPreview(URL.createObjectURL(file));
                }}
              />
            </label>
          </div>

          {/* USERNAME (LOCKED + EXPLAINED) */}
          <div className="mb-6">
            <label className="text-xs font-medium text-slate-500">
              Username
              <Tooltip text="Your username was chosen during signup. Usernames are unique and cannot be changed later." />
            </label>

            <div className="relative mt-2">
              <input
                value={`@${storedUser.username || ""}`}
                disabled
                className="w-full p-4 rounded-xl bg-slate-100 text-slate-600 font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                Locked
              </span>
            </div>
          </div>

          {/* USERNAME PREVIEW */}
          <div className="mb-8 p-4 rounded-xl bg-indigo-50">
            <p className="text-xs text-slate-500 mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-200" />
              <div>
                <p className="font-semibold">{name || "Your Name"}</p>
                <p className="text-sm text-slate-500">
                  @{storedUser.username}
                </p>
              </div>
            </div>
          </div>

          {/* NAME */}
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mb-4 p-4 rounded-xl border focus:ring-2 focus:ring-indigo-400 outline-none"
            required
          />

          {/* AGE + CITY */}
          <div className="flex gap-3 mb-4">
            <input
              type="number"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-1/3 p-4 rounded-xl border focus:ring-2 focus:ring-indigo-400 outline-none"
            />
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-2/3 p-4 rounded-xl border focus:ring-2 focus:ring-indigo-400 outline-none"
              required
            />
          </div>

          {/* GENDER */}
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full mb-8 p-4 rounded-xl border focus:ring-2 focus:ring-indigo-400 outline-none"
          >
            <option value="">Gender (optional)</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </select>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-4 rounded-xl text-white font-semibold transition
              ${loading ? "bg-slate-300" : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-[1.01]"}
            `}
          >
            {loading ? "Saving…" : "Save & Continue"}
          </button>

          <p className="text-center text-xs text-slate-400 mt-4">
            You can edit this later
          </p>
        </form>
      </div>
    </>
  );
}

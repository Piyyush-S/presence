import React, { useState } from "react";
import {
  collection,
  doc,
  serverTimestamp,
  query,
  where,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../firebase";


export default function UserInfoForm({ email, onComplete }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [imgFile, setImgFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🧠 Check if username is unique before saving
  const checkUsernameExists = async (username) => {
    const q = query(collection(db, "users"), where("username", "==", username));
    const snap = await getDocs(q);
    return !snap.empty;
  };

  // 📤 Handle image upload to Firebase Storage
  const uploadImage = async (file, email) => {
    if (!file) return "";
    const storage = getStorage();
    const fileRef = ref(storage, `profilePics/${email}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !username || !city) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const usernameTaken = await checkUsernameExists(username);
      if (usernameTaken) {
        alert("This username is already taken. Please choose another.");
        setLoading(false);
        return;
      }

      const imgUrl = await uploadImage(imgFile, email);

      const userRef = doc(db, "users", email);
      await setDoc(
        userRef,
        {
          name,
          username,
          age,
          city,
          gender,
          img: imgUrl,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Save in localStorage
      const newUser = {
        email,
        name,
        username,
        age,
        city,
        gender,
        img: imgUrl,
      };
      localStorage.setItem("presenceUser", JSON.stringify(newUser));

      alert("Profile completed successfully!");
      onComplete?.();
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg p-8 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-indigo-600 mb-6 text-center">
          Complete Your Profile 🌿
        </h1>

        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 p-3 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
          required
        />

        <input
          type="text"
          placeholder="Unique username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 p-3 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
          required
        />

        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full mb-4 p-3 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
        />

        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full mb-4 p-3 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
          required
        />

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full mb-4 p-3 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImgFile(e.target.files[0])}
          className="w-full mb-6 text-gray-600"
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold text-white transition ${
            loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

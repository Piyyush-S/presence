// src/constants/vibes.js

export const VIBES = [
  {
    name: "Calm ☁️",
    label: "Calm",
    emoji: "☁️",
    description: "I'm here, taking it slow.",
  },
  {
    name: "Open to Talk 💬",
    label: "Open to Talk",
    emoji: "💬",
    description: "I'm present and open to conversation.",
  },
  {
    name: "Curious 🔍",
    label: "Curious",
    emoji: "🔍",
    description: "Exploring thoughts and quiet observations.",
  },
  {
    name: "Reflective 🌿",
    label: "Reflective",
    emoji: "🌿",
    description: "Looking inward, thinking through things.",
  },
  {
    name: "Energetic ⚡",
    label: "Energetic",
    emoji: "⚡",
    description: "Feeling lively and ready to connect.",
  },
  {
    name: "Grateful 🌻",
    label: "Grateful",
    emoji: "🌻",
    description: "Appreciating the moment and good presence.",
  },
  {
    name: "Quiet 🌙",
    label: "Quiet",
    emoji: "🌙",
    description: "I'm here, but keeping to myself.",
  },
  {
    name: "Overwhelmed 🌊",
    label: "Overwhelmed",
    emoji: "🌊",
    description: "Tired or overstimulated, resting quietly.",
  },
];

export function getVibeInfo(vibeName) {
  if (!vibeName) return VIBES[0];
  const found = VIBES.find(
    (v) =>
      v.name.toLowerCase() === vibeName.toLowerCase() ||
      v.label.toLowerCase() === vibeName.toLowerCase() ||
      vibeName.toLowerCase().startsWith(v.label.toLowerCase())
  );
  return (
    found || {
      name: vibeName,
      label: vibeName,
      emoji: "✨",
      description: "Sharing calm presence.",
    }
  );
}

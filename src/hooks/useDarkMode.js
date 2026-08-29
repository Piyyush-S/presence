import { useTheme } from "../context/ThemeContext";

export default function useDarkMode() {
  const { dark, toggleDark } = useTheme();
  return [dark, toggleDark];
}

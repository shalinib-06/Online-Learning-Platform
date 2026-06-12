import { useTheme } from "../context/ThemeContext";

const DARK_SRC = {
  signup: "/images/dark/signup-how-it-works.png",
  login: "/images/dark/login.png",
  forgot: "/images/dark/forgot-password.png",
  hero: "/images/dark/hero.png",
  howItWorks: "/images/dark/signup-how-it-works.png",
};

const ThemeImage = ({ name, lightSrc, darkSrc, alt, className }) => {
  const { isDark } = useTheme();
  const ds = darkSrc || DARK_SRC[name];
  const src = isDark && ds ? ds : lightSrc;
  return <img src={src} alt={alt} className={className} />;
};

export default ThemeImage;

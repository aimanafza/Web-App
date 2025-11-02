export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Session storage key for auth state
export const AUTH_STORAGE_KEY = "hierarchical-todo-auth";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Hierarchical Todo App";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "https://placehold.co/128x128/E1E7EF/1F2937?text=Hierarchical Todo";

// Use custom login page instead of Manus OAuth
export const getLoginUrl = () => {
  return "/login";
};
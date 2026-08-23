// Central API configuration
// In production (Vercel): VITE_API_URL = https://docsmind-q8d6.onrender.com
// In local dev (.env.local): VITE_API_URL = http://localhost:3000
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

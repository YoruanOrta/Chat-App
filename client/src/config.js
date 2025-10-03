const isProduction = process.env.NODE_ENV === 'production';

// Change this URL after you deploy to Render
const PRODUCTION_URL = 'chat-app-7kr1.onrender.com';

export const config = {
  WS_URL: isProduction 
    ? `wss://${PRODUCTION_URL}` 
    : 'ws://localhost:8989',
  
  API_URL: isProduction 
    ? `https://${PRODUCTION_URL}` 
    : 'http://localhost:8989'
};
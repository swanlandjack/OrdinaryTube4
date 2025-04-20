// This is for development mode only — bypasses validation
const isDevMode = process.env.NODE_ENV === 'development';

exports.handler = async (event) => {
  // CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle OPTIONS preflight request
  if (event.httpMethod === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    return {
      statusCode: 204,
      headers
    };
  }
  
  console.log("🔐 Verifying access token");
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    };
  }

  try {
    // Parse the request body
    const { token } = JSON.parse(event.body);
    
    console.log("Token received:", token);

    // Always accept in dev mode
    if (isDevMode) {
      console.log("✅ Development mode — skipping real validation");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Access verified (dev)' }),
      };
    }

    // In production, just check if token exists and is non-empty
    if (token && typeof token === 'string' && token.length > 10) {
      console.log("Token looks valid");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Access verified' }),
      };
    } else {
      console.log("Invalid token");
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid or expired access token' }),
      };
    }
  } catch (error) {
    console.error("❌ Error verifying token:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error' }),
    };
  }
};
// Define the correct password (from environment variable)
const CORRECT_PASSWORD = process.env.CLASS_PASSWORD || "your_default_password_here";

// Maximum number of allowed users
const MAX_USERS = parseInt(process.env.MAX_USERS || "30", 10);

// In-memory storage for access tokens (resets when function is redeployed or goes cold)
// This won't work reliably in production but is ok for a classroom demo
let accessTokens = [];

// Generate a random access token
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

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
  
  // Debug logging
  console.log("Function triggered");
  console.log("HTTP Method:", event.httpMethod);
  console.log("Environment variables:", {
    CLASS_PASSWORD: process.env.CLASS_PASSWORD ? "EXISTS" : "MISSING",
    MAX_USERS: process.env.MAX_USERS || "MISSING"
  });
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log("Method not allowed:", event.httpMethod);
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    console.log("Request body:", event.body);
    const data = JSON.parse(event.body);
    
    // Log data (be careful not to log actual passwords in production)
    console.log("Password provided:", data.password ? "YES" : "NO");
    
    const submittedPassword = data.password;
    const correctPassword = process.env.CLASS_PASSWORD;
    
    // Check if the password is correct
    if (submittedPassword === correctPassword) {
      console.log("Password matched, checking user count");
      
      // Check if we've reached the maximum number of users
      if (accessTokens.length >= MAX_USERS) {
        console.log("Max users reached:", accessTokens.length, ">=", MAX_USERS);
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            success: false,
            message: `Access limit reached. Only ${MAX_USERS} users can access this application.`
          })
        };
      }
      
      // Generate a new access token
      const token = generateToken();
      
      // Add the token to our list
      accessTokens.push(token);
      
      // Log the current number of users (helpful for monitoring)
      console.log(`Current number of users: ${accessTokens.length}`);
      console.log(`New token generated: ${token}`);
      
      // Return success response with the token
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          token: token,
          message: 'Access granted'
        })
      };
    } else {
      console.log("Password did not match, access denied");
      // Password is incorrect
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Incorrect password'
        })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Server error: ' + error.message
      })
    };
  }
};
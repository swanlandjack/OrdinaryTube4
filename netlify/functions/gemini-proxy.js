// netlify/functions/gemini-proxy.js (Fixed fetch import)

// REMOVED: const fetch = require('node-fetch'); // Removed CommonJS require

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Adjust model name as needed
const GEMINI_MODEL = 'gemini-1.5-flash-latest';
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

exports.handler = async (event, context) => {
    // ADDED: Dynamic import for node-fetch v3+
    const { default: fetch } = await import('node-fetch');

    if (!GEMINI_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Gemini API key is not configured.' }) };
    }

    // Expecting request data in the body from the frontend
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed. Please use POST.' }) };
    }

    let requestPayload;
    try {
        requestPayload = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON request body.' }) };
    }

    const apiUrl = `${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`;

    try {
        console.log(`GEMINI PROXY: Fetching from ${GEMINI_API_ENDPOINT} (key hidden)`);
        const response = await fetch(apiUrl, { // Now fetch works
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload),
        });

        const responseBody = await response.text(); // Read body once

        if (!response.ok) {
            console.error(`GEMINI PROXY: Gemini API Error (${response.status}): ${responseBody}`);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Gemini API Error: ${response.statusText}`, details: responseBody }),
            };
        }
        console.log("GEMINI PROXY: Received OK response from Gemini API.");

        // Return the successful response from Gemini API to the frontend
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: responseBody, // Forward the JSON string
        };

    } catch (error) {
        console.error('GEMINI PROXY: Error proxying Gemini request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data from Gemini API.' }),
        };
    }
};

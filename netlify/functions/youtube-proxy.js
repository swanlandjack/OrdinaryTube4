// netlify/functions/youtube-proxy.js (Fixed fetch import)

// REMOVED: const fetch = require('node-fetch'); // Removed CommonJS require

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

exports.handler = async (event, context) => {
    // ADDED: Dynamic import for node-fetch v3+
    const { default: fetch } = await import('node-fetch');

    if (!YOUTUBE_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'YouTube API key is not configured.' }) };
    }

    // Get parameters from query string
    const { q, timeRangeDays, maxResults: maxResultsStr } = event.queryStringParameters;
    const maxResults = parseInt(maxResultsStr || '3', 10); // Default to 3 if not provided
    const initialFetchCount = Math.max(25, maxResults * 2); // Fetch more initially for better sorting pool

    if (!q) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing search query parameter "q".' }) };
    }
    if (!timeRangeDays) {
         return { statusCode: 400, body: JSON.stringify({ error: 'Missing timeRangeDays parameter.' }) };
    }

    // Calculate publishedAfter date
    const now = new Date();
    const pastDate = new Date(now.getTime() - (parseInt(timeRangeDays, 10) * 24 * 60 * 60 * 1000));
    const publishedAfter = pastDate.toISOString();

    const searchParams = new URLSearchParams({
        part: 'snippet',
        q: q,
        type: 'video',
        publishedAfter: publishedAfter,
        order: 'viewCount', // Let YouTube try to order by view count initially
        maxResults: initialFetchCount.toString(), // Fetch more to sort accurately later
        key: YOUTUBE_API_KEY
    });

    try {
        // Step 1: Search for videos
        console.log(`YT PROXY: Fetching search: ${SEARCH_URL}?${searchParams.toString().replace(YOUTUBE_API_KEY, 'API_KEY_HIDDEN')}`);
        const searchResponse = await fetch(`${SEARCH_URL}?${searchParams.toString()}`); // Now fetch works
        const searchData = await searchResponse.json();

        if (!searchResponse.ok || searchData.error) {
            console.error('YT PROXY: YouTube Search API Error:', searchData.error || `Status ${searchResponse.status}`);
            throw new Error(searchData.error?.message || `YouTube Search API request failed`);
        }
        if (!searchData.items || searchData.items.length === 0) {
             console.log("YT PROXY: No search results found.");
            return { statusCode: 200, body: JSON.stringify({ items: [] }) }; // Return empty list if no results
        }

        // Step 2: Get video IDs
        const videoIds = searchData.items.map(item => item.id?.videoId).filter(id => id);
        if (videoIds.length === 0) {
             console.log("YT PROXY: No valid video IDs found in search results.");
             return { statusCode: 200, body: JSON.stringify({ items: [] }) };
        }
         console.log(`YT PROXY: Found ${videoIds.length} video IDs.`);

        // Step 3: Fetch video details and statistics
        const videoParams = new URLSearchParams({
            part: 'snippet,statistics',
            id: videoIds.join(','),
            key: YOUTUBE_API_KEY
        });
         console.log(`YT PROXY: Fetching details: ${VIDEOS_URL}?${videoParams.toString().replace(YOUTUBE_API_KEY, 'API_KEY_HIDDEN')}`);
        const videoResponse = await fetch(`${VIDEOS_URL}?${videoParams.toString()}`); // Now fetch works
        const videoData = await videoResponse.json();

         if (!videoResponse.ok || videoData.error) {
            console.error('YT PROXY: YouTube Video API Error:', videoData.error || `Status ${videoResponse.status}`);
            throw new Error(videoData.error?.message || `YouTube Video Details API request failed`);
        }
         if (!videoData.items) {
             console.log("YT PROXY: No video details returned.");
             return { statusCode: 200, body: JSON.stringify({ items: [] }) };
         }
         console.log(`YT PROXY: Received details for ${videoData.items.length} videos.`);

        // Step 4: Add view counts and sort
        videoData.items.forEach(item => {
            item.viewCountNumeric = parseInt(item.statistics?.viewCount || '0', 10);
        });
        videoData.items.sort((a, b) => b.viewCountNumeric - a.viewCountNumeric);

        // Step 5: Slice to get the actual top N results requested
        const finalVideos = videoData.items.slice(0, maxResults);
         console.log(`YT PROXY: Returning top ${finalVideos.length} videos.`);

        // Return the final sorted and sliced video list
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: finalVideos }), // Return structure similar to API
        };

    } catch (error) {
        console.error('YT PROXY: Error in youtube-proxy function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Failed to fetch data from YouTube API.' }),
        };
    }
};
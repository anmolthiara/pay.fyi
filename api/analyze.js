// Vercel Serverless Function for Gemini API
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    // Get the prompt from request body
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Calling Gemini API...');

    // Call Gemini API - using gemini-1.5-flash (stable, widely available)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error response:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      return res.status(response.status).json({ 
        error: data.error?.message || 'Gemini API request failed',
        details: data,
        apiStatus: response.status
      });
    }

    console.log('Gemini API success');
    
    // Return the analysis
    return res.status(200).json(data);

  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to analyze compensation' 
    });
  }
};

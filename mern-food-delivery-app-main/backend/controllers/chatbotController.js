import axios from 'axios';

const MAX_CONTENTS_LENGTH = 50; // max conversation turns
const MAX_MESSAGE_CHARS = 4000; // max characters per message

/**
 * Proxy to Gemini API — authenticated and rate-limited at route level.
 * Validates and sanitizes the request body before forwarding.
 */
export const askChatbot = async (req, res) => {
  const { contents, systemInstruction, generationConfig } = req.body;

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ success: false, message: 'Chatbot is not configured.' });
  }

  // Validate contents array
  if (!Array.isArray(contents) || contents.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid message format.' });
  }

  if (contents.length > MAX_CONTENTS_LENGTH) {
    return res.status(400).json({ success: false, message: 'Conversation too long.' });
  }

  // Validate each content item
  for (const item of contents) {
    if (!item.role || !Array.isArray(item.parts)) {
      return res.status(400).json({ success: false, message: 'Invalid message format.' });
    }
    for (const part of item.parts) {
      if (typeof part.text === 'string' && part.text.length > MAX_MESSAGE_CHARS) {
        return res.status(400).json({ success: false, message: 'Message too long.' });
      }
    }
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    const response = await axios.post(url, {
      contents,
      systemInstruction: systemInstruction || undefined,
      generationConfig: generationConfig || undefined,
    });

    return res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Chatbot proxy error:', error.response?.data?.error?.message || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.error?.message || 'Chatbot request failed.',
    });
  }
};

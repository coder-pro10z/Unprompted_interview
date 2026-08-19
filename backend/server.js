import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fetch from 'node-fetch';
import FormData from 'form-data';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Single endpoint: Audio/Video upload -> AI Review
app.post('/api/review-speech', upload.single('media'), async (req, res) => {
  try {
    const { topic, durationSeconds, contextMode } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No audio/video file provided' });
    }

    if (!process.env.GROQ_API_KEY || !process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'The server administrator has not configured the required API keys.' });
    }

    // STEP 1: Transcribe using Groq Whisper
    const formData = new FormData();
    formData.append('file', file.buffer, { filename: 'speech.webm', contentType: file.mimetype });
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'json');

    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: formData
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq STT failed:', errText);
      if (groqResponse.status === 401 || groqResponse.status === 403) {
        return res.status(500).json({ error: 'The server transcription API key is invalid or expired.' });
      }
      return res.status(500).json({ error: 'Failed to transcribe audio' });
    }

    const { text: transcript } = await groqResponse.json();

    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({ error: 'No speech detected in the recording.' });
    }

    // STEP 2: Evaluate using OpenRouter (120B model)
    const isInterview = contextMode === 'interview';
    
    const prompt = isInterview ? `
      You are an expert technical interviewer. Evaluate the user's verbal response to the technical topic: "${topic}".
      (Target duration: ${durationSeconds || 60} seconds).
      
      Here is the transcript of their speech:
      "${transcript}"

      Evaluate their speech strictly on the basis of:
      1. Articulation and Speech Clarity (How well the topic is articulated, fluency, pacing).
      2. Technical Concept Accuracy (Is their explanation technically sound and accurate?).
      3. Communication (Filler words, structuring of thoughts).

      Provide structured analysis and concrete coaching tips tailored for a technical interview setting.
      Return ONLY a valid JSON object. Do not include markdown formatting or explanations.
      
      The JSON must perfectly match this schema:
      {
        "overallScore": 85,
        "transcript": "...",
        "wordsPerMinute": 130,
        "fillerWords": [{"word": "um", "count": 2}],
        "structureEvaluation": {
          "whatCovered": true,
          "soWhatCovered": true,
          "nowWhatCovered": false,
          "feedback": "..."
        },
        "strengths": ["...", "..."],
        "areasToImprove": ["...", "..."]
      }
    ` : `
      You are an expert speech coach. Analyze the user's spoken response on the topic: "${topic}".
      (Target duration: ${durationSeconds || 60} seconds).
      
      Here is the transcript of their speech:
      "${transcript}"

      Evaluate their speech following the 3-part framework:
      1. What? (The concept/definition)
      2. So what? (Why it matters/impact)
      3. Now what? (Actionable takeaways or future outlook)

      Provide structured analysis for fluency, filler words (e.g., "um", "ah", "like"), pacing (WPM), and concrete coaching tips.
      Return ONLY a valid JSON object. Do not include markdown formatting or explanations.
      
      The JSON must perfectly match this schema:
      {
        "overallScore": 85,
        "transcript": "...",
        "wordsPerMinute": 130,
        "fillerWords": [{"word": "um", "count": 2}],
        "structureEvaluation": {
          "whatCovered": true,
          "soWhatCovered": true,
          "nowWhatCovered": false,
          "feedback": "..."
        },
        "strengths": ["...", "..."],
        "areasToImprove": ["...", "..."]
      }
    `;

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173', // Optional, for OpenRouter rankings
        'X-Title': 'Unprompted Coach', // Optional, for OpenRouter rankings
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-70b-instruct', // Using a valid large OpenRouter model
        messages: [
          {
            role: 'system',
            content: isInterview 
              ? 'You are an expert technical interviewer AI. Return ONLY a valid JSON object. No markdown, no explanations.'
              : 'You are an expert speech coach AI. Return ONLY a valid JSON object. No markdown, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!openRouterResponse.ok) {
      const errText = await openRouterResponse.text();
      console.error('OpenRouter Evaluation failed:', errText);
      if (openRouterResponse.status === 401 || openRouterResponse.status === 403) {
        return res.status(500).json({ error: 'The server AI grading API key is invalid, out of credits, or the model is unavailable.' });
      }
      return res.status(500).json({ error: 'Failed to evaluate speech' });
    }

    const orData = await openRouterResponse.json();
    let resultText = orData.choices[0].message.content;
    
    // Clean up potential markdown wrappers
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const result = JSON.parse(resultText);
    
    // Ensure the original transcript is included in the response if not returned by LLM
    if (!result.transcript) {
        result.transcript = transcript;
    }

    return res.json(result);
  } catch (error) {
    console.error('AI Analysis failed:', error);
    return res.status(500).json({ error: 'Failed to analyze speech' });
  }
});

app.listen(5000, () => console.log('Speech Review Server running on http://localhost:5000'));

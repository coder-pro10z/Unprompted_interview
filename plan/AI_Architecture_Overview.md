# AI Integration Architecture: JD Extraction Pipeline

This document outlines how Generative AI (LLMs) are architected and utilized within this project. You can use this pattern as a reference for integrating resilient, cost-effective AI extraction into other applications.

## 1. The Hybrid AI Approach

Instead of sending massive raw text payloads directly to an LLM for every operation (which is slow, prone to hallucination, and expensive), this project uses a **Hybrid Heuristic + LLM Architecture**.

1.  **Fast Heuristic Pass (Stage 1):** Raw Job Description (JD) text is first passed through a blazing-fast Regex/Heuristic engine. It identifies known technologies (e.g., C#, Python, Docker) using predefined cluster dictionaries and attempts basic metadata extraction.
2.  **Targeted AI Extraction (Stage 2):** Any contextually ambiguous data or "unclassified skills" that the heuristic engine couldn't confidently parse are bundled up and sent to the LLM. 
3.  **JSON Contract:** The LLM is given strict instructions to return a valid JSON object matching the exact schema required to backfill the missing data (e.g., splitting unclassified skills into `mandatory` vs `preferred`, and extracting `company`, `role`, and `experience`).

> [!TIP]
> **Why this matters for your next project:** By using AI *only for the difficult edge cases* rather than baseline parsing, you cut latency by over 80% and drastically reduce API token costs.

## 2. Multi-Provider Cascading Fallback System

To guarantee 100% uptime and avoid vendor lock-in, the system implements a robust fallback cascade. If one API is rate-limited or goes down, it seamlessly degrades to the next available provider.

### Primary: OpenRouter (OpenAI-Compatible REST API)
-   **Trigger:** Triggered if `OPENROUTER_API_KEY` is present.
-   **Models Used:** Uses high-throughput, open-weights models (e.g., `openai/gpt-oss-120b`, `google/gemma-2-9b-it:free`).
-   **Integration:** Standard `requests.post` to `https://openrouter.ai/api/v1/chat/completions` using the OpenAI chat schema.

### Secondary: Google Gemini API (Native SDK)
-   **Trigger:** If OpenRouter fails, or if only `GOOGLE_API_KEY` is present.
-   **Integration:** Uses the native `google.genai` SDK.
-   **Model Cascade:** It loops through a descending tier of Gemini models if it hits quota limits:
    1.  `gemini-2.5-flash-preview-05-20` (Latest/Fastest)
    2.  `gemini-2.5-flash`
    3.  `gemini-2.0-flash`
    4.  `gemini-1.5-flash`
    5.  `gemini-1.5-pro` (Heavy Reasoning)

> [!IMPORTANT]
> **Implementation Note:** Notice the `try/except` loop over a list of model strings in `extract_jd_fields.py`. If a `ResourceExhausted` error occurs, the code silently steps down to the next model model in the array without crashing the app.

## 3. The Prompting Strategy

The prompt is designed to strictly enforce machine-readable output:

1.  **System Constraints:** `You are an expert technical recruiter AI. Return ONLY a valid JSON object. No markdown, no explanations.`
2.  **Context Delivery:** The raw JD text is provided alongside the specific list of `candidate_skills` that need classification.
3.  **Schema Definition:** The expected JSON shape is explicitly laid out:
    ```json
    {
      "company": "string",
      "role": "string",
      "location": "string",
      "experience": "string",
      "mandatory": ["skill1"],
      "preferred": ["skill2"],
      "unclassified": []
    }
    ```
4.  **Application Layer Parsing:** The Python backend strips any accidental ```json ... ``` markdown wrappers the LLM might hallucinate and uses `json.loads()`. If it fails, it simply keeps the heuristic data.

## 4. Porting to a New Project

If you are taking this architecture to a new project:
1.  **Keep the Fallback Loop:** Always design your LLM wrapper function to accept multiple API keys and try multiple model IDs in a `try/except` block.
2.  **Enforce JSON Structure:** Use strict system prompts or provider-specific tools like OpenAI's "JSON Mode" or Gemini's `response_schema` feature to ensure outputs are immediately usable by code.
3.  **Hybrid Parsing:** Process structured/predictable data with code, and save the AI API calls for analyzing intent, classifying ambiguous text, or sentiment analysis.

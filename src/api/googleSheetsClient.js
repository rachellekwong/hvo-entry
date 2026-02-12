// Use /api/google-sheets in both dev (Vite proxy) and production (Vercel serverless) to avoid CORS.
const scriptUrl = '/api/google-sheets';

const request = async (payload) => {
  if (!scriptUrl) {
    console.error('[Google Sheets] Missing VITE_GOOGLE_SHEETS_SCRIPT_URL');
    throw new Error("Missing VITE_GOOGLE_SHEETS_SCRIPT_URL");
  }

  console.log('[Google Sheets] Sending request:', payload);
  console.log('[Google Sheets] URL:', scriptUrl);

  try {
    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log('[Google Sheets] Response status:', res.status, res.statusText);

    if (!res.ok) {
      const text = await res.text();
      console.error('[Google Sheets] Error response:', text);
      throw new Error(text || "Failed to reach Google Sheets endpoint");
    }

    const data = await res.json();
    console.log('[Google Sheets] Success response:', data);
    return data;
  } catch (err) {
    console.error('[Google Sheets] Request failed:', err);
    throw err;
  }
};

export const googleSheets = {
  appendSurvey: async (data) => {
    console.log('[Google Sheets] appendSurvey called with:', data);
    const result = await request({
      action: "appendSurvey",
      data,
    });
    console.log('[Google Sheets] appendSurvey result:', result);
    return result;
  },
  listSurveysByDate: async (date) => {
    console.log('[Google Sheets] listSurveysByDate called with date:', date);
    const result = await request({
      action: "listSurveysByDate",
      date,
    });
    console.log('[Google Sheets] listSurveysByDate result:', result);
    return result;
  },
};

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface ChatHistoryItem {
  role: string;
  content: string;
}

export const sendChat = async (message: string, history: ChatHistoryItem[], language: string = 'en') => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
        target_language: language,
        use_rag: true
      }),
    });
    
    if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Chat API Error:", error);
    throw error;
  }
};

export const translateText = async (_text: string, _source: string, _target: string) => {
    // Call translation endpoint
    return null;
};

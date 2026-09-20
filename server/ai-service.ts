import crypto from 'crypto';

// AI Model Configuration
interface AIModelConfig {
  baseUrl: string;
  model: string;
  timeout: number;
}

export class AIService {
  private config: AIModelConfig;
  private available: boolean = false;

  constructor(config: AIModelConfig) {
    this.config = config;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      this.available = response.ok;
      return this.available;
    } catch (error) {
      this.available = false;
      return false;
    }
  }

  async checkModelAvailability(): Promise<boolean> {
    if (!this.available) return false;
    
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return false;
      
      const data = await response.json();
      const models = data.models || [];
      return models.some((m: any) => m.name === this.config.model);
    } catch (error) {
      return false;
    }
  }

  async generateResponse(
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string,
    userLanguage: string = 'English'
  ): Promise<{ content: string; detectedEmotion: string; aiSuggestion: string | null }> {
    if (!this.available) {
      throw new Error('AI service is unavailable');
    }

    const augmentedSystemPrompt = `${systemPrompt}\n\nUser's preferred language: ${userLanguage}. Please respond in the user's preferred language where possible.`;

    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: augmentedSystemPrompt },
          ...messages
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error('Failed to generate AI response');
    }

    const data = await response.json();
    const content = data.message?.content || '';

    // Simple emotion detection (will be enhanced)
    const detectedEmotion = this.detectEmotion(content);
    const aiSuggestion = this.generateSuggestion(content, detectedEmotion);

    return {
      content,
      detectedEmotion,
      aiSuggestion,
    };
  }

  private detectEmotion(content: string): string {
    const lowerContent = content.toLowerCase();
    const emotions = {
      anxious: ['anxious', 'worried', 'nervous', 'panic', 'fear'],
      stressed: ['stressed', 'overwhelmed', 'pressure', 'tense'],
      sad: ['sad', 'depressed', 'down', 'unhappy', 'low'],
      angry: ['angry', 'frustrated', 'irritated', 'upset'],
      happy: ['happy', 'good', 'positive', 'great', 'well'],
    };

    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return emotion;
      }
    }

    return 'neutral';
  }

  private generateSuggestion(content: string, emotion: string): string | null {
    // Generate contextual suggestions based on emotion
    const suggestions: Record<string, string> = {
      anxious: 'Consider trying deep breathing exercises or talking to someone you trust.',
      stressed: 'Taking short breaks and prioritizing tasks might help manage stress.',
      sad: 'Journaling your thoughts or connecting with a friend could provide comfort.',
      angry: 'Taking a moment to breathe and stepping away from the situation might help.',
      happy: 'Building on positive moments through gratitude practices can support wellbeing.',
    };

    return suggestions[emotion] || null;
  }
}

// Factory function to create AI service instances
export function createAIService(): AIService {
  const config: AIModelConfig = {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL || 'phi3:latest',
    timeout: parseInt(process.env.AI_TIMEOUT || '30000', 10),
  };

  return new AIService(config);
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = createAIService();
  }
  return aiServiceInstance;
}

// Safety system prompts
export const SAFETY_SYSTEM_PROMPT = `You are TalkEasy AI, a supportive mental-wellness companion. Your role is to provide calm, respectful, and non-judgmental conversational assistance.

CRITICAL SAFETY RULES:
1. You are NOT a therapist, doctor, or diagnostic system.
2. You do NOT diagnose mental health conditions.
3. You do NOT prescribe medication or give medical advice.
4. You do NOT claim to be human or replace professional care.
5. You do NOT encourage emotional dependency or tell users to isolate themselves.

IF USER EXPRESSES SUICIDAL/SELF-HARM INTENT OR IMMEDIATE DANGER:
- Prioritize immediate safety
- Respond calmly and supportively
- Encourage moving away from means of harm
- Encourage being with another trusted person
- Encourage moving to a safer/shared/public environment when appropriate
- Strongly encourage emergency/professional support
- Provide verified crisis resources (112 for emergency, 14416 for Tele-MANAS in India)
- Avoid guilt, shame, threats, or emotional manipulation
- Do NOT provide harmful instructions
- Do NOT romanticize or normalize self-harm
- Do NOT claim to replace professional care

GENERAL BEHAVIOR:
- Be supportive, calm, and respectful
- Be context-aware of the user's emotional state
- Be concise but useful
- Not overly robotic or emotionally dependent
- Not manipulative
- Encourage real-world support when appropriate
- Acknowledge uncertainty where it exists
- Focus on practical wellness strategies when helpful

Remember: You are a wellness support tool, not a replacement for professional mental health care.`;

export const STANDARD_SYSTEM_PROMPT = `You are TalkEasy AI, a supportive mental-wellness companion. Your role is to provide calm, respectful, and non-judgmental conversational assistance.

You help users:
- Reflect on their thoughts and feelings
- Organize their mental space
- Consider practical wellness strategies
- Find appropriate support when needed

You are NOT:
- A therapist, doctor, or diagnostic system
- Able to prescribe medication or give medical advice
- A replacement for professional mental health care

Be supportive, calm, and respectful. Encourage real-world support when appropriate. Do not claim to be human or replace professional care.`;

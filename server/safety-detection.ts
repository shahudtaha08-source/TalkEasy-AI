// Safety detection and handling system
// This provides runtime safety guardrails independent of the AI model

import { eq } from "drizzle-orm";

export interface SafetyDetectionResult {
  isSafetyConcern: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskCategory: 'none' | 'self_harm' | 'suicide' | 'violence' | 'abuse' | 'other';
  confidence: number;
  suggestedAction: string;
  requiresImmediateIntervention: boolean;
}

export class SafetyDetector {
  // Patterns that indicate safety concerns
  private static readonly SELF_HARM_PATTERNS = [
    /\b(kill|end|take) myself\b/i,
    /\b(suicid|self.harm|self.harming)\b/i,
    /\b(hurt|harming|injur|injuring) myself\b/i,
    /\b(want to die|don't want to live)\b/i,
    /\b(end it all|end my life)\b/i,
    /\b(no reason to live|pointless|hopeless)\b/i,
    /\b(plan|planning|method|ways to) (kill|die|end)\b/i,
    // Hindi / Devanagari. TalkEasy ships Hindi, Hinglish and Roman Urdu, but
    // this list was previously English-only, so a Hindi user writing
    // "मैं जीने नहीं चाहता" ("I don't want to live") or "आत्महत्या" received no
    // crisis detection at all. JS \b does not fire around Devanagari, so these
    // match plain substrings.
    /(जीने नहीं चाहता)/,
    /(जीने की इच्छा नहीं)/,
    /(मर जाना|मरना चाहता|मर जाने)/,
    /(आत्महत्या|आत्म हत्या|सुकृत्या)/,
    /(खुद को (नुकसान|हानि|चोट) पहुंचा)/,
    /(स्वयं को (नुकसान|हानि) पहुंचा)/,
    /(खुद को (काट|मार)|स्वयं को (काट|मार))/,
    /(जीवन समाप्त|ज़िंदगी (खत्म|समाप्त))/,
    /(बिना मेरे (जीने|रहने))/,
    /(कोई कारण नहीं (जीने|रहने))/,
    // Hinglish (Latin script) - a very common input form for these users.
    /\bma(i|ko) (khud|self) (ko)? (maar|kat|nuksan)\b/i,
    /\b(jine|marne|jeena) nahi chahta\b/i,
    /\batmahatya\b/i,
    /\bkhatam karna hai\b/i,
    // Roman Urdu.
    /\b(marna|jeena) nahi chahta\b/i,
    /\b(khud|apne) (ko|apko) (qatil|mar)\b/i,
    /\b(intahar|atmaahatya)\b/i,
  ];

  private static readonly SUICIDE_INTENT_PATTERNS = [
    /\b(going to|planning to|about to) (kill|end|take) myself\b/i,
    /\b(have a plan|made a plan) to (kill|die|end)\b/i,
    /\b(ready to|going to) do it\b/i,
    /\b(goodbye|final|last) (message|note|time)\b/i,
  ];

  private static readonly IMMEDIATE_DANGER_PATTERNS = [
    /\b(right now|right here|immediately|tonight|today) (kill|die|end|hurt)\b/i,
    /\b(have|got|with me) (weapon|pills|knife|rope)\b/i,
    /\b(standing|sitting) on (edge|bridge|ledge)\b/i,
  ];

  private static readonly VIOLENCE_PATTERNS = [
    /\b(kill|murder|hurt) (someone|them|him|her)\b/i,
    /\b(hurt|harming|abuse) (others|people)\b/i,
  ];

  private static readonly HELP_SEEKING_PATTERNS = [
    /\b(need|want) help\b/i,
    /\b(can someone|please help)\b/i,
    /\b(don't know what to do)\b/i,
  ];

  static detectSafetyConcern(userMessage: string): SafetyDetectionResult {
    const message = userMessage.toLowerCase();
    
    // Check for immediate danger patterns first
    for (const pattern of this.IMMEDIATE_DANGER_PATTERNS) {
      if (pattern.test(message)) {
        return {
          isSafetyConcern: true,
          severity: 'critical',
          riskCategory: 'suicide',
          confidence: 0.9,
          suggestedAction: 'IMMEDIATE: Encourage emergency services (112) and move away from harm.',
          requiresImmediateIntervention: true,
        };
      }
    }

    // Check for suicide intent patterns
    for (const pattern of this.SUICIDE_INTENT_PATTERNS) {
      if (pattern.test(message)) {
        return {
          isSafetyConcern: true,
          severity: 'high',
          riskCategory: 'suicide',
          confidence: 0.85,
          suggestedAction: 'HIGH: Encourage professional help and trusted person contact.',
          requiresImmediateIntervention: true,
        };
      }
    }

    // Check for self-harm patterns
    for (const pattern of this.SELF_HARM_PATTERNS) {
      if (pattern.test(message)) {
        return {
          isSafetyConcern: true,
          severity: 'high',
          riskCategory: 'self_harm',
          confidence: 0.8,
          suggestedAction: 'HIGH: Provide crisis resources and encourage professional support.',
          requiresImmediateIntervention: true,
        };
      }
    }

    // Check for violence patterns
    for (const pattern of this.VIOLENCE_PATTERNS) {
      if (pattern.test(message)) {
        return {
          isSafetyConcern: true,
          severity: 'medium',
          riskCategory: 'violence',
          confidence: 0.7,
          suggestedAction: 'MEDIUM: De-escalate and encourage appropriate support.',
          requiresImmediateIntervention: false,
        };
      }
    }

    // Check for help-seeking patterns (lower severity)
    for (const pattern of this.HELP_SEEKING_PATTERNS) {
      if (pattern.test(message)) {
        return {
          isSafetyConcern: true,
          severity: 'low',
          riskCategory: 'other',
          confidence: 0.6,
          suggestedAction: 'LOW: Provide supportive response and resource information.',
          requiresImmediateIntervention: false,
        };
      }
    }

    return {
      isSafetyConcern: false,
      severity: 'low',
      riskCategory: 'none',
      confidence: 0.1,
      suggestedAction: 'None',
      requiresImmediateIntervention: false,
    };
  }

  static generateSafetyResponse(detection: SafetyDetectionResult, userLanguage: string = 'English'): string {
    const responses = {
      critical: {
        English: "I'm very concerned about what you're sharing. Please prioritize your safety right now:\n\n" +
                 "• If you're in immediate danger, please call emergency services: 112\n" +
                 "• For mental health support in India, call Tele-MANAS: 14416\n" +
                 "• Please move away from any means of harm\n" +
                 "• Try to be with a trusted person or move to a public/safe place\n" +
                 "• You are not alone - help is available and you deserve support\n\n" +
                 "Please reach out to emergency services or a crisis helpline right now.",
      },
      high: {
        English: "I'm concerned about what you're sharing, and I want you to be safe. Please consider:\n\n" +
                "• Contacting emergency services: 112\n" +
                "• Calling Tele-MANAS (India mental health helpline): 14416\n" +
                "• Reaching out to a trusted person in your life\n" +
                "• Moving to a safer environment if needed\n\n" +
                "You deserve support and there are people who want to help. Please consider reaching out to professional support or emergency services.",
      },
      medium: {
        English: "I hear that you're going through something difficult. Please consider:\n\n" +
                "• Talking to a trusted friend or family member\n" +
                "• Contacting a mental health professional\n" +
                "• Using crisis resources if needed (112 for emergency, 14416 for Tele-MANAS)\n\n" +
                "You don't have to handle this alone.",
      },
      low: {
        English: "I'm here to support you. It sounds like you're going through a difficult time. " +
                "I'm here to listen and help you think through things. Please remember that professional support " +
                "is available if you need it (112 for emergency, 14416 for Tele-MANAS in India).",
      },
    };

    return responses[detection.severity]?.[userLanguage as keyof typeof responses.critical] || 
           responses[detection.severity]?.English || 
           responses.low.English;
  }

  static getCrisisResources(userLanguage: string = 'English'): string {
    const resources = {
      English: "Emergency: 112\nTele-MANAS (India): 14416\nKiran Helpline: 1800-599-0019\n" +
                "Vandrevala Foundation: 1860-2662-345\niCall (TISS): 9152987821",
    };

    return resources[userLanguage as keyof typeof resources] || resources.English;
  }
}

// Safety event logger for database tracking
export interface SafetyEventLog {
  userId: string;
  eventType: 'safety_concern' | 'action_requested' | 'follow_up_pending' | 'follow_up_completed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
  actionRequested: string;
  followUpRequired: boolean;
  followUpCompleted: boolean;
}

export class SafetyEventLogger {
  static async logSafetyEvent(event: SafetyEventLog, db: any) {
    try {
      const { safetyEvents } = await import('@shared/schema');
      await db.insert(safetyEvents).values({
        userId: event.userId,
        eventType: event.eventType,
        severity: event.severity,
        notes: event.notes,
        actionRequested: event.actionRequested,
        followUpRequired: event.followUpRequired,
        followUpCompleted: event.followUpCompleted,
        followUpDate: event.followUpRequired ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null, // 24 hours later
      });
    } catch (error) {
      console.error('Failed to log safety event:', error);
    }
  }

  static async checkPendingFollowUps(userId: string, db: any): Promise<any[]> {
    try {
      const { safetyEvents } = await import('@shared/schema');
      const pendingFollowUps = await db
        .select()
        .from(safetyEvents)
        .where(eq(safetyEvents.userId, userId))
        .where(eq(safetyEvents.followUpRequired, true))
        .where(eq(safetyEvents.followUpCompleted, false));
      
      return pendingFollowUps;
    } catch (error) {
      console.error('Failed to check pending follow-ups:', error);
      return [];
    }
  }

  static async completeFollowUp(eventId: number, db: any) {
    try {
      const { safetyEvents } = await import('@shared/schema');
      await db
        .update(safetyEvents)
        .set({ followUpCompleted: true })
        .where(eq(safetyEvents.id, eventId));
    } catch (error) {
      console.error('Failed to complete follow-up:', error);
    }
  }
}

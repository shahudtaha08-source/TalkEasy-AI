/**
 * Rule-based wellness insights engine for TalkEasy v6.0
 * 
 * This provides deterministic, rule-based insights without AI.
 * Future v6.5/v7.0 will add AI-generated insights.
 */

export interface WellnessInsight {
  id: string;
  category: "stress" | "hydration" | "sleep" | "mood" | "activity" | "positive";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
  suggestion?: string;
}

export interface HealthRecord {
  heartRate?: number;
  spo2?: number;
  systolicBp?: number;
  diastolicBp?: number;
  steps?: number;
  sleepHours?: number;
  waterMl?: number;
  stressLevel?: string;
  mood?: string;
  moodIntensity?: number;
}

export interface InsightContext {
  healthRecords: HealthRecord[];
  moodEntries: { mood: string; intensity: number }[];
  stressEntries: { level: string }[];
  waterTargetMl?: number;
  sleepTargetHours?: number;
}

/**
 * Generate wellness insights based on user data
 */
export function generateWellnessInsights(context: InsightContext): WellnessInsight[] {
  const insights: WellnessInsight[] = [];
  const { healthRecords, moodEntries, stressEntries, waterTargetMl = 2500, sleepTargetHours = 8 } = context;

  // Stress insights
  const moderateHighStressCount = stressEntries.filter(e => e.level === "Moderate" || e.level === "High").length;
  const totalStressEntries = stressEntries.length;

  if (totalStressEntries > 0) {
    const stressRatio = moderateHighStressCount / totalStressEntries;
    
    if (stressRatio > 0.5) {
      insights.push({
        id: "stress-frequent",
        category: "stress",
        priority: "high",
        title: "Frequent Stress Detected",
        message: `You've recorded moderate or high stress on ${moderateHighStressCount} of ${totalStressEntries} tracked days.`,
        suggestion: "Consider incorporating stress management techniques like breathing exercises, short walks, or mindfulness meditation. If stress persists, consider speaking with a mental health professional.",
      });
    } else if (stressRatio > 0.3) {
      insights.push({
        id: "stress-occasional",
        category: "stress",
        priority: "medium",
        title: "Periodic Stress",
        message: `You've experienced moderate or high stress on ${moderateHighStressCount} days recently.`,
        suggestion: "Try to identify stress triggers and practice relaxation techniques. Taking short breaks throughout the day can help manage stress levels.",
      });
    }
  }

  // Hydration insights
  const lowWaterDays = healthRecords.filter(r => r.waterMl && r.waterMl < waterTargetMl).length;
  const totalWaterDays = healthRecords.filter(r => r.waterMl).length;

  if (totalWaterDays > 0) {
    const lowWaterRatio = lowWaterDays / totalWaterDays;
    
    if (lowWaterRatio > 0.6) {
      insights.push({
        id: "hydration-consistently-low",
        category: "hydration",
        priority: "high",
        title: "Hydration Below Target",
        message: `Your water intake has been below your target on ${lowWaterDays} of ${totalWaterDays} tracked days.`,
        suggestion: "Try drinking water regularly throughout the day. Keep a water bottle nearby and set reminders to drink water. Proper hydration supports overall wellness.",
      });
    } else if (lowWaterRatio > 0.3) {
      insights.push({
        id: "hydration-occasionally-low",
        category: "hydration",
        priority: "medium",
        title: "Occasional Low Hydration",
        message: `Your water intake was below target on ${lowWaterDays} days recently.`,
        suggestion: "Aim to drink water consistently. Try having a glass of water with each meal and snack.",
      });
    }
  }

  // Sleep insights
  const lowSleepDays = healthRecords.filter(r => r.sleepHours && r.sleepHours < sleepTargetHours).length;
  const totalSleepDays = healthRecords.filter(r => r.sleepHours).length;

  if (totalSleepDays > 0) {
    const lowSleepRatio = lowSleepDays / totalSleepDays;
    
    if (lowSleepRatio > 0.6) {
      insights.push({
        id: "sleep-consistently-low",
        category: "sleep",
        priority: "high",
        title: "Sleep Below Target",
        message: `Your sleep has been below your target on ${lowSleepDays} of ${totalSleepDays} tracked days.`,
        suggestion: "Establish a consistent sleep schedule. Try to go to bed and wake up at the same time each day. Avoid screens before bedtime and create a relaxing bedtime routine.",
      });
    } else if (lowSleepRatio > 0.3) {
      insights.push({
        id: "sleep-occasionally-low",
        category: "sleep",
        priority: "medium",
        title: "Occasional Low Sleep",
        message: `Your sleep was below target on ${lowSleepDays} days recently.`,
        suggestion: "Focus on getting adequate rest. Consider adjusting your bedtime to ensure you get enough sleep.",
      });
    }
  }

  // Mood insights
  const negativeMoods = moodEntries.filter(e => ["Sad", "Anxious", "Angry", "Overwhelmed", "Tired"].includes(e.mood));
  const positiveMoods = moodEntries.filter(e => ["Happy", "Calm", "Excited"].includes(e.mood));
  const totalMoods = moodEntries.length;

  if (totalMoods > 0) {
    const negativeRatio = negativeMoods.length / totalMoods;
    const positiveRatio = positiveMoods.length / totalMoods;

    if (negativeRatio > 0.5) {
      insights.push({
        id: "mood-frequently-negative",
        category: "mood",
        priority: "high",
        title: "Frequent Challenging Moods",
        message: `You've recorded challenging moods on ${negativeMoods.length} of ${totalMoods} entries.`,
        suggestion: "Consider journaling to process your thoughts, connecting with friends or family, or speaking with a mental health professional. It's okay to seek support.",
      });
    } else if (negativeRatio > 0.3) {
      insights.push({
        id: "mood-occasionally-negative",
        category: "mood",
        priority: "medium",
        title: "Periodic Challenging Moods",
        message: `You've experienced challenging moods on ${negativeMoods.length} days recently.`,
        suggestion: "Practice self-care and reach out to your support network when needed. Small activities like walking, reading, or listening to music can help.",
      });
    }

    if (positiveRatio > 0.6) {
      insights.push({
        id: "mood-positive-trend",
        category: "positive",
        priority: "low",
        title: "Positive Mood Trend",
        message: `You've recorded positive moods on ${positiveMoods.length} of ${totalMoods} entries.`,
        suggestion: "Great job! Continue activities that contribute to your positive mood. Sharing positive experiences with others can amplify their impact.",
      });
    }
  }

  // Activity insights (steps)
  const stepRecords = healthRecords.filter(r => r.steps);
  if (stepRecords.length > 0) {
    const avgSteps = stepRecords.reduce((sum, r) => sum + (r.steps || 0), 0) / stepRecords.length;
    
    if (avgSteps < 5000) {
      insights.push({
        id: "activity-low",
        category: "activity",
        priority: "medium",
        title: "Low Activity Level",
        message: `Your average daily steps are ${Math.round(avgSteps)}.`,
        suggestion: "Consider increasing daily activity. Short walks, taking stairs, or gentle stretching can help. Aim for gradual increases in activity.",
      });
    } else if (avgSteps < 7500) {
      insights.push({
        id: "activity-moderate",
        category: "activity",
        priority: "low",
        title: "Moderate Activity Level",
        message: `Your average daily steps are ${Math.round(avgSteps)}.`,
        suggestion: "You're doing well! Consider slightly increasing activity for additional wellness benefits.",
      });
    } else {
      insights.push({
        id: "activity-good",
        category: "positive",
        priority: "low",
        title: "Good Activity Level",
        message: `Your average daily steps are ${Math.round(avgSteps)}.`,
        suggestion: "Excellent! Maintaining regular physical activity supports overall wellness.",
      });
    }
  }

  // Sort insights by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights;
}

/**
 * Get a daily wellness suggestion based on current state
 */
export function getDailyWellnessSuggestion(context: InsightContext): string | null {
  const insights = generateWellnessInsights(context);
  const highPriorityInsights = insights.filter(i => i.priority === "high");
  
  if (highPriorityInsights.length > 0) {
    return highPriorityInsights[0].suggestion || null;
  }

  const mediumPriorityInsights = insights.filter(i => i.priority === "medium");
  if (mediumPriorityInsights.length > 0) {
    return mediumPriorityInsights[0].suggestion || null;
  }

  // Default suggestions if no concerning patterns
  const defaultSuggestions = [
    "Take a 5-minute breathing break to center yourself.",
    "Go for a short walk to refresh your mind.",
    "Stay hydrated—drink a glass of water now.",
    "Take a moment to appreciate something positive in your day.",
    "Consider journaling your thoughts to clear your mind.",
    "Practice a brief mindfulness exercise.",
    "Connect with a friend or family member today.",
    "Take regular breaks from screens to rest your eyes.",
  ];

  return defaultSuggestions[Math.floor(Math.random() * defaultSuggestions.length)];
}

/**
 * Curated wellness thoughts library (no AI)
 */
export const WELLNESS_THOUGHTS = [
  "A small pause can make the rest of the day feel a little lighter.",
  "You don't have to solve everything at once. Focus on the next small step.",
  "Progress, not perfection. Every small step counts.",
  "Your wellbeing matters. Taking care of yourself is not selfish.",
  "It's okay to not be okay sometimes. What matters is how you care for yourself.",
  "Be gentle with yourself. You're doing the best you can.",
  "Rest is productive. Recharging is part of the journey.",
  "Your feelings are valid. It's okay to feel whatever you're feeling.",
  "One day at a time. You've handled difficult days before, and you will again.",
  "Small consistent actions lead to meaningful change.",
  "You deserve kindness, especially from yourself.",
  "It's never too late to start something new or change direction.",
  "Your worth is not measured by productivity.",
  "Taking time to rest is not giving up—it's gathering strength.",
  "Comparison is the thief of joy. Focus on your own journey.",
  "You are stronger than you think.",
  "Every ending is also a beginning.",
  "Be present in this moment. The past is gone, the future hasn't arrived.",
  "Your mental health is just as important as your physical health.",
  "Growth happens outside your comfort zone, but comfort is necessary too.",
];

/**
 * Get a thought based on optional context (mood, stress, etc.)
 */
export function getThought(context?: { mood?: string; stressLevel?: string }): string {
  if (!context) {
    return WELLNESS_THOUGHTS[Math.floor(Math.random() * WELLNESS_THOUGHTS.length)];
  }

  const { mood, stressLevel } = context;

  // Mood-specific thoughts
  if (mood === "Sad" || mood === "Anxious" || mood === "Overwhelmed") {
    const supportiveThoughts = [
      "This feeling is temporary. You've gotten through difficult days before.",
      "Be gentle with yourself today. You don't have to carry everything alone.",
      "It's okay to ask for help. Strength includes knowing when to reach out.",
      "One breath at a time. That's all you need to do right now.",
    ];
    return supportiveThoughts[Math.floor(Math.random() * supportiveThoughts.length)];
  }

  if (mood === "Happy" || mood === "Excited" || mood === "Calm") {
    const positiveThoughts = [
      "Savor this moment. Positive energy is worth celebrating.",
      "Your positive mindset is a gift. Share it with others if you can.",
      "This feeling of wellness is your natural state. Remember it.",
    ];
    return positiveThoughts[Math.floor(Math.random() * positiveThoughts.length)];
  }

  if (stressLevel === "High" || stressLevel === "Moderate") {
    const stressThoughts = [
      "Stress is a signal, not a sentence. Listen to what it's telling you.",
      "You can't control everything, but you can control how you respond.",
      "Take a pause. Five minutes of breathing can change your perspective.",
    ];
    return stressThoughts[Math.floor(Math.random() * stressThoughts.length)];
  }

  // Default random thought
  return WELLNESS_THOUGHTS[Math.floor(Math.random() * WELLNESS_THOUGHTS.length)];
}

import { z } from 'zod';
import { insertMoodSchema, insertHabitSchema, insertJournalSchema, users, moods, habits, conversations, messages, journals } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  user: {
    get: {
      method: 'GET' as const,
      path: '/api/auth/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/user',
      input: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        ageGroup: z.string().optional(),
        preferredLanguage: z.string().optional(),
        emergencyContact: z.string().optional(),
        city: z.string().optional(),
        locality: z.string().optional(),
        budget: z.string().optional(),
        occupationType: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  moods: {
    list: {
      method: 'GET' as const,
      path: '/api/moods',
      responses: { 200: z.array(z.custom<typeof moods.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/moods',
      input: z.object({ mood: z.string(), notes: z.string().optional(), date: z.string().optional() }),
      responses: { 201: z.custom<typeof moods.$inferSelect>() }
    }
  },
  habits: {
    list: {
      method: 'GET' as const,
      path: '/api/habits',
      input: z.object({ date: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof habits.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/habits',
      input: z.object({ type: z.string(), completed: z.boolean(), notes: z.string().optional(), date: z.string().optional() }),
      responses: { 201: z.custom<typeof habits.$inferSelect>() }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/habits/:id',
      input: z.object({ completed: z.boolean().optional(), notes: z.string().optional() }),
      responses: { 200: z.custom<typeof habits.$inferSelect>() }
    }
  },
  journals: {
    list: {
      method: 'GET' as const,
      path: '/api/journals',
      responses: { 200: z.array(z.custom<typeof journals.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/journals',
      input: z.object({ title: z.string().optional(), content: z.string(), type: z.string().optional(), tags: z.string().optional(), date: z.string().optional() }),
      responses: { 201: z.custom<typeof journals.$inferSelect>() }
    }
  },
  chat: {
    list: {
      method: 'GET' as const,
      path: '/api/conversations',
      responses: { 200: z.array(z.custom<typeof conversations.$inferSelect>()) }
    },
    history: {
      method: 'GET' as const,
      path: '/api/conversations/:id/messages',
      responses: { 200: z.array(z.custom<typeof messages.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/conversations',
      input: z.object({ title: z.string() }),
      responses: { 201: z.custom<typeof conversations.$inferSelect>() }
    },
    sendMessage: {
      method: 'POST' as const,
      path: '/api/conversations/:id/messages',
      input: z.object({ content: z.string() }),
      responses: { 
        200: z.any() 
      }
    }
  },
  history: {
    emotional: {
      method: 'GET' as const,
      path: '/api/history/emotional',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          date: z.string(),
          type: z.enum(['mood', 'emotion', 'journal']),
          value: z.string(),
          suggestion: z.string().optional(),
          notes: z.string().optional(),
          tags: z.string().optional()
        }))
      }
    }
  },
  goals: {
    list: {
      method: 'GET' as const,
      path: '/api/goals',
      responses: { 200: z.array(z.any()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/goals',
      input: z.object({
        title: z.string(),
        description: z.string().optional(),
        focusArea: z.string(),
        target: z.number().optional(),
        unit: z.string().optional(),
        deadline: z.string().optional(),
      }),
      responses: { 201: z.any() }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/goals/:id',
      input: z.object({
        status: z.string().optional(),
        currentProgress: z.number().optional(),
        completedAt: z.string().optional(),
      }),
      responses: { 200: z.any() }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/goals/:id',
      responses: { 200: z.object({ success: z.boolean() }) }
    }
  },
  reflections: {
    prompts: {
      method: 'GET' as const,
      path: '/api/reflection-prompts',
      responses: { 200: z.array(z.any()) }
    },
    list: {
      method: 'GET' as const,
      path: '/api/reflection-responses',
      responses: { 200: z.array(z.any()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/reflection-responses',
      input: z.object({
        promptId: z.number(),
        response: z.string(),
        date: z.string().optional(),
      }),
      responses: { 201: z.any() }
    }
  },
  safetyPlan: {
    get: {
      method: 'GET' as const,
      path: '/api/safety-plan',
      responses: { 200: z.any() }
    },
    save: {
      method: 'POST' as const,
      path: '/api/safety-plan',
      input: z.object({
        trustedContacts: z.string().optional(),
        safePlaces: z.string().optional(),
        copingStrategies: z.string().optional(),
        groundingTechniques: z.string().optional(),
        reasonsToKeepGoing: z.string().optional(),
        professionalSupport: z.string().optional(),
        emergencyResources: z.string().optional(),
        notes: z.string().optional(),
      }),
      responses: { 200: z.any() }
    }
  },
  experiments: {
    list: {
      method: 'GET' as const,
      path: '/api/experiments',
      responses: { 200: z.array(z.any()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/experiments',
      input: z.object({
        type: z.string(),
        title: z.string(),
        objective: z.string().optional(),
        durationDays: z.number().optional(),
        target: z.number().optional(),
      }),
      responses: { 201: z.any() }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/experiments/:id',
      input: z.object({
        status: z.string().optional(),
      }),
      responses: { 200: z.any() }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

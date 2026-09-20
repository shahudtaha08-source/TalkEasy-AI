import { useState } from "react";
import {
  Book, Heart, BrainCircuit, Coffee, Moon, Zap, Shield, Flame,
  Star, Clock, ChevronRight, Bookmark, BookmarkCheck, ArrowRight
} from "lucide-react";
import { Link } from "wouter";

const ARTICLES = [
  {
    id: 1,
    slug: "stress-management-breathing-techniques",
    category: "Stress Management",
    title: "10 Breathing Techniques for Instant Calm",
    summary: "When stress strikes, your breath is your fastest tool. These science-backed techniques activate the parasympathetic nervous system and reduce cortisol within minutes.",
    readTime: "5 min",
    icon: Flame,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-900/50",
    content: `
## Understanding the Stress Response

When you're stressed, your body activates the "fight or flight" response. This increases cortisol, heart rate, and blood pressure. Breathing techniques can directly counteract this by activating the parasympathetic nervous system.

## 10 Science-Backed Breathing Techniques

### 1. Box Breathing (4-4-4-4)
- Inhale for 4 seconds
- Hold for 4 seconds
- Exhale for 4 seconds
- Hold empty for 4 seconds
- Repeat for 4-8 cycles

### 2. 4-7-8 Breathing
- Inhale for 4 seconds
- Hold for 7 seconds
- Exhale for 8 seconds
- Particularly effective for anxiety

### 3. Diaphragmatic Breathing
- Place one hand on chest, one on belly
- Breathe so only your belly hand moves
- Reduces shallow chest breathing

### 4. Alternate Nostril Breathing
- Close right nostril, inhale left
- Close left nostril, exhale right
- Reverse and repeat
- Balances nervous system

### 5. Resonant Breathing
- Breathe at 5-6 breaths per minute
- Find your personal resonant frequency
- Optimizes heart rate variability

### 6. Extended Exhale
- Make exhale longer than inhale
- Try 4-second inhale, 6-second exhale
- Activates relaxation response

### 7. Humming Breathing
- Hum while exhaling
- Vibration stimulates vagus nerve
- Creates natural relaxation

### 8. Body Scan Breathing
- Direct breath to tense areas
- Visualize tension releasing
- Combines mindfulness with breath

### 9. Ocean Breath (Ujjayi)
- Slight constriction in throat
- Creates soothing ocean sound
- Calms mind quickly

### 10. 5-5-5 Breathing
- Simple equal-count breathing
- Inhale 5, hold 5, exhale 5
- Easy to remember in stress

## When to Use These Techniques

- Before stressful situations
- During anxiety or panic
- To improve sleep
- To reset between tasks
- For general relaxation

## Important Notes

- These techniques complement, not replace, professional care
- If you have breathing difficulties, consult a healthcare provider
- Consistency matters more than complexity
- Start with 1-2 techniques and build from there

## References

Based on research from Harvard Medical School, American Institute of Stress, and clinical studies on respiratory biofeedback.
    `
  },
  {
    id: 2,
    slug: "understanding-anxiety-triggers",
    category: "Anxiety",
    title: "Understanding Your Anxiety Triggers",
    summary: "Anxiety often feels random, but it rarely is. Learn to identify the situations, thoughts, and patterns that bring on anxious feelings — and how to respond differently.",
    readTime: "8 min",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    border: "border-yellow-200 dark:border-yellow-900/50",
    content: `
## What Are Anxiety Triggers?

Anxiety triggers are specific situations, thoughts, or experiences that activate your body's stress response. Understanding yours is the first step to managing anxiety effectively.

## Common Types of Triggers

### Environmental Triggers
- Crowded spaces
- Loud noises
- Unfamiliar environments
- Certain times of day

### Social Triggers
- Public speaking
- Meeting new people
- Performance situations
- Conflict or confrontation

### Cognitive Triggers
- "What if" thinking
- Catastrophizing
- Perfectionism
- Overthinking

### Physical Triggers
- Caffeine
- Lack of sleep
- Hunger
- Certain medications

## Identifying Your Personal Triggers

### Keep a Trigger Journal
- Note what happened before anxiety
- Record your thoughts and feelings
- Identify patterns over time
- Rate intensity (1-10)

### The HALT Method
- **H**ungry: Physical needs
- **A**ngry: Emotional state
- **L**onely: Social connection
- **T**ired: Energy level

## Responding to Triggers

### Immediate Strategies
1. **Pause and recognize**: "This is a trigger, not danger"
2. **Ground yourself**: 5-4-3-2-1 technique
3. **Breathe**: Use your preferred breathing technique
4. **Challenge thoughts**: "Is this thought helpful or accurate?"

### Long-term Strategies
- **Gradual exposure**: Face triggers in small steps
- **Prepare coping strategies**: Plan before entering trigger situations
- **Build resilience**: Practice relaxation regularly
- **Seek support**: Don't face triggers alone

## When to Seek Professional Help

If triggers significantly impact your daily life, relationships, or work, consider speaking with a mental health professional. They can help you develop personalized strategies.

## Important Notes

- Identifying triggers doesn't mean avoiding everything
- Some anxiety is normal and healthy
- Progress takes time and practice
- Be patient with yourself in the process

## References

Based on cognitive behavioral therapy principles and anxiety research from leading mental health organizations.
    `
  },
  {
    id: 3,
    slug: "sleep-science-mental-health",
    category: "Sleep Hygiene",
    title: "The Science of Sleep and Mental Health",
    summary: "Poor sleep doesn't just make you tired. It affects memory, emotional regulation, and your ability to cope with stress. Discover what good sleep hygiene really looks like.",
    readTime: "6 min",
    icon: Moon,
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    border: "border-indigo-200 dark:border-indigo-900/50",
    content: `
## The Sleep-Mental Health Connection

Research consistently shows that sleep and mental health are deeply interconnected. Poor sleep can contribute to mental health issues, and mental health issues can disrupt sleep.

## How Sleep Affects Mental Health

### Emotional Regulation
- Sleep deprivation increases emotional reactivity
- Reduces ability to process emotions
- Increases irritability and mood swings

### Cognitive Function
- Impairs concentration and decision-making
- Reduces problem-solving abilities
- Affects memory consolidation

### Stress Response
- Increases cortisol levels
- Heightens stress sensitivity
- Reduces resilience to daily stressors

## Recommended Sleep Duration

- **Adults (18-64)**: 7-9 hours
- **Teenagers (14-17)**: 8-10 hours
- **Older adults (65+)**: 7-8 hours

## Sleep Hygiene Best Practices

### Environment
- Keep bedroom cool (65-68°F / 18-20°C)
- Maintain darkness (blackout curtains, eye mask)
- Reduce noise (white noise machine, earplugs)
- Invest in comfortable mattress and pillows

### Timing
- Consistent sleep schedule, even weekends
- Wake up at the same time daily
- Avoid napping after 3 PM
- Get morning sunlight exposure

### Pre-Sleep Routine
- Avoid screens 1-2 hours before bed
- Wind down with relaxing activities
- Keep bedroom for sleep only
- Avoid caffeine 6+ hours before bed

### Daytime Habits
- Regular exercise (but not close to bedtime)
- Morning sunlight exposure
- Avoid heavy meals before bed
- Limit alcohol and nicotine

## Common Sleep Disruptors

### Blue Light
- Screens emit blue light that suppresses melatonin
- Use blue light filters or "night mode"
- Consider blue light blocking glasses

### Caffeine
- Half-life is 5-6 hours
- Avoid after 2 PM for most people
- Be mindful of hidden sources (tea, chocolate)

### Stress
- Racing thoughts at bedtime
- Mindfulness or meditation can help
- Write down worries before bed

## When to Seek Help

If you consistently struggle with sleep despite good sleep hygiene, consider consulting a healthcare provider. Sleep disorders are treatable medical conditions.

## Important Notes

- Sleep needs vary by individual
- Quality matters as much as quantity
- It's never too late to improve sleep habits
- Small changes can make big differences

## References

Based on research from National Sleep Foundation, American Academy of Sleep Medicine, and clinical sleep studies.
    `
  },
  {
    id: 4,
    slug: "healthy-boundaries-without-guilt",
    category: "Relationships",
    title: "Setting Healthy Boundaries Without Guilt",
    summary: "Saying no is not selfish — it's sustainable. This article explores how to set boundaries clearly, compassionately, and with confidence in any relationship.",
    readTime: "7 min",
    icon: Heart,
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-900/50",
    content: `
## What Are Boundaries?

Boundaries are the limits and guidelines we establish to identify reasonable, safe, and permissible ways for other people to behave towards us and how we will respond when those limits are crossed.

## Why Boundaries Matter

### For Your Wellbeing
- Protects your mental and emotional energy
- Prevents resentment and burnout
- Maintains self-respect and identity
- Creates space for self-care

### For Relationships
- Builds trust and respect
- Clarifies expectations
- Reduces conflict and misunderstanding
- Allows relationships to be sustainable

## Common Boundary Challenges

### Guilt
- Feeling selfish for saying no
- Worrying about disappointing others
- Cultural or family expectations
- Fear of rejection

### People-Pleasing
- Difficulty saying no
- Overextending to gain approval
- Avoiding conflict at all costs
- Losing yourself in relationships

### Confusion
- Not knowing what you want
- Unclear about your limits
- Mixed messages from others
- Fear of being unreasonable

## Setting Boundaries Effectively

### Be Clear and Specific
- State your boundary directly
- Use "I" statements
- Avoid over-explaining or justifying
- Be consistent

### Start Small
- Practice with low-stakes situations
- Build confidence gradually
- Learn from each experience
- Adjust as needed

### Be Kind but Firm
- You can be both compassionate and firm
- Respect others' reactions
- Don't apologize for having boundaries
- Stay true to your values

## Types of Boundaries

### Time Boundaries
- "I need to leave by 8 PM"
- "I can't take on new projects right now"
- "I need alone time on weekends"

### Emotional Boundaries
- "I'm not comfortable discussing this"
- "I can't be your emotional support person"
- "I need space when I'm upset"

### Physical Boundaries
- "I need personal space"
- "I don't want to be touched right now"
- "I need you to step back"

### Digital Boundaries
- "I don't check work emails after 6 PM"
- "I don't text after 10 PM"
- "I need phone-free meals"

## Handling Boundary Pushback

### Stay Calm
- Don't get defensive
- Acknowledge their feelings
- Reiterate your boundary
- Don't over-explain

### Be Consistent
- Enforce boundaries consistently
- Don't make exceptions that confuse
- Let actions speak louder than words
- Trust that consistency builds respect

### Seek Support
- Talk to trusted friends
- Consider therapy if boundaries are consistently violated
- Join support groups
- Learn from others' experiences

## Important Notes

- Boundaries are about self-respect, not control
- Healthy relationships require boundaries
- It's okay to change boundaries as you grow
- Setting boundaries is a skill that improves with practice

## References

Based on boundary work in psychology, relationship counseling principles, and healthy relationship research.
    `
  },
  {
    id: 5,
    slug: "recovering-academic-burnout",
    category: "Burnout",
    title: "Recovering from Academic Burnout",
    summary: "If studying feels impossible and everything drags, you may be experiencing burnout. Here is how to identify it early and take structured steps toward recovery.",
    readTime: "10 min",
    icon: Coffee,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-900/50",
    content: `
## What Is Academic Burnout?

Academic burnout is a state of emotional, physical, and mental exhaustion caused by excessive and prolonged stress. It's characterized by feeling overwhelmed, cynical, and ineffective in your academic work.

## Signs of Academic Burnout

### Physical Symptoms
- Chronic fatigue and exhaustion
- Sleep disturbances
- Frequent illness
- Headaches or muscle tension

### Emotional Symptoms
- Feeling detached or cynical about studies
- Loss of motivation and interest
- Increased irritability or frustration
- Sense of failure or inadequacy

### Behavioral Symptoms
- Procrastination and avoidance
- Decreased academic performance
- Withdrawal from social activities
- Neglecting self-care

## Early Warning Signs

- Constantly feeling tired despite sleep
- Dread or anxiety about academic tasks
- Reduced satisfaction from achievements
- Increased criticism of yourself or others
- Feeling like nothing matters

## Recovery Strategies

### Immediate Steps

#### 1. Acknowledge and Accept
- Recognize that burnout is real
- Accept that you need to slow down
- Be kind to yourself about it
- Seek support if needed

#### 2. Rest and Recovery
- Take a short break from academics
- Prioritize sleep and nutrition
- Engage in non-academic activities
- Practice relaxation techniques

#### 3. Reassess Priorities
- What actually matters to you?
- Are your goals realistic?
- What can you realistically handle?
- What can wait or be dropped?

### Medium-Term Recovery

#### 4. Rebuild Gradually
- Start with small, manageable tasks
- Celebrate small wins
- Build momentum slowly
- Avoid perfectionism

#### 5. Improve Study Habits
- Use time management techniques
- Take regular breaks (Pomodoro)
- Create a supportive study environment
- Balance work with rest

#### 6. Seek Support
- Talk to professors or advisors
- Connect with classmates
- Consider counseling services
- Join study groups

### Long-Term Prevention

#### 7. Build Sustainable Habits
- Regular exercise and movement
- Consistent sleep schedule
- Healthy eating patterns
- Social connection and support

#### 8. Practice Self-Compassion
- Treat yourself with kindness
- Accept that mistakes are normal
- Focus on progress, not perfection
- Celebrate effort, not just outcomes

## When to Seek Professional Help

If burnout symptoms persist despite self-care efforts, or if you're experiencing depression, anxiety, or other mental health concerns, consider seeking professional support from a counselor or mental health provider.

## Important Notes

- Burnout is not a sign of weakness
- Recovery takes time and patience
- Your worth is not tied to academic performance
- Asking for help is a sign of strength
- Prevention is easier than recovery

## References

Based on burnout research in psychology, academic stress studies, and mental health best practices for students.
    `
  },
  {
    id: 6,
    slug: "sadness-beyond-feeling",
    category: "Depression",
    title: "When Sadness Becomes More Than a Feeling",
    summary: "It is normal to feel sad sometimes. But when sadness persists, steals your joy, and affects daily life, it deserves proper attention. Learn the signs and next steps.",
    readTime: "9 min",
    icon: BrainCircuit,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-900/50",
    content: `
## Sadness vs. Depression

Sadness is a normal human emotion that everyone experiences. Depression is a mental health condition that affects how you feel, think, and function. Understanding the difference is important.

## Normal Sadness

### Characteristics
- Triggered by specific events
- Comes and goes naturally
- Doesn't prevent daily functioning
- Allows for moments of happiness
- Relatively short-lived

### Coping Strategies
- Talk to someone you trust
- Engage in activities you enjoy
- Practice self-care
- Give yourself time
- Express your feelings

## Depression Warning Signs

### Emotional Changes
- Persistent sadness or emptiness
- Loss of interest in activities
- Feelings of hopelessness or worthlessness
- Irritability or frustration

### Physical Changes
- Changes in sleep (too much or too little)
- Changes in appetite (weight gain or loss)
- Fatigue or low energy
- Unexplained aches and pains

### Cognitive Changes
- Difficulty concentrating
- Indecisiveness
- Memory problems
- Negative thought patterns

### Behavioral Changes
- Withdrawal from social activities
- Neglecting responsibilities
- Reduction in performance
- Self-harm or suicidal thoughts

## When to Seek Help

### Immediate Help Needed
- Thoughts of self-harm or suicide
- Inability to care for yourself
- Extreme hopelessness
- Psychotic symptoms (hallucinations, delusions)

**Call emergency services: 112**

### Professional Help Recommended
- Symptoms persist for 2+ weeks
- Affecting daily life significantly
- Interfering with relationships or work
- You're concerned about your mental health

## Getting Help

### Start with Your Doctor
- Physical exam to rule out other causes
- Discussion of symptoms and history
- Referral to mental health specialist if needed

### Mental Health Professionals
- Psychiatrists (medical doctors)
- Psychologists (therapy and assessment)
- Licensed counselors
- Social workers

### Types of Treatment
- Psychotherapy (CBT, interpersonal therapy)
- Medication (if appropriate)
- Lifestyle changes
- Support groups

## Supporting Someone with Depression

### What to Do
- Listen without judgment
- Encourage professional help
- Offer practical support
- Check in regularly
- Take suicide threats seriously

### What to Avoid
- Saying "just cheer up" or "it could be worse"
- Minimizing their feelings
- Giving unsolicited advice
- Making them feel guilty
- Taking it personally

## Important Notes

- Depression is treatable
- Seeking help is a sign of strength
- You are not alone in this
- Recovery is possible
- Support is available

## Crisis Resources

- **Emergency**: 112
- **Tele-MANAS (India)**: 14416
- **Kiran Helpline**: 1800-599-0019
- **iCall (TISS)**: 9152987821

## References

Based on depression diagnostic criteria from DSM-5, mental health organization guidelines, and clinical depression research.
    `
  },
  {
    id: 7,
    slug: "building-discipline-motivation-fails",
    category: "Motivation",
    title: "How to Build Discipline When Motivation Fails",
    summary: "Motivation is fleeting. Discipline is a system. Discover practical strategies to maintain momentum in your studies, work, and personal goals even on your worst days.",
    readTime: "6 min",
    icon: Shield,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-900/50",
    content: `
## Understanding Motivation vs. Discipline

Motivation is the emotional drive to act - it comes and goes. Discipline is the commitment to act regardless of how you feel - it's reliable and sustainable.

## Why Motivation Fails

### Common Traps
- Waiting to "feel like it"
- Relying on inspiration
- Letting emotions dictate actions
- Seeking perfect conditions

### The Reality
- Motivation is inconsistent
- Willpower is a limited resource
- Life has inevitable ups and downs
- External factors affect our drive

## Building Discipline Systems

### 1. Make It Easy to Start
- Reduce friction to begin
- Use the 2-minute rule
- Prepare in advance
- Create supportive environment

### 2. Use Commitment Devices
- Accountability partners
- Public commitments
- Financial stakes
- Social contracts

### 3. Build Habits
- Start with small, consistent actions
- Use implementation intentions ("When X, I will Y")
- Stack new habits onto existing ones
- Focus on consistency, not intensity

### 4. Track Progress
- Measure what matters
- Celebrate small wins
- Review and adjust regularly
- Visual progress indicators

### 5. Plan for Failure
- Anticipate obstacles
- Have backup plans
- Forgive yourself quickly
- Get back on track immediately

## Practical Strategies

### The "Minimum Viable Action"
- What's the smallest step you can take?
- Lower the bar for bad days
- Momentum matters more than magnitude
- Something is better than nothing

### Environment Design
- Remove temptations and distractions
- Make good choices easier
- Use friction strategically
- Create visual cues

### Energy Management
- Work with your natural energy cycles
- Schedule difficult tasks appropriately
- Take regular breaks
- Respect your biological needs

### Social Accountability
- Study/work with others
- Share your goals
- Regular check-ins
- Celebrate together

## Mindset Shifts

### From "I Need Motivation" to "I Need Systems"
- Don't rely on feelings
- Build processes that work regardless
- Trust your systems over your moods
- Focus on long-term patterns

### From "All or Nothing" to "Consistent Imperfection"
- Imperfect action beats perfect inaction
- Progress over perfection
- Consistency compounds over time
- Be flexible with yourself

### From "Self-Criticism" to "Self-Compassion"
- Treat yourself as you would a friend
- Focus on learning, not failure
- Use setbacks as data
- Celebrate effort, not just outcomes

## When Discipline Feels Impossible

### Check Your Basics
- Are you getting enough sleep?
- Are you eating properly?
- Are you physically healthy?
- Are you overwhelmed?

### Reevaluate Your Goals
- Are they realistic?
- Do they still matter to you?
- Can they be broken down further?
- Is it time to pivot?

### Seek Support
- Talk to someone you trust
- Consider professional help if needed
- Join a community with similar goals
- Sometimes we need external accountability

## Important Notes

- Discipline is a skill, not a trait
- It takes time to build
- Be patient with yourself
- Progress is rarely linear
- Systems beat willpower

## References

Based on behavioral psychology research, habit formation studies, and self-discipline best practices.
    `
  },
  {
    id: 8,
    slug: "self-care-not-selfish",
    category: "Self-care",
    title: "Self-Care Is Not Selfish — Here Is Why",
    summary: "Rest, play, and personal care are not luxuries — they are necessities. Understand the evidence behind self-care and how small daily acts compound into resilience.",
    readTime: "5 min",
    icon: Star,
    color: "text-pink-500",
    bg: "bg-pink-50 dark:bg-pink-950/20",
    border: "border-pink-200 dark:border-pink-900/50",
    content: `
## What Self-Care Really Is

Self-care is the practice of taking action to preserve or improve one's own health. It's not just bubble baths and spa days - it's fundamental to wellbeing and sustainable performance.

## Why Self-Care Matters

### Physiological Benefits
- Reduces stress hormones
- Improves immune function
- Enhances cognitive performance
- Regulates emotions better

### Psychological Benefits
- Builds emotional resilience
- Prevents burnout
- Improves self-esteem
- Supports mental health

### Performance Benefits
- Increases productivity
- Enhances creativity
- Improves decision-making
- Sustains long-term motivation

## Common Myths

### Myth 1: "Self-Care Is Selfish"
- Reality: You can't pour from an empty cup
- Self-care enables you to care for others better
- It's modeling healthy behavior for those around you

### Myth 2: "Self-Care Is Indulgent"
- Reality: It's maintenance, not luxury
- Exercise, sleep, and healthy eating are self-care
- It's about functioning optimally

### Myth 3: "Self-Care Is Time-Consuming"
- Reality: Small acts compound over time
- 5 minutes of meditation daily adds up
- Consistency beats duration

### Myth 4: "Self-Care Is Only for People with Problems"
- Reality: Everyone needs self-care
- Prevention is better than treatment
- High performers often prioritize self-care

## Types of Self-Care

### Physical Self-Care
- Regular exercise
- Adequate sleep
- Healthy nutrition
- Regular health check-ups

### Emotional Self-Care
- Therapy or counseling
- Journaling
- Mindfulness meditation
- Setting boundaries

### Mental Self-Care
- Learning new skills
- Reading
- Puzzles and brain games
- Creative expression

### Social Self-Care
- Nurturing relationships
- Setting social boundaries
- Joining communities
- Asking for help

### Spiritual Self-Care
- Meditation or prayer
- Spending time in nature
- Reflecting on values
- Gratitude practice

## Practical Self-Care Strategies

### Daily Micro-Practices
- 5-minute morning stretch
- Deep breathing between tasks
- Taking actual lunch breaks
- Evening wind-down routine

### Weekly Practices
- Exercise sessions
- Social activities
- Hobby time
- Digital detox periods

### Monthly Practices
- Health check-ins
- Goal reviews
- Relationship maintenance
- Adventure or novelty

### Seasonal Practices
- Vacation time
- Skill development
- Reflection and planning
- Deep cleaning and organization

## Overcoming Self-Care Barriers

### "I Don't Have Time"
- Start with 5-minute practices
- Schedule it like any important appointment
- Combine activities (walk + call friend)
- Remember: self-care saves time in the long run

### "I Feel Guilty"
- Reframe as necessary maintenance
- Consider the alternative (burnout, illness)
- Model healthy behavior for others
- Remember: you deserve care

### "I Don't Know What to Do"
- Start with basics: sleep, food, movement
- Try different activities and see what feels good
- Ask others what they do
- Listen to your body and preferences

### "It Feels Self-Indulgent"
- Focus on function, not luxury
- Consider the long-term benefits
- Start with evidence-based practices
- Remember: maintenance isn't indulgence

## Building Sustainable Self-Care

### Start Small
- Choose 1-2 practices to start
- Focus on consistency over intensity
- Build habits gradually
- Add more as habits solidify

### Make It Enjoyable
- Choose activities you actually like
- Experiment with different approaches
- Socialize your self-care
- Track how you feel after practices

### Be Flexible
- Adjust based on energy and schedule
- Have backup options for different situations
- Scale up or down as needed
- Listen to your changing needs

### Track and Adjust
- Note how different practices affect you
- Adjust based on results
- Keep what works, change what doesn't
- Celebrate your progress

## Important Notes

- Self-care is personal and individual
- What works for others may not work for you
- It's okay to experiment and adjust
- Self-care needs change over time
- Small acts compound into significant benefits

## References

Based on self-care research in psychology, burnout prevention studies, and wellbeing science.
    `
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(ARTICLES.map(a => a.category)))];

export { ARTICLES };
export default function Resources() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [favorites, setFavorites] = useState<number[]>([]);

  const filtered = activeCategory === "All"
    ? ARTICLES
    : ARTICLES.filter(a => a.category === activeCategory);

  const toggleFav = (id: number) =>
    setFavorites(fs => fs.includes(id) ? fs.filter(f => f !== id) : [...fs, id]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header>
        <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Book className="w-8 h-8 text-indigo-500" /> Wellness Resources
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          Curated articles on mental wellbeing. Educational content only — not a substitute for professional support.
        </p>
      </header>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-sm font-medium px-4 py-2 rounded-full transition ${
              activeCategory === cat
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(article => {
          const Icon = article.icon;
          const isFav = favorites.includes(article.id);

          return (
            <div
              key={article.id}
              className={`glass-card rounded-2xl overflow-hidden border ${article.border} hover:shadow-md transition-shadow group`}
            >
              <div className={`${article.bg} px-5 pt-5 pb-4`}>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${article.color}`} />
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${article.color}`}>
                      {article.category}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleFav(article.id)}
                    aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                      isFav ? "text-yellow-500" : "text-slate-400 hover:text-yellow-500"
                    }`}
                  >
                    {isFav ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mt-3 leading-snug">
                  {article.title}
                </h3>
              </div>

              <div className="p-5">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                  {article.summary}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {article.readTime} read
                  </div>
                  <Link
                    href={`/resources/${article.slug}`}
                    className="flex items-center gap-1.5 text-sm font-semibold transition text-indigo-600 hover:underline"
                  >
                    Read More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 text-sm text-amber-700 dark:text-amber-300 text-center">
        These articles are for educational purposes only. TalkEasy does not diagnose mental illness or replace licensed professionals.
      </div>
    </div>
  );
}
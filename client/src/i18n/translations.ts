export type LanguageCode = "English" | "Hindi" | "Urdu" | "Marathi" | "Tamil" | "Telugu" | "Malayalam" | "Kannada" | "Bengali" | "Gujarati";

export interface Translations {
  appName: string;
  tagline: string;
  dashboard: string;
  supportChat: string;
  aiTherapist: string;
  aiTherapistBadge: string;
  journal: string;
  moodTracker: string;
  habits: string;
  statistics: string;
  emotionalHistory: string;
  resources: string;
  findHelp: string;
  settings: string;
  login: string;
  signup: string;
  logout: string;
  demoMode: string;
  exitDemo: string;
  developedBy: string;
  leadDev: string;
  coDev: string;
  institution: string;
  disclaimerText: string;
  therapistComingSoonTitle: string;
  therapistComingSoonDesc: string;
  therapistNextVersion: string;
  landingHeroTitle: string;
  landingHeroSubtitle: string;
  landingHeroDesc: string;
  signInBtn: string;
  tryDemoBtn: string;
  platformFeatures: string;
  meetTheDevelopers: string;
  loginTitle: string;
  signupTitle: string;
  emailLabel: string;
  usernameLabel: string;
  passwordLabel: string;
  firstNameLabel: string;
  lastNameLabel: string;
  ageGroupLabel: string;
  preferredLanguageLabel: string;
  noAccountText: string;
  alreadyHaveAccountText: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  wellnessOverview: string;
  needSomeoneToTalk: string;
  startConversation: string;
  todaysMood: string;
  logNow: string;
  dailyHabits: string;
  progress: string;
  viewAll: string;
  recentJournal: string;
  writeFirstEntry: string;
  patternInsights: string;
  quickActions: string;
  recentActivity: string;
  moodTrackerTitle: string;
  moodTrackerSubtitle: string;
  loggedToday: string;
  feelingText: string;
  happy: string;
  neutral: string;
  sad: string;
  stressed: string;
  anxious: string;
  angry: string;
  saveMood: string;
  recentMoods: string;
  habitTrackerTitle: string;
  habitTrackerSubtitle: string;
  sleepHabit: string;
  waterHabit: string;
  exerciseHabit: string;
  meditationHabit: string;
  journalHabit: string;
  addHabit: string;
  completed: string;
  journalTitle: string;
  journalSubtitle: string;
  newJournalEntry: string;
  journalTitleLabel: string;
  journalContentLabel: string;
  journalTagsLabel: string;
  saveJournal: string;
  chatTitle: string;
  chatSubtitle: string;
  typeMessagePlaceholder: string;
  send: string;
  teleManasNotice: string;
  findHelpTitle: string;
  findHelpSubtitle: string;
  emergencyHelplines: string;
  resourcesTitle: string;
  settingsTitle: string;
  settingsSubtitle: string;
  personalDetails: string;
  emergencyContactLabel: string;
  cityLabel: string;
  saveSettings: string;
  teen: string;
  youngAdult: string;
  adult: string;
  senior: string;
  anyThoughtsLabel: string;
  thoughtsPlaceholder: string;
  todaysGoals: string;
  noHabitsToday: string;
  customHabitPlaceholder: string;
  suggestions: string;
  trackingAllHabits: string;
  contentRequired: string;
  entryUpdated: string;
  entrySaved: string;
  failedToUpdate: string;
  failedToSave: string;
  entryDeleted: string;
  failedToDelete: string;
  deleteEntryConfirm: string;
  editEntry: string;
  writeEntry: string;
  noEntriesYet: string;
  noEntriesMatchFilters: string;
  startWritingFirstEntry: string;
  tryAdjustingFilters: string;
  searchJournals: string;
  allTags: string;
  writeThoughtsPlaceholder: string;
  journalTypeReflection: string;
  journalTypeGratitude: string;
  journalTypeDaily: string;
  journalTypeFree: string;
  statisticsTitle: string;
  statisticsSubtitle: string;
  moodTrendChart: string;
  habitCompletionChart: string;
  completionRate: string;
  moodLabel: string;
  startSupportiveConversation: string;
  supportChatDescription: string;
  updateEntryDesc: string;
  createEntryDesc: string;
  entryTitlePlaceholder: string;
  tagsPlaceholder: string;
  cancel: string;
}

const english: Translations = {
  appName: "TalkEasy", tagline: "A professional Mental Wellness Platform", dashboard: "Dashboard", supportChat: "Support Chat", aiTherapist: "Support Chat", aiTherapistBadge: "Coming Soon", journal: "Personal Journal", moodTracker: "Mood Tracker", habits: "Habit Builder", statistics: "Statistics", emotionalHistory: "Emotional History", resources: "Resources", findHelp: "Find Help", settings: "Settings", login: "Sign In", signup: "Register", logout: "Logout", demoMode: "Demo Mode", exitDemo: "Exit Demo", developedBy: "Developed by Taha Shahud & Praneet Gholap", leadDev: "Creator & Lead Developer", coDev: "Co-Developer", institution: "School of Engineering and Technology", disclaimerText: "TalkEasy supports emotional wellbeing. It does not diagnose mental illnesses and does not replace licensed psychologists, psychiatrists or emergency services.", therapistComingSoonTitle: "Support Chat — Coming Soon", therapistComingSoonDesc: "Support Chat is currently under development. We are working on making TalkEasy safe, reliable and meaningful before its official release.", therapistNextVersion: "Support Chat will be available in the next TalkEasy version.", landingHeroTitle: "TalkEasy AI", landingHeroSubtitle: "A calm, personal space for your emotional wellbeing.", landingHeroDesc: "Track moods, journal reflections, build habits, discover emotional patterns, and find human support — all in one safe experience.", signInBtn: "Sign In / Register", tryDemoBtn: "Try Demo Mode", platformFeatures: "Platform Features", meetTheDevelopers: "Meet the Developers", loginTitle: "Welcome Back", signupTitle: "Create Your Account", emailLabel: "Email Address", usernameLabel: "Username", passwordLabel: "Password", firstNameLabel: "First Name", lastNameLabel: "Last Name", ageGroupLabel: "Age Group", preferredLanguageLabel: "Preferred Language", noAccountText: "Don't have an account? Sign Up", alreadyHaveAccountText: "Already have an account? Sign In", goodMorning: "Good morning", goodAfternoon: "Good afternoon", goodEvening: "Good evening", wellnessOverview: "Here is your wellness overview for today.", needSomeoneToTalk: "Need someone to talk?", startConversation: "Start Conversation", todaysMood: "Today's Mood", logNow: "Log now", dailyHabits: "Daily Habits", progress: "Progress", viewAll: "View all", recentJournal: "Recent Journal", writeFirstEntry: "Write your first entry", patternInsights: "Pattern Insights", quickActions: "Quick Actions", recentActivity: "Recent Activity", moodTrackerTitle: "Mood Tracker", moodTrackerSubtitle: "Check in with yourself. How are you feeling today?", loggedToday: "You've logged your mood today!", feelingText: "Feeling", happy: "Happy", neutral: "Neutral", sad: "Sad", stressed: "Stressed", anxious: "Anxious", angry: "Angry", saveMood: "Save Daily Mood", recentMoods: "Recent Moods", habitTrackerTitle: "Habit Builder", habitTrackerSubtitle: "Build small daily routines that support your emotional health.", sleepHabit: "Sleep 7+ Hours", waterHabit: "Stay Hydrated (2L)", exerciseHabit: "Physical Exercise", meditationHabit: "Mindful Meditation", journalHabit: "Journal Entry", addHabit: "Add Habit", completed: "Completed", journalTitle: "Personal Journal", journalSubtitle: "Reflect on your thoughts, gratitude, and daily experiences.", newJournalEntry: "New Journal Entry", journalTitleLabel: "Title", journalContentLabel: "Content", journalTagsLabel: "Tags (comma separated)", saveJournal: "Save Entry", chatTitle: "Support Chat", chatSubtitle: "This feature is currently under development and will be available in the next TalkEasy version.", typeMessagePlaceholder: "Support Chat is coming soon...", send: "Send", teleManasNotice: "Tele MANAS helpline: 14416 (24/7 Toll-Free)", findHelpTitle: "Find Help & Crisis Helplines", findHelpSubtitle: "Professional psychologists, emergency helplines, and support services.", emergencyHelplines: "24/7 Emergency Helplines", resourcesTitle: "Self-Care & Wellbeing Resources", settingsTitle: "Settings", settingsSubtitle: "Manage your profile, preferences, and emergency contacts.", personalDetails: "Personal Details", emergencyContactLabel: "Emergency Contact", cityLabel: "City / Locality", saveSettings: "Save Settings", teen: "Teen (13-19)", youngAdult: "Young Adult (20-35)", adult: "Adult (36-55)", senior: "Senior (55+)", anyThoughtsLabel: "Any thoughts? (Optional)", thoughtsPlaceholder: "What made you feel this way? Or just journal your day...", todaysGoals: "Today's Goals", noHabitsToday: "No habits added for today yet.", customHabitPlaceholder: "Type a custom habit...", suggestions: "Suggestions", trackingAllHabits: "You're tracking all standard habits!", contentRequired: "Content is required.", entryUpdated: "Entry updated.", entrySaved: "Entry saved.", failedToUpdate: "Failed to update.", failedToSave: "Failed to save.", entryDeleted: "Entry deleted.", failedToDelete: "Failed to delete.", deleteEntryConfirm: "Delete this entry?", editEntry: "Edit Entry", writeEntry: "Write Entry", noEntriesYet: "No entries yet", noEntriesMatchFilters: "No entries match your filters", startWritingFirstEntry: "Start writing your first journal entry.", tryAdjustingFilters: "Try adjusting the search or filters.", searchJournals: "Search journals…", allTags: "All Tags", writeThoughtsPlaceholder: "Write your thoughts here…", journalTypeReflection: "🪞 Reflection", journalTypeGratitude: "🙏 Gratitude", journalTypeDaily: "📅 Daily Journal", journalTypeFree: "✍️ Free Writing", statisticsTitle: "Statistics & Insights", statisticsSubtitle: "Visualize your mental wellness journey over time.", moodTrendChart: "Mood Trend (Last 7 Days)", habitCompletionChart: "Habit Completion Rates", completionRate: "Completion Rate", moodLabel: "Mood", startSupportiveConversation: "Start a supportive conversation to reflect, organize your thoughts and receive practical wellness guidance.", supportChatDescription: "Support Chat is under development and will be available in the next TalkEasy version.", updateEntryDesc: "Update your journal entry", createEntryDesc: "Create a new journal entry", entryTitlePlaceholder: "Entry title...", tagsPlaceholder: "Tags (comma separated)...", cancel: "Cancel"
};

export const translations: Record<LanguageCode, Translations> = {
  English: english,
  Hindi: { ...english, dashboard: "डैशबोर्ड", supportChat: "सहायता चैट", aiTherapist: "सहायता चैट", aiTherapistBadge: "जल्द आ रहा है", journal: "व्यक्तिगत जर्नल", moodTracker: "मूड ट्रैकर", habits: "आदतें", statistics: "आंकड़े", emotionalHistory: "भावनात्मक इतिहास", resources: "संसाधन", findHelp: "मदद पाएं", settings: "सेटिंग्स", login: "साइन इन", signup: "पंजीकरण करें", logout: "लॉगआउट", therapistComingSoonTitle: "सहायता चैट — जल्द आ रहा है", therapistComingSoonDesc: "सहायता चैट वर्तमान में विकास के अधीन है।", therapistNextVersion: "सहायता चैट अगले TalkEasy संस्करण में उपलब्ध होगी।", chatTitle: "सहायता चैट", chatSubtitle: "यह सुविधा वर्तमान में विकास के अधीन है और अगले TalkEasy संस्करण में उपलब्ध होगी।" },
  Urdu: { ...english, dashboard: "ڈیش بورڈ", supportChat: "سپورٹ چیٹ", aiTherapist: "سپورٹ چیٹ", aiTherapistBadge: "جلد آ رہا ہے", journal: "ذاتی جرنل", moodTracker: "موڈ ٹریکر", habits: "عادات", statistics: "اعداد و شمار", emotionalHistory: "جذباتی تاریخ", resources: "وسائل", findHelp: "مدد حاصل کریں", settings: "ترتیبات", login: "سائن اِن", signup: "رجسٹر", logout: "لاگ آؤٹ", therapistComingSoonTitle: "سپورٹ چیٹ — جلد آ رہا ہے", therapistComingSoonDesc: "سپورٹ چیٹ فی الحال زیرِ تعمیر ہے۔", therapistNextVersion: "سپورٹ چیٹ اگلے TalkEasy ورژن میں دستیاب ہوگی۔", chatTitle: "سپورٹ چیٹ", chatSubtitle: "یہ فیچر فی الحال زیرِ تعمیر ہے اور اگلے TalkEasy ورژن میں دستیاب ہوگا۔" },
  Marathi: { ...english, dashboard: "डॅशबोर्ड", supportChat: "सपोर्ट चॅट", aiTherapist: "सपोर्ट चॅट", aiTherapistBadge: "लवकरच", journal: "वैयक्तिक जर्नल", moodTracker: "मूड ट्रॅकर", habits: "सवयी", statistics: "आकडेवारी", emotionalHistory: "भावनिक इतिहास", resources: "संसाधने", findHelp: "मदत मिळवा", settings: "सेटिंग्ज", login: "साइन इन", signup: "नोंदणी", logout: "लॉगआउट", therapistComingSoonTitle: "सपोर्ट चॅट — लवकरच", therapistComingSoonDesc: "सपोर्ट चॅट सध्या विकासाधीन आहे.", therapistNextVersion: "सपोर्ट चॅट पुढील TalkEasy आवृत्तीत उपलब्ध होईल.", chatTitle: "सपोर्ट चॅट", chatSubtitle: "हे फीचर सध्या विकासाधीन आहे आणि पुढील TalkEasy आवृत्तीत उपलब्ध होईल." },
  Tamil: { ...english, dashboard: "டாஷ்போர்டு", supportChat: "ஆதரவு அரட்டை", aiTherapist: "ஆதரவு அரட்டை", aiTherapistBadge: "விரைவில்", journal: "தனிப்பட்ட குறிப்பேடு", moodTracker: "மனநிலை கண்காணிப்பு", habits: "பழக்கங்கள்", statistics: "புள்ளிவிவரங்கள்", emotionalHistory: "உணர்ச்சி வரலாறு", resources: "வளங்கள்", findHelp: "உதவி பெறுங்கள்", settings: "அமைப்புகள்", therapistComingSoonTitle: "ஆதரவு அரட்டை — விரைவில்", therapistComingSoonDesc: "ஆதரவு அரட்டை தற்போது உருவாக்கத்தில் உள்ளது.", therapistNextVersion: "ஆதரவு அரட்டை அடுத்த TalkEasy பதிப்பில் கிடைக்கும்.", chatTitle: "ஆதரவு அரட்டை", chatSubtitle: "இந்த அம்சம் தற்போது உருவாக்கத்தில் உள்ளது மற்றும் அடுத்த TalkEasy பதிப்பில் கிடைக்கும்." },
  Telugu: { ...english, dashboard: "డాష్‌బోర్డ్", supportChat: "సపోర్ట్ చాట్", aiTherapist: "సపోర్ట్ చాట్", aiTherapistBadge: "త్వరలో", journal: "వ్యక్తిగత జర్నల్", moodTracker: "మూడ్ ట్రాకర్", habits: "అలవాట్లు", statistics: "గణాంకాలు", emotionalHistory: "భావోద్వేగ చరిత్ర", resources: "వనరులు", findHelp: "సహాయం పొందండి", settings: "సెట్టింగ్‌లు", therapistComingSoonTitle: "సపోర్ట్ చాట్ — త్వరలో", therapistComingSoonDesc: "సపోర్ట్ చాట్ ప్రస్తుతం అభివృద్ధిలో ఉంది.", therapistNextVersion: "సపోర్ట్ చాట్ తదుపరి TalkEasy వెర్షన్‌లో అందుబాటులో ఉంటుంది.", chatTitle: "సపోర్ట్ చాట్", chatSubtitle: "ఈ ఫీచర్ ప్రస్తుతం అభివృద్ధిలో ఉంది మరియు తదుపరి TalkEasy వెర్షన్‌లో అందుబాటులో ఉంటుంది." },
  Malayalam: { ...english, dashboard: "ഡാഷ്ബോർഡ്", supportChat: "സപ്പോർട്ട് ചാറ്റ്", aiTherapist: "സപ്പോർട്ട് ചാറ്റ്", aiTherapistBadge: "ഉടൻ വരുന്നു", journal: "വ്യക്തിഗത ജേർണൽ", moodTracker: "മൂഡ് ട്രാക്കർ", habits: "ശീലങ്ങൾ", statistics: "സ്ഥിതിവിവരക്കണക്കുകൾ", emotionalHistory: "വികാര ചരിത്രം", resources: "വിഭവങ്ങൾ", findHelp: "സഹായം നേടുക", settings: "ക്രമീകരണങ്ങൾ", therapistComingSoonTitle: "സപ്പോർട്ട് ചാറ്റ് — ഉടൻ വരുന്നു", therapistComingSoonDesc: "സപ്പോർട്ട് ചാറ്റ് ഇപ്പോൾ വികസനത്തിലാണ്.", therapistNextVersion: "സപ്പോർട്ട് ചാറ്റ് അടുത്ത TalkEasy പതിപ്പിൽ ലഭ്യമാകും.", chatTitle: "സപ്പോർട്ട് ചാറ്റ്", chatSubtitle: "ഈ ഫീച്ചർ ഇപ്പോൾ വികസനത്തിലാണ്, അടുത്ത TalkEasy പതിപ്പിൽ ലഭ്യമാകും." },
  Kannada: english,
  Bengali: english,
  Gujarati: english,
};

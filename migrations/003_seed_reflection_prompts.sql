-- Seed reflection prompts
INSERT INTO reflection_prompts (id, prompt, category) VALUES (1, 'What brought me joy today?', 'daily') ON CONFLICT (id) DO UPDATE SET prompt=EXCLUDED.prompt, category=EXCLUDED.category;
INSERT INTO reflection_prompts (id, prompt, category) VALUES (2, 'What is one small thing I am grateful for right now?', 'daily') ON CONFLICT (id) DO UPDATE SET prompt=EXCLUDED.prompt, category=EXCLUDED.category;
INSERT INTO reflection_prompts (id, prompt, category) VALUES (3, 'What challenged me today and how did I respond?', 'daily') ON CONFLICT (id) DO UPDATE SET prompt=EXCLUDED.prompt, category=EXCLUDED.category;
INSERT INTO reflection_prompts (id, prompt, category) VALUES (4, 'What is one thing I learned today?', 'daily') ON CONFLICT (id) DO UPDATE SET prompt=EXCLUDED.prompt, category=EXCLUDED.category;
INSERT INTO reflection_prompts (id, prompt, category) VALUES (5, 'What would I tell my future self right now?', 'daily') ON CONFLICT (id) DO UPDATE SET prompt=EXCLUDED.prompt, category=EXCLUDED.category;
INSERT INTO reflection_prompts (id, prompt, category) VALUES (6, 'What boundary did I honor today?', 'daily') ON CONFLICT (id) DO UPDATE SET prompt=EXCLUDED.prompt, category=EXCLUDED.category;
INSERT INTO reflection_prompts (id, prompt, category) VALUES (7, 'What is weighing on my mind, and what is within my control?', 'daily') ON CONFLICT (id) DO UPDATE SET prompt=EXCLUDED.prompt, category=EXCLUDED.category;
INSERT INTO reflection_prompts (id, prompt, category) VALUES (8, 'What moment made me feel calm or safe today?', 'daily') ON CONFLICT (id) DO UPDATE SET prompt=EXCLUDED.prompt, category=EXCLUDED.category;
INSERT INTO reflection_prompts (id, prompt, category) VALUES (9, 'What is one act of kindness I gave or received today?', 'daily') ON CONFLICT (id) DO UPDATE SET prompt=EXCLUDED.prompt, category=EXCLUDED.category;
INSERT INTO reflection_prompts (id, prompt, category) VALUES (10, 'What is something I am looking forward to this week?', 'daily') ON CONFLICT (id) DO UPDATE SET prompt=EXCLUDED.prompt, category=EXCLUDED.category;

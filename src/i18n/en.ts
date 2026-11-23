export const EN_COPY = {
  brandTagline: 'A quiet corner for a heavy heart. Anonymous. Non-judgmental. Ad-free.',
  crisisButtonLabel: 'Need help now',
  betaNotice:
    'This is Heali closed beta. Some community spaces keep active safety moderation on; if anything feels overwhelming or unclear, please leave anonymous feedback under Privacy & Safety.',
  promises: [
    'Safety: crisis support is always one tap away.',
    'Honesty: no fake numbers, no promises an app cannot keep.',
    'Respect: your private writing stays yours — never sold and never monetized.',
  ],
  onboarding: {
    skipLabel: 'Skip',
    nextLabel: 'Continue',
    finishLabel: 'Enter your quiet space',
    step1Title: 'Welcome to Heali',
    step1Subtitle:
      'A calm space when your heart feels heavy. Heali is not a doctor or therapist — just a quiet bench where you can pause and gather your thoughts.',
    step2Title: 'What do you need most right now?',
    step2Subtitle:
      'Your choice only suggests 1–2 gentle starting actions at the top — nothing is hidden.',
    needs: [
      {
        id: 'release' as const,
        title: 'Let it out',
        desc: 'Write a private journal entry or an unsent letter.',
      },
      {
        id: 'calm' as const,
        title: 'Settle down',
        desc: 'Slow breathing, 5-4-3-2-1 grounding, or soft rain sounds.',
      },
      {
        id: 'together' as const,
        title: 'Quiet company',
        desc: 'Read gentle anonymous reflections in a moderated space.',
      },
      {
        id: 'quiet' as const,
        title: 'Just stillness',
        desc: 'Sit by the lantern lake without needing to speak or type.',
      },
    ],
    step3Title: 'Support and privacy remain in your hands',
    step3Bullets: [
      'The "Need help now" button stays anchored at the top of every screen for one-tap access.',
      'Use completely anonymously, lock with a PIN, export all your data, or permanently delete your account anytime.',
      'Choosing "Burn / Erase permanently" on an unsent letter truly removes its content from the server.',
    ],
  },
  navGroups: {
    self: 'For myself',
    calm: 'Settle down',
    community: 'With others',
    explore: 'Explore',
  },
  moodCheckin: {
    heading: 'How are things feeling right now?',
    lowMoodSupport:
      'Today feels very heavy. You do not have to force anything right now. If you want, here are a few small things that might help steady this moment.',
    recordedNeutral: 'Saved this check-in privately for you.',
    breatheCta: 'Breathe for 1 minute',
    writeCta: 'Write a few lines',
    helpCta: 'I want to talk to someone',
    weeklySummaryPrefix: 'This week you paused',
    weeklySummarySuffix: 'times to check in with yourself.',
    emptyWeeklySummary: 'No daily streak pressure. Come back only whenever it feels helpful.',
  },
  emotionWheel: [
    { name: 'Angry', definition: 'Restless, hurt, or pushing back against what happened.' },
    { name: 'Anxious', definition: 'Tight chest or racing thoughts about what might happen next.' },
    { name: 'Numb', definition: 'Flat, disconnected, or finding it hard to cry or name feelings.' },
    { name: 'Guilty', definition: 'Blaming yourself for past choices or things left unsaid.' },
    { name: 'Missing', definition: 'Longing for a person, voice, or familiar routine that changed.' },
    { name: 'Empty', definition: 'Unsteady or hollow after a familiar anchor stepped away.' },
    { name: 'Exhausted', definition: 'Worn out physically and mentally after long nights of holding on.' },
    { name: 'Lighter', definition: 'A small pocket of breathing room right now.' },
  ],
  journal: {
    midnightHint:
      'It is late. If you feel worn out, writing just a few short lines or listening to soft rain in Settle down may help you rest.',
    recommendedDurationHint: 'Consider pausing after 15–20 minutes so thoughts do not loop for too long.',
    guidedSteps: [
      {
        key: 'happened',
        label: '1. What just happened?',
        placeholder: 'Describe briefly what occurred, without judging right or wrong yet...',
      },
      {
        key: 'body',
        label: '2. How do your body and emotions feel?',
        placeholder: 'For example: tight shoulders, stinging eyes, feeling small or hollow...',
      },
      {
        key: 'need',
        label: '3. What do you need right now?',
        placeholder: 'For example: warm water, putting the phone down for 30 minutes, texting a friend...',
      },
      {
        key: 'kindness',
        label: '4. One small kindness for today',
        placeholder: 'Just one small doable thing (optional)...',
      },
    ],
    postWriteTitle: 'Private page saved',
    postWriteBody: 'You set some thoughts down safely. Feel free to take a 1-minute breath before leaving the screen.',
    undoDeleteBanner: 'Journal entry deleted.',
    undoButton: 'Undo (10s)',
  },
  unsentLetters: {
    burnWarning:
      'Choosing "Erase permanently" permanently removes the letter content from the server and cannot be undone.',
    burnCompleteTitle: 'Letter erased',
    burnCompleteBody:
      'The letter is no longer stored here. You do not have to feel better instantly — taking more time is completely okay.',
    sealOptionHint: 'Or seal it temporarily until a future date when you feel ready to read it again.',
  },
  exUrge: {
    buttonLabel: 'About to text my ex',
    title: 'A 10-minute pause before sending',
    subtitle: 'No rules or judgment here — just a short breather to hear what you truly need right now.',
    questionLabel: 'What are you hoping for most from sending this message?',
    intentOptions: [
      'Just wanting the loneliness right now to ease a little',
      'Wondering whether they still think of me',
      'Wanting to say one last sentence to feel heard',
      'Out of habit at this hour, not quite sure why',
    ],
    draftLabel: 'Draft what you were going to send here (only you can see this)',
    moveToUnsentLabel: 'Move to Unsent Letters',
  },
  calmTools: {
    heading: 'Settle down in 3 minutes',
    subtitle: 'No sign-up, no long explanation needed. Pick one small exercise within reach right now.',
  },
  realWorldBridge: {
    title: 'Stepping back into the real world',
    body: 'Heali is only a quiet resting corner and cannot replace real-world care. If sadness lasts longer than 2–3 weeks or disrupts sleep, meals, work, or study, consider talking with a trusted friend, doctor, or licensed mental health professional.',
    disclaimer: 'Information on Heali is for self-care and reflection only, not medical diagnosis.',
  },
  supportPrompts: {
    level1Title: 'This part sounds quite heavy.',
    level1Body: 'You do not have to push through or solve everything right now. Feel free to pause.',
    level2Question: 'Are you having thoughts of hurting yourself?',
    level2Body: 'Everything you typed remains intact. If this feels too heavy to carry, you do not have to be alone.',
    level2CallCta: 'Show support numbers right now',
    level2ContinueCta: 'I am safe, let me keep writing',
    level3Title: 'Your safety matters most right now',
    level3Body:
      'If you are thinking of harming yourself right now, please call emergency services or reach someone near you so you are not alone.',
    trustedSmsTemplate:
      'I am feeling really overwhelmed right now and do not want to be alone. Are you free to talk or sit with me for a little while?',
  },
  confessions: {
    heldNotice:
      'Your note contains sensitive words, so it was held for safety review before appearing publicly. If things feel overwhelming right now, please check the support lines below.',
  },
  spiritual: {
    disclaimer:
      'Note: Tarot, Astrology, and Numerology on Heali are purely for personal reflection & leisure — never future prediction or psychological/medical/financial advice.',
    paidDisabledNotice:
      'Paid sessions are turned off (free preview mode) until host conduct rules, financial safeguards, and legal review are finalized.',
  },
} as const;

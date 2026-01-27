// Email content generator for warmup emails
// Creates realistic, varied content to avoid spam filters

const WARMUP_SUBJECTS = [
  'Quick question about {topic}',
  'Following up on our conversation',
  'Thoughts on {topic}?',
  'Re: {topic} discussion',
  'Can you help with {topic}?',
  '{topic} - your thoughts?',
  'Checking in',
  'Quick update on {topic}',
  'About {topic}',
  '{topic} clarification',
  'Update regarding {topic}',
  'Question about {topic}',
  'Your input needed on {topic}',
  '{topic} follow-up',
  'Regarding {topic}',
];

const WARMUP_BODIES = [
  'Hey,\n\nJust wanted to follow up on {topic}. Let me know your thoughts when you get a chance.\n\nThanks!',
  'Hi there,\n\nI was thinking about {topic} and wanted to get your input. What do you think?\n\nBest,',
  'Hello,\n\nHope you\'re doing well! Quick question about {topic} - do you have any recommendations?\n\nCheers,',
  'Hi,\n\nI wanted to touch base regarding {topic}. Could you share your perspective?\n\nAppreciate it!',
  'Hey,\n\nQuick one - any thoughts on {topic}? Would love your feedback.\n\nThanks,',
  'Hi,\n\nHope all is well. I had a question about {topic} and thought you might have some insights.\n\nBest regards,',
  'Hello,\n\nJust checking in on {topic}. Let me know if you have any updates.\n\nThanks!',
  'Hi there,\n\nWanted to get your take on {topic}. What\'s your opinion?\n\nBest,',
  'Hey,\n\nI\'ve been working on {topic} and could use your input. Any thoughts?\n\nCheers,',
  'Hi,\n\nCan you help me understand {topic} better? I\'d appreciate your guidance.\n\nThanks,',
  'Hello,\n\nI wanted to ask about {topic}. Do you have a moment to discuss?\n\nBest,',
  'Hi,\n\nFollowing up on {topic}. Any progress or updates?\n\nThanks!',
  'Hey,\n\nJust wondering about {topic}. What are your current thoughts?\n\nBest regards,',
  'Hi there,\n\nI had a quick question regarding {topic}. Could you clarify?\n\nAppreciate your help!',
  'Hello,\n\nHope you\'re having a great day! Quick inquiry about {topic}.\n\nThanks,',
];

const REPLY_BODIES = [
  'Thanks for reaching out!\n\n{response}\n\nLet me know if you have any other questions.',
  'Great question!\n\n{response}\n\nHappy to discuss further.',
  'Thanks for the update.\n\n{response}\n\nTalk soon!',
  'Appreciate you following up.\n\n{response}\n\nLet me know how it goes!',
  'Good to hear from you!\n\n{response}\n\nFeel free to reach out anytime.',
  'Thanks for asking.\n\n{response}\n\nHope that helps!',
  'Hey!\n\n{response}\n\nLet me know if you need anything else.',
  'Thanks for checking in.\n\n{response}\n\nKeep me posted!',
  'Good question!\n\n{response}\n\nLet me know what you think.',
  'Appreciate the message.\n\n{response}\n\nTalk to you soon!',
];

const RESPONSES = [
  'I think we should move forward with that approach. It makes sense given our timeline.',
  'That sounds good to me. Let\'s schedule a time to discuss the details.',
  'I agree with your assessment. We can proceed as planned.',
  'Thanks for bringing that up. I\'ll look into it and get back to you.',
  'That\'s a great point. Let\'s align on next steps.',
  'I reviewed the information and it looks solid. We\'re good to go.',
  'Appreciate you flagging this. I\'ll handle it on my end.',
  'Sounds like a plan. Let me know if anything changes.',
  'I think that approach will work well. Let\'s move forward.',
  'Good idea. I\'ll coordinate with the team.',
  'That makes sense. I\'ll follow up with more details soon.',
  'Thanks for the heads up. I\'ll take care of that.',
  'I\'m on board with that direction. Keep me updated.',
  'That works for me. Let\'s touch base next week.',
  'Agreed. I\'ll make sure everything is in order.',
];

const TOPICS = [
  'the project timeline',
  'next week\'s meeting',
  'the quarterly report',
  'the new process',
  'team updates',
  'the upcoming event',
  'our discussion',
  'the action items',
  'the documentation',
  'the latest changes',
  'the proposal',
  'next steps',
  'the schedule',
  'the requirements',
  'the deliverables',
  'the presentation',
  'the feedback',
  'the budget',
  'the resources',
  'coordination',
];

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function addRandomTypo(text: string): string {
  // 20% chance of a minor typo to appear more human
  if (Math.random() > 0.8) {
    const typos = [
      (s: string) => s.replace('the', 'teh'),
      (s: string) => s.replace('quick', 'quikc'),
      (s: string) => s.replace('about', 'abotu'),
      (s: string) => s.replace('thanks', 'thnks'),
    ];
    const typo = randomItem(typos);
    return typo(text);
  }
  return text;
}

export function generateWarmupEmail(): { subject: string; body: string } {
  const topic = randomItem(TOPICS);
  const subject = randomItem(WARMUP_SUBJECTS).replace('{topic}', topic);
  const body = randomItem(WARMUP_BODIES).replace('{topic}', topic);

  return {
    subject: addRandomTypo(subject),
    body,
  };
}

export function generateWarmupReply(): { body: string } {
  const response = randomItem(RESPONSES);
  const body = randomItem(REPLY_BODIES).replace('{response}', response);

  return {
    body,
  };
}

// Generate a unique Message-ID for email threading
export function generateMessageId(domain: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `<${timestamp}.${random}@${domain}>`;
}

// Generate random delay between 1-4 hours (in milliseconds)
export function generateReplyDelay(): number {
  const minHours = 1;
  const maxHours = 4;
  const hours = Math.random() * (maxHours - minHours) + minHours;
  return Math.floor(hours * 60 * 60 * 1000);
}

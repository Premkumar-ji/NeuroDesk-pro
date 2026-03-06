/**
 * AI-powered natural language task parser
 * Parses natural language to extract task details
 */

// Time patterns
const timePatterns = {
  // Days of week
  sunday: { day: 0 },
  monday: { day: 1 },
  tuesday: { day: 2 },
  wednesday: { day: 3 },
  thursday: { day: 4 },
  friday: { day: 5 },
  saturday: { day: 6 },
  
  // Relative days
  today: { relative: 0 },
  tomorrow: { relative: 1 },
  'day after tomorrow': { relative: 2 },
  'next week': { relative: 7 },
  
  // Time patterns like "at 5pm", "at 5:30pm", "at 17:00"
  time: /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
  
  // Date patterns
  'next monday': { day: 1, week: 1 },
  'next friday': { day: 5, week: 1 }
};

// Priority keywords
const priorityKeywords = {
  critical: ['critical', 'urgent', 'asap', 'immediately', 'important', 'emergency'],
  high: ['high priority', 'important', 'priority', 'soon', 'crucial'],
  medium: ['medium priority', 'normal', 'regular'],
  low: ['low priority', 'whenever', 'someday', 'eventually']
};

// Recurring patterns
const recurringPatterns = {
  daily: ['every day', 'daily', 'each day'],
  weekly: ['every week', 'weekly', 'each week', 'every monday', 'every tuesday'],
  monthly: ['every month', 'monthly', 'each month']
};

/**
 * Parse natural language text into task object
 * @param {string} text - The natural language text
 * @returns {Object} - Parsed task object
 */
export function parseTaskWithAI(text) {
  const result = {
    title: '',
    description: '',
    priority: 'medium',
    dueDate: null,
    reminder: null,
    tags: [],
    recurring: { enabled: false }
  };

  let processedText = text.trim();

  // Extract priority
  result.priority = extractPriority(processedText);
  
  // Remove priority keywords from text
  priorityKeywords.critical.forEach(k => processedText = processedText.replace(new RegExp(k, 'gi'), ''));
  priorityKeywords.high.forEach(k => processedText = processedText.replace(new RegExp(k, 'gi'), ''));
  priorityKeywords.low.forEach(k => processedText = processedText.replace(new RegExp(k, 'gi'), ''));

  // Extract recurring
  const recurring = extractRecurring(processedText);
  if (recurring) {
    result.recurring = recurring;
    // Remove recurring keywords
    Object.values(recurringPatterns).flat().forEach(k => {
      processedText = processedText.replace(new RegExp(k, 'gi'), '');
    });
  }

  // Extract due date
  const dateInfo = extractDate(processedText);
  if (dateInfo.date) {
    result.dueDate = dateInfo.date;
    result.reminder = dateInfo.reminder;
  }

  // Extract time
  const timeInfo = extractTime(processedText);
  if (timeInfo && timeInfo.time) {
    if (result.dueDate) {
      // Combine date and time
      const date = new Date(result.dueDate);
      date.setHours(timeInfo.time.hours, timeInfo.time.minutes, 0, 0);
      result.dueDate = date.toISOString();
    }
  }

  // Extract tags (words starting with #)
  const tagMatches = processedText.match(/#\w+/g);
  if (tagMatches) {
    result.tags = tagMatches.map(t => t.replace('#', ''));
    // Remove tags from title
    processedText = processedText.replace(/#\w+/g, '');
  }

  // Clean up title
  result.title = processedText
    .replace(/\s+/g, ' ')
    .replace(/^(todo|task|reminder|call|buy|finish|start|do)\s+/i, '')
    .trim();

  // If title is empty, use the original text
  if (!result.title) {
    result.title = text.trim();
  }

  // Limit title length
  if (result.title.length > 200) {
    result.title = result.title.substring(0, 200);
  }

  return result;
}

/**
 * Extract priority from text
 */
function extractPriority(text) {
  const lowerText = text.toLowerCase();
  
  for (const [priority, keywords] of Object.entries(priorityKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return priority;
      }
    }
  }
  
  return 'medium';
}

/**
 * Extract recurring information
 */
function extractRecurring(text) {
  const lowerText = text.toLowerCase();
  
  for (const [type, patterns] of Object.entries(recurringPatterns)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return {
          enabled: true,
          type,
          interval: 1
        };
      }
    }
  }
  
  return null;
}

/**
 * Extract date from text
 */
function extractDate(text) {
  const lowerText = text.toLowerCase();
  const now = new Date();
  let date = null;
  let reminder = null;

  // Check for specific days
  for (const [dayName, dayInfo] of Object.entries(timePatterns)) {
    if (typeof dayInfo === 'object' && 'day' in dayInfo && lowerText.includes(dayName)) {
      const targetDate = new Date(now);
      
      if ('relative' in dayInfo) {
        targetDate.setDate(targetDate.getDate() + dayInfo.relative);
      } else if ('week' in dayInfo) {
        const currentDay = targetDate.getDay();
        let daysUntil = dayInfo.day - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        daysUntil += (dayInfo.week - 1) * 7;
        targetDate.setDate(targetDate.getDate() + daysUntil);
      } else {
        const currentDay = targetDate.getDay();
        let daysUntil = dayInfo.day - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        targetDate.setDate(targetDate.getDate() + daysUntil);
      }
      
      date = targetDate;
      break;
    }
  }

  // Check for "tomorrow"
  if (!date && lowerText.includes('tomorrow')) {
    date = new Date(now);
    date.setDate(date.getDate() + 1);
  }

  // Check for "today"
  if (!date && lowerText.includes('today')) {
    date = new Date(now);
  }

  // Check for "next week"
  if (!date && lowerText.includes('next week')) {
    date = new Date(now);
    date.setDate(date.getDate() + 7);
  }

  // Set reminder for 1 hour before
  if (date) {
    reminder = new Date(date);
    reminder.setHours(reminder.getHours() - 1);
  }

  return { date: date ? date.toISOString() : null, reminder: reminder ? reminder.toISOString() : null };
}

/**
 * Extract time from text
 */
function extractTime(text) {
  const match = text.match(timePatterns.time);
  
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = match[3] ? match[3].toLowerCase() : null;

    if (period === 'pm' && hours < 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }

    return { time: { hours, minutes } };
  }

  return null;
}

/**
 * Suggest optimal task order based on priority and due date
 * @param {Array} tasks - Array of task objects
 * @returns {Array} - Sorted tasks
 */
export function suggestTaskOrder(tasks) {
  return tasks.sort((a, b) => {
    // First, sort by priority (critical > high > medium > low)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    
    if (priorityDiff !== 0) return priorityDiff;

    // Then by due date (earlier first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    // Finally by creation date
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

/**
 * Generate productivity insights
 * @param {Object} stats - User statistics
 * @returns {Array} - Array of insight strings
 */
export function generateInsights(stats) {
  const insights = [];

  // Check completion rate
  if (stats.completionRate > 70) {
    insights.push("🎉 Great job! You're completing over 70% of your tasks!");
  } else if (stats.completionRate < 30) {
    insights.push("💡 Try breaking down larger tasks into smaller, manageable ones.");
  }

  // Check streak
  if (stats.streak?.currentStreak > 5) {
    insights.push(`🔥 Amazing! You've maintained a ${stats.streak.currentStreak}-day streak!`);
  }

  // Check overdue tasks
  const overdueCount = stats.overdueTasks || 0;
  if (overdueCount > 0) {
    insights.push(`⚠️ You have ${overdueCount} overdue task(s). Consider rescheduling or reprioritizing.`);
  }

  // Check focus time
  if (stats.avgFocusTime > 45) {
    insights.push("🧠 You're averaging over 45 minutes of focus time per session!");
  }

  return insights;
}

export default {
  parseTaskWithAI,
  suggestTaskOrder,
  generateInsights
};


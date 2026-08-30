const DEFAULT_SCHEDULE_DAYS = [1, 3, 7, 14, 30]; // interval after revision level N

/**
 * Given a problem's current revision_level and the result of today's revision,
 * compute the new level and the next_revision_at timestamp.
 */
function computeNextRevision(currentLevel, result, schedule = DEFAULT_SCHEDULE_DAYS) {
  let newLevel = currentLevel;

  if (result === 'Remembered') {
    newLevel = Math.min(currentLevel + 1, schedule.length); // cap at mastered level
  } else if (result === 'Partially Remembered') {
    newLevel = Math.max(currentLevel - 1, 0);
  } else if (result === 'Forgot') {
    newLevel = 0; // reset — schedule soonest interval again
  }

  const isMastered = newLevel >= schedule.length;
  const intervalDays = schedule[Math.min(newLevel, schedule.length - 1)];

  const next = new Date();
  next.setDate(next.getDate() + intervalDays);

  return {
    newLevel,
    nextRevisionAt: isMastered ? null : next,
    newStatus: isMastered ? 'Mastered' : result === 'Forgot' ? 'Need Revision' : 'In Revision',
  };
}

module.exports = { computeNextRevision, DEFAULT_SCHEDULE_DAYS };

const SKILL_SCORE = {
  basic: 1,
  intermediate: 2,
  professional: 3,
};

const SKILL_FROM_SCORE = (score) => {
  if (score <= 1.5) return 'basic';
  if (score <= 2.5) return 'intermediate';
  return 'professional';
};

export const calculateTeamSkillLevel = async (teamID, db) => {
  const teamSnap = await db.collection('teams').doc(teamID).get();
  if (!teamSnap.exists) throw new Error('Team not found');

  const { memberIds } = teamSnap.data();
  if (!memberIds || memberIds.length === 0) {
    return { skill_level: 'basic', skill_score: 1 };
  }

  // Fetch all member documents
  const memberSnaps = await Promise.all(
    memberIds.map(uid => db.collection('users').doc(uid).get())
  );

  const scores = memberSnaps
    .filter(snap => snap.exists)
    .map(snap => SKILL_SCORE[snap.data().skill_level] ?? 1);

  if (scores.length === 0) return { skill_level: 'basic', skill_score: 1 };

  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const skill_level = SKILL_FROM_SCORE(avg);

  return { skill_level, skill_score: parseFloat(avg.toFixed(2)) };
};

export { SKILL_SCORE, SKILL_FROM_SCORE };
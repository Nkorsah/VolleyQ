import express from 'express';
import { db } from '../firebase.js';
import admin from 'firebase-admin';
import gemini from '../gemini.js';

const router = express.Router();

router.post('/submit-match', async (req, res) => {
  console.log('/api/submit-match called...');
  try {
    const { courtId, courtName, teamA, teamB, sets } = req.body;

    if (!courtId || !teamA?.id || !teamB?.id || !sets?.length) {
      return res.status(400).json({ message: 'courtId, teamA, teamB and sets are required' });
    }
    if (teamA.id === teamB.id) {
      return res.status(400).json({ message: 'Teams must be different' });
    }

    const uid = '1234567';

    const [teamASnap, teamBSnap] = await Promise.all([
      db.collection('teams').doc(teamA.id).get(),
      db.collection('teams').doc(teamB.id).get(),
    ]);

    if (!teamASnap.exists || !teamBSnap.exists) {
      return res.status(404).json({ message: 'One or both teams not found' });
    }

    const teamAData = teamASnap.data();
    const teamBData = teamBSnap.data();
    const isMember = teamAData.memberIds.includes(uid) || teamBData.memberIds.includes(uid);

    if (!isMember) {
      return res.status(403).json({ message: 'Only team members can submit scores' });
    }

    let teamAWins = 0;
    let teamBWins = 0;
    sets.forEach(set => {
      if (set.teamAPoints > set.teamBPoints) teamAWins++;
      else teamBWins++;
    });

    const winnerId = teamAWins > teamBWins ? teamA.id : teamB.id;
    const loserId = teamAWins > teamBWins ? teamB.id : teamA.id;

    const matchRef = db.collection('matches').doc();
    const match = {
      id: matchRef.id,
      courtId,
      courtName,
      teamA,
      teamB,
      sets,
      winnerId,
      loserId,
      playedAt: new Date().toISOString(),
      submittedBy: uid,
    };

    const batch = db.batch();

    batch.set(matchRef, match);

    const teamAMatchRef = db
      .collection('teams').doc(teamA.id)
      .collection('matches').doc(matchRef.id);

    batch.set(teamAMatchRef, {
      matchId: matchRef.id,
      opponent: teamB,
      result: winnerId === teamA.id ? 'win' : 'loss',
      sets,
      courtId,
      playedAt: match.playedAt,
    });

    const teamBMatchRef = db
      .collection('teams').doc(teamB.id)
      .collection('matches').doc(matchRef.id);

    batch.set(teamBMatchRef, {
      matchId: matchRef.id,
      opponent: teamA,
      result: winnerId === teamB.id ? 'win' : 'loss',
      sets,
      courtId,
      playedAt: match.playedAt,
    });

    batch.update(db.collection('teams').doc(winnerId), {
      'stats.wins': admin.firestore.FieldValue.increment(1),
    });
    batch.update(db.collection('teams').doc(loserId), {
      'stats.losses': admin.firestore.FieldValue.increment(1),
    });

    await batch.commit();

    res.status(201).json(match);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/teams/:teamId/matches', async (req, res) => {
  const { teamId } = req.params;
  try {
    const snap = await db
      .collection('teams').doc(teamId)
      .collection('matches')
      .orderBy('playedAt', 'desc')
      .get();

    const matches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.get('/matches/:matchId', async (req, res) => {
  const { matchId } = req.params;
  try {
    const snap = await db.collection('matches').doc(matchId).get();
    if (!snap.exists) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.status(200).json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.post('/predict', async (req, res) => {
  console.log('/api/match/predict called...');
  try {
    const { team1, team2, score_limit } = req.body;

    if (!team1 || !team2 || !score_limit) {
      return res.status(400).json({ message: 'team1, team2 and score_limit are required' });
    }

    const team1_progress = ((team1.team_score / score_limit) * 100).toFixed(1);
    const team2_progress = ((team2.team_score / score_limit) * 100).toFixed(1);
    const score_diff = Math.abs(team1.team_score - team2.team_score);
    const points_remaining = score_limit - Math.max(team1.team_score, team2.team_score);

    const prompt = `
      You are a volleyball match analyst. Analyze this live match and predict the winner.

      Match Status:
      - ${team1.team_name}: ${team1.team_score} points (${team1_progress}% to win)${team1.skill_level ? `, skill: ${team1.skill_level}` : ''}
      - ${team2.team_name}: ${team2.team_score} points (${team2_progress}% to win)${team2.skill_level ? `, skill: ${team2.skill_level}` : ''}
      - Score limit: ${score_limit}
      - Score difference: ${score_diff} points
      - Points remaining for leader: ${points_remaining}

      Respond in this exact JSON format with no extra text:
      {
        "predicted_winner": "<team name>",
        "confidence": "<low|medium|high>",
        "reasoning": "<1-2 sentence explanation>"
      }
    `;

    const result = await gemini.model.generateContent(prompt);
    const raw = result.response.text();

    // Parse JSON from Gemini response
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.status(200).json({ prediction: parsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
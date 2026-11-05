import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('Activity input must be an object');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !mongoose.isObjectIdOrHexString(userId) ||
    typeof teamId !== 'string' || !mongoose.isObjectIdOrHexString(teamId)
  ) {
    throw badRequest('Activity must reference a valid user and team');
  }
  if (typeof type !== 'string' || type.trim().length === 0 || typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('Activity type and positive minutes are required');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw badRequest('Activity references must identify an existing user and team');
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('Team input must be an object');
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw badRequest('Team name is required');
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw badRequest('Team mascot is required');
  }
  if (members !== undefined && !Array.isArray(members)) {
    throw badRequest('Team members must be an array of user IDs');
  }

  const memberIds = (members ?? []) as unknown[];
  if (memberIds.some((memberId) => typeof memberId !== 'string' || !mongoose.isObjectIdOrHexString(memberId))) {
    throw badRequest('Team members must be valid user IDs');
  }
  const uniqueMemberIds = [...new Set(memberIds as string[])];
  const existingMembers = await User.countDocuments({ _id: { $in: uniqueMemberIds } });
  if (existingMembers !== uniqueMemberIds.length) {
    throw badRequest('Team members must reference existing users');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    { $set: { totalPoints: { $sum: '$activities.points' } } },
    { $sort: { totalPoints: -1, name: 1 } },
    { $project: { _id: 0, teamName: '$name', totalPoints: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const activityFocus = recentActivity
    ? ['run', 'walk', 'cycle'].includes(recentActivity.type.toLowerCase())
      ? 'endurance'
      : recentActivity.type.trim().toLowerCase()
    : undefined;
  const goalFocus = user.fitnessGoal.trim().toLowerCase();
  const matchesFocus = (workout: (typeof workouts)[number], focus: string) => workout.focus.trim().toLowerCase() === focus;
  const goalMatches = workouts.filter((workout) => matchesFocus(workout, goalFocus));
  const activityMatches = activityFocus
    ? workouts.filter((workout) => matchesFocus(workout, activityFocus))
    : [];
  const preferred = goalMatches.length > 0 ? goalMatches : activityMatches;
  const orderedWorkouts = preferred.length > 0
    ? [...preferred, ...workouts.filter((workout) => !preferred.includes(workout))]
    : workouts;

  return orderedWorkouts.map((workout) => {
    const reasons = [];
    if (matchesFocus(workout, goalFocus)) reasons.push(`matches your ${user.fitnessGoal} goal`);
    if (recentActivity && activityFocus && matchesFocus(workout, activityFocus)) {
      reasons.push(`reflects recent ${recentActivity.type} activity`);
    }
    const reason = reasons.length > 0
      ? `This workout ${reasons.join(' and ')}.`
      : `Suggested based on your ${user.fitnessGoal} goal.`;
    return { ...workout, reason };
  });
}

export { User };

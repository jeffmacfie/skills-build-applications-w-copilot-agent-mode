import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    void getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((response) => {
        if (isCurrent) setEntries(response.leaderboard);
      })
      .catch(() => {
        if (isCurrent) setHasError(true);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {isLoading && <p role="status">Loading leaderboard...</p>}
        {!isLoading && hasError && <p role="alert">Unable to load leaderboard.</p>}
        {!isLoading && !hasError && entries?.length === 0 && <p>No leaderboard rankings yet.</p>}
        {!isLoading && !hasError && entries && entries.length > 0 && (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr><th scope="col">Rank</th><th scope="col">Team</th><th scope="col">Points</th></tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={`${entry.rank}-${entry.teamName}`}>
                    <td>{entry.rank}</td>
                    <td>{entry.teamName}</td>
                    <td>{entry.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  _id?: string;
  name: string;
  mascot?: string;
  members?: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    void getJson<{ teams: Team[] }>('/api/teams')
      .then((response) => {
        if (isCurrent) setTeams(response.teams);
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
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {isLoading && <p role="status">Loading teams...</p>}
        {!isLoading && hasError && <p role="alert">Unable to load teams.</p>}
        {!isLoading && !hasError && teams?.length === 0 && <p>No teams yet.</p>}
        {!isLoading && !hasError && teams && teams.length > 0 && (
          <ul className="list-group list-group-flush">
            {teams.map((team, index) => (
              <li className="list-group-item px-0" key={team._id ?? `${team.name}-${index}`}>
                <h3 className="h6">{team.name}</h3>
                {team.mascot && <p className="mb-1">Mascot: {team.mascot}</p>}
                {team.members && team.members.length > 0 && <p className="mb-0">Members: {team.members.join(', ')}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

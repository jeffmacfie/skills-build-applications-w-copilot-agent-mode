import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  _id?: string;
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    void getJson<{ suggestions: WorkoutSuggestion[] }>(
      `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`,
    )
      .then((response) => {
        if (isCurrent) setSuggestions(response.suggestions);
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
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {isLoading && <p role="status">Loading workout suggestions...</p>}
        {!isLoading && hasError && <p role="alert">Unable to load workout suggestions.</p>}
        {!isLoading && !hasError && suggestions?.length === 0 && <p>No workout suggestions yet.</p>}
        {!isLoading && !hasError && suggestions && suggestions.length > 0 && (
          <ul className="list-group list-group-flush">
            {suggestions.map((suggestion, index) => (
              <li className="list-group-item px-0" key={suggestion._id ?? `${suggestion.title}-${index}`}>
                <h3 className="h6">{suggestion.title}</h3>
                {suggestion.focus && <p className="mb-1">Focus: {suggestion.focus}</p>}
                {suggestion.minutes !== undefined && <p className="mb-1">{suggestion.minutes} min</p>}
                {suggestion.difficulty && <p className="mb-1">Difficulty: {suggestion.difficulty}</p>}
                {suggestion.reason && <p className="mb-0">{suggestion.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

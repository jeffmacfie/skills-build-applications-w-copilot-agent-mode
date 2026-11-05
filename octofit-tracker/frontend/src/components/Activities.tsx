import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  _id?: string;
  type: string;
  minutes: number;
  points: number;
  occurredAt?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    void getJson<{ activities: Activity[] }>('/api/activities')
      .then((response) => {
        if (isCurrent) setActivities(response.activities);
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
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {isLoading && <p role="status">Loading activities...</p>}
        {!isLoading && hasError && <p role="alert">Unable to load activities.</p>}
        {!isLoading && !hasError && activities?.length === 0 && <p>No activities yet.</p>}
        {!isLoading && !hasError && activities && activities.length > 0 && (
          <ul className="list-group list-group-flush">
            {activities.map((activity, index) => (
              <li className="list-group-item px-0" key={activity._id ?? `${activity.type}-${activity.occurredAt ?? index}`}>
                <span>{activity.type}</span>{' '}
                <span>{activity.minutes} min</span>{' '}
                <span>{activity.points} points</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

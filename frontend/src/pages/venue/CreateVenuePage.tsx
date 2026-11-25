import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createVenue } from '../../api/venues.api';
import { Workspace } from '../../components/layout/Workspace';
import { getApiErrorMessage } from '../../utils/apiErrors';

export function CreateVenuePage() {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const save = useMutation({ mutationFn: createVenue, onSuccess: venue => {
    void cache.invalidateQueries({ queryKey: ['venue-list'] });
    navigate(`/venue/${venue.id}/seats`);
  } });
  return <Workspace role="VENUE_MANAGER" title="Create venue">
    <form className="work-form" onSubmit={event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      save.mutate({
        name: String(form.get('name')), address: String(form.get('address')),
        city: String(form.get('city')), state: String(form.get('state')),
        totalCapacity: Number(form.get('capacity'))
      });
    }}>
      <label>Name<input name="name" required maxLength={200} /></label>
      <label>City<input name="city" required maxLength={100} /></label>
      <label>State<input name="state" required maxLength={100} /></label>
      <label>Capacity<input name="capacity" type="number" min={1} max={100000} required /></label>
      <label className="work-wide">Address<textarea name="address" required rows={3} /></label>
      <button type="submit" className="button-dark" disabled={save.isPending}>Save venue</button>
    </form>
    {save.error && <p className="status-note" role="alert">{getApiErrorMessage(save.error, 'Venue could not be saved.')}</p>}
  </Workspace>;
}

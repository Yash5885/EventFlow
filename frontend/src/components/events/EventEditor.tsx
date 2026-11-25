import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, CalendarDays, MapPin, Ticket } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createEvent, submitEvent, updateEvent } from '../../api/events.api';
import { listVenueSeats, listVenues } from '../../api/venues.api';
import type { EventDetailResponse, SeatMapResponse } from '../../types';
import { WorkflowStatus } from '../common/WorkflowStatus';
import { fallbackEventImage } from '../../utils/constants';
import { getApiErrorMessage } from '../../utils/apiErrors';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export function EventEditor({ existing, inventory }: { existing?: EventDetailResponse; inventory?: SeatMapResponse }) {
  const event = existing?.event;
  const [venueId, setVenueId] = useState(event?.venueId ?? '');
  const location = useLocation();
  const [message, setMessage] = useState(location.state?.editorNotice ?? '');
  const [preview, setPreview] = useState({ title: event?.title ?? '', category: event?.category ?? '', date: event?.eventDate ?? '' });
  const navigate = useNavigate();
  const cache = useQueryClient();
  const venues = useQuery({ queryKey: ['venue-list'], queryFn: () => listVenues({ size: 100 }), enabled: !event });
  const venueSeats = useQuery({ queryKey: ['venue-seats', venueId], queryFn: () => listVenueSeats(venueId), enabled: !event && Boolean(venueId) });
  const seats = inventory?.rows.flatMap(row => row.seats.map(seat => ({ id: seat.seatId, seatType: seat.seatType, price: Number(seat.price) })))
    ?? venueSeats.data?.filter(seat => seat.isActive).map(seat => ({ id: seat.id, seatType: seat.seatType, price: 0 })) ?? [];
  const sections = [...new Set(seats.map(seat => seat.seatType))];
  const editable = !event || event.status === 'DRAFT';
  const save = useMutation({
    mutationFn: async ({ form, submit }: { form: FormData; submit: boolean }) => {
      const seatPrices = seats.filter(seat => event || form.has('section-'+seat.seatType)).map(seat => {
        const price = String(form.get('price-'+seat.seatType) ?? '');
        return { seatId: seat.id, price: price.trim() ? Number(price) : seat.price };
      });
      if (!seatPrices.length || seatPrices.some(seat => !Number.isFinite(seat.price) || seat.price <= 0)) {
        throw new Error('Select at least one section and enter positive seat prices.');
      }
      const input = {
        title: String(form.get('title')).trim(), category: String(form.get('category')).trim(),
        description: String(form.get('description')).trim(), bannerUrl: String(form.get('bannerUrl')).trim(),
        eventDate: String(form.get('eventDate')), seatPrices
      };
      const saved = event ? await updateEvent(event.id, input) : await createEvent({ ...input, venueId });
      if (!submit) return { saved };
      try {
        return { saved: await submitEvent(saved.id) };
      } catch (error) {
        return { saved, reviewError: getApiErrorMessage(error, 'The draft was saved. Submission could not be completed.') };
      }
    },
    onSuccess: ({ saved, reviewError }) => {
      const notice = reviewError || (saved.status === 'PENDING_APPROVAL' ? 'Submitted for approval.' : 'Draft saved.');
      setMessage(notice);
      void cache.invalidateQueries({ queryKey: ['organizer-events'] });
      void cache.invalidateQueries({ queryKey: ['event', saved.id] });
      void cache.invalidateQueries({ queryKey: ['seat-map', saved.id] });
      if (!event) navigate(`/organizer/events/${saved.id}/edit`, { state: { editorNotice: notice } });
    },
    onError: error => setMessage(getApiErrorMessage(error, error instanceof Error ? error.message : 'The draft could not be saved.'))
  });

  function onSubmit(submitEventForm: FormEvent<HTMLFormElement>) {
    submitEventForm.preventDefault();
    setMessage('');
    const button = (submitEventForm.nativeEvent as SubmitEvent).submitter;
    save.mutate({ form: new FormData(submitEventForm.currentTarget), submit: button?.getAttribute('value') === 'review' });
  }

  return (
    <div className="editor-layout">
      <div className="editor-fields">
        {event?.adminNote && <p className="flow-feedback"><strong>Review note</strong> · {event.adminNote}</p>}
        <form onSubmit={onSubmit} onChange={change => {
          const form = new FormData(change.currentTarget);
          setPreview({ title: String(form.get('title') ?? ''), category: String(form.get('category') ?? ''), date: String(form.get('eventDate') ?? '') });
        }}>
        <fieldset className="work-form editor-form" disabled={!editable || save.isPending}>
          <div className="work-wide editor-section-title"><h2>Listing details</h2><WorkflowStatus status={event?.status ?? 'DRAFT'} /></div>
          <label>Title<input name="title" defaultValue={event?.title} required maxLength={300} /></label>
          <label>Category<input name="category" defaultValue={event?.category} maxLength={100} required /></label>
          {!event && <label htmlFor="editor-venue">Venue<select id="editor-venue" value={venueId} onChange={change => setVenueId(change.target.value)} required>
            <option value="">Choose a venue</option>
            {venues.data?.content.map(venue => <option key={venue.id} value={venue.id}>{venue.name} · {venue.city}</option>)}
          </select></label>}
          <label>Event date and time<input name="eventDate" type="datetime-local" defaultValue={event?.eventDate.slice(0,16)} required /></label>
          <label className="work-wide">Image URL<input name="bannerUrl" defaultValue={event?.bannerUrl} placeholder="/editorial/indie.webp" maxLength={500} /></label>
          <label className="work-wide">Description<textarea name="description" rows={4} defaultValue={event?.description} /></label>
          <div className="work-wide editor-inventory">
            <h2>Sections and prices</h2>
            <p className="booking-hint">{sections.length ? 'Set one price per section in INR. In an existing draft, leave a price blank to retain it.' : 'Choose a venue with an existing seat layout.'}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {sections.map(section => {
                const group = seats.filter(seat => seat.seatType === section);
                const different = new Set(group.map(seat => seat.price)).size > 1;
                return <div key={section} className="editor-section">
                  {!event && <label className="!flex items-center"><input type="checkbox" name={`section-${section}`} defaultChecked /> Offer this section</label>}
                  <label>{section} · {group.length} seats
                    <input type="number" name={`price-${section}`} min="0.01" max="999999" step="0.01" defaultValue={event && !different ? group[0].price : undefined}
                      placeholder={different ? 'Keep existing seat prices' : 'Price in INR'} />
                  </label>
                  {different && <small>{formatCurrency(Math.min(...group.map(seat => seat.price)))}–{formatCurrency(Math.max(...group.map(seat => seat.price)))}</small>}
                </div>;
              })}
            </div>
          </div>
          {editable && <div className="work-wide flex flex-wrap gap-3">
            <button className="text-link" type="submit" value="draft" disabled={!sections.length}>Save draft</button>
            <button className="button-dark" type="submit" value="review" disabled={!sections.length}>Save and submit for approval</button>
          </div>}
        </fieldset>
        </form>
        {message && <p className="flow-feedback" role="status">{message}</p>}
      </div>
      <aside className="editor-preview" aria-label="Listing preview">
        <div className="editor-preview-image"><img src={event?.bannerUrl || fallbackEventImage} alt="" onError={image => {
          if (!image.currentTarget.src.endsWith(fallbackEventImage)) image.currentTarget.src = fallbackEventImage;
        }} /></div>
        <div className="editor-preview-copy">
          <p className="eyebrow">{preview.category || 'Listing preview'}</p>
          <h2>{preview.title || 'Your event title'}</h2>
          {preview.date && <p><CalendarDays size={15} aria-hidden="true" />{formatDateTime(preview.date)}</p>}
          {(existing?.venueName || venueId) && <p><MapPin size={15} aria-hidden="true" />{existing?.venueName || venues.data?.content.find(venue => venue.id === venueId)?.name}</p>}
          {seats.length > 0 && <p><Ticket size={15} aria-hidden="true" />{seats.length} seats in layout</p>}
          {event && <Link to={`/events/${event.id}`} className="text-link">Preview listing <ArrowUpRight size={16} aria-hidden="true" /></Link>}
        </div>
      </aside>
    </div>
  );
}

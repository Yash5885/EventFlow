import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, QrCode, Ticket, TicketCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { claimTicket, createTransfer, downloadTicket, getMyTickets } from '../../api/tickets.api';
import { WorkflowStatus } from '../common/WorkflowStatus';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getApiErrorMessage } from '../../utils/apiErrors';
import { toast } from 'sonner';

export function CustomerTickets() {
  const cache = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [link, setLink] = useState<{ id: string; url: string }>();
  const [openTicket, setOpenTicket] = useState('');
  const claimToken = new URLSearchParams(location.hash.slice(1)).get('claim');
  const tickets = useQuery({ queryKey: ['my-tickets'], queryFn: getMyTickets });
  const claim = useMutation({
    mutationFn: claimTicket,
    onSuccess: ticket => {
      setOpenTicket(ticket.id);
      toast.success('Ticket claimed');
      void cache.invalidateQueries({ queryKey: ['my-tickets'] });
      navigate('/my-bookings?view=tickets', { replace: true });
    }
  });
  const offer = useMutation({
    mutationFn: createTransfer,
    onSuccess: (data, id) => setLink({ id, url: `${window.location.origin}/my-bookings#claim=${encodeURIComponent(data.token)}` })
  });
  const download = useMutation({ mutationFn: downloadTicket, onError: () => toast.error('The ticket PDF could not be downloaded.') });

  return (
    <section className="account-panel" aria-labelledby="my-tickets">
      <h2 id="my-tickets" className="flow-section-title">Your tickets</h2>
      {claimToken && <div className="wallet-claim">
        <TicketCheck size={27} aria-hidden="true" />
        <div><h3>Accept a ticket transfer</h3><p>Claim this pass to add it to your wallet.</p></div>
        <button className="button-accent" type="button" disabled={claim.isPending} onClick={() => claim.mutate(claimToken)}>{claim.isPending ? 'Claiming…' : 'Claim ticket'}</button>
        {claim.error && <p role="alert" className="flow-feedback" data-tone="danger">{getApiErrorMessage(claim.error, 'The transfer link could not be accepted.')}</p>}
      </div>}
      {tickets.isLoading && <LoadingSpinner label="Loading tickets" />}
      {tickets.isError && <p role="alert" className="flow-feedback" data-tone="danger">Tickets could not be loaded.</p>}
      {tickets.data?.content.length === 0 && <div className="empty-state"><p>No tickets in this account yet.</p></div>}
      <ul className="wallet-grid">
        {tickets.data?.content.map(ticket => <li key={ticket.id} className="wallet-pass">
          <div className="wallet-pass-top">
            <Ticket size={22} aria-hidden="true" />
            <WorkflowStatus status={ticket.isUsed ? 'USED' : 'CONFIRMED'} />
            <h3>{ticket.eventTitle || 'EventFlow admission'}</h3>
            {ticket.seatLabel && <p className="eyebrow">Seat {ticket.seatLabel}</p>}
          </div>
          <div className="wallet-pass-body">
            {openTicket === ticket.id && <div className="wallet-qr"><QRCodeSVG value={ticket.ticketCode} size={150} marginSize={4} title="Admission QR code" /><code>{ticket.ticketCode}</code></div>}
            <div className="wallet-actions">
              <button type="button" className="button-dark" aria-expanded={openTicket === ticket.id}
                onClick={() => setOpenTicket(openTicket === ticket.id ? '' : ticket.id)}><QrCode size={16} aria-hidden="true" />{openTicket === ticket.id ? 'Hide QR code' : 'Show QR code'}</button>
              <button type="button" className="text-link" disabled={download.isPending} onClick={() => download.mutate(ticket.id)}><Download size={16} aria-hidden="true" />{download.isPending && download.variables === ticket.id ? 'Downloading…' : 'Download PDF'}</button>
              {!ticket.isUsed && <button type="button" className="text-link" disabled={offer.isPending} onClick={() => {
                setLink(undefined);
                offer.mutate(ticket.id);
              }}>Create transfer link</button>}
            </div>
            {offer.error && offer.variables === ticket.id && <p role="alert" className="flow-feedback" data-tone="danger">{getApiErrorMessage(offer.error, 'A transfer link could not be created.')}</p>}
            {link?.id === ticket.id && <div className="wallet-transfer">
              <div className="flow-field"><label htmlFor={`transfer-${ticket.id}`}>One-time transfer link</label><input id={`transfer-${ticket.id}`} value={link.url} readOnly onFocus={event => event.currentTarget.select()} /></div>
              <p>When the recipient claims the ticket, their admission code replaces yours.</p>
              <button type="button" className="text-link" onClick={async () => {
                try { await navigator.clipboard.writeText(link.url); toast.success('Transfer link copied'); }
                catch { toast.message('Select and copy the transfer link above.'); }
              }}><Copy size={16} aria-hidden="true" />Copy link</button>
            </div>}
          </div>
        </li>)}
      </ul>
    </section>
  );
}

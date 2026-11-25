import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Check, CircleAlert, ImageUp, ScanLine, Users, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getGateAttendance, getGateEvents, verifyTicket } from '../../api/tickets.api';
import { Workspace } from '../../components/layout/Workspace';
import { getApiErrorMessage } from '../../utils/apiErrors';

function makeReader() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas is unavailable');
  return async (image: CanvasImageSource, width: number, height: number) => {
    if (!width || !height) return;
    const scale = Math.min(1, 960 / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const { default: decode } = await import('jsqr');
    return decode(pixels.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' })?.data.trim().toUpperCase();
  };
}

export function QRScannerPage() {
  const [eventId, setEventId] = useState('');
  const [code, setCode] = useState('');
  const [camera, setCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [readingImage, setReadingImage] = useState(false);
  const [readerMessage, setReaderMessage] = useState('');
  const video = useRef<HTMLVideoElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const lastScan = useRef('');
  const busy = useRef(false);
  const cache = useQueryClient();
  const events = useQuery({ queryKey: ['gate-events'], queryFn: getGateEvents });
  const attendance = useQuery({
    queryKey: ['gate-attendance', eventId], queryFn: () => getGateAttendance(eventId),
    enabled: Boolean(eventId), refetchInterval: 5000
  });
  const { mutate, reset, data, error, isPending } = useMutation({
    mutationFn: ({ eventId, code }: { eventId: string; code: string }) => verifyTicket(eventId, code),
    onSuccess: (_, request) => void cache.invalidateQueries({ queryKey: ['gate-attendance', request.eventId] }),
    onSettled: () => { busy.current = false; }
  });

  const check = useCallback((value: string) => {
    if (busy.current || !eventId || !value) return;
    busy.current = true;
    setReaderMessage('');
    mutate({ eventId, code: value });
  }, [eventId, mutate]);

  useEffect(() => {
    if (!camera || !eventId) return;
    let stream: MediaStream | undefined;
    let timer: number | undefined;
    let stopped = false;
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable');
        const read = makeReader();
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (stopped) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        const frame = video.current;
        if (!frame) return;
        frame.srcObject = stream;
        await frame.play();
        if (stopped) return;
        setCameraReady(true);
        let clearFrames = 0;
        const scan = async () => {
          if (stopped) return;
          try {
            const value = await read(frame, frame.videoWidth, frame.videoHeight);
            if (stopped) return;
            if (!value) {
              if (++clearFrames >= 3) lastScan.current = '';
            } else {
              clearFrames = 0;
              if (value.startsWith('EF-') && value.length <= 50 && value !== lastScan.current && !busy.current) {
                lastScan.current = value;
                check(value);
              }
            }
          } catch {
            if (!stopped) {
              setReaderMessage('The camera could not read this frame. Try an image or enter the ticket code.');
              setCamera(false);
            }
            return;
          }
          if (!stopped) timer = window.setTimeout(() => void scan(), 240);
        };
        void scan();
      } catch {
        if (!stopped) {
          setReaderMessage('Camera access is unavailable. Use a QR image or enter the ticket code.');
          setCamera(false);
        }
      }
    }
    void start();
    return () => {
      stopped = true;
      stream?.getTracks().forEach(track => track.stop());
      window.clearTimeout(timer);
    };
  }, [camera, eventId, check]);

  async function readImage(file: File) {
    setReadingImage(true);
    setCamera(false);
    setReaderMessage('');
    let bitmap: ImageBitmap | undefined;
    try {
      if (file.size > 12 * 1024 * 1024) throw new Error('Image too large');
      bitmap = await createImageBitmap(file);
      const value = await makeReader()(bitmap, bitmap.width, bitmap.height);
      if (value?.startsWith('EF-') && value.length <= 50) {
        setCode(value);
        setReaderMessage('Ticket code read from image. Select Check in to admit the guest.');
        input.current?.focus();
      } else {
        setReaderMessage('No EventFlow ticket code was found in this image.');
      }
    } catch {
      setReaderMessage('Choose a readable QR image under 12 MB.');
    } finally {
      bitmap?.close();
      setReadingImage(false);
    }
  }

  const issued = attendance.data?.issued ?? 0;
  const checkedIn = attendance.data?.checkedIn ?? 0;
  const ResultIcon = data?.result === 'ACCEPTED' ? Check : data?.result === 'ALREADY_USED' ? CircleAlert : X;

  return (
    <Workspace role="VENUE_MANAGER" title="Gate check-in" description="Verify admission and track arrivals for your event.">
      <div className="gate-console">
        <div className="gate-controls">
          <div className="flow-field">
            <label htmlFor="gate-event">Event</label>
            <select id="gate-event" value={eventId} disabled={isPending || readingImage} onChange={event => {
              setEventId(event.target.value);
              setCode('');
              setCamera(false);
              setCameraReady(false);
              setReaderMessage('');
              lastScan.current = '';
              reset();
            }}>
              <option value="">Choose an event</option>
              {events.data?.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}
            </select>
          </div>
          <div className="gate-attendance" aria-label="Attendance">
            <div><Users size={16} aria-hidden="true" /> <span>Checked in</span></div>
            {attendance.data ? <><strong>{checkedIn}<small> / {issued}</small></strong><progress value={checkedIn} max={Math.max(1, issued)} aria-label="Admission progress" /></>
              : <p>{attendance.isError ? 'Attendance could not be loaded.' : eventId ? 'Loading attendance…' : 'Select an event for live counts.'}</p>}
          </div>
        </div>
        {eventId && <div className="gate-body">
          <section className="gate-reader" aria-label="QR reader">
            {camera ? <video ref={video} muted playsInline aria-label="QR camera preview" /> : <ScanLine size={56} strokeWidth={1} aria-hidden="true" />}
            {camera && <span className="gate-reticle" aria-hidden="true" />}
            <div className="gate-reader-actions">
              <button type="button" className="button-accent focus-ring" disabled={readingImage} onClick={() => {
                setCamera(!camera);
                setCameraReady(false);
                setReaderMessage('');
                lastScan.current = '';
              }}><Camera size={17} aria-hidden="true" />{camera ? 'Stop camera' : 'Start camera'}</button>
              <label className="gate-upload">
                <ImageUp size={17} aria-hidden="true" />{readingImage ? 'Reading image…' : 'Read QR image'}
                <input type="file" accept="image/*" disabled={readingImage || isPending} onChange={event => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) void readImage(file);
                }} />
              </label>
            </div>
            {camera && <p className="gate-camera-status" role="status">{cameraReady ? 'Point the camera at a ticket QR code' : 'Starting camera…'}</p>}
          </section>
          <form className="gate-manual" onSubmit={event => {
            event.preventDefault();
            check(code.trim().toUpperCase());
            input.current?.select();
          }}>
            <div className="flow-field">
              <label htmlFor="gate-code">Ticket code</label>
              <input id="gate-code" ref={input} value={code} onChange={event => setCode(event.target.value)} maxLength={50} placeholder="EF-…" spellCheck={false} autoComplete="off" required />
            </div>
            <button className="button-dark" type="submit" disabled={!code.trim() || isPending || readingImage}>
              {isPending ? 'Checking…' : 'Check in'}<ScanLine size={17} aria-hidden="true" />
            </button>
          </form>
          {readerMessage && <p className="flow-feedback" role="status">{readerMessage}</p>}
          {data && !isPending && <div className="gate-result" data-result={data.result} role="status">
            <ResultIcon size={24} aria-hidden="true" />
            <div><h2>{data.message}</h2><p>{[data.holderName, data.seatInfo, data.ticketCode].filter(Boolean).join(' · ')}</p></div>
          </div>}
          {error && <p className="flow-feedback" data-tone="danger" role="alert">{getApiErrorMessage(error, 'Ticket could not be checked.')}</p>}
        </div>}
      </div>
      {events.isError && <p className="flow-feedback" data-tone="danger" role="alert">Venue events could not be loaded.</p>}
      {!events.isLoading && events.data?.length === 0 && <p className="flow-feedback">This venue has no published events.</p>}
    </Workspace>
  );
}

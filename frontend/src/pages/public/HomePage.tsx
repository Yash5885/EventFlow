import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Armchair, ScanLine, Ticket } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEvents } from '../../api/events.api';
import { EventCard } from '../../components/events/EventCard';
import { TestBookingCallout } from '../../components/booking/TestBookingCallout';
import type { EventSummaryResponse } from '../../types';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  { title: 'Find your crowd.', description: 'Discover concerts, game nights and gatherings worth stepping out for.', icon: ScanLine },
  { title: 'Pick your spot.', description: 'See which seats are available and choose where you want to be.', icon: Armchair },
  { title: 'Walk right in.', description: 'Your digital ticket is ready once payment is confirmed.', icon: Ticket }
];

const emptyLineup: EventSummaryResponse[] = [];

export function HomePage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['home-lineup'], queryFn: () => listEvents({ size: 8 }) });
  const lineupEvents = data?.content ?? emptyLineup;
  const root = useRef<HTMLElement>(null);
  const lineup = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useLayoutEffect(() => {
    const track = lineup.current;
    if (!track) return;
    const update = () => {
      const start = track.scrollLeft <= 1;
      const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
      setEdges(previous => previous.start === start && previous.end === end ? previous : { start, end });
    };
    const observer = new ResizeObserver(update);
    observer.observe(track);
    track.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      track.removeEventListener('scroll', update);
    };
  }, [lineupEvents]);

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-photo', { clipPath: 'inset(0 0 100% 0)', duration: 1.05 })
        .from('.hero-line > span', { yPercent: 110, duration: 0.85, stagger: 0.12 }, 0.17)
        .from('[data-hero-enter]', { opacity: 0, y: 14, duration: 0.48, stagger: 0.09 }, 0.57);

      gsap.to('.hero-photo img', {
        yPercent: 13, ease: 'none',
        scrollTrigger: { trigger: '.home-hero', start: 'top top', end: 'bottom top', scrub: true }
      });

      gsap.utils.toArray<HTMLElement>('.story-step').forEach(step => {
        gsap.from(step, {
          opacity: 0.35, y: 24, duration: 0.55,
          scrollTrigger: { trigger: step, start: 'top 88%', once: true }
        });
      });
    }, root.current ?? undefined);
    media.add('(min-width: 960px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const button = root.current?.querySelector<HTMLElement>('.hero-cta');
      if (!button) return;
      const x = gsap.quickTo(button, 'x', { duration: 0.3, ease: 'power3.out' });
      const y = gsap.quickTo(button, 'y', { duration: 0.3, ease: 'power3.out' });
      const move = (event: PointerEvent) => {
        const bounds = button.getBoundingClientRect();
        x((event.clientX - bounds.left - bounds.width / 2) * 0.13);
        y((event.clientY - bounds.top - bounds.height / 2) * 0.2);
      };
      const reset = () => { x(0); y(0); };
      button.addEventListener('pointermove', move);
      button.addEventListener('pointerleave', reset);
      return () => {
        button.removeEventListener('pointermove', move);
        button.removeEventListener('pointerleave', reset);
        x.tween.kill();
        y.tween.kill();
      };
    }, root.current ?? undefined);
    return () => media.revert();
  }, []);

  useLayoutEffect(() => {
    const track = lineup.current;
    if (!lineupEvents.length || !track) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.event-image', {
        clipPath: 'inset(0 0 24% 0)', duration: 0.65, stagger: 0.07, ease: 'power2.out',
        scrollTrigger: { trigger: track, start: 'top 92%', once: true }
      });
    }, track);
    return () => media.revert();
  }, [lineupEvents]);

  function moveLineup(direction: number) {
    const track = lineup.current;
    const item = track?.firstElementChild;
    if (!track || !item) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (item.clientWidth + gap), behavior: reduced ? 'instant' : 'smooth' });
  }

  return (
    <main className="home-page" ref={root}>
      <section className="home-hero">
        <div className="hero-photo"><img src="/editorial/after-dark.webp" alt="" fetchPriority="high" /></div>
        <div className="page-container hero-content">
          <p className="eyebrow hero-kicker" data-hero-enter><span /> The live events platform</p>
          <h1 aria-label="Life sounds better live.">
            <span className="hero-line" aria-hidden="true"><span>Life sounds</span></span>
            <span className="hero-line hero-accent" aria-hidden="true"><span>better live.</span></span>
          </h1>
          <p className="hero-description" data-hero-enter>Find the nights you’ll talk about tomorrow. Book concerts, games and more, right down to your seat.</p>
          <div className="hero-actions" data-hero-enter>
            <Link to="/events" className="button-accent hero-cta">Explore events <ArrowUpRight size={20} aria-hidden="true" /></Link>
            <a href="#lineup" className="hero-scroll" aria-label="Scroll to the lineup"><ArrowDown size={19} aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      <section className="lineup-section" id="lineup" aria-labelledby="lineup-title">
        <div className="page-container">
          <div className="editorial-heading">
            <div><p className="eyebrow">Upcoming events</p><h2 id="lineup-title">The lineup<span>.</span></h2></div>
            <Link to="/events" className="text-link">Browse all events <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
          <div className="lineup-track" ref={lineup}>
            {lineupEvents.map(event => <EventCard key={event.id} event={event} />)}
          </div>
          {!lineupEvents.length && <p className="status-note" role="status">{isLoading ? 'Loading events…' : isError ? 'The lineup is currently unavailable.' : 'No events are listed yet.'}</p>}
          {lineupEvents.length > 0 && <div className="lineup-controls" aria-label="Lineup controls">
            <button type="button" className="icon-button focus-ring" onClick={() => moveLineup(-1)} disabled={edges.start} aria-label="Previous event"><ArrowLeft size={19} aria-hidden="true" /></button>
            <button type="button" className="icon-button focus-ring" onClick={() => moveLineup(1)} disabled={edges.end} aria-label="Next event"><ArrowRight size={19} aria-hidden="true" /></button>
          </div>}
          <TestBookingCallout />
        </div>
      </section>

      <section className="story-section">
        <div className="page-container story-grid">
          <div className="story-intro">
            <p className="eyebrow">How it works</p>
            <h2>See you<br />out there.</h2>
            <Link className="text-link" to="/register">Create account <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
          <ol className="story-steps">
            {steps.map(({ title, description, icon: Icon }, index) => (
              <li className="story-step" key={title}>
                <span className="eyebrow">0{index + 1}</span><Icon size={26} aria-hidden="true" />
                <div><h3>{title}</h3><p>{description}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}

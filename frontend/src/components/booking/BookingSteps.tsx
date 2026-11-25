const labels = ['Seats', 'Checkout', 'Tickets'];

export function BookingSteps({ current }: { current: number }) {
  return (
    <ol className="booking-steps" aria-label="Booking progress">
      {labels.map((label, index) => (
        <li key={label} aria-current={index + 1 === current ? 'step' : undefined} data-complete={index + 1 < current}>
          <span aria-hidden="true">{index + 1}</span>{label}
        </li>
      ))}
    </ol>
  );
}

INSERT INTO users (id, name, email, password_hash, role, is_active)
VALUES
    ('2d519b22-3746-4598-8b66-b169143c68e1', 'EventFlow Demo Organizer', 'organizer@eventflow.invalid', '!', 'ORGANIZER', false),
    ('8082380e-7ec7-4d4b-b4ae-00fb08cac6cb', 'EventFlow Demo Venue', 'venue@eventflow.invalid', '!', 'VENUE_MANAGER', false);

INSERT INTO venues (id, manager_id, name, address, city, state, total_capacity, description)
VALUES (
    '3c3ef9e3-72b1-40e3-bd2b-ed437768c387', '8082380e-7ec7-4d4b-b4ae-00fb08cac6cb',
    'The Assembly Hall', 'EventFlow demonstration venue', 'Mumbai', 'Maharashtra', 54,
    'A sample venue for trying EventFlow seat selection and ticketing.'
);

INSERT INTO seats (venue_id, row_label, seat_number, seat_type, x_position, y_position)
SELECT '3c3ef9e3-72b1-40e3-bd2b-ed437768c387', chr(65 + row_index), seat_index,
       (CASE WHEN row_index = 5 AND seat_index IN (1, 9) THEN 'WHEELCHAIR'
             WHEN row_index < 2 THEN 'PREMIUM' ELSE 'GENERAL' END)::seat_type,
       65 + 46 * seat_index, 98 + 52 * row_index
FROM generate_series(0, 5) AS rows(row_index)
CROSS JOIN generate_series(1, 9) AS numbers(seat_index);

INSERT INTO events (id, organizer_id, venue_id, title, description, category, banner_url, event_date, status, is_public)
VALUES
    ('bc89caa5-a957-4a7f-b47e-c561d441f85c', '2d519b22-3746-4598-8b66-b169143c68e1', '3c3ef9e3-72b1-40e3-bd2b-ed437768c387',
     'Assembly After Dark', 'A night of live electronic music. This sample event lets you choose a seat and try a no-charge checkout.',
     'Concert', '/editorial/after-dark.webp', current_date + interval '18 days 19 hours 30 minutes', 'PUBLISHED', true),
    ('21480625-6e41-451a-91bf-75b5ba985f3a', '2d519b22-3746-4598-8b66-b169143c68e1', '3c3ef9e3-72b1-40e3-bd2b-ed437768c387',
     'Courtside Finals', 'A sample finals night with reserved seating across six rows.',
     'Sports', '/editorial/finals.webp', current_date + interval '24 days 18 hours', 'PUBLISHED', true),
    ('4603a872-bbca-4678-9982-627a2a89b3cd', '2d519b22-3746-4598-8b66-b169143c68e1', '3c3ef9e3-72b1-40e3-bd2b-ed437768c387',
     'Independent Stage', 'An intimate set of original performances. Explore the seating plan and try a digital ticket.',
     'Theatre', '/editorial/indie.webp', current_date + interval '28 days 20 hours', 'PUBLISHED', true);

INSERT INTO event_seats (event_id, seat_id, price)
SELECT e.id, s.id, CASE s.seat_type WHEN 'PREMIUM' THEN 1350.00 ELSE 800.00 END
FROM events e
JOIN seats s ON s.venue_id = e.venue_id
WHERE e.id IN (
    'bc89caa5-a957-4a7f-b47e-c561d441f85c',
    '21480625-6e41-451a-91bf-75b5ba985f3a',
    '4603a872-bbca-4678-9982-627a2a89b3cd'
);

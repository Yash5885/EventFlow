package com.eventflow.modules.notification;

import com.eventflow.common.enums.BookingStatus;
import com.eventflow.modules.booking.BookingRepository;
import com.eventflow.modules.ticket.TicketPdf;
import com.eventflow.modules.ticket.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.mail.MessagingException;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    private final BookingRepository bookings;
    private final TicketRepository tickets;
    private final TicketPdf ticketPdf;

    @Value("${app.ticket-mail.enabled:false}")
    private boolean enabled;

    @Value("${app.ticket-mail.from}")
    private String from;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public boolean sendWaitlistOffer(String recipient, String title, UUID bookingId) {
        if (!enabled) return false;
        var message = new org.springframework.mail.SimpleMailMessage();
        message.setFrom(from);
        message.setTo(recipient);
        message.setSubject("A seat opened for " + title.replaceAll("[\\r\\n]", " "));
        message.setText("A seat is reserved for a short time. Open checkout to claim it: " + frontendUrl + "/checkout/" + bookingId);
        mailSender.send(message);
        return true;
    }

    @Transactional
    public void sendTickets(UUID bookingId) {
        if (!enabled) return;
        var booking = bookings.lockById(bookingId).orElseThrow();
        if (booking.getStatus() != BookingStatus.CONFIRMED || booking.getTicketEmailSentAt() != null) return;
        var admission = tickets.findByBooking_Id(bookingId);
        if (admission.isEmpty()) return;
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(booking.getUser().getEmail());
            helper.setSubject("Your EventFlow tickets");
            helper.setText("Your tickets for " + booking.getEvent().getTitle() + " are attached.");
            for (var ticket : admission) {
                helper.addAttachment(ticket.getTicketCode() + ".pdf", new ByteArrayResource(ticketPdf.render(ticket)), "application/pdf");
            }
            mailSender.send(message);
            booking.setTicketEmailSentAt(LocalDateTime.now());
        } catch (MessagingException exception) {
            throw new IllegalStateException("Ticket email could not be created", exception);
        }
    }
}

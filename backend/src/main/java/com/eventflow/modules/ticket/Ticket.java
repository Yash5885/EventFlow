package com.eventflow.modules.ticket;

import com.eventflow.modules.booking.Booking;
import com.eventflow.modules.event.EventSeat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tickets", uniqueConstraints = @UniqueConstraint(columnNames = {"booking_id", "event_seat_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_seat_id", nullable = false)
    private EventSeat eventSeat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "holder_id")
    private com.eventflow.modules.user.User holder;

    @Column(name = "transfer_hash")
    private String transferHash;

    @Column(name = "transfer_expires_at")
    private LocalDateTime transferExpiresAt;

    public com.eventflow.modules.user.User currentHolder() {
        return holder != null ? holder : booking.getUser();
    }

    @Column(name = "ticket_code", nullable = false, unique = true, length = 50)
    private String ticketCode;

    @Column(name = "qr_code_url", length = 500)
    private String qrCodeUrl;

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @Column(name = "is_used", nullable = false)
    @Builder.Default
    private Boolean used = false;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;
}

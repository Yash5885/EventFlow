package com.eventflow.modules.refund;

import com.eventflow.modules.booking.Booking;
import com.eventflow.modules.payment.Payment;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "refund_requests")
@Getter
@Setter
public class RefundRequest {
    public enum Status { REQUESTED, APPROVED, REJECTED, PROCESSED }
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "booking_id") private Booking booking;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "payment_id") private Payment payment;
    private String reason;
    private String note;
    @Enumerated(EnumType.STRING) private Status status;
    @Column(name = "requested_at") private LocalDateTime requestedAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @Column(name = "gateway_refund_id") private String gatewayRefundId;
}

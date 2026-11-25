package com.eventflow.modules.refund;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefundRepository extends JpaRepository<RefundRequest, UUID> {
    List<RefundRequest> findByBooking_User_IdOrderByRequestedAtDesc(UUID userId, Pageable pageable);
    List<RefundRequest> findByStatusInOrderByRequestedAtAsc(List<RefundRequest.Status> statuses, Pageable pageable);
    boolean existsByBooking_IdAndStatusIn(UUID id, List<RefundRequest.Status> statuses);
    Optional<RefundRequest> findByPayment_GatewayPaymentIdAndStatus(String paymentId, RefundRequest.Status status);
}

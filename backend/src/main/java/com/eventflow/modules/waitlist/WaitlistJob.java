package com.eventflow.modules.waitlist;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.util.UUID;
import java.util.function.Consumer;

@Slf4j
@Component
@RequiredArgsConstructor
class WaitlistJob {
    private final WaitlistRepository repository;
    private final WaitlistService service;

    @Scheduled(fixedDelayString = "${app.waitlist.interval-ms:15000}")
    void process() {
        var limit = PageRequest.of(0, 100);
        repository.activeOffers(WaitlistEntry.Status.OFFERED, limit).forEach(id -> run(id, service::updateOffer));
        repository.queueHeads(limit).forEach(id -> run(id, service::offer));
    }

    private void run(UUID id, Consumer<UUID> action) {
        try {
            action.accept(id);
        } catch (RuntimeException exception) {
            log.warn("Could not advance waitlist entry {}", id, exception);
        }
    }
}

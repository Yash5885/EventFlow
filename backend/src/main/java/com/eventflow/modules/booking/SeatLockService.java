package com.eventflow.modules.booking;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class SeatLockService {

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${app.seat-lock.ttl-minutes}")
    private long lockTtlMinutes;

    public boolean acquireLock(UUID eventId, UUID eventSeatId, UUID userId) {
        Boolean locked = redisTemplate.opsForValue().setIfAbsent(
                key(eventId, eventSeatId),
                userId.toString(),
                lockTtlMinutes,
                TimeUnit.MINUTES
        );
        return Boolean.TRUE.equals(locked);
    }

    public void releaseLock(UUID eventId, UUID eventSeatId, UUID userId) {
        String script = """
                if redis.call('GET', KEYS[1]) == ARGV[1] then
                    return redis.call('DEL', KEYS[1])
                end
                return 0
                """;
        redisTemplate.execute(new DefaultRedisScript<>(script, Long.class), List.of(key(eventId, eventSeatId)), userId.toString());
    }

    public boolean isLocked(UUID eventId, UUID eventSeatId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key(eventId, eventSeatId)));
    }

    public boolean isLockedByUser(UUID eventId, UUID eventSeatId, UUID userId) {
        return userId.toString().equals(redisTemplate.opsForValue().get(key(eventId, eventSeatId)));
    }

    public void extendLock(UUID eventId, UUID eventSeatId, UUID userId) {
        String script = """
                if redis.call('GET', KEYS[1]) == ARGV[1] then
                    return redis.call('EXPIRE', KEYS[1], ARGV[2])
                end
                return 0
                """;
        redisTemplate.execute(
                new DefaultRedisScript<>(script, Long.class),
                List.of(key(eventId, eventSeatId)),
                userId.toString(),
                String.valueOf(TimeUnit.MINUTES.toSeconds(lockTtlMinutes))
        );
    }

    public long getLockTtl(UUID eventId, UUID eventSeatId) {
        Long ttl = redisTemplate.getExpire(key(eventId, eventSeatId), TimeUnit.SECONDS);
        return ttl == null ? -2 : ttl;
    }

    public void releaseAllLocksForBooking(UUID bookingId, List<UUID> eventSeatIds, UUID eventId) {
        eventSeatIds.forEach(eventSeatId -> redisTemplate.delete(key(eventId, eventSeatId)));
    }

    private String key(UUID eventId, UUID eventSeatId) {
        return "seat_lock:%s:%s".formatted(eventId, eventSeatId);
    }
}


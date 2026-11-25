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

    public boolean extendBookingLocks(UUID eventId, List<UUID> eventSeatIds, UUID token) {
        String script = """
                for _, key in ipairs(KEYS) do
                    if redis.call('GET', key) ~= ARGV[1] then return 0 end
                end
                for _, key in ipairs(KEYS) do
                    redis.call('EXPIRE', key, ARGV[2])
                end
                return 1
                """;
        var keys = eventSeatIds.stream().map(seat -> key(eventId, seat)).toList();
        Long result = redisTemplate.execute(new DefaultRedisScript<>(script, Long.class), keys, token.toString(),
                String.valueOf(TimeUnit.MINUTES.toSeconds(lockTtlMinutes)));
        return Long.valueOf(1).equals(result);
    }

    public long getLockTtl(UUID eventId, UUID eventSeatId) {
        Long ttl = redisTemplate.getExpire(key(eventId, eventSeatId), TimeUnit.SECONDS);
        return ttl == null ? -2 : ttl;
    }

    public void releaseAllLocksForBooking(UUID token, List<UUID> eventSeatIds, UUID eventId) {
        eventSeatIds.forEach(eventSeatId -> releaseLock(eventId, eventSeatId, token));
    }

    private String key(UUID eventId, UUID eventSeatId) {
        return "seat_lock:%s:%s".formatted(eventId, eventSeatId);
    }
}

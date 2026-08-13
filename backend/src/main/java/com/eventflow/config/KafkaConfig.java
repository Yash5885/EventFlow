package com.eventflow.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KafkaConfig {

    @Bean
    NewTopic bookingConfirmedTopic() {
        return new NewTopic("booking.confirmed", 1, (short) 1);
    }

    @Bean
    NewTopic bookingExpiredTopic() {
        return new NewTopic("booking.expired", 1, (short) 1);
    }

    @Bean
    NewTopic bookingCancelledTopic() {
        return new NewTopic("booking.cancelled", 1, (short) 1);
    }

    @Bean
    NewTopic paymentRefundedTopic() {
        return new NewTopic("payment.refunded", 1, (short) 1);
    }

    @Bean
    NewTopic eventApprovedTopic() {
        return new NewTopic("event.approved", 1, (short) 1);
    }
}


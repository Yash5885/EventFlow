package com.eventflow.modules.payment;

import com.eventflow.common.exception.AppException;
import com.eventflow.common.exception.PaymentVerificationException;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Component
public class RazorpayGateway {
    public static final String DEMO_GATEWAY = "LOCAL_DEMO";

    private final RestClient client;
    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;
    private final boolean demo;

    public RazorpayGateway(@Value("${app.razorpay.key-id}") String keyId,
                           @Value("${app.razorpay.key-secret}") String keySecret,
                           @Value("${app.razorpay.webhook-secret:}") String webhookSecret,
                           @Value("${app.razorpay.demo:false}") boolean demoRequested, Environment environment) {
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.webhookSecret = webhookSecret;
        this.demo = demoRequested && environment.matchesProfiles("dev", "hosted-demo") && "rzp_test_local".equals(keyId);
        var timeouts = new SimpleClientHttpRequestFactory();
        timeouts.setConnectTimeout(Duration.ofSeconds(4));
        timeouts.setReadTimeout(Duration.ofSeconds(8));
        this.client = RestClient.builder().baseUrl("https://api.razorpay.com/v1")
                .defaultHeaders(headers -> headers.setBasicAuth(keyId, keySecret))
                .requestFactory(timeouts).build();
    }

    public String keyId() { return keyId; }
    public boolean demo() { return demo; }
    public boolean configured() {
        return demo || (keyId.startsWith("rzp_") && !"rzp_test_local".equals(keyId)
                && !keySecret.isBlank() && !"local_secret".equals(keySecret));
    }

    public String createOrder(UUID bookingId, BigDecimal amount, String currency) {
        if (demo) return "demo_" + bookingId;
        if (!configured()) throw unavailable();
        try {
            var result = client.post().uri("/orders").body(Map.of(
                    "receipt", bookingId.toString(), "amount", paise(amount), "currency", currency,
                    "partial_payment", false)).retrieve().body(JsonNode.class);
            String id = result == null ? "" : result.path("id").asText();
            if (!id.startsWith("order_")) throw unavailable();
            return id;
        } catch (RestClientException exception) {
            throw unavailable();
        }
    }

    public void verifyCheckoutSignature(Payment payment, String paymentId, String signature) {
        if (DEMO_GATEWAY.equals(payment.getGateway()) || !configured() || demo ||
                !validSignature((payment.getGatewayOrderId() + "|" + paymentId).getBytes(StandardCharsets.UTF_8), signature, keySecret)) {
            throw new PaymentVerificationException("Payment signature could not be verified");
        }
    }

    public void verifyCaptured(Payment payment, String paymentId) {
        if (!configured() || demo || !paymentId.matches("pay_[A-Za-z0-9]+")) {
            throw new PaymentVerificationException("Invalid gateway payment");
        }
        try {
            var result = client.get().uri("/payments/{id}", paymentId).retrieve().body(JsonNode.class);
            if (!matchesCapture(payment, result)) {
                throw new PaymentVerificationException("Payment has not been captured for this order and amount");
            }
        } catch (RestClientException exception) {
            throw unavailable();
        }
    }

    public boolean matchesCapture(Payment payment, JsonNode entity) {
        return entity != null && "captured".equals(entity.path("status").asText())
                && payment.getGatewayOrderId().equals(entity.path("order_id").asText())
                && payment.getCurrency().equals(entity.path("currency").asText())
                && entity.path("amount").asLong(-1) == paise(payment.getAmount());
    }

    public boolean verifyWebhook(byte[] body, String signature) {
        return !webhookSecret.isBlank() && validSignature(body, signature, webhookSecret);
    }

    private boolean validSignature(byte[] body, String signature, String secret) {
        if (signature == null || signature.length() != 64) return false;
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return MessageDigest.isEqual(mac.doFinal(body), HexFormat.of().parseHex(signature));
        } catch (GeneralSecurityException | IllegalArgumentException exception) {
            return false;
        }
    }

    private long paise(BigDecimal amount) { return amount.movePointRight(2).longValueExact(); }

    private AppException unavailable() {
        return new AppException(HttpStatus.SERVICE_UNAVAILABLE, "PAYMENT_UNAVAILABLE", "Payment checkout is temporarily unavailable");
    }
}

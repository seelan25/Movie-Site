package com.moviesite.backend.service;

import com.moviesite.backend.dto.PaymentDtos;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class RazorpayService {
    @Value("${app.razorpay.key-id:}")
    private String keyId;

    @Value("${app.razorpay.key-secret:}")
    private String keySecret;

    private final RestTemplate restTemplate = new RestTemplate();

    public PaymentDtos.CreateOrderResponse createOrder(PaymentDtos.CreateOrderRequest req) {
        Integer amount = req.amount() == null ? 0 : req.amount();
        String currency = (req.currency() == null || req.currency().isBlank()) ? "INR" : req.currency();

        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()) {
            return new PaymentDtos.CreateOrderResponse("order_" + UUID.randomUUID(), amount, currency);
        }

        String auth = Base64.getEncoder()
                .encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + auth);

        Map<String, Object> payload = new HashMap<>();
        payload.put("amount", amount);
        payload.put("currency", currency);
        payload.put("receipt", (req.receipt() == null || req.receipt().isBlank())
                ? "rcpt_" + UUID.randomUUID()
                : req.receipt());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        ResponseEntity<Map> response = restTemplate.exchange(
                "https://api.razorpay.com/v1/orders",
                HttpMethod.POST,
                entity,
                Map.class
        );

        Map<?, ?> body = response.getBody();
        String orderId = body != null && body.get("id") != null ? body.get("id").toString() : "order_" + UUID.randomUUID();
        Integer orderAmount = body != null && body.get("amount") != null
                ? Integer.parseInt(body.get("amount").toString())
                : amount;
        String orderCurrency = body != null && body.get("currency") != null
                ? body.get("currency").toString()
                : currency;

        return new PaymentDtos.CreateOrderResponse(orderId, orderAmount, orderCurrency);
    }
}

package com.moviesite.backend.dto;

public class PaymentDtos {
    public record CreateOrderRequest(Integer amount, String currency, String receipt) {}
    public record CreateOrderResponse(String orderId, Integer amount, String currency) {}

    public record TicketInformationRequest(
            String movieName,
            String saloonName,
            String movieDay,
            String movieStartTime,
            String email,
            String fullName,
            String phone,
            String chairNumbers,
            Integer movieSaloonTimeId,
            String razorpayOrderId,
            Integer amountPaise
    ) {}

    public record BookingSummaryResponse(
            Long bookingId,
            String bookingCode,
            String movieName,
            String movieDay,
            String movieStartTime,
            String cityName,
            String saloonName,
            String seats,
            Integer seatsCount,
            Integer amountPaise,
            String fullName,
            String email,
            String razorpayOrderId,
            String bookedAt
    ) {}
}

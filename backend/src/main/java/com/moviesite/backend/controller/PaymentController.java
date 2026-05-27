package com.moviesite.backend.controller;

import com.moviesite.backend.dto.PaymentDtos;
import com.moviesite.backend.service.BookingService;
import com.moviesite.backend.service.RazorpayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/movie")
@RequiredArgsConstructor
public class PaymentController {
    private final RazorpayService razorpayService;
    private final BookingService bookingService;

    @GetMapping("/bookings/occupied-seats/{movieSaloonTimeId}")
    public java.util.List<String> occupiedSeats(@PathVariable("movieSaloonTimeId") Integer movieSaloonTimeId) {
        return bookingService.getOccupiedSeats(movieSaloonTimeId);
    }

    @PostMapping("/payments/createOrder")
    public PaymentDtos.CreateOrderResponse createOrder(@RequestBody PaymentDtos.CreateOrderRequest req) {
        return razorpayService.createOrder(req);
    }

    @PostMapping("/payments/sendTicketDetail")
    public ResponseEntity<?> sendTicketDetail(@RequestBody PaymentDtos.TicketInformationRequest req) {
        try {
            PaymentDtos.BookingSummaryResponse summary = bookingService.reserveSeats(req);
            return ResponseEntity.ok(summary);
        } catch (BookingService.SeatConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/bookings/summary/{razorpayOrderId}")
    public PaymentDtos.BookingSummaryResponse bookingSummary(@PathVariable("razorpayOrderId") String razorpayOrderId) {
        return bookingService.getSummaryByOrderId(razorpayOrderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking summary not found"));
    }

    @GetMapping("/bookings/completed")
    public java.util.List<PaymentDtos.BookingSummaryResponse> completedBookings() {
        return bookingService.getCompletedBookings();
    }
}

package com.moviesite.backend.service;

import com.moviesite.backend.dto.PaymentDtos;
import com.moviesite.backend.model.BookedSeatEntity;
import com.moviesite.backend.model.BookingEntity;
import com.moviesite.backend.model.MovieSaloonTimeEntity;
import com.moviesite.backend.repository.BookedSeatRepository;
import com.moviesite.backend.repository.BookingRepository;
import com.moviesite.backend.repository.MovieSaloonTimeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {
    private final MovieSaloonTimeRepository movieSaloonTimeRepository;
    private final BookedSeatRepository bookedSeatRepository;
    private final BookingRepository bookingRepository;

    public List<String> getOccupiedSeats(Integer movieSaloonTimeId) {
        return bookedSeatRepository.findByMovieSaloonTimeId(movieSaloonTimeId).stream()
                .map(BookedSeatEntity::getSeatCode)
                .sorted()
                .toList();
    }

    @Transactional
    public PaymentDtos.BookingSummaryResponse reserveSeats(PaymentDtos.TicketInformationRequest req) {
        Integer mstId = req.movieSaloonTimeId();
        if (mstId == null) {
            throw new IllegalArgumentException("movieSaloonTimeId is required.");
        }

        MovieSaloonTimeEntity showtime = movieSaloonTimeRepository.findById(mstId)
                .orElseThrow(() -> new EntityNotFoundException("Showtime not found."));

        List<String> seats = parseSeats(req.chairNumbers());
        if (seats.isEmpty()) {
            throw new IllegalArgumentException("At least one seat is required.");
        }

        BookingEntity booking = new BookingEntity();
        booking.setMovieSaloonTime(showtime);
        booking.setFullName(req.fullName());
        booking.setEmail(req.email());
        booking.setMovieName(req.movieName());
        booking.setMovieDay(req.movieDay());
        booking.setMovieStartTime(req.movieStartTime());
        booking.setSaloonName(req.saloonName());
        booking.setChairNumbers(String.join(", ", seats));
        booking.setRazorpayOrderId(req.razorpayOrderId());
        booking.setAmountPaise(req.amountPaise());
        booking.setCreatedAt(LocalDateTime.now());

        List<BookedSeatEntity> seatRows = new ArrayList<>();
        for (String seat : seats) {
            BookedSeatEntity s = new BookedSeatEntity();
            s.setBooking(booking);
            s.setMovieSaloonTime(showtime);
            s.setSeatCode(seat);
            seatRows.add(s);
        }
        booking.setBookedSeats(seatRows);

        try {
            BookingEntity saved = bookingRepository.save(booking);
            return toSummary(saved);
        } catch (DataIntegrityViolationException e) {
            throw new SeatConflictException("Seat conflict — someone else booked these seats.");
        }
    }

    @Transactional(readOnly = true)
    public Optional<PaymentDtos.BookingSummaryResponse> getSummaryByOrderId(String razorpayOrderId) {
        if (razorpayOrderId == null || razorpayOrderId.isBlank()) {
            return Optional.empty();
        }
        return bookingRepository
                .findTopByRazorpayOrderIdOrderByCreatedAtDesc(razorpayOrderId)
                .map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public List<PaymentDtos.BookingSummaryResponse> getCompletedBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(b -> b.getRazorpayOrderId() != null && !b.getRazorpayOrderId().isBlank())
                .map(this::toSummary)
                .toList();
    }

    private List<String> parseSeats(String chairNumbers) {
        if (chairNumbers == null || chairNumbers.isBlank()) return List.of();
        return Arrays.stream(chairNumbers.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(s -> s.toUpperCase(Locale.ROOT))
                .distinct()
                .collect(Collectors.toList());
    }

    private PaymentDtos.BookingSummaryResponse toSummary(BookingEntity booking) {
        String cityName = booking.getMovieSaloonTime() != null && booking.getMovieSaloonTime().getSaloon() != null
                ? booking.getMovieSaloonTime().getSaloon().getCityName()
                : "";
        List<String> seats = parseSeats(booking.getChairNumbers());
        String bookingCode = "CV-" + booking.getId();
        return new PaymentDtos.BookingSummaryResponse(
                booking.getId(),
                bookingCode,
                booking.getMovieName(),
                booking.getMovieDay(),
                booking.getMovieStartTime(),
                cityName,
                booking.getSaloonName(),
                String.join(", ", seats),
                seats.size(),
                booking.getAmountPaise(),
                booking.getFullName(),
                booking.getEmail(),
                booking.getRazorpayOrderId(),
                booking.getCreatedAt() == null ? null : booking.getCreatedAt().toString()
        );
    }

    public static class SeatConflictException extends RuntimeException {
        public SeatConflictException(String message) {
            super(message);
        }
    }
}

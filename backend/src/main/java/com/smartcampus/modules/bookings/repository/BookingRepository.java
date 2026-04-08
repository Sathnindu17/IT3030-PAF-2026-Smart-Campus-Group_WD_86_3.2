package com.smartcampus.modules.bookings.repository;

import com.smartcampus.modules.bookings.entity.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByUserId(String userId);

    List<Booking> findByStatus(Booking.BookingStatus status);

    List<Booking> findByResourceId(String resourceId);

    List<Booking> findByDate(LocalDate date);

    List<Booking> findByUserIdAndStatus(String userId, Booking.BookingStatus status);

    // Find overlapping bookings for conflict detection
    @Query("{ 'resourceId': ?0, 'date': ?1, 'status': { $in: ['PENDING', 'APPROVED'] }, " +
           "'startTime': { $lt: ?3 }, 'endTime': { $gt: ?2 } }")
    List<Booking> findOverlappingBookings(String resourceId, LocalDate date,
                                          LocalTime startTime, LocalTime endTime);
}

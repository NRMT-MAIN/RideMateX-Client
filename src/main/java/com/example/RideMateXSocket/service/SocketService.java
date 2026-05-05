package com.example.RideMateXSocket.service;

import com.example.RideMateXSocket.dto.DriverNotificationDTO;
import com.example.RideMateXSocket.dto.RideRequestDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
@Slf4j
public class SocketService {
    private final SimpMessagingTemplate messagingTemplate;

    public void notifyDriverForNewRide(RideRequestDTO rideRequestDTO) {
        DriverNotificationDTO notification = DriverNotificationDTO.builder()
                .pickupLocationLatitude(rideRequestDTO.getPickupLocationLatitude())
                .pickupLocationLongitude(rideRequestDTO.getPickupLocationLongitude())
                .bookingId(rideRequestDTO.getBookingId())
                .build();

        for(Integer driverId : rideRequestDTO.getDriverIds()) {
            log.info("Notifying driver {} about new ride request {}", driverId, notification);
            messagingTemplate.convertAndSend("/topic/new-ride/" + driverId, notification);
        }
    }
}

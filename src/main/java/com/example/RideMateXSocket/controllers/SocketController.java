package com.example.RideMateXSocket.controllers;

import com.example.RideMateXSocket.client.GrpcClient;
import com.example.RideMateXSocket.dto.RideAcceptanceDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class SocketController {
    private final GrpcClient grpcClient;

    @MessageMapping("/ride-acceptance")
    public void recieveRideAcceptance(RideAcceptanceDTO rideAcceptanceDTO) {
        try {
            boolean success = grpcClient.acceptRide(rideAcceptanceDTO.getDriverId(), rideAcceptanceDTO.getBookingId());

            if(success) {
                log.info("Driver {} accepted ride {}", rideAcceptanceDTO.getDriverId(), rideAcceptanceDTO.getBookingId());
            } else {
                log.warn("Driver {} failed to accept ride {}", rideAcceptanceDTO.getDriverId(), rideAcceptanceDTO.getBookingId());
            }
        } catch (Exception e) {
            log.error("Error processing ride acceptance for driver {} and booking {}: {}",
                    rideAcceptanceDTO.getDriverId(),
                    rideAcceptanceDTO.getBookingId(),
                    e.getMessage());
            throw new RuntimeException(e);
        }


    }
}

package com.example.RideMateXSocket.controllers;

import com.example.RideMateXSocket.dto.RideAcceptanceDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class SocketController {

    @MessageMapping("/ride-acceptance")
    public void recieveRideAcceptance(RideAcceptanceDTO rideAcceptanceDTO) {
        log.info("Recieved Ride Acceptance");


    }
}

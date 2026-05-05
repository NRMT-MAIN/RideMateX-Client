package com.example.RideMateXSocket.service;

import com.example.RideMateXSocket.RideNotificationRequest;
import com.example.RideMateXSocket.RideNotificationResponse;
import com.example.RideMateXSocket.RideNotificationServiceGrpc;
import com.example.RideMateXSocket.dto.RideRequestDTO;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RideNotificationServiceImpl extends RideNotificationServiceGrpc.RideNotificationServiceImplBase {
    private final SocketService socketService;

    @Override
    public void notifyDriverForNewRide(RideNotificationRequest request, StreamObserver<RideNotificationResponse> responseObserver) {
        RideRequestDTO rideRequestDTO = RideRequestDTO.builder()
                .pickupLocationLatitude(request.getPickupLocationLatitude())
                .pickupLocationLongitude(request.getPickupLocationLongitude())
                .bookingId(request.getBookingId())
                .driverIds(request.getDriverIdsList())
                .build();

        socketService.notifyDriverForNewRide(rideRequestDTO);
        responseObserver.onNext(RideNotificationResponse.newBuilder().setSuccess(true).build());
        responseObserver.onCompleted();
    }
}

package com.example.RideMateXSocket.client;

import com.example.RideMateXSocket.RideAcceptanceRequest;
import com.example.RideMateXSocket.RideAcceptanceResponse;
import com.example.RideMateXSocket.RideServiceGrpc;
import io.grpc.ManagedChannel;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GrpcClient {
    @Value("${grpc.client.port:9090}")
    private int grpcClientPort;

    @Value("${grpc.client.host:localhost}")
    private String grpcClientHost;


    private ManagedChannel channel;
    private RideServiceGrpc.RideServiceBlockingStub rideServiceBlockingStub;


    @PostConstruct
    public void init() {
        channel = io.grpc.ManagedChannelBuilder.forAddress(grpcClientHost, grpcClientPort)
                .usePlaintext()
                .build();

        rideServiceBlockingStub = RideServiceGrpc.newBlockingStub(channel);
    }

        public boolean acceptRide(Integer bookingId, Integer driverId) {
            RideAcceptanceRequest request = RideAcceptanceRequest.newBuilder()
                    .setBookingId(bookingId)
                    .setDriverId(driverId)
                    .build();

            RideAcceptanceResponse response = rideServiceBlockingStub.acceptRide(request);
            return response.getSuccess();
        }

}

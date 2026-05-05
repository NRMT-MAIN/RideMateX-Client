package com.example.RideMateXSocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RideRequestDTO {
    private String pickupLocationLatitude;
    private String pickupLocationLongitude;
    private Integer bookingId;
    private List<Integer> driverIds;
}

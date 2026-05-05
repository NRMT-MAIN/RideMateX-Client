package com.example.RideMateXSocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RideAcceptanceDTO {
    private Integer driverId;
    private Integer bookingId;
}

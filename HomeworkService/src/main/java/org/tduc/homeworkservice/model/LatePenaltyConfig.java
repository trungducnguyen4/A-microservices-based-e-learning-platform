package org.tduc.homeworkservice.model;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LatePenaltyConfig {
    
    @Builder.Default
    Boolean enabled = false;
    
    @Builder.Default
    BigDecimal percentagePerDay = BigDecimal.ZERO;
    
    @Builder.Default
    BigDecimal percentagePerHour = BigDecimal.ZERO;
    
    @Builder.Default
    BigDecimal percentagePerMinute = BigDecimal.ZERO;
    
    @Builder.Default
    BigDecimal maxPenalty = new BigDecimal("1.0"); // Default max penalty is 100%
    
    @Builder.Default
    Integer gracePeriodMinutes = 0; // No grace period by default
}
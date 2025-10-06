package org.tduc.homeworkservice.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GradingRequest {
    
    @NotBlank(message = "Submission ID is required")
    String submissionId;
    
    @NotNull(message = "Score is required")
    @DecimalMin(value = "0.0", message = "Score must be non-negative")
    BigDecimal score;
    
    @DecimalMin(value = "0.0", message = "Percentage must be non-negative")
    @DecimalMax(value = "100.0", message = "Percentage must not exceed 100")
    BigDecimal percentage;
    
    String letterGrade;
    
    @Size(max = 2000, message = "Feedback must not exceed 2000 characters")
    String feedback;
    
    @NotBlank(message = "Graded by is required")
    String gradedBy;
}
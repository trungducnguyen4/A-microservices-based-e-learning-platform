package org.tduc.adminservice.service;

import org.springframework.stereotype.Service;
import org.tduc.adminservice.dto.response.AdminSummaryResponse;

@Service
public class AdminDashboardService {

    public AdminSummaryResponse getSummary() {
        // Placeholder values; replace with real aggregations via repositories or Feign clients
        return AdminSummaryResponse.builder()
                .totalUsers(0)
                .totalCourses(0)
                .totalHomeworks(0)
                .totalSchedules(0)
                .build();
    }
}

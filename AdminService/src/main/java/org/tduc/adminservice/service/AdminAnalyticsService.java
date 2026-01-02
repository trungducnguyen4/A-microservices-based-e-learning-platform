package org.tduc.adminservice.service;

import org.springframework.stereotype.Service;
import org.tduc.adminservice.dto.response.AdminSummaryResponse;

@Service
public class AdminAnalyticsService {

    public AdminSummaryResponse getSummary() {
        // TODO: Aggregate from other services (users, courses, etc.)
        return AdminSummaryResponse.builder()
                .totalUsers(0)
                .totalCourses(0)
                .totalHomeworks(0)
                .totalSchedules(0)
                .build();
    }
}

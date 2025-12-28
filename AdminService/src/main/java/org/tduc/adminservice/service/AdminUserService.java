package org.tduc.adminservice.service;

import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class AdminUserService {

    public List<Map<String, Object>> listUsers() {
        // TODO: Wire to UserService via Feign/RestTemplate or DB repository
        return Collections.emptyList();
    }
}

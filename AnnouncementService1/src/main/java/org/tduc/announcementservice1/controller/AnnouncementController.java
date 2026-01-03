package org.tduc.announcementservice1.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.tduc.announcementservice1.dto.request.AnnouncementCreationRequest;
import org.tduc.announcementservice1.dto.response.AnnouncementResponse;
import org.tduc.announcementservice1.service.AnnouncementService;
import org.tduc.announcementservice1.util.AuthContextUtil;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final AuthContextUtil authContextUtil;

    @PostMapping
    public ResponseEntity<AnnouncementResponse> create(@RequestBody @Valid AnnouncementCreationRequest req) {
        String userId = authContextUtil.getCurrentUserIdRaw();
        AnnouncementResponse res = announcementService.createAnnouncement(req, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<AnnouncementResponse>> getByCourse(@PathVariable String courseId) {
        return ResponseEntity.ok(announcementService.getAnnouncementsByCourse(courseId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnnouncementResponse> get(@PathVariable String id) {
        AnnouncementResponse a = announcementService.getAnnouncement(id);
        if (a == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(a);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.ok().build();
    }
}

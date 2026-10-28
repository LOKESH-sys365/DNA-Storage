package com.dna.storage.controller;

import com.dna.storage.model.DnaRecord;
import com.dna.storage.repository.DnaRecordRepository;
import com.dna.storage.service.PythonCodecService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Tag(name = "DNA Storage", description = "Upload, encode, damage-simulate and decode files as DNA")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/dna")
@RequiredArgsConstructor
public class DnaController {

    private final PythonCodecService codecService;
    private final DnaRecordRepository repository;

    @Operation(summary = "Upload a file -> encode to DNA (Reed-Solomon + XOR) -> simulate damage -> decode & repair")
    @PostMapping("/upload")
    public DnaRecord upload(@RequestParam("file") MultipartFile file,
                            @RequestParam(defaultValue = "42") long seed,
                            @RequestParam(name = "mutRate", defaultValue = "0.02") double mutRate,
                            @RequestParam(name = "indelRate", defaultValue = "0.005") double indelRate,
                            @RequestParam(name = "chunkLosses", defaultValue = "1") int chunkLosses,
                            Authentication authentication) throws Exception {
        Path tmp = Files.createTempFile("dna-upload-", "-" + file.getOriginalFilename());
        try {
            file.transferTo(tmp);
            Map<String, Object> report = codecService.run(tmp, seed, mutRate, indelRate, chunkLosses);

            DnaRecord record = new DnaRecord();
            record.setFileName(file.getOriginalFilename());
            record.setOwner(authentication.getName());
            record.setOriginalSize((int) report.get("originalSizeBytes"));
            record.setRsEncodedBytes((int) report.get("rsEncodedBytes"));
            record.setDnaLength((int) report.get("dnaLength"));
            record.setRecoveredPerfectly((boolean) report.get("recoveredPerfectly"));
            record.setRecoveredBytes((int) report.get("recoveredBytes"));
            record.setStats((Map<String, Object>) report.get("stats"));
            record.setDnaPreview((String) report.get("dnaPreview"));
            record.setDamagedPreview((String) report.get("damagedPreview"));
            record.setCreatedAt(Instant.now());
            return repository.save(record);
        } finally {
            Files.deleteIfExists(tmp);
        }
    }

    @Operation(summary = "List my previous simulations")
    @GetMapping
    public List<DnaRecord> mine(Authentication authentication) {
        return repository.findByOwnerOrderByCreatedAtDesc(authentication.getName());
    }

    @Operation(summary = "Get one simulation result by id")
    @GetMapping("/{id}")
    public DnaRecord one(@PathVariable String id) {
        return repository.findById(id).orElseThrow();
    }
}

package com.dna.storage.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Data
@Document("dna_records")
public class DnaRecord {

    @Id
    private String id;
    private String fileName;
    private String owner;
    private int originalSize;
    private int rsEncodedBytes;
    private int dnaLength;
    private boolean recoveredPerfectly;
    private int recoveredBytes;
    private Map<String, Object> stats;
    private String dnaPreview;
    private String damagedPreview;
    private Instant createdAt;
}

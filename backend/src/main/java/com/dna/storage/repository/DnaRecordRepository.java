package com.dna.storage.repository;

import com.dna.storage.model.DnaRecord;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DnaRecordRepository extends MongoRepository<DnaRecord, String> {
    List<DnaRecord> findByOwnerOrderByCreatedAtDesc(String owner);
}

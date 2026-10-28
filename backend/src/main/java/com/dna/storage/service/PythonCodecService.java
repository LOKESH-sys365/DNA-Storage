package com.dna.storage.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class PythonCodecService {

    private final String script;
    private final ObjectMapper mapper = new ObjectMapper();

    public PythonCodecService(@Value("${app.python.script}") String script) {
        this.script = script;
    }

    /** Runs: python3 dna_codec.py run --file <tmp> ... and parses the JSON report. */
    public Map<String, Object> run(Path file, long seed, double mutRate,
                                   double indelRate, int chunkLosses) throws Exception {
        ProcessBuilder pb = new ProcessBuilder("python3", script, "run",
                "--file", file.toAbsolutePath().toString(),
                "--seed", String.valueOf(seed),
                "--mut-rate", String.valueOf(mutRate),
                "--indel-rate", String.valueOf(indelRate),
                "--chunk-losses", String.valueOf(chunkLosses));
        pb.redirectErrorStream(true);
        Process process = pb.start();
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (!process.waitFor(120, TimeUnit.SECONDS)) {
            process.destroyForcibly();
            throw new IllegalStateException("DNA codec timed out");
        }
        if (process.exitValue() != 0) {
            throw new IllegalStateException("DNA codec failed: " + output);
        }
        return mapper.readValue(output, Map.class);
    }
}

package com.dna.storage.controller;

import com.dna.storage.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Auth", description = "Authentication endpoints")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtService jwtService;

    @Operation(summary = "Current user info (requires Bearer JWT)")
    @GetMapping("/me")
    public Map<String, String> me(Authentication authentication) {
        return Map.of("email", authentication.getName());
    }

    /** Demo-only login: bypass Google when app.dev-mode=true */
    @ConditionalOnProperty(name = "app.dev-mode", havingValue = "true")
    @PostMapping("/dev-token")
    public Map<String, String> devToken(@RequestParam(defaultValue = "demo@dnarchive.dev") String email) {
        return Map.of("token", jwtService.generate(email, "Demo User"));
    }
}

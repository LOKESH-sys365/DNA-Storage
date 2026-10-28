package com.dna.storage.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {

    private final Algorithm algorithm;
    private final long expiryMinutes;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiry-minutes}") long expiryMinutes) {
        this.algorithm = Algorithm.HMAC256(secret);
        this.expiryMinutes = expiryMinutes;
    }

    public String generate(String email, String name) {
        long now = System.currentTimeMillis();
        return JWT.create()
                .withSubject(email)
                .withClaim("name", name == null ? "" : name)
                .withIssuedAt(new Date(now))
                .withExpiresAt(new Date(now + expiryMinutes * 60_000))
                .sign(algorithm);
    }

    public DecodedJWT verify(String token) {
        JWTVerifier verifier = JWT.require(algorithm).build();
        return verifier.verify(token);
    }
}

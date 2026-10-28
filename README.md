# DNArchive — DNA Storage Simulator

Store files in (simulated) DNA: encode any file into A/C/G/T, damage it like real DNA
gets damaged, then prove Reed-Solomon error correction brings it back byte-for-byte.

## Architecture

```
React + Tailwind + Bootstrap (port 5173)
        │  Bearer JWT (after Google OIDC + PKCE login)
        ▼
Spring Boot 3 (port 8080) ── OAuth2/OIDC (Google, PKCE S256) ──► issues own JWT
   │ REST /api/dna/upload (multipart)          │
   │                                           ├── MongoDB (dna_records)
   ▼                                           └── Swagger UI (/swagger-ui.html)
Python codec (backend/python/dna_codec.py)
   Encode : bytes → Reed-Solomon(+32B parity/223B block) → XOR keystream scramble
            → 2 bits/base (00=A, 01=C, 10=G, 11=T) → DNA strand
   Damage : point mutations, insertions/deletions, lost chunks ("N")
   Decode : reverse map (frame re-sync) → un-XOR → RS repair (N = known erasures)
            → original bytes
```

The XOR keystream (deterministic seed, step 5 of the spec) is what keeps the strand
GC-balanced (~50%) and breaks long homopolymer runs (AAAAAA) without needing a complex
constrained coder — and it is 100% reversible before Reed-Solomon runs.

## Quickstart

Prereqs: JDK 17+, Maven, Node 18+, Python 3.9+, MongoDB running on localhost:27017.

```bash
# 1. Python codec deps
pip install -r backend/python/requirements.txt

# 2. Backend
export GOOGLE_CLIENT_ID=xxx        # Google Cloud Console → OAuth client (Web)
export GOOGLE_CLIENT_SECRET=xxx    # Authorized redirect: http://localhost:8080/login/oauth2/code/google
export JWT_SECRET="a-32+-char-random-secret"
cd backend && mvn spring-boot:run

# 3. Frontend
cd frontend && npm install && npm run dev
# open http://localhost:5173
```

No Google creds handy? Set `app.dev-mode: true` in `application.yml` and call
`POST /api/auth/dev-token` to mint a demo JWT.

## Try it

1. Log in with Google (PKCE S256 challenge is attached to the auth request;
   Spring Security exchanges the code and the backend issues a JWT).
2. Upload `hi.txt` on the New Simulation page (tune mutation/indel/chunk-loss sliders).
3. Watch the pipeline: **Encode → Damage → Repair**, with GC balance, damage rate,
   errors fixed and a base-coloured DNA preview (grey `N` = lost chunk).

Verify the mapping matches the spec: `python3 backend/python/dna_codec.py run --file hi.txt`.

## API (Swagger)

`http://localhost:8080/swagger-ui.html` — endpoints:
- `POST /api/dna/upload` — file + damage params → full encode/damage/decode report
- `GET  /api/dna` / `GET /api/dna/{id}` — your stored simulations
- `GET  /api/auth/me` — current JWT identity

## Notes & limits (educational demo)

- Default redundancy: 32 parity bytes per 223-byte RS block → up to 16 errors,
  or 32 known erasures (lost chunks) per block. Raise `NSYM` for harsher damage.
- A single insertion/deletion shifts the reading frame; the decoder tries both
  base alignments. Keep `--indel-rate` modest or increase redundancy.
- Keystream seed is hard-coded (both sides must share it) — in production, store a
  random seed per record in MongoDB and pass it to the codec.

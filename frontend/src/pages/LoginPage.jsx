export default function LoginPage() {
  return (
    <div className="min-vh-100 dna-bg d-flex align-items-center justify-content-center px-3">
      <div className="glass rounded-4 p-5 text-center" style={{ maxWidth: 440, width: "100%" }}>
        <div className="mb-2">
          <span className="fs-1 fw-bold text-white">
            DNA<span className="text-info">rchive</span>
          </span>
        </div>
        <p className="text-secondary mb-1">Store files in simulated DNA.</p>
        <p className="text-secondary small">
          Reed-Solomon error correction &middot; XOR scrambling &middot; damage simulation
        </p>
        <div className="d-flex justify-content-center gap-2 my-4">
          <span className="badge rounded-pill text-bg-dark border border-secondary">OAuth 2.0</span>
          <span className="badge rounded-pill text-bg-dark border border-secondary">OpenID Connect</span>
          <span className="badge rounded-pill text-bg-dark border border-secondary">PKCE</span>
          <span className="badge rounded-pill text-bg-dark border border-secondary">JWT</span>
        </div>
        <a href="/oauth2/authorization/google" className="btn btn-light btn-lg w-100 d-flex align-items-center justify-content-center gap-2">
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
          Continue with Google
        </a>
        <p className="text-secondary small mt-4 mb-0">
          Secured with Spring Security OIDC + S256 PKCE challenge
        </p>
      </div>
    </div>
  );
}

# Security Policy

## Reporting a vulnerability

Please report security issues privately via GitHub's **Report a vulnerability**
(Security → Advisories) on this repository, rather than opening a public issue.

## Scope

Flaky is a static single-page game served by nginx:

- There is no backend, account, or server-side state. The daily result lives
  only in the player's browser (`localStorage`).
- The page loads fonts from Google Fonts and nothing else from third parties.

Relevant reports concern the served page (for example script injection) and
the container image or its nginx configuration.

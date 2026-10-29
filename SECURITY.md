# Security Policy

## Supported versions

Security fixes land on the default branch (`main`). Only the latest release
is supported; upgrade before reporting.

## Reporting a vulnerability

**Do not open a public issue for security problems.**

Preferred: report it privately on GitHub, Security → Report a vulnerability.

Otherwise email **xexc@mail.ru**. Either way, include:

- a description of the vulnerability and its impact,
- the affected component(s) and version/commit,
- reproduction steps or a proof of concept,
- any suggested remediation.

You will get an acknowledgement within **5 business days**. Once the issue is
confirmed, a fix and disclosure timeline will be agreed with you. Please give a
reasonable window to ship a fix before any public disclosure.

## Scope

In scope: the served pages (for example script injection), the nginx
configuration, the analytics proxy, the compose manifests and the CI
configuration in this repository.

Out of scope: vulnerabilities in third-party dependencies (report those
upstream), and issues that require a misconfiguration explicitly warned against
in the docs.

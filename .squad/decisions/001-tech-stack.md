# ADR-001: Technology Stack

## Status: Accepted

## Context
We need to choose a tech stack for an internal developer platform that lets developers browse and deploy Azure reference architecture templates.

## Decision
- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Infrastructure as Code:** Bicep only (no Terraform/ARM JSON)
- **CI/CD:** GitHub Actions
- **Package management:** npm workspaces (monorepo)
- **GitHub integration:** Octokit REST client
- **Azure integration:** Azure SDK for JavaScript (@azure/identity, @azure/arm-resources)

## Rationale
- TypeScript end-to-end for type safety and developer experience
- Vite for fast frontend development
- Express for lightweight API with good ecosystem
- Bicep as the native Azure IaC language with first-class tooling
- Monorepo for simpler dependency management and atomic changes

## Consequences
- Team needs TypeScript proficiency
- Bicep-only limits multi-cloud scenarios (acceptable — Azure-focused platform)
- Monorepo means shared CI/CD pipeline

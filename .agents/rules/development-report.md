# Rule: Mandatory Development Report File

## Intent
Ensure that the user and all collaborators always have an immediate, persistent, and executed file in the project workspace recording all developments, code edits, and operational feature statuses.

## Requirement
Whenever completing a requested feature, modification cycle, or major task:
1. **Always Create or Update an Executed Report File**:
   - Maintain a file named `DEVELOPMENT_REPORT.md` in the project root (or update an existing `CHANGELOG.md`).
2. **Mandatory Sections in the Report**:
   - **Executive Summary**: High-level overview of the session's objectives and outcomes.
   - **Modifications & Edits Made**: Detailed breakdown per file of additions, refactorings, and removals.
   - **Ready & Operational Features**: Clear tabular status checklist indicating what is tested and ready to run.
   - **Next Steps / Roadmap**: Actionable list of remaining or upcoming items.
3. **Commit & Synchronize**:
   - Include the report file in project commits when pushing to source control.

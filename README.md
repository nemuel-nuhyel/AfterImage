CyberRange AI / AfterMath

Adversarial SOC Investigation Simulator

Status: In development

CyberRange AI is a portable, Docker-oriented training environment for Security Operations Center (SOC) investigations. It gives learners incomplete and sometimes misleading synthetic security data, then asks them to construct hypotheses, defend their evidence, manage uncertainty, and produce an incident report.

The project is designed to move beyond simple answer matching. Its long-term goal is to combine a deterministic investigation simulator with an AI-assisted scenario-generation and review system called Scenario Studio.

This repository is an active academic project. The implementation is the source of truth: features described as planned or proposed below are not presented as completed functionality.

Why this project exists

Traditional cybersecurity exercises often provide clean data and a clearly identifiable answer. Real SOC work is different:

Evidence is distributed across several log sources.

Events may be incomplete, noisy, or contradictory.

Analysts must distinguish malicious activity from false positives.

Findings must be supported with traceable evidence.

Conclusions often need to be explained to other people under time pressure.

CyberRange AI is intended to train those analytical skills in a reproducible and safe environment.

Core simulator

The simulator is built around an investigation workflow:

Select a security scenario.

Start an investigation session with a time limit.

Inspect synthetic authentication, firewall, and audit logs.

Mark relevant events as evidence and add analyst notes.

Form an assessment of what happened.

Build a report that references the evidence supporting each finding.

Receive structured feedback and scoring as the evaluation features mature.

The scenarios are synthetic. They are designed to contain realistic attack patterns, legitimate activity, red herrings, and evidence that must be correlated rather than interpreted in isolation.

Current implementation status

Area

Current status

FastAPI backend

Implemented foundation

Pydantic request and response validation

Implemented foundation

SQLAlchemy and SQLite persistence

Implemented foundation

Deterministic synthetic log generation

Implemented

Scenario selection and investigation sessions

Implemented/prototype

Log inspection

Implemented/prototype

Evidence marking and analyst notes

Implemented foundation

Report evidence-reference validation

Implemented foundation

React/Vite interface

Prototype and in progress

Basic investigation scoring

Prototype/in progress

AI devil's-advocate debate and advanced grading

Planned

Scenario Studio with LLM generation

Planned

Live NVD, MITRE ATT&CK, CISA KEV, and EPSS integrations

Planned

Isolated container-based labs

Planned expansion

Community submissions and human review

Deferred roadmap

Project architecture

flowchart LR
    UI["React / Vite UI"] --> API["FastAPI API"]
    API --> DB[("SQLite / SQLAlchemy")]
    API --> LOGS["Deterministic log synthesis"]
    API --> EVAL["Validation and evaluation"]
    STUDIO["Planned Scenario Studio"] -.-> API

The current foundation favors deterministic behavior and explicit validation so that an investigation can be reproduced during development and testing. AI-generated content is treated as untrusted input and is intended to pass through validation and review gates before becoming a published training scenario.

Technology stack

Backend: Python, FastAPI, Pydantic, SQLAlchemy

Database: SQLite for the current prototype

Frontend: React, Vite

Deployment direction: Docker and Docker Compose

Testing direction: Python automated tests, API tests, schema validation, and reproducibility checks

Planned AI layer: LLM structured-output generation, adversarial feedback, and quality review

Planned threat-intelligence sources: NVD CVE API, MITRE ATT&CK TAXII, CISA KEV, and FIRST EPSS

Scenario Studio - planned subsystem

Scenario Studio is the planned content-generation subsystem. It will support two controlled creation paths:

AI-generated scenarios

An author selects a topic, difficulty, and threat-intelligence source. The system then uses structured public threat intelligence to generate a fictional scenario containing:

A scenario narrative

Synthetic logs

Learning objectives

Relevant evidence

Red-herring events

Hidden events

Debate questions

An evaluation rubric

User-submitted scenarios

Users will be able to upload or paste scenario JSON. Submitted content will be validated and reviewed before publication. User submissions will always require human approval.

Planned review pipeline

flowchart TD
    D["Draft"] --> AI["Automated schema, safety, and quality review"]
    AI --> R["Needs revision"]
    AI --> H["Human review"]
    H --> A["Approved"]
    A --> P["Published"]
    H --> X["Rejected"]

The AI must never publish a scenario directly. A configurable auto-approval path may be considered for AI-generated content only when all quality dimensions meet the defined threshold and the safety checks pass completely. Community submissions remain subject to human review.

Safety guardrails

CyberRange AI is intended for defensive education and safe simulation. The planned Scenario Studio will enforce rules such as:

Allowed

RFC 1918 private IP addresses

Documentation domains such as example.com and test.local

Fictional companies and synthetic usernames

Synthetic logs that describe realistic security events

Normal cybersecurity terminology, including terms such as brute force and lateral movement

Blocked

Real victim organizations or identifiable personal data

Real credentials or secrets

Public target IP addresses

Malware code or payloads

Exploit commands and credential-theft instructions

Destructive commands

The system should distinguish between describing an attack pattern for learning and providing instructions to carry out an attack.

Quality and evaluation strategy

Evaluation is designed as a layered process rather than a single model score.

Current and deterministic checks

Request and response schema validation

Required-field validation

Safety and input checks

Evidence-reference validation in reports

Functional API tests

Deterministic log-generation and reproducibility checks

Planned scenario-quality review

Generated or uploaded scenarios will be assessed across ten dimensions:

Realism

Learning-objective clarity

Expected-answer fairness

Evidence sufficiency

Red-herring balance

Difficulty calibration

Safety

IP-address validation

Log generability

Debate-question quality

The planned academic evaluation compares learner performance on manually authored and AI-generated scenarios. The formal specification targets one manual scenario, three AI-generated scenarios, and a study with at least ten participants.

Roadmap

Simulator

Establish the FastAPI backend foundation

Add deterministic synthetic security-log generation

Add scenario and session foundations

Add evidence and report-validation foundations

Complete the production investigation workbench

Expand the scenario library

Add the AI devil's-advocate interaction

Finalize advanced grading and feedback

Scenario Studio

Integrate public threat-intelligence sources

Normalize CVE, ATT&CK, KEV, and EPSS data

Add structured LLM scenario generation

Add draft preview and editing

Implement safety checks

Implement automated quality review

Add review-status persistence and workflow transitions

Add human approval tools

Deferred product roadmap

Community scenario submissions

Multi-user deployment

Human review queue and moderation tools

Broader isolated training labs

Public scenario catalog

Local development

Prerequisites

Python 3.11 or newer

Node.js and npm

Docker Desktop or Docker Engine with Docker Compose

Run with Docker

git clone <repository-url>
cd <repository-directory>
docker compose up --build

The exact service names, ports, and environment variables may change while the project is under active development. Refer to the repository's Docker Compose file and application configuration for the current values.

Run the backend and frontend separately

The expected development split is:

# Backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
npm install
npm run dev

If the repository structure changes, use the commands documented beside the relevant backend and frontend package configuration.

Example API flow

The simulator exposes versioned API endpoints. A typical investigation begins by starting a session for a selected scenario:

POST /api/v1/scenarios/{scenario_id}/start

The session then acts as the boundary for investigation state, evidence selection, notes, report construction, and later evaluation.

Academic alignment

The project is being developed alongside the thesis topic:

AI-Assisted Generation and Validation of SOC Training Scenarios Using Public Threat Intelligence and Synthetic Forensic Logs

The main research questions are:

Can LLMs generate pedagogically sound SOC training scenarios from structured threat intelligence?

Which automated safety and quality checks are necessary to make generated scenarios realistic, fair, and safe?

Can adversarial AI feedback improve analytical reasoning compared with traditional grading?

The bachelor-level scope focuses on the simulator core, Scenario Studio v1, and the comparison of AI-generated and manually authored scenarios. Community publishing, multi-user deployment, and payment features are outside the initial thesis scope.

Design principles

Evidence before conclusions: findings should be traceable to observed events.

Reproducibility: deterministic synthetic data makes behavior testable.

Adversarial reasoning: the learner should defend a hypothesis, not only select an answer.

Safety by construction: generated content must be sanitized and reviewed.

Human oversight: AI can assist with generation and review, but it should not silently publish training content.

Progressive implementation: the working repository takes priority over proposed future architecture.

Disclaimer

CyberRange AI is an educational defensive-security project. It uses synthetic data and is not intended for attacking real systems, testing public targets, or handling real credentials or victim data.


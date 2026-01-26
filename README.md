# Alex — Agentic Learning Equities eXplainer

Multi-agent, enterprise-grade SaaS financial planning platform built for the **AI in Production** course.

![Alex](assets/alex.png)

## What this project does

Alex helps users understand and improve their portfolios via a team of collaborating AI agents:

- A **Planner** orchestrates the workflow.
- Specialized agents generate **instrument classifications**, **written portfolio analysis**, **charts**, and **retirement projections**.
- An autonomous **Researcher** continuously gathers market insights and stores them in a **vector knowledge base**.

The system is designed for production deployment on AWS: **Lambda**, **API Gateway**, **SQS**, **Aurora Serverless v2**, **App Runner**, **CloudFront**, and **S3 Vectors**.

## Repo layout

```
alex/
├── backend/             # Agent code + FastAPI API (multiple uv projects)
├── frontend/            # Next.js (Pages Router) + Clerk auth
├── terraform/           # Independent Terraform stacks by guide
└── scripts/             # Local dev + deploy/destroy helpers
```

## Agent collaboration overview

The **Planner (orchestrator)** coordinates the analysis workflow. A separate, scheduled **Researcher** runs independently to populate the knowledge base.

```mermaid
graph TB
    User[User Request] -->|Portfolio Analysis| Planner[Financial Planner<br/>Orchestrator Agent]

    Planner -->|Check Instruments| Tagger[InstrumentTagger<br/>Agent]
    Tagger -->|Classify Assets| DB[(Database)]

    Planner -->|Generate Analysis| Reporter[Report Writer<br/>Agent]
    Reporter -->|Markdown Reports| DB

    Planner -->|Create Visualizations| Charter[Chart Maker<br/>Agent]
    Charter -->|JSON Chart Data| DB

    Planner -->|Project Future| Retirement[Retirement Specialist<br/>Agent]
    Retirement -->|Income Projections| DB

    DB -->|Results| Response[Complete Analysis<br/>Report]

    Planner -->|Retrieve Context| Vectors[(S3 Vectors<br/>Knowledge Base)]

    Schedule[EventBridge<br/>Every 2 Hours] -->|Trigger| Researcher[Researcher<br/>Agent]
    Researcher -->|Store Insights| Vectors
    Researcher -->|Web Research| Browser[Web Browser<br/>MCP Server]
```

### Agent responsibilities (high level)

- **Planner (Orchestrator)**: owns job lifecycle, calls other agents, merges outputs, retrieves research context.
- **InstrumentTagger**: structured classification (asset class / region / sector) for instruments.
- **Report Writer**: narrative analysis + recommendations (markdown).
- **Chart Maker**: produces chart-ready JSON for the UI.
- **Retirement Specialist**: projections and simulations.
- **Researcher (autonomous)**: periodic web research, stores insights in S3 Vectors.

## System architecture

### Research + knowledge ingestion (S3 Vectors pipeline)

This is the core knowledge pipeline described in `guides/architecture.md`.

```mermaid
graph TB
    APIGW[API Gateway<br/>REST API<br/>API Key Auth]

    Lambda[Lambda<br/>alex-ingest<br/>Document Processing]
    AppRunner[App Runner<br/>alex-researcher<br/>AI Agent Service]

    EventBridge[EventBridge Scheduler<br/>Every 2 Hours]
    SchedulerLambda[Lambda<br/>alex-scheduler<br/>Trigger Research]

    SageMaker[SageMaker<br/>Embedding Model<br/>all-MiniLM-L6-v2]
    Bedrock[AWS Bedrock<br/>LLM Inference]

    S3Vectors[S3 Vectors<br/>Vector Storage]
    ECR[ECR<br/>Researcher Images]

    AppRunner -->|Generate| Bedrock
    AppRunner -->|Store Research via API| APIGW
    APIGW -->|Invoke| Lambda

    EventBridge -->|Every 2hrs| SchedulerLambda
    SchedulerLambda -->|Call /research/auto| AppRunner

    Lambda -->|Get Embeddings| SageMaker
    Lambda -->|Store Vectors| S3Vectors

    AppRunner -.->|Pull Image| ECR
```

### End-to-end product flow (frontend → API → agents)

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant CF as CloudFront + S3 (Frontend)
    participant API as API Gateway
    participant Fast as FastAPI (Lambda)
    participant DB as Aurora Serverless v2 (Data API)
    participant Q as SQS (Planner Queue)
    participant P as Planner (Lambda)
    participant T as Tagger (Lambda)
    participant R as Reporter (Lambda)
    participant C as Charter (Lambda)
    participant Rt as Retirement (Lambda)
    participant V as S3 Vectors (Knowledge)

    U->>CF: Load app + sign in (Clerk)
    U->>API: Call /api/* with JWT
    API->>Fast: Invoke alex-api
    Fast->>DB: Read/write user + accounts
    Fast->>Q: Enqueue analysis job
    Q->>P: Trigger planner
    P->>DB: Load portfolio + preferences
    P->>V: Retrieve relevant research context
    alt Missing instrument classifications
      P->>T: Classify instruments
      T->>DB: Save classifications
    end
    par Parallel agent execution
      P->>R: Generate report
      R->>DB: Save report markdown
    and
      P->>C: Build chart data
      C->>DB: Save charts JSON
    and
      P->>Rt: Run projections
      Rt->>DB: Save projections
    end
    P->>DB: Mark job complete
    Fast-->>U: Job status + results available
```

## Enterprise-grade enhancements


### Scalability
- **Lambda scaling**: tune memory/timeout, optionally set reserved concurrency for predictable capacity.
- **Aurora Serverless v2**: adjust min/max ACUs for cost vs throughput.
- **API Gateway throttling**: protect downstream services and control cost under bursty traffic.

### Security
- **Least-privilege IAM** per service.
- **JWT auth with Clerk** (+ JWKS rotation).
- **Secrets Manager** for database creds and sensitive config.
- Optional upgrades:
  - **AWS WAF** (rate limiting + managed rules like SQLi/XSS)
  - **VPC endpoints** (private connectivity to AWS services)
  - **GuardDuty** (threat detection)

### Monitoring & reliability
- **CloudWatch dashboards + alarms** (errors, duration, throttles, queue depth, etc.).
- **SQS DLQ monitoring** for failed orchestration messages.

### Guardrails
- Input validation and sanitization (prompt-injection awareness).
- Output validation (e.g., chart JSON schema checks).
- Response size limits and retry/backoff patterns for transient failures.

### Explainability
- Require “rationale” alongside structured outputs (e.g., Tagger) to make decisions auditable.
- Optional audit trail patterns for compliance.

### Observability
- End-to-end tracing with **LangFuse** (token usage, latency, agent spans), designed to flush traces correctly in Lambda.

## Local development

From the `scripts/` directory:

```bash
cd scripts
uv run run_local.py
```

This starts:
- Frontend: `http://localhost:3000` (or next available port)
- Backend API: `http://localhost:8000` (`/docs` for OpenAPI)

## Production deployment

Follow the guides in order (each Terraform folder is independent):

1. `guides/1_permissions.md` → `terraform/1_permissions` (if present)
2. `guides/2_sagemaker.md` → `terraform/2_sagemaker`
3. `guides/3_ingest.md` → `terraform/3_ingestion`
4. `guides/4_researcher.md` → `terraform/4_researcher`
5. `guides/5_database.md` → `terraform/5_database`
6. `guides/6_agents.md` → `terraform/6_agents`
7. `guides/7_frontend.md` → `terraform/7_frontend`
8. `guides/8_enterprise.md` → `terraform/8_enterprise`

## Notes for pushing to GitHub

- Do **not** commit secrets (`.env`, `.env.local`, Terraform state, etc.).
- If you’re publishing publicly, treat AWS account IDs and ARNs as sensitive context too.

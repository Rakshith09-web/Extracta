import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_element(name):
    return OxmlElement(name)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_table_borders(table, color="D3D3D3"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="{color}"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def make_callout(doc, text_p_list, title="KEY PRINCIPLE", border_color="1E3A8A", bg_color="F0F4F8"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    run_t = p.add_run(f"📌 {title}\n")
    run_t.font.name = 'Calibri'
    run_t.font.size = Pt(10.5)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    for item in text_p_list:
        p2 = cell.add_paragraph()
        p2.paragraph_format.space_before = Pt(2)
        p2.paragraph_format.space_after = Pt(3)
        p2.paragraph_format.line_spacing = 1.15
        r = p2.add_run(item)
        r.font.name = 'Calibri'
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def style_heading(p, text, level=1):
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.bold = True
    
    if level == 1:
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(0x0F, 0x2A, 0x4A) # Deep Navy
    elif level == 2:
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A) # Primary Blue
    elif level == 3:
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(2)
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0x25, 0x63, 0xEB) # Slate Blue

def add_body_p(doc, text="", bold_prefix="", space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_b = p.add_run(bold_prefix)
        r_b.font.name = 'Calibri'
        r_b.font.size = Pt(10.5)
        r_b.font.bold = True
        r_b.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    if text:
        r_t = p.add_run(text)
        r_t.font.name = 'Calibri'
        r_t.font.size = Pt(10.5)
        r_t.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    return p

def add_bullet_p(doc, text, bold_prefix=""):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_b = p.add_run(bold_prefix)
        r_b.font.name = 'Calibri'
        r_b.font.size = Pt(10)
        r_b.font.bold = True
        r_b.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    if text:
        r_t = p.add_run(text)
        r_t.font.name = 'Calibri'
        r_t.font.size = Pt(10)
        r_t.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    return p

def create_styled_table(doc, headers, data, col_widths=None):
    table = doc.add_table(rows=len(data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table)
    
    # Header row
    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        set_cell_background(hdr_cells[i], "1E3A8A")
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
        for p in hdr_cells[i].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = 'Calibri'
                r.font.size = Pt(10)
                r.font.bold = True
                r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                
    # Data rows
    for r_idx, row in enumerate(data):
        row_cells = table.rows[r_idx + 1].cells
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], bg)
            set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=120, right=120)
            for p in row_cells[c_idx].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for r in p.runs:
                    r.font.name = 'Calibri'
                    r.font.size = Pt(9.5)
                    r.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
                    
    if col_widths:
        for row in table.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = Inches(width)
                
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    return table

def generate_document():
    doc = Document()
    
    # Page Setup
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    # Document Title & Header
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    r_title = title_p.add_run("Product Requirements Document (PRD) &\nTechnical Architecture Specification")
    r_title.font.name = 'Calibri'
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x0F, 0x2A, 0x4A)
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(2)
    sub_p.paragraph_format.space_after = Pt(14)
    r_sub = sub_p.add_run("Project: CRM Sales AI Platform | Release Version: 1.0 Enterprise")
    r_sub.font.name = 'Calibri'
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    # Metadata Box
    meta_headers = ["Document Version", "Product Scope", "Target Audience", "Status"]
    meta_data = [
        ["v1.0 (Enterprise PRD + TAD)", "AI-Powered B2B CRM Sales Copilot", "Product, Engineering, Sales Ops, Leadership", "Approved for Review"]
    ]
    create_styled_table(doc, meta_headers, meta_data, col_widths=[1.5, 2.3, 2.0, 1.2])

    # -------------------------------------------------------------
    # SECTION 1: EXECUTIVE SUMMARY & BUSINESS JUSTIFICATION
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "1. Executive Summary & Business Justification", level=1)
    
    add_body_p(doc, 
        "Modern enterprise sales professionals spend as much as 30% to 40% of their working hours trapped in administrative overhead: "
        "logging calls, manually transcribing meeting takeaways, searching through fragmented email threads, updating stages, and guessing at "
        "pipeline risk. This administrative burden directly impacts revenue—stalling active deals and causing deal slippage across quarters.",
        bold_prefix="The Business Problem: "
    )
    
    add_body_p(doc, 
        "The CRM Sales AI Platform transforms passive CRM databases into an active, intelligent partner. By combining an Enterprise LLM Gateway, "
        "Permission-Aware Retrieval-Augmented Generation (RAG), and deterministic tool invocation, the platform provides proactive pipeline risk detection, "
        "automated pre-call briefings, context-aware email drafting, and audited CRM record synchronization.",
        bold_prefix="The Solution: "
    )
    
    add_body_p(doc, 
        "Unlike generic generative AI assistants, this system is deeply enterprise-grounded. It executes actions under strict Role-Based Access Controls (RBAC), "
        "enforces hard human approval gates for critical actions (e.g., pricing, contract revisions, and outbound communications), and logs every tool invocation "
        "for continuous auditability.",
        bold_prefix="Enterprise Safeguards: "
    )
    
    # -------------------------------------------------------------
    # SECTION 2: TARGET USER PERSONAS & PAIN POINTS
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "2. Target User Personas & Pain Points", level=1)
    
    persona_headers = ["Persona", "Core Responsibilities", "Primary Pain Points", "Key AI Copilot Capabilities"]
    persona_data = [
        [
            "Account Executive (AE)",
            "Closing mid-market & enterprise pipeline; negotiating contracts and managing client relationships.",
            "Spends 45+ minutes prepping for each prospect meeting; struggles to spot stalled deals across 30+ opportunities.",
            "Automated account briefing, risk & stagnation alerts, contextual follow-up drafting, one-click meeting logging."
        ],
        [
            "Sales Development Rep (SDR)",
            "Prospecting, qualifying inbound/outbound leads, and booking initial discovery calls.",
            "High context-switching between LinkedIn, email, and CRM; generic templates result in low reply rates.",
            "Semantic lead scoring, automated ICP qualification, hyper-personalized outreach suggestions based on recent signals."
        ],
        [
            "Sales Manager / VP",
            "Pipeline forecasting, team quota attainment, coaching reps, and reviewing deal approvals.",
            "Forecast blind spots; reps hold outdated opportunity close dates and probabilities without management visibility.",
            "Automated pipeline risk rollups, forecast discrepancy analysis, fast approval queue for rep-proposed actions."
        ],
        [
            "Sales Ops / CRM Admin",
            "Data hygiene, CRM compliance, security configuration, and multi-tenant access control.",
            "AI hallucinations writing corrupt data into production; unauthorized reps seeing cross-territory data.",
            "Strict RBAC/tenant-scoped retrieval, mandatory Human-in-the-Loop gates, full end-to-end audit trail of tool runs."
        ]
    ]
    create_styled_table(doc, persona_headers, persona_data, col_widths=[1.3, 1.6, 1.8, 2.0])

    # -------------------------------------------------------------
    # SECTION 3: PRODUCT SCOPE & FEATURE MATRIX (MoSCoW)
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "3. Product Scope & Functional Requirements", level=1)
    
    add_body_p(doc, "To ensure delivery excellence and risk control, platform capabilities are divided strictly into a Minimum Viable Product (MVP v1.0) and future iterations:")
    
    scope_headers = ["Requirement Category", "Priority", "Feature Description", "Acceptance Criteria"]
    scope_data = [
        ["Deal Risk Intelligence", "Must Have (v1)", "Identify pipeline opportunities with inactivity, delayed close dates, or lost executive sponsorship.", "Flags deals with >14 days inactivity and presents actionable reasons with cited CRM records."],
        ["Permission-Aware RAG", "Must Have (v1)", "Retrieve knowledge from notes, emails, support tickets, and pricing rules strictly respecting user RBAC.", "Users never see data from accounts outside their assigned territory or tenant."],
        ["Controlled Tool Execution", "Must Have (v1)", "Execute safe CRM mutations (create task, update stage, log meeting note) via structured schema tools.", "All tool calls validate parameter schemas and provide rollback tokens."],
        ["Human-in-the-Loop (HITL)", "Must Have (v1)", "Approval gateway for high-stakes actions (sending customer emails, updating deal values >$50k).", "Generates pending state in database; executes only upon signed user/manager confirmation."],
        ["Audit & Observability", "Must Have (v1)", "End-to-end tracing of prompt, context, tool calls, user decisions, and token consumption.", "Logs every run with trace ID, user ID, tenant ID, and latency metrics."],
        ["Calendar & Email Sync", "Should Have (v1.1)", "Deep bi-directional integration with Google Workspace and Microsoft 365 Outlook.", "Pre-reads incoming customer threads and suggests draft responses inside the CRM mail composer."],
        ["Direct Autonomous Outbound", "Won't Have (v1)", "Sending unreviewed cold emails or communicating with external leads without rep review.", "Zero unreviewed external communications permitted by system architecture."]
    ]
    create_styled_table(doc, scope_headers, scope_data, col_widths=[1.5, 1.1, 2.4, 2.0])

    # -------------------------------------------------------------
    # SECTION 4: SUCCESS METRICS & BUSINESS KPIS
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "4. Measurable Success Metrics & KPIs", level=1)
    
    kpi_headers = ["Metric Category", "Target Objective", "Measurement Method", "Target Benchmark"]
    kpi_data = [
        ["Sales Productivity", "Reduce manual CRM data entry and prep time", "Time-motion study & telemetry on session duration", "Save ≥ 3 hours/rep/week"],
        ["User Adoption", "Weekly Active Rep engagement", "Percentage of active AEs/SDRs invoking AI weekly", "≥ 70% weekly active usage"],
        ["Recommendation Accuracy", "Rep acceptance rate of AI suggestions", "Ratio of accepted vs dismissed AI recommendations", "≥ 80% acceptance rate"],
        ["Pipeline Velocity", "Decrease days spent in stalled stages", "CRM opportunity duration metrics", "15% reduction in deal stall duration"],
        ["Data Security & Safety", "Zero unauthorized data leaks or corrupted data", "Security audits and automated regression testing", "0 cross-tenant/cross-role leak incidents"]
    ]
    create_styled_table(doc, kpi_headers, kpi_data, col_widths=[1.5, 1.8, 2.0, 1.4])

    # -------------------------------------------------------------
    # SECTION 5: SYSTEM ARCHITECTURE & COMPONENT TOPOLOGY
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "5. High-Level Technical Architecture", level=1)
    
    add_body_p(doc, 
        "The architecture decouples the front-end user experience from model orchestration, retrieval pipelines, and core CRM databases. "
        "This ensures that LLM provider outages, rate limits, or context variations never disrupt the primary CRM transactional system."
    )
    
    make_callout(doc, [
        "1. Presentation Layer: Web CRM UI (React/Next.js) with real-time SSE streaming for interactive chat and embedded contextual widgets.",
        "2. Security & Identity: OAuth 2.0 / OIDC identity validation and strict Tenant/RBAC policy enforcement on every inbound payload.",
        "3. AI Gateway: Enterprise proxy managing prompt templates, rate limiting, token budgets, model fallback routing, and PII anonymization.",
        "4. Agent Orchestrator: State machine coordinating intent classification, iterative retrieval, tool execution, and approval suspension.",
        "5. Permission-Aware Context Engine: Combines vector similarity search with SQL metadata permission filters before feeding prompt context.",
        "6. Deterministic Tool Bus: Validated APIs for interacting with CRM databases, Google/Office365 calendars, ERP, and email dispatchers.",
        "7. Governance & Audit: Immutable ledger recording all prompts, retrieved documents, tool payloads, approvals, and outcomes."
    ], title="ARCHITECTURAL FLOW & LAYER RESPONSIBILITIES")

    # -------------------------------------------------------------
    # SECTION 6: LLM GATEWAY & ROUTING STRATEGY
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "6. Enterprise LLM Gateway & Routing Strategy", level=1)
    
    add_body_p(doc, 
        "To prevent single-vendor lock-in, manage enterprise API costs, and guarantee high availability, the platform operates behind a centralized LLM Gateway."
    )
    
    add_bullet_p(doc, "Route fast, simple tasks (e.g., entity extraction, intent detection) to lightweight models (e.g., Claude 3.5 Haiku / GPT-4o-mini). Complex reasoning, deal risk analysis, and multi-step tool calls are routed to high-capacity frontier models (e.g., Claude 3.5 Sonnet / GPT-4o).", bold_prefix="Tiered Model Routing: ")
    add_bullet_p(doc, "If the primary LLM provider suffers an outage, rate limit (HTTP 429), or latency spike (>5s), the gateway automatically falls back to an alternate enterprise provider without dropping user state.", bold_prefix="Automated Failover: ")
    add_bullet_p(doc, "All inbound customer messages and notes pass through automated regex and NER masking to scrub customer credit cards, social security numbers, or sensitive PII prior to model ingress.", bold_prefix="PII & Secrets Scrubbing: ")
    add_bullet_p(doc, "Per-team token limits, budget alerts, and real-time inference cost tracking per sales organization.", bold_prefix="Cost & Token Accounting: ")

    # -------------------------------------------------------------
    # SECTION 7: PERMISSION-AWARE RAG & CONTEXT ENGINE
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "7. Permission-Aware RAG & Context Engine", level=1)
    
    add_body_p(doc, 
        "The Context Engine replaces naive vector search with a secure, permission-filtered retrieval architecture. In enterprise B2B sales, "
        "an account executive in Region A must never retrieve deals or pricing notes belonging to Region B, even if the semantic query matches perfectly."
    )
    
    style_heading(doc.add_paragraph(), "Ingestion & Partitioning Pipeline", level=2)
    add_bullet_p(doc, "Extract text from customer emails, call transcripts, pricing docs, PDFs, support tickets, and meeting summaries.", bold_prefix="1. Multichannel Ingestion: ")
    add_bullet_p(doc, "Sanitize whitespace, remove redundant HTML tags, and redact confidential credential tokens.", bold_prefix="2. Document Normalization: ")
    add_bullet_p(doc, "Split documents using semantic boundary chunking (512–1024 tokens) with a 10% overlap to preserve conversational context.", bold_prefix="3. Context-Preserving Chunking: ")
    add_bullet_p(doc, "Every chunk is stamped with immutable metadata: {tenant_id, account_id, owner_id, territory_id, security_clearance, updated_at}.", bold_prefix="4. Metadata Stamping: ")
    add_bullet_p(doc, "Vectors are stored in PostgreSQL using the pgvector extension with HNSW indexing for sub-50ms similarity search.", bold_prefix="5. Secure Vector Storage: ")

    style_heading(doc.add_paragraph(), "Permission-Filtered Retrieval Algorithm", level=2)
    add_body_p(doc, 
        "When an AI request arrives, the engine retrieves the requesting user's security token and injects hard SQL filter constraints into the vector query: "
        "`WHERE tenant_id = :user_tenant AND (owner_id = :user_id OR territory_id IN (:user_territories))`. Only chunks passing this security boundary "
        "are returned to the LLM's context window. This guarantees zero possibility of cross-territory data contamination."
    )

    # -------------------------------------------------------------
    # SECTION 8: TOOL DEFINITIONS & SAFE FUNCTION CALLING
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "8. Tool Definitions & API Execution Schema", level=1)
    
    add_body_p(doc, 
        "The LLM is strictly prohibited from executing raw SQL queries or modifying production tables directly. "
        "All environment interactions occur through deterministic, strongly-typed tool APIs equipped with input validation and idempotency tokens."
    )
    
    tool_headers = ["Category", "Function Signature", "Description & Safety Mechanism"]
    tool_data = [
        ["Customer", "get_customer(customer_id)\nsearch_customers(query, filters)", "Retrieves customer profile, assigned rep, open tickets, and contract status. Read-only."],
        ["Lead", "qualify_lead(lead_id, score, reasons)\nassign_lead(lead_id, rep_id)", "Evaluates inbound lead against ICP and routes to territory owner. Validates schema before commit."],
        ["Opportunity", "get_opportunities(filters)\ncalculate_probability(opp_id)\nchange_stage(opp_id, new_stage)", "Analyzes deal velocity, stage progression, and risk factors. High-value stage updates require confirmation."],
        ["Activity", "create_task(opp_id, title, due_date)\nschedule_followup(contact_id, date, notes)", "Creates CRM task objects and calendar invitations. Fully idempotent to prevent duplicate tasks."],
        ["Analytics", "get_pipeline_health(rep_id, quarter)\nget_conversion_rate(timeframe)", "Aggregates revenue forecasts, conversion trends, and quota attainment summaries. Read-only."]
    ]
    create_styled_table(doc, tool_headers, tool_data, col_widths=[1.2, 2.6, 3.2])

    # -------------------------------------------------------------
    # SECTION 9: GUARDRAILS, SAFETY & COMPLIANCE CONTROLS
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "9. Multi-Layer Guardrails & Safety Controls", level=1)
    
    add_body_p(doc, "The platform incorporates a three-tiered guardrail defense model to safeguard system integrity and enterprise data:")
    
    add_bullet_p(doc, "Inspects user queries for jailbreak patterns, prompt injections, unauthorized administrative commands, and malicious payloads.", bold_prefix="1. Ingress Guardrails: ")
    add_bullet_p(doc, "Every tool execution verifies API scopes, validates JSON schemas with Pydantic, checks rate limits, and requires unique idempotency keys.", bold_prefix="2. Execution Guardrails: ")
    add_bullet_p(doc, "Responses are cross-referenced against retrieved source documents. If factual claims cannot be grounded in CRM data, the system flags the statement or falls back gracefully rather than hallucinating.", bold_prefix="3. Egress Guardrails: ")

    # -------------------------------------------------------------
    # SECTION 10: HUMAN-IN-THE-LOOP (HITL) WORKFLOW
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "10. Human-in-the-Loop (HITL) & State Machine", level=1)
    
    add_body_p(doc, 
        "Autonomous agents must never make unilateral, irreversible decisions that impact customer relationships or financial commitments. "
        "The system classifies every action into low, medium, or high risk, enforcing human sign-off where appropriate."
    )
    
    hitl_headers = ["Risk Tier", "Action Types", "Approval Requirement", "Execution Mechanism"]
    hitl_data = [
        ["Tier 1: Read-Only", "Search records, view risk analysis, summarize notes", "No Approval Required", "Executed immediately in real-time streaming."],
        ["Tier 2: Low-Impact Mutation", "Create internal follow-up task, add meeting note, update lead status", "Implicit Rep Confirmation", "Executed with a 10-second undo toast notification in the UI."],
        ["Tier 3: High-Impact External", "Send customer-facing email, propose contract terms, modify deal value >$50k", "Explicit Human Approval Gate", "Agent enters suspended state; creates actionable approval card with full diff and rationale."]
    ]
    create_styled_table(doc, hitl_headers, hitl_data, col_widths=[1.5, 2.2, 1.8, 1.5])
    
    add_body_p(doc, 
        "State Persistence & Escalation: Approval state is managed in a durable workflow engine (Temporal / LangGraph Checkpointer). "
        "If an approval request is not acted on within 24 hours, the request automatically expires, notifications are dispatched to the assigned rep, "
        "and no destructive action is committed.",
        bold_prefix="Timeout & Fallback Handling: "
    )

    # -------------------------------------------------------------
    # SECTION 11: END-TO-END SCENARIO WALKTHROUGH
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "11. End-to-End Enterprise Scenario Walkthrough", level=1)
    
    add_body_p(doc, "Scenario: An Account Executive asks: “Which of my key Q3 enterprise deals are at risk of slipping, and what should I do today?”", bold_prefix="Real-World Use Case: ")
    
    add_bullet_p(doc, "The web client passes the JWT session to the backend. The system validates AE identity, tenant ID (Acme Corp), and assigned accounts.", bold_prefix="Step 1 - Authentication & RBAC Check: ")
    add_bullet_p(doc, "The LLM Gateway parses the intent: Pipeline Risk Analysis + Remediation Recommendations.", bold_prefix="Step 2 - Intent Understanding: ")
    add_bullet_p(doc, "The agent invokes `get_opportunities(owner_id='AE_102', stage='Negotiation', close_date='Q3')` returning 8 active deals.", bold_prefix="Step 3 - Data Retrieval: ")
    add_bullet_p(doc, "The Context Engine searches recent emails and meeting notes for those 8 accounts. It uncovers that the champion at 'GlobalLogistics Corp' resigned two weeks ago, and no meeting has occurred since.", bold_prefix="Step 4 - Semantic Context Retrieval: ")
    add_bullet_p(doc, "The model cross-references deal value ($120k), days inactive (18 days), and champion loss. It flags 'GlobalLogistics' as High Risk.", bold_prefix="Step 5 - Risk Evaluation: ")
    add_bullet_p(doc, "The copilot displays a risk breakdown card explaining: 'Champion departed; 18 days without touchpoint.' It recommends reaching out to the VP of Operations and presents a pre-drafted personalized email.", bold_prefix="Step 6 - Recommendation & Draft Generation: ")
    add_bullet_p(doc, "Because sending an external email is a Tier 3 action, the system halts. It presents the draft to the AE with an [Approve & Send] button. The AE edits two sentences and clicks Approve.", bold_prefix="Step 7 - Human-in-the-Loop Approval: ")
    add_bullet_p(doc, "The email is dispatched via the CRM email tool, a CRM task is logged, and the entire audit trace is committed to the database.", bold_prefix="Step 8 - Execution & Audit: ")

    # -------------------------------------------------------------
    # SECTION 12: SYSTEM EVALUATION, OBSERVABILITY & SLAS
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "12. Evaluation Framework, Observability & SLAs", level=1)
    
    eval_headers = ["Evaluation Metric", "Target Threshold", "Measurement Tooling", "Corrective Action on Breach"]
    eval_data = [
        ["Interactive Response Latency", "P95 < 2.5 seconds (first token < 800ms)", "OpenTelemetry / Prometheus", "Optimize RAG chunk retrieval, enable model token streaming"],
        ["Workflow Completion Time", "Multi-step agent tasks < 12 seconds", "Temporal Workflow Metrics", "Parallelize independent tool queries; refine sub-agent prompt length"],
        ["Grounding & Source Citation", "≥ 98% fact-checked against CRM data", "Langfuse / Ragas Framework", "Tighten context injection prompts and lower LLM generation temperature (0.1)"],
        ["Hallucination Rate", "< 2.0% of total responses", "Continuous LLM-as-a-judge sampling", "Update system prompt with explicit 'I don't know' instructions"],
        ["System Availability & Uptime", "99.9% monthly uptime", "CloudWatch / Datadog synthetic monitors", "Activate multi-region failover and multi-provider LLM routing"]
    ]
    create_styled_table(doc, eval_headers, eval_data, col_widths=[1.8, 1.8, 1.8, 1.6])

    # -------------------------------------------------------------
    # SECTION 13: RECOMMENDED PRODUCTION TECHNOLOGY STACK
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "13. Recommended Production Technology Stack", level=1)
    
    tech_headers = ["Platform Layer", "Primary Technology Selection", "Enterprise Justification"]
    tech_data = [
        ["Frontend UI", "React / Next.js / TailwindCSS", "Provides responsive component library and native Server-Sent Events (SSE) support for streaming."],
        ["Backend API", "Python FastAPI (AsyncIO)", "Native Python ecosystem compatibility with AI libraries, async high-throughput performance."],
        ["Primary LLM", "Claude 3.5 Sonnet / GPT-4o", "Industry-leading reasoning capabilities, function calling precision, and structured JSON output."],
        ["LLM Gateway", "LiteLLM / Portkey", "Centralized load balancing, model routing, fallback management, and spend tracking."],
        ["Agent Framework", "LangGraph", "Provides explicit cyclic graph state control, persistence, and native human-in-the-loop pausing."],
        ["Relational DB", "PostgreSQL 16", "Enterprise transactional store for CRM entities, user accounts, and immutable audit logs."],
        ["Vector Search", "pgvector (or Qdrant for large scale)", "Enables zero-latency JOINs between transactional CRM tables and vector embeddings."],
        ["Cache & Session", "Redis", "Sub-millisecond prompt caching, rate limit counters, and temporary session state."],
        ["Workflow Engine", "Temporal / LangGraph Checkpoint", "Durable execution of multi-day workflows, handling rep approval pauses without timeouts."],
        ["Security & Auth", "OAuth 2.0 / OIDC (Keycloak / Okta)", "Enterprise single sign-on (SSO), granular role-based access control, and token management."],
        ["Observability", "Langfuse + OpenTelemetry", "Granular LLM tracing, step-by-step cost tracking, and evaluation benchmarking."]
    ]
    create_styled_table(doc, tech_headers, tech_data, col_widths=[1.5, 2.3, 3.2])

    # -------------------------------------------------------------
    # SECTION 14: SUMMARY PRINCIPLES
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "14. Core Operational Principles", level=1)
    
    make_callout(doc, [
        "1. LLMs Reason, They Do Not Store Truth: All factual data comes directly from the CRM database and verified documents, never from LLM parametric memory.",
        "2. Permissions Precede Relevance: A document must be authorized for a user before it is ever evaluated for semantic relevance.",
        "3. Deterministic Over Generative Tools: Database mutations happen through hardened, typed code APIs—not unconstrained SQL generation.",
        "4. Humans Retain Ultimate Authority: Any action impacting customer communications, financial terms, or contracts requires signed human confirmation.",
        "5. Complete Traceability: If an AI action occurs, its full reasoning trace, context snapshot, tool parameters, and authorizing user ID must be permanently auditable."
    ], title="THE FIVE FOUNDATIONAL PRINCIPLES OF CRM AI")

    # Output file
    output_filename = "CRM_Sales_AI_Platform_PRD.docx"
    doc.save(output_filename)
    print(f"Document successfully created: {os.path.abspath(output_filename)}")

if __name__ == "__main__":
    generate_document()

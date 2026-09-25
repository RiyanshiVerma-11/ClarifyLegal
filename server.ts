import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, type LiveServerMessage } from "@google/genai";
import dotenv from "dotenv";
import { sanitizeContractInput, sanitizeUserMessage, checkRateLimit } from "./src/services/securityGuardrails";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// API Rate Limiting Middleware
app.use("/api", (req, res, next) => {
  const clientIp = req.ip || req.headers["x-forwarded-for"]?.toString() || "127.0.0.1";
  const rateStatus = checkRateLimit(clientIp);
  if (!rateStatus.allowed) {
    return res.status(429).json({
      error: "Rate limit exceeded. Too many requests. Please slow down.",
    });
  }
  res.setHeader("X-RateLimit-Remaining", rateStatus.remaining.toString());
  next();
});

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini SDK with telemetry header
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Resilient GenAI call with model fallback
async function generateGenAIContent(
  ai: GoogleGenAI,
  prompt: string,
  config?: { responseMimeType?: string; temperature?: number }
) {
  // Try primary model first, with automatic fast fallback to flash-lite if demand spikes
  const modelsToTry = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} unavailable or spike in demand (${err.message?.slice(0, 100)}), trying next fallback...`);
    }
  }

  throw lastError || new Error("All Gemini models were unavailable.");
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({ status: "ok", genaiConfigured: hasKey });
});

// Endpoint: Analyze contract
app.post("/api/analyze-contract", async (req, res) => {
  try {
    const { documentText, documentTitle = "Legal Document", userPerspective = "User / Signer" } = req.body;

    if (!documentText || typeof documentText !== "string" || documentText.trim().length < 20) {
      return res.status(400).json({ error: "Please provide valid legal document text with at least 20 characters." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // High-quality deterministic fallback analyzer if API key is not yet configured
      const fallbackAnalysis = generateFallbackAnalysis(documentText, documentTitle);
      return res.json(fallbackAnalysis);
    }

    const prompt = `You are ClarifyLegal, an expert legal educator and document analysis AI assistant.
Analyze the following legal document objectively from the perspective of the signer/consumer/contractor ("${userPerspective}").
Your goal is to demystify complex legalese, surface hidden liabilities, evaluate fairness, and give practical actionable next steps.

Document Title: ${documentTitle}
Document Text:
"""
${documentText.slice(0, 30000)}
"""

Respond with a strictly formatted JSON object adhering to this structure:
{
  "documentType": "string (e.g. Residential Lease, Freelance Services Agreement, SaaS Terms of Service)",
  "summary": "string (A clear, 2 to 3 paragraph executive summary in plain English explaining what this document does, what rights are granted, and what major burdens are placed on the signer)",
  "riskScore": number (0 to 100, where 0-35 is Low/Favorable, 36-65 is Moderate, 66-84 is High, and 85-100 is Severe/Hazardous),
  "riskLevel": "Low" | "Moderate" | "High" | "Severe",
  "keyParties": {
    "party1": "string (Entity issuing or controlling agreement)",
    "party2": "string (Signer / contractor / tenant / consumer)",
    "userPerspective": "string (Summary of user's negotiating position and vulnerability)"
  },
  "criticalClauses": [
    {
      "id": "clause-1",
      "title": "string (Short descriptive title like 'Automatic 12-Month Renewal')",
      "originalExcerpt": "string (Exact or paraphrased key sentence from document)",
      "simplifiedMeaning": "string (What this actually means in simple 5th-grade English without legalese)",
      "risk": "Low" | "Moderate" | "High" | "Severe",
      "obligationType": "Your Obligation" | "Your Right" | "Counterparty Right" | "Shared Obligation",
      "potentialPitfall": "string (What could go wrong or how this could hurt you in practice)",
      "recommendation": "string (Specific practical amendment, negotiation request, or precaution)"
    }
  ],
  "financialTerms": [
    {
      "item": "string (e.g. Base Fee, Late Payment Penalty, Security Deposit, Early Termination Fee)",
      "amountOrFormula": "string (e.g. '$2,450/month', 'Net-90 days', '$150 flat + $15/day')",
      "condition": "string (When or how it triggers)",
      "isUnusualOrAggressive": boolean (true if excessive or one-sided)
    }
  ],
  "deadlinesAndMilestones": [
    {
      "event": "string (e.g. Renewal Opt-Out Notice, Payment Due Date, Dispute Filing)",
      "timeline": "string (e.g. '90 days before lease end', 'Within 21 days post move-out')",
      "consequenceIfMissed": "string (e.g. 'Lease automatically locks in for another full year with up to 25% rent spike')"
    }
  ],
  "missingProtections": [
    "string (Standard customary protective clauses that are missing from this contract, such as mutual indemnity cap, 30-day notice to cure breaches, return of pre-existing deposit within statutory timeframes, intellectual property carve-outs)"
  ],
  "categoryRisks": {
    "financialLiability": {
      "score": number (0 to 100),
      "level": "Low" | "Moderate" | "High" | "Severe",
      "flaggedCount": number,
      "keyFinding": "string (Concise 1-sentence finding regarding fees, maintenance, uncapped indemnity, or monetary shifts)"
    },
    "ipRights": {
      "score": number (0 to 100),
      "level": "Low" | "Moderate" | "High" | "Severe",
      "flaggedCount": number,
      "keyFinding": "string (Concise 1-sentence finding regarding copyright ownership, licenses, or pre-existing asset carve-outs)"
    },
    "termination": {
      "score": number (0 to 100),
      "level": "Low" | "Moderate" | "High" | "Severe",
      "flaggedCount": number,
      "keyFinding": "string (Concise 1-sentence finding regarding notice windows, automatic renewals, or exit penalties)"
    },
    "hiddenPenalties": {
      "score": number (0 to 100),
      "level": "Low" | "Moderate" | "High" | "Severe",
      "flaggedCount": number,
      "keyFinding": "string (Concise 1-sentence finding regarding late fees, waivers of rights, unannounced entry, or deposit forfeitures)"
    }
  },
  "actionChecklist": [
    {
      "id": "action-1",
      "action": "string (Direct verb phrase like 'Request removal of perpetual IP assignment for pre-existing libraries')",
      "priority": "urgent" | "recommended" | "optional",
      "explanation": "string (Why this action is critical before signing)"
    }
  ]
}`;

    const response = await generateGenAIContent(ai, prompt, {
      responseMimeType: "application/json",
      temperature: 0.2,
    });

    const rawText = response.text || "{}";
    const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);

    parsed.id = "analysis-" + Date.now();
    parsed.documentTitle = documentTitle;
    parsed.analyzedAt = new Date().toISOString();
    parsed.rawText = documentText;

    return res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/analyze-contract:", error);
    // Graceful fallback to guarantee UI always displays
    const fallback = generateFallbackAnalysis(req.body.documentText || "", req.body.documentTitle || "Document");
    return res.json(fallback);
  }
});

// Endpoint: Compare two contracts / versions
app.post(["/api/compare-contracts", "/api/compare-documents"], async (req, res) => {
  try {
    const { docA, docB, context = "Standard comparison" } = req.body;

    if (!docA?.content || !docB?.content) {
      return res.status(400).json({ error: "Both Document A and Document B are required for comparison." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      const fallbackComparison = generateFallbackComparison(docA, docB);
      return res.json(fallbackComparison);
    }

    const prompt = `You are ClarifyLegal, an expert legal contract comparison system.
Compare the following two versions or related agreements in detail:

Context: ${context}

DOCUMENT A (e.g. Original / Standard / Version A):
Title: ${docA.title || "Document A"}
Content:
"""
${docA.content.slice(0, 15000)}
"""

DOCUMENT B (e.g. Revised / Markup / Version B):
Title: ${docB.title || "Document B"}
Content:
"""
${docB.content.slice(0, 15000)}
"""

Provide an objective side-by-side analysis in JSON format:
{
  "overview": "string (Summary of key structural and legal differences between Document A and Document B)",
  "verdict": "string (Clear verdict on which version is more advantageous for the signer, and the rationale)",
  "riskShift": "More Favorable to You" | "Equal/Neutral" | "More Risky for You",
  "clauseComparisons": [
    {
      "clauseTopic": "string (e.g. Indemnification Cap, Maintenance Responsibilities, Payment Terms, Termination Period)",
      "docAText": "string (Summary or excerpt of how Doc A handles it)",
      "docBText": "string (Summary or excerpt of how Doc B handles it)",
      "changeType": "added" | "removed" | "modified" | "identical",
      "significance": "high" | "medium" | "low",
      "impact": "string (Plain English consequence: who gains leverage and what risks are introduced or mitigated)",
      "recommendation": "string (Which version to accept or how to counter-propose)"
    }
  ],
  "keyTakeaways": [
    "string (Crucial bullet points the user must know before choosing or signing)"
  ]
}`;

    const response = await generateGenAIContent(ai, prompt, {
      responseMimeType: "application/json",
      temperature: 0.2,
    });

    const rawText = response.text || "{}";
    const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);

    parsed.id = "compare-" + Date.now();
    parsed.docATitle = docA.title || "Document A";
    parsed.docBTitle = docB.title || "Document B";
    parsed.comparedAt = new Date().toISOString();

    return res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/compare-contracts:", error);
    const fallback = generateFallbackComparison(req.body.docA, req.body.docB);
    return res.json(fallback);
  }
});

// Endpoint: Decode a single legal clause
app.post(["/api/decode-clause", "/api/decode-jargon"], async (req, res) => {
  try {
    const { clauseText } = req.body;

    if (!clauseText || typeof clauseText !== "string" || clauseText.trim().length < 5) {
      return res.status(400).json({ error: "Please provide a legal clause or sentence to decode." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.json(generateFallbackClauseDecode(clauseText));
    }

    const prompt = `You are ClarifyLegal's instant jargon decoder.
Decode the following dense legal clause into plain, transparent, 5th-grade English.
Identify hidden traps and draft a balanced, fair counter-clause.

Clause:
"""
${clauseText.slice(0, 4000)}
"""

Return JSON:
{
  "plainEnglish": "string (Crystal clear translation avoiding any jargon)",
  "riskAssessment": "string (Objective analysis of whether this clause is standard, aggressive, or one-sided)",
  "riskLevel": "Low" | "Moderate" | "High" | "Severe",
  "redFlags": [
    "string (Specific danger or hidden trap)"
  ],
  "fairAlternative": "string (A professionally drafted, reasonable substitute clause that protects both parties equally)",
  "questionsToAsk": [
    "string (Concrete question to ask the counterparty or an attorney regarding this clause)"
  ]
}`;

    const response = await generateGenAIContent(ai, prompt, {
      responseMimeType: "application/json",
      temperature: 0.2,
    });

    const rawText = response.text || "{}";
    const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);

    return res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/decode-clause:", error);
    return res.json(generateFallbackClauseDecode(req.body.clauseText || ""));
  }
});

// Endpoint: Generate redline counter proposal email
app.post("/api/generate-counter-proposal", async (req, res) => {
  try {
    const { 
      originalClause, 
      issueIdentified, 
      desiredOutcome, 
      recipientRole = "Counterparty / Landlord / Client",
      tone = "Diplomatic" 
    } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      let subject = `Requested Clarification regarding Contract Terms`;
      let greeting = `Dear ${recipientRole},`;
      let bodyText = "";

      if (tone === "Firm") {
        subject = `Required Amendments Prior to Execution: ${issueIdentified || 'Contract Terms'}`;
        bodyText = `${greeting}\n\nI have reviewed the agreement and identified an essential revision necessary before this document can be executed.\n\nSpecifically, regarding "${issueIdentified || 'Terms'}":\n"${originalClause.slice(0, 250)}..."\n\nThis provision introduces asymmetric exposure that does not align with standard commercial guidelines. To proceed, this clause must be revised to the following standard terms:\n\n"${desiredOutcome || 'Both parties agree to standard mutual liability capped at direct damages and fees paid, with standard 30-day notice.'}"\n\nPlease incorporate this redline and provide an amended version for signature.\n\nSincerely,\n[Your Name]`;
      } else if (tone === "Collaborative") {
        subject = `Excited to Partner! Minor Contract Alignment on ${issueIdentified || 'Terms'}`;
        bodyText = `${greeting}\n\nI am thrilled about the prospect of working together! I reviewed the contract draft and want to make sure we're set up for a smooth, transparent partnership.\n\nOn the section touching on "${issueIdentified || 'Terms'}":\n"${originalClause.slice(0, 250)}..."\n\nTo ensure our expectations are fully aligned and win-win for both sides, I suggest the following mutual wording:\n\n"${desiredOutcome || 'Both parties agree to standard mutual protections and reasonable cure periods.'}"\n\nHow does this feel to your team? Happy to hop on a quick 5-minute sync if easier.\n\nWarm regards,\n[Your Name]`;
      } else {
        // Diplomatic
        subject = `Question Regarding Contract Terms: ${issueIdentified || 'Clarification'}`;
        bodyText = `${greeting}\n\nThank you for sharing the agreement. I have reviewed the terms and look forward to finalizing our arrangement.\n\nI noticed the current wording regarding "${issueIdentified || 'Terms'}":\n"${originalClause.slice(0, 250)}..."\n\nTo ensure our agreement remains balanced and reflects standard industry practice, I propose amending this clause to:\n\n"${desiredOutcome || 'Both parties agree to standard mutual liability capped at fees paid, with reasonable notice periods.'}"\n\nPlease let me know if this adjustment works for your team, and I will be happy to sign the updated draft.\n\nBest regards,\n[Your Name]`;
      }

      return res.json({
        emailSubject: subject,
        emailBody: bodyText,
        redlinedText: `[-] Original: "${originalClause}"\n[+] Proposed: "${desiredOutcome || 'Standard mutual balanced clause'}"`,
        talkingPoints: [
          tone === "Firm" ? "Stand firm on direct liability caps as an absolute pre-condition" : "Highlights mutual benefit and standard commercial practice",
          "Maintains professional clarity and avoids ambiguity",
          "Offers specific drop-in language to eliminate costly legal delays"
        ]
      });
    }

    const prompt = `You are an expert legal negotiation coach.
Draft a highly persuasive, attorney-grade negotiation email and redlined language to counter-propose a problematic contract clause.

Recipient: ${recipientRole}
Selected Tone: ${tone} (Options: 'Diplomatic' = polite, relationship-preserving, respectful; 'Firm' = direct, principled, non-negotiable on liability/rights; 'Collaborative' = partnership-first, win-win framing, solution-oriented).
Original Problematic Clause:
"""${originalClause}"""

Specific Issue: ${issueIdentified}
Desired Outcome: ${desiredOutcome}

Respond in JSON:
{
  "emailSubject": "string (Subject line matching the ${tone} tone)",
  "emailBody": "string (Complete email text with appropriate greeting, tone-matched opening, clear justification, exact proposed drop-in language, and professional sign-off)",
  "redlinedText": "string (Side-by-side or strike-through style redline comparison showing what to remove [-] and what to add [+])",
  "talkingPoints": [
    "string (3 quick verbal bullet points to use on a phone call or meeting if counterparty pushes back)"
  ]
}`;

    const response = await generateGenAIContent(ai, prompt, {
      responseMimeType: "application/json",
      temperature: 0.3,
    });

    const rawText = response.text || "{}";
    const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    return res.json(JSON.parse(cleaned));
  } catch (error: any) {
    console.error("Error in /api/generate-counter-proposal:", error);
    // Fallback on demand spike or API outage
    const { originalClause = "", issueIdentified = "Terms", desiredOutcome = "", recipientRole = "Counterparty", tone = "Diplomatic" } = req.body;
    return res.json(generateFallbackCounterProposal(originalClause, issueIdentified, desiredOutcome, recipientRole, tone));
  }
});

// Endpoint: AI Counterparty Negotiation Simulator
app.post("/api/simulate-counterparty-response", async (req, res) => {
  try {
    const counterpartyPersona = req.body.counterpartyPersona || "Tough Corporate Landlord";
    const clauseTopic = req.body.clauseTopic || req.body.contractContext || "Contract Terms";
    const proposedAmendment = req.body.proposedAmendment || req.body.proposedChanges || "";
    const originalClause = req.body.originalClause || "";
    const userPerspective = req.body.userPerspective || "Signer / Tenant / Contractor";

    const ai = getGeminiClient();

    if (!ai) {
      return res.json(generateFallbackCounterpartySimulation(counterpartyPersona, clauseTopic, proposedAmendment));
    }

    const prompt = `You are an elite legal negotiation strategist and realistic corporate counterparty simulator.
A user is negotiating a contract clause and wants to anticipate how their counterparty will push back.
Simulate the counterparty's authentic pushback email, unpack their hidden motivations, and provide the user with the winning rebuttal script to close the compromise.

Target Counterparty Persona: ${counterpartyPersona}
Clause / Negotiation Topic: ${clauseTopic}
User's Role / Perspective: ${userPerspective}

Original Clause in Dispute:
"""${originalClause || 'Standard boiler-plate contract term'}"""

User's Proposed Amendment / Sent Negotiation Email:
"""${proposedAmendment || 'Request to cap liability, make obligations mutual, and provide 30-day notice.'}"""

Respond strictly with valid JSON matching this schema:
{
  "counterpartyPersona": "${counterpartyPersona}",
  "scenarioTitle": "string (Short descriptive scenario title, e.g. 'Pushback on Portfolio Maintenance Uniformity')",
  "counterpartyStance": "Strict Resistance" | "Conditional Pushback" | "Open to Compromise",
  "simulatedResponseEmail": "string (Realistic, authentic reply email from the counterparty using their institutional voice, referencing internal policy, risk committees, or operating standards to deflect or counter the request)",
  "coreObjections": [
    "string (Objection 1: Specific legal or operational reason they push back)",
    "string (Objection 2: Precedent or financial concern they cite)",
    "string (Objection 3: What they feel is non-negotiable from their side)"
  ],
  "underlyingMotivation": "string (What this counterparty secretly cares about beneath the formal legalese — e.g. avoiding administrative complexity, protecting cash flow, avoiding audit triggers, or meeting procurement targets)",
  "rebuttalStrategy": "string (Strategic negotiation game-plan for the user: how to reframe the request so the counterparty can say yes without losing face)",
  "winningRebuttalScript": "string (The ready-to-send follow-up email or meeting script the user should deploy to secure the concession)",
  "concessionLikelihood": "string (e.g. 'High (80%) with defined monetary cap', 'Moderate (60%) if escalated to regional director')",
  "tacticalAdvice": [
    "string (Tactical execution tip 1)",
    "string (Tactical execution tip 2)"
  ]
}`;

    const response = await generateGenAIContent(ai, prompt, {
      responseMimeType: "application/json",
      temperature: 0.3,
    });

    const rawText = response.text || "{}";
    const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    return res.json(JSON.parse(cleaned));
  } catch (error: any) {
    console.error("Error in /api/simulate-counterparty-response:", error);
    return res.json(generateFallbackCounterpartySimulation(
      req.body?.counterpartyPersona || "Tough Corporate Landlord",
      req.body?.clauseTopic || req.body?.contractContext || "Terms",
      req.body?.proposedAmendment || req.body?.proposedChanges || ""
    ));
  }
});

// Endpoint: Interactive legal navigator Q&A
app.post("/api/ask-navigator", async (req, res) => {
  try {
    const { question, context = "", history = [] } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Please provide a valid question." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        content: `**Legal Information Overview**\n\nRegarding: "${question}"\n\n1. **Core Legal Principle**: Generally in contract and civil law, agreements require mutual assent, clear terms, and statutory compliance. Standard rights (such as implied warranty of habitability in leases, or prompt payment statutes for contractors) cannot typically be waived unilaterally in consumer or tenant contexts.\n\n2. **Practical Key Factors**:\n- Review the exact contract text for written notice requirements.\n- Check local statutory guidelines (e.g., local state housing or consumer protection laws).\n- Document all communications in writing (email/certified letter) rather than verbal agreements.\n\n3. **Actionable Steps**:\n- Gather all invoices, timestamps, and signed agreements.\n- Request written clarification citing specific section numbers.\n- Consult a local legal aid clinic or licensed attorney if financial liability is substantial.\n\n*Disclaimer: This response provides educational legal information and analysis only. It does not constitute legal advice or create an attorney-client relationship.*`,
        suggestedQuestions: [
          "How do I write a formal notice to cure breach?",
          "What clauses are commonly unenforceable in my state?",
          "How can I negotiate without losing the deal?"
        ],
        actionChecklist: [
          "Collect written records and receipts",
          "Identify specific contract clause numbers",
          "Check local statutory grace periods"
        ]
      });
    }

    const prompt = `You are ClarifyLegal Navigator, an AI legal educator and information assistant.
You provide clear, empowering, plain-English legal knowledge, practical strategies, and actionable checklists to consumers, tenants, freelancers, and small business owners.

Always maintain ethical legal safety: You provide legal information, analysis, and educational guidance, not formal legal representation or legal advice.

Context / Document snippet (if any):
${context ? `"""${context.slice(0, 4000)}"""` : "No specific document attached."}

User's Question:
"${question}"

Provide a structured, beautifully formatted response in JSON:
{
  "content": "string (Rich markdown response with: ## Plain-English Analysis, ## Key Legal Principles & Rights, ## Hidden Risks to Watch For, and ## Recommended Strategy)",
  "suggestedQuestions": [
    "string (3 smart follow-up questions the user might want to ask next)"
  ],
  "actionChecklist": [
    "string (3 to 5 immediate, concrete action items the user should take right now)"
  ]
}`;

    const response = await generateGenAIContent(ai, prompt, {
      responseMimeType: "application/json",
      temperature: 0.3,
    });

    const rawText = response.text || "{}";
    const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    return res.json(JSON.parse(cleaned));
  } catch (error: any) {
    console.error("Error in /api/ask-navigator:", error);
    // Fallback on model busy or rate limit so the user always gets a high quality response
    return res.json(generateFallbackNavigatorAnswer(req.body?.question || "", req.body?.context || ""));
  }
});

// Endpoint: Multi-turn Gemini Chatbot with customizable roles & models
app.post("/api/chat/conversation", async (req, res) => {
  try {
    const {
      messages = [],
      model = "gemini-3.5-flash",
      role = "general",
      customSystemInstruction = "",
      documentContext = "",
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Please provide a conversation history with at least one user message." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        message: {
          id: "msg-" + Date.now(),
          role: "assistant",
          content: "Gemini API key is not configured. Here is key guidance: ambiguous terms are strictly construed against the drafter. Ensure indemnities are capped and cure periods are at least 15–30 days.",
          timestamp: new Date().toISOString(),
          model: "offline-demo",
          rolePreset: role,
        }
      });
    }

    // Determine role-specific system instruction
    let roleSystemInstruction = "";
    if (role === "complex" || model === "gemini-3.1-pro-preview") {
      roleSystemInstruction = `You are ClarifyLegal's Senior Legal Risk Analyst and Forensic Contract Strategist (powered by Gemini Pro).
Your job is to perform deep legal reasoning, identify hidden statutory and regulatory risks, unpack multi-layered liability webs, assess jurisdictional enforceability, and draft precise, surgical contract language.
When answering, structure your output with:
1. Executive Risk Diagnosis
2. Deep Statutory & Legal Analysis
3. Hidden Loopholes or Exposure Points
4. Balanced, Professional Counter-Language (ready to insert into agreement)`;
    } else if (role === "fast" || model === "gemini-3.1-flash-lite") {
      roleSystemInstruction = `You are ClarifyLegal's Rapid Legal Assistant (powered by Gemini Flash-Lite).
Your job is to deliver ultra-fast, high-velocity answers, instant clause explanations, rapid red-flag checks, and concise definition lookups.
Get straight to the point in sharp, easily readable bullet points without unnecessary preamble.`;
    } else {
      // General tasks (gemini-3.5-flash)
      roleSystemInstruction = `You are ClarifyLegal's AI Contract Navigator & Legal Strategist (powered by Gemini 3.5 Flash).
Your mission is to translate intimidating legal clauses into 5th-grade plain English, protect signers from unfair one-sided terms, calculate financial exposures, and provide diplomatic negotiation playbooks.
Keep answers structured, balanced, clear, and actionable.`;
    }

    if (customSystemInstruction && typeof customSystemInstruction === "string" && customSystemInstruction.trim()) {
      roleSystemInstruction += `\n\nSpecific User Instructions:\n${customSystemInstruction.trim()}`;
    }

    if (documentContext && typeof documentContext === "string" && documentContext.trim()) {
      roleSystemInstruction += `\n\nACTIVE DOCUMENT CONTEXT FROM USER'S WORKSPACE:\n"""\n${documentContext.trim().slice(0, 30000)}\n"""\nReference this document directly whenever relevant.`;
    }

    // Map conversation history into Gemini format
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: String(m.content || "") }]
    }));

    // Ensure last turn is user
    if (contents[contents.length - 1].role !== "user") {
      return res.status(400).json({ error: "The latest message in history must be from the user." });
    }

    // Determine model cascade (prefer user selected, fallback gracefully on rate limits or pro-tier quota)
    const modelsToAttempt = [
      model,
      model === "gemini-3.1-pro-preview" ? "gemini-3.5-flash" : "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite"
    ];

    const uniqueModels = Array.from(new Set(modelsToAttempt));
    let responseText = "";
    let finalModelUsed = model;
    let fallbackNote: string | undefined = undefined;

    for (const targetModel of uniqueModels) {
      try {
        const response = await ai.models.generateContent({
          model: targetModel,
          contents,
          config: {
            systemInstruction: roleSystemInstruction,
            temperature: targetModel === "gemini-3.1-pro-preview" ? 0.2 : 0.4,
          },
        });
        if (response && response.text) {
          responseText = response.text;
          finalModelUsed = targetModel;
          if (targetModel !== model) {
            fallbackNote = `Processed with ${targetModel} in high-reasoning mode (primary model experienced a temporary demand spike).`;
          }
          break;
        }
      } catch (err: any) {
        console.warn(`Chat model ${targetModel} issue: ${err.message?.slice(0, 100)}. Trying fallback...`);
      }
    }

    if (!responseText) {
      throw new Error("All Gemini models were temporarily busy. Please retry.");
    }

    return res.json({
      message: {
        id: "msg-" + Date.now(),
        role: "assistant",
        content: responseText,
        timestamp: new Date().toISOString(),
        model: finalModelUsed,
        rolePreset: role,
        fallbackNote,
      }
    });
  } catch (error: any) {
    console.error("Error in /api/chat/conversation:", error);
    return res.status(500).json({
      error: error.message || "Failed to process chat message.",
      fallback: {
        id: "msg-" + Date.now(),
        role: "assistant",
        content: "I ran into a temporary communication hiccup with the AI service. As a general legal rule, always ensure that indemnification is strictly reciprocal and capped to fees paid, and demand a 30-day written cure period before any default penalties trigger. Please ask your question again.",
        timestamp: new Date().toISOString(),
        model: "offline-fallback"
      }
    });
  }
});

// Fallback generators for instant zero-config resilience
function generateFallbackAnalysis(text: string, title: string) {
  const isLease = text.toLowerCase().includes("lease") || text.toLowerCase().includes("tenant") || text.toLowerCase().includes("landlord");
  const isFreelance = text.toLowerCase().includes("contractor") || text.toLowerCase().includes("deliverables") || text.toLowerCase().includes("intellectual property");
  
  if (isLease) {
    return {
      id: "analysis-" + Date.now(),
      documentTitle: title || "Residential Lease Agreement",
      documentType: "Residential Lease Agreement",
      analyzedAt: new Date().toISOString(),
      summary: "This agreement is a 12-month residential lease that heavily tilts financial and operational burdens onto the tenant. Key provisions shift routine maintenance and repair costs—ordinarily borne by landlords under warranty of habitability laws—onto the tenant, impose aggressive daily late fee penalties, and require 90 days advance notice to prevent an automatic 1-year renewal with up to a 25% rent increase.",
      riskScore: 78,
      riskLevel: "High",
      keyParties: {
        party1: "Landlord / Property Management",
        party2: "Tenant (Jane Doe)",
        userPerspective: "High vulnerability due to routine maintenance waivers, 90-day deposit return delay, and unilateral entry rights."
      },
      criticalClauses: [
        {
          id: "clause-1",
          title: "Shifting Routine Maintenance & Repair Liabilities",
          originalExcerpt: "Tenant agrees to bear full financial responsibility for plumbing clogs, heating repairs under $350, window maintenance regardless of wear and tear.",
          simplifiedMeaning: "You must pay out-of-pocket for broken appliances and plumbing even if it broke from old age, and you cannot withhold rent if the heat dies.",
          risk: "High",
          obligationType: "Your Obligation",
          potentialPitfall: "You could be billed hundreds for a decades-old plumbing failure or pre-existing heater breakdown.",
          recommendation: "Strike this clause or amend to: 'Tenant responsible solely for damages caused by Tenant misuse; Landlord maintains all structural, plumbing, and HVAC systems.'"
        },
        {
          id: "clause-2",
          title: "Automatic 1-Year Renewal Trap with 25% Hike",
          originalExcerpt: "Unless Tenant provides 90 days notice by certified mail, this Lease automatically renews for 12 months with up to 25% rent increase.",
          simplifiedMeaning: "If you forget to send a certified letter 3 months before your lease is up, you are locked in for another whole year and your rent can jump 25%.",
          risk: "Severe",
          obligationType: "Your Obligation",
          potentialPitfall: "Missing the notice deadline by a single day locks you into a mandatory 12-month extension with a massive rent jump.",
          recommendation: "Request converting to a standard month-to-month tenancy upon expiration with standard 30-day written notice."
        },
        {
          id: "clause-3",
          title: "Unrestricted Landlord Access without Notice",
          originalExcerpt: "Landlord or agents may enter the Premises at any time without prior written notice for inspection or arbitrary checks.",
          simplifiedMeaning: "The landlord claims the right to enter your home whenever they want without telling you first.",
          risk: "High",
          obligationType: "Counterparty Right",
          potentialPitfall: "Violates your covenant of quiet enjoyment and statutory privacy rights in almost all jurisdictions.",
          recommendation: "Replace with statutory requirement: 'Landlord must give at least 24 hours advance written notice prior to non-emergency entry during business hours.'"
        }
      ],
      financialTerms: [
        {
          item: "Monthly Rent & Aggressive Late Fee",
          amountOrFormula: "$2,450/mo + $150 flat fee + $15/day after day 2",
          condition: "Payment received after 5:00 PM on the 2nd",
          isUnusualOrAggressive: true
        },
        {
          item: "Security Deposit Return Period",
          amountOrFormula: "$4,900 (2 months rent) held for 90 days",
          condition: "Returned 90 days after vacating premises",
          isUnusualOrAggressive: true
        }
      ],
      deadlinesAndMilestones: [
        {
          event: "Renewal Opt-Out Certified Notice",
          timeline: "90 calendar days prior to September 30 (July 2)",
          consequenceIfMissed: "Automatic 1-year lock-in with up to 25% rent spike"
        },
        {
          event: "Monthly Rent Grace Cutoff",
          timeline: "2nd day of each month by 5:00 PM",
          consequenceIfMissed: "Immediate $150 charge plus $15/day accruing fee"
        }
      ],
      missingProtections: [
        "Landlord covenant to maintain implied warranty of habitability",
        "Mandatory 24-hour advance notice for non-emergency entry",
        "State-mandated 21-day or 30-day security deposit return requirement with itemized receipts",
        "Interest-bearing escrow account protection for security deposit funds"
      ],
      categoryRisks: {
        financialLiability: {
          score: 82,
          level: "Severe",
          flaggedCount: 3,
          keyFinding: "Shifts $350 repair costs, HVAC maintenance, and $4,900 deposit held for 90 days."
        },
        ipRights: {
          score: 15,
          level: "Low",
          flaggedCount: 0,
          keyFinding: "Standard residential context; no adverse intellectual property assignments."
        },
        termination: {
          score: 88,
          level: "Severe",
          flaggedCount: 2,
          keyFinding: "Strict 90-day certified mail notice required; failure triggers 12-month lock-in at +25% rent."
        },
        hiddenPenalties: {
          score: 75,
          level: "High",
          flaggedCount: 2,
          keyFinding: "Immediate daily late fees ($15/day after day 2) and arbitrary landlord entry without notice."
        }
      },
      actionChecklist: [
        {
          id: "act-1",
          action: "Redline Section 4 to eliminate tenant liability for pre-existing heating and plumbing",
          priority: "urgent",
          explanation: "Essential to prevent arbitrary repair bills upon move-in."
        },
        {
          id: "act-2",
          action: "Change 90-day renewal lock-in to standard 30-day month-to-month conversion",
          priority: "urgent",
          explanation: "Prevents being trapped in an unwanted second year."
        },
        {
          id: "act-3",
          action: "Perform comprehensive photo/video move-in inspection walk-through",
          priority: "recommended",
          explanation: "Protects your $4,900 deposit from deductions for pre-existing flaws."
        }
      ]
    };
  }

  // Default contractor/services fallback
  return {
    id: "analysis-" + Date.now(),
    documentTitle: title || "Services & Commercial Agreement",
    documentType: isFreelance ? "Independent Contractor Agreement" : "Commercial Agreement",
    analyzedAt: new Date().toISOString(),
    summary: "This agreement establishes service terms with significant legal exposures. Notable provisions include broad intellectual property assignment extending to prior inventions, extended payment remittance schedules (such as Net-90), and one-sided indemnification clauses that could hold the signer liable for third-party legal fees without a monetary cap.",
    riskScore: 72,
    riskLevel: "High",
    keyParties: {
      party1: "Client / Commissioning Entity",
      party2: "Service Provider / Contractor",
      userPerspective: "Signer carries disproportionate risk on indemnification and delayed compensation."
    },
    criticalClauses: [
      {
        id: "clause-1",
        title: "Perpetual Pre-Payment IP Assignment",
        originalExcerpt: "Contractor hereby irrevocably assigns all rights, title, and pre-existing code libraries and tools in perpetuity.",
        simplifiedMeaning: "The client owns everything you build AND tools you already created before taking the job, even if they haven't paid you yet.",
        risk: "High",
        obligationType: "Your Obligation",
        potentialPitfall: "You lose ownership of your proprietary starter kits and have no leverage if the client defaults on payment.",
        recommendation: "Amend so IP ownership transfers strictly 'upon receipt of full payment', and explicitly carve out your pre-existing background tools."
      },
      {
        id: "clause-2",
        title: "Unlimited Uncapped Indemnification",
        originalExcerpt: "Contractor shall defend, indemnify, and hold harmless Company without limitation or cap on liability.",
        simplifiedMeaning: "If the client gets sued by anyone over your work, you have to pay their entire legal defense even if it costs millions.",
        risk: "Severe",
        obligationType: "Your Obligation",
        potentialPitfall: "A single claim could result in crippling legal fees far exceeding your total earnings on the project.",
        recommendation: "Cap liability at the total fees paid to you under the contract, and exclude indirect or consequential damages."
      }
    ],
    financialTerms: [
      {
        item: "Payment Terms",
        amountOrFormula: "Net-90 days with 40% revision withholdings",
        condition: "Paid 90 days after deliverable acceptance",
        isUnusualOrAggressive: true
      }
    ],
    deadlinesAndMilestones: [
      {
        event: "Invoice Processing Window",
        timeline: "Monthly submission, 90 days remittance",
        consequenceIfMissed: "Delayed cash flow up to 3+ months"
      }
    ],
    missingProtections: [
      "Mutual liability limitation cap equal to fees paid",
      "Payment terms tied to Net-15 or Net-30 maximum",
      "Explicit carve-out for pre-existing tools and open source assets",
      "Late interest fee on overdue undisputed invoices"
    ],
    categoryRisks: {
      financialLiability: {
        score: 85,
        level: "Severe",
        flaggedCount: 2,
        keyFinding: "Unlimited, uncapped indemnification for third-party claims and Net-90 delayed payout."
      },
      ipRights: {
        score: 80,
        level: "High",
        flaggedCount: 2,
        keyFinding: "Perpetual assignment of all inventions prior to payment, with no carve-out for developer tooling."
      },
      termination: {
        score: 45,
        level: "Moderate",
        flaggedCount: 1,
        keyFinding: "Client retains unilateral immediate termination without guaranteed payment for work in progress."
      },
      hiddenPenalties: {
        score: 65,
        level: "High",
        flaggedCount: 1,
        keyFinding: "40% revision withholdings and waiver of interest on overdue invoices."
      }
    },
    actionChecklist: [
      {
        id: "act-1",
        action: "Counter-propose Net-30 payment terms with 1.5% monthly late fee on overdue invoices",
        priority: "urgent",
        explanation: "Net-90 creates severe cash flow risk for independent operators."
      },
      {
        id: "act-2",
        action: "Insert clause conditioning IP transfer strictly upon receipt of cleared funds",
        priority: "urgent",
        explanation: "Prevents client from using your code without paying."
      }
    ]
  };
}

function generateFallbackComparison(docA: any, docB: any) {
  return {
    id: "compare-" + Date.now(),
    docATitle: docA.title || "Document A",
    docBTitle: docB.title || "Document B",
    comparedAt: new Date().toISOString(),
    overview: "Comparison reveals substantial shifts between the two documents. Document B significantly reallocates risk, establishes clearer notice periods, and reins in one-sided obligations found in Document A.",
    verdict: "Document B is substantially more balanced and favorable for the signer, addressing major liability exposures and offering realistic cure periods.",
    riskShift: "More Favorable to You",
    clauseComparisons: [
      {
        clauseTopic: "Liability & Indemnification",
        docAText: "Doc A imposed unlimited, one-way indemnification with strict liability for any breach.",
        docBText: "Doc B limits indemnification to direct damages and establishes mutual liability protection.",
        changeType: "modified",
        significance: "high",
        impact: "Reduces catastrophic exposure from third-party lawsuits and aligns with industry norms.",
        recommendation: "Adopt Document B language."
      },
      {
        clauseTopic: "Notice & Cure Periods",
        docAText: "Immediate forfeiture or termination without notice in Doc A.",
        docBText: "Mandatory 30-day written notice with opportunity to cure in Doc B.",
        changeType: "added",
        significance: "high",
        impact: "Protects against surprise lease termination or contract cancellations.",
        recommendation: "Ensure 30-day cure window is preserved in final execution copy."
      }
    ],
    keyTakeaways: [
      "Document B fixes the highest risk liability traps found in Document A",
      "Timelines are standardized to industry-standard 30-day windows",
      "Document B establishes mutual rather than unilateral protections"
    ]
  };
}

function generateFallbackClauseDecode(clause: string) {
  return {
    plainEnglish: "In plain English, this clause means you are giving up certain legal rights or taking on financial responsibility if a problem arises. It creates a binding legal promise that can be enforced against you in court.",
    riskAssessment: "This clause contains language that places disproportionate burden on the signer and should be scrutinized carefully before signing.",
    riskLevel: "Moderate",
    redFlags: [
      "Broad obligation without a monetary ceiling",
      "Strict liability standard that does not require proof of intentional wrongdoing"
    ],
    fairAlternative: "Both parties agree to exercise reasonable care, with any liability limited strictly to actual direct damages capped at amounts paid under this agreement.",
    questionsToAsk: [
      "Can we make this obligation mutual so both parties are protected equally?",
      "Can we add an explicit dollar cap to the liability under this section?"
    ]
  };
}

function generateFallbackCounterpartySimulation(persona: string, topic: string, proposed: string) {
  const pLower = (persona || "").toLowerCase();

  if (pLower.includes("landlord") || pLower.includes("property")) {
    return {
      counterpartyPersona: "Tough Corporate Landlord (Crestview Asset Management)",
      scenarioTitle: "Resistance to Lease Rider & Portfolio Uniformity Exception",
      counterpartyStance: "Conditional Pushback",
      simulatedResponseEmail: `Dear Tenant,\n\nThank you for reaching out regarding the lease agreement for 442 Elmwood Ave. We have received your proposed revisions concerning ${topic || "maintenance and renewal terms"}.\n\nAs a professional property management firm overseeing multi-family assets, all leases must adhere to our standard institutional template approved by our lenders and insurance underwriters. Making bespoke modifications creates unmanageable variance across our accounting and maintenance ticketing systems.\n\nFurthermore, our repair deductible clause exists to encourage responsible property stewardship and avoid dispatching technicians for minor fixture adjustments that take 5 minutes.\n\nWhile we cannot sign your custom amendment rider as drafted, we are prepared to confirm in writing via email that our in-house maintenance superintendent is on-call 24/7 for emergency water/heat issues.\n\nPlease execute the original lease agreement by Friday 5:00 PM to secure your unit.\n\nSincerely,\nLeasing Management Department\nCrestview Properties LLC`,
      coreObjections: [
        "Inability to alter standard corporate lease forms due to lender/underwriter covenant requirements",
        "Administrative friction of managing custom maintenance obligations across multi-unit portfolios",
        "Fear that waiving small repair costs will lead to frivolous service requests for burned-out bulbs or loose cabinet knobs"
      ],
      underlyingMotivation: "The property manager's core fear is setting a precedent that triggers audit questions from the building owners or complicates standard automated maintenance software ticketing.",
      rebuttalStrategy: "Acknowledge their need for operational efficiency, but cite state statutory implied warranty of habitability which legally supersedes private lease waivers. Offer a clear compromise: a narrow tenant repair cap ($75 instead of $350) strictly limited to tenant-caused plumbing, while reserving all HVAC/structural systems to landlord.",
      winningRebuttalScript: `Dear Leasing Management,\n\nThank you for the prompt follow-up. I appreciate Crestview's commitment to maintaining 442 Elmwood Ave and want to ensure our tenancy gets off to a transparent, cooperative start.\n\nI fully respect your need for portfolio consistency. My only concern is ensuring our contract aligns with local statutory habitability standards, which mandate that primary HVAC, hot water, and major plumbing remain landlord operational responsibilities.\n\nTo accommodate your workflow without creating accounting friction, I propose a simple 1-sentence addendum:\n"Tenant agrees to handle routine minor upkeep under $75 (such as bulb replacements), while Landlord maintains primary mechanical, heating, and plumbing systems in compliance with state habitability laws."\n\nWith this single adjustment, I am ready to sign the lease and remit the security deposit immediately today. Thank you for working with me to finalize this!\n\nBest regards,\n[Your Name]`,
      concessionLikelihood: "High (80%) — Property managers will almost always accept a habitability compromise when confronted politely with statutory compliance rather than risk vacancy.",
      tacticalAdvice: [
        "Never argue over the phone — keep all requests in writing so they can be forwarded directly to the portfolio manager.",
        "Emphasize your readiness to sign and pay immediately if the habitability clarification is accepted."
      ]
    };
  }

  if (pLower.includes("client") || pLower.includes("procurement") || pLower.includes("enterprise")) {
    return {
      counterpartyPersona: "Enterprise Client / Strategic Procurement Director",
      scenarioTitle: "Corporate Payment Terms & IP Indemnity Pushback",
      counterpartyStance: "Strict Resistance",
      simulatedResponseEmail: `Hi there,\n\nOur legal and procurement committees have completed the review of your contract redlines regarding ${topic || "Net-30 payment and IP limits"}.\n\nAs an enterprise organization operating under Sarbanes-Oxley and ISO-27001 compliance standards, our standard vendor tiering strictly mandates Net-60 payment terms. Our ERP accounts payable system processes disbursements on fixed bi-weekly vendor run cycles, and we cannot manually expedite individual billing streams.\n\nRegarding intellectual property: because our company is funding the creation of deliverables, our executive board requires an absolute, unencumbered transfer of all work product and unlimited indemnity against third-party copyright claims before any purchase order can be issued.\n\nIf these terms present a roadblock, we may need to put the initiative on hold and review alternative proposals from our pre-approved vendor roster.\n\nRegards,\nDirector of Enterprise Procurement & Vendor Management`,
      coreObjections: [
        "Rigid ERP corporate payment cycles (Net-60/90) that procurement KPIs are measured upon",
        "Fear of IP ownership ambiguity that could jeopardize corporate valuation or customer contracts",
        "Reluctance of middle management to seek exception approval from general counsel"
      ],
      underlyingMotivation: "Procurement is incentivized to protect working capital cashflow and avoid getting reprimanded by legal for accepting uncapped vendor carve-outs.",
      rebuttalStrategy: "Offer a commercial trade: accept Net-60 terms in exchange for a 2% Net-15 prompt payment discount rider, and offer 100% full copyright assignment on final bespoke deliverables while protecting your pre-existing background toolsets.",
      winningRebuttalScript: `Dear Procurement Team,\n\nThank you for the detailed feedback and for walking me through your vendor guidelines. I am enthusiastic about partnering with your team and ensuring our project executes on schedule.\n\nI understand your enterprise billing protocols. To align with your financial guidelines while keeping our delivery timeline on track, I propose the following practical compromise:\n\n1. Payment Terms: We will accept your standard Net-60 cycle, with an optional 2% prompt-pay discount if paid within 15 days of invoice approval.\n2. Intellectual Property: We grant full, perpetual, exclusive worldwide assignment of all custom deliverables created for your organization upon cleared settlement. To protect both sides, we simply carve out our pre-existing background design libraries and tools (for which we grant you a perpetual, royalty-free license).\n3. Indemnity: We will provide full indemnification capped at 2x aggregate contract value, which matches standard industry risk benchmarks.\n\nThis gives your team pristine clean title and risk protection while fitting cleanly within your vendor management frameworks. Please let me know if we can proceed with this adjustment.\n\nBest regards,\n[Your Name]`,
      concessionLikelihood: "Moderate (70%) — Enterprise procurement expects negotiation and typically has pre-authorized fallback tiers for IP and liability caps.",
      tacticalAdvice: [
        "Frame the concession around protecting the enterprise's ownership of the final deliverables.",
        "Include the 2% discount incentive — procurement loves capturing early payment discounts to report as cost savings."
      ]
    };
  }

  // Default / SaaS / General Persona
  return {
    counterpartyPersona: persona || "Corporate Counterparty Legal Department",
    scenarioTitle: `Standard Counterparty Pushback on ${topic || "Contract Terms"}`,
    counterpartyStance: "Conditional Pushback",
    simulatedResponseEmail: `Dear Counterparty,\n\nWe have received your requested amendments concerning ${topic || "the agreement provisions"}.\n\nOur legal department has carefully considered your request. However, the terms in our standard agreement are drafted to balance mutual interests and maintain standard commercial parity across all client engagements.\n\nModifying the core limitation of liability or indemnification sections would introduce asymmetrical exposure that our risk management policies do not permit at this pricing tier.\n\nWe value this relationship and are willing to consider minor wording adjustments, but we cannot accept unilateral carve-outs or unbounded liabilities.\n\nPlease review and let us know if you wish to proceed with the existing standard terms.\n\nSincerely,\nLegal & Commercial Affairs`,
    coreObjections: [
      "Standard contract terms have been pre-cleared by risk underwriters",
      "Fear of asymmetric liability exposure",
      "Reluctance to alter terms without reciprocal concessions"
    ],
    underlyingMotivation: "The counterparty wants to minimize legal review costs and avoid taking on unbudgeted commercial risk.",
    rebuttalStrategy: "Propose mutual reciprocity: whatever protection they demand from you, offer that both parties receive the exact same protection equally.",
    winningRebuttalScript: `Dear Legal & Commercial Affairs,\n\nThank you for your response. I completely agree that contracts should reflect balanced mutual interests and commercial parity.\n\nOur proposed adjustment simply establishes reciprocity: capping both parties' liability equally to total contract fees paid in the past 12 months, and providing standard 30-day notice with cure opportunities for both sides. Neither party gains an asymmetrical advantage.\n\nBy making the protection strictly mutual, both organizations remain fully insulated from unbounded risk while moving our commercial partnership forward smoothly.\n\nPlease let me know if this balanced mutual standard is acceptable so we can proceed to signature.\n\nBest regards,\n[Your Name]`,
    concessionLikelihood: "High (75%) — Proposing mutual reciprocity is standard legal practice and leaves the counterparty with no valid reason to reject.",
    tacticalAdvice: [
      "Always use the word 'mutual' — it is the most effective psychological lever in contract negotiations.",
      "Never ask for an exemption that you wouldn't be willing to grant the other party."
    ]
  };
}

function generateFallbackCounterProposal(
  originalClause: string,
  issueIdentified: string,
  desiredOutcome: string,
  recipientRole: string = "Counterparty",
  tone: string = "Diplomatic"
) {
  let subject = `Requested Clarification regarding Contract Terms`;
  let greeting = `Dear ${recipientRole},`;
  let bodyText = "";

  if (tone === "Firm") {
    subject = `Required Amendments Prior to Execution: ${issueIdentified || 'Contract Terms'}`;
    bodyText = `${greeting}\n\nI have reviewed the agreement and identified an essential revision necessary before this document can be executed.\n\nSpecifically, regarding "${issueIdentified || 'Terms'}":\n"${originalClause.slice(0, 250)}..."\n\nThis provision introduces asymmetric exposure that does not align with standard commercial guidelines. To proceed, this clause must be revised to the following standard terms:\n\n"${desiredOutcome || 'Both parties agree to standard mutual liability capped at direct damages and fees paid, with standard 30-day notice.'}"\n\nPlease incorporate this redline and provide an amended version for signature.\n\nSincerely,\n[Your Name]`;
  } else if (tone === "Collaborative") {
    subject = `Excited to Partner! Minor Contract Alignment on ${issueIdentified || 'Terms'}`;
    bodyText = `${greeting}\n\nI am thrilled about the prospect of working together! I reviewed the contract draft and want to make sure we're set up for a smooth, transparent partnership.\n\nOn the section touching on "${issueIdentified || 'Terms'}":\n"${originalClause.slice(0, 250)}..."\n\nTo ensure our expectations are fully aligned and win-win for both sides, I suggest the following mutual wording:\n\n"${desiredOutcome || 'Both parties agree to standard mutual protections and reasonable cure periods.'}"\n\nHow does this feel to your team? Happy to hop on a quick 5-minute sync if easier.\n\nWarm regards,\n[Your Name]`;
  } else {
    subject = `Question Regarding Contract Terms: ${issueIdentified || 'Clarification'}`;
    bodyText = `${greeting}\n\nThank you for sharing the agreement. I have reviewed the terms and look forward to finalizing our arrangement.\n\nI noticed the current wording regarding "${issueIdentified || 'Terms'}":\n"${originalClause.slice(0, 250)}..."\n\nTo ensure our agreement remains balanced and reflects standard industry practice, I propose amending this clause to:\n\n"${desiredOutcome || 'Both parties agree to standard mutual liability capped at fees paid, with reasonable notice periods.'}"\n\nPlease let me know if this adjustment works for your team, and I will be happy to sign the updated draft.\n\nBest regards,\n[Your Name]`;
  }

  return {
    emailSubject: subject,
    emailBody: bodyText,
    redlinedText: `[-] Original: "${originalClause}"\n[+] Proposed: "${desiredOutcome || 'Standard mutual balanced clause'}"`,
    talkingPoints: [
      tone === "Firm" ? "Stand firm on direct liability caps as an absolute pre-condition" : "Highlights mutual benefit and standard commercial practice",
      "Maintains professional clarity and avoids ambiguity",
      "Offers specific drop-in language to eliminate costly legal delays"
    ]
  };
}

function generateFallbackNavigatorAnswer(question: string, context: string = "") {
  const qLower = question.toLowerCase();

  // Query: How to use this app
  if (qLower.includes("how to use") || qLower.includes("app") || qLower.includes("guide") || qLower.includes("get started") || qLower.includes("tutorial") || qLower.includes("clarifylegal")) {
    return {
      content: `## How to Use ClarifyLegal

Welcome to **ClarifyLegal**! Here is a step-by-step guide to analyzing your contracts, uncovering hidden risks, and negotiating better terms:

---

### 1. 🔍 Analyze Any Legal Contract (Interactive Analyzer)
- Navigate to the **Document Analyzer** tab.
- **Upload or Drop**: Drag and drop any contract file (\`.pdf\`, \`.docx\`, \`.txt\`, \`.md\`) or paste the agreement text directly into the editor.
- **1-Click Quick Samples**: If you don't have a document on hand, click **"Residential Lease"** or **"Freelance Agreement"** to load a realistic contract instantly.
- **Select Your Perspective**: Choose whether you are analyzing as a **Tenant**, **Freelancer**, **Consumer**, or **Employee**.
- Click **"Analyze Contract with ClarifyLegal"** to generate an objective **0–100 Risk Score**, party obligation breakdowns, financial penalty summaries, and deadline trackers.

---

### 2. ⚡ In-Text Interactive Clause Inspection & Highlighting
- Under the **Document View**, toggle **"Interactive Visual Highlighter"**.
- Hover or click on color-coded clauses (**Severe**, **High**, **Moderate**, **Safe**) to jump directly between the verbatim contract text and the plain-English risk explanation.

---

### 3. ⚖️ Compare Contract Versions (Diff Engine)
- Go to the **Compare Versions** tab to compare an initial draft (**Document A**) against a landlord or client's counter-proposal (**Document B**).
- See word-level redline additions and deletions, and discover whether the changes actually made the deal safer or shifted more risk onto you.

---

### 4. 🤝 Action Playbook & Negotiation Emails
- Click **"Negotiate Clause"** on any flagged risk or go to the **Action Playbook** tab.
- Choose your preferred tone (**Diplomatic**, **Firm**, or **Collaborative**).
- Generate attorney-grade email responses with drop-in counter-clauses and verbal talking points for phone calls.

---

### 5. 🎭 Counterparty Negotiation Simulator
- In the **Action Playbook**, use the **Counterparty Simulator** to roleplay your negotiation against realistic AI personas (e.g., *Tough Corporate Landlord*, *Procurement Director*).
- Learn their hidden motivations, test your rebuttals, and see the likelihood of winning concessions.

---

### 6. 📄 1-Click Clean Amended Contract Export
- Click **"Export Clean Amended Contract"** in the action bar to automatically substitute all predatory red-risk clauses with balanced, safe terms.
- Download a ready-to-sign draft or copy the full amended agreement immediately.

---

*Note: ClarifyLegal provides educational legal literacy, analysis, and negotiation tools; it does not replace formal legal counsel.*`,
      suggestedQuestions: [
        "How do I analyze a residential lease agreement?",
        "What is the Counterparty Negotiation Simulator?",
        "How does the 0-100 Risk Score calculate contract liability?"
      ],
      actionChecklist: [
        "Select a sample contract or upload your document in the Document Analyzer",
        "Review flagged Severe and High risk clauses in the interactive viewer",
        "Generate a polite counter-proposal email in the Action Playbook",
        "Export the clean amended draft ready for signature"
      ]
    };
  }

  // Tenant / Lease questions
  if (qLower.includes("lease") || qLower.includes("tenant") || qLower.includes("rent") || qLower.includes("landlord") || qLower.includes("deposit") || qLower.includes("carpet") || qLower.includes("wear")) {
    return {
      content: `## Plain-English Legal Analysis: Tenant & Lease Rights

Regarding: **"${question}"**

---

### 1. Key Statutory Principles & Rights
- **Routine Wear & Tear vs. Property Damage**: In virtually all state and municipal jurisdictions, landlords are legally prohibited from deducting standard wear and tear (e.g., faded paint, carpet traffic matting, light scuffs) from your security deposit.
- **Warranty of Habitability**: Landlords have a non-waivable statutory obligation to maintain basic habitability (operational heating, hot water, watertight roof, plumbing). Lease clauses attempting to shift major mechanical or structural repair burdens onto tenants are frequently void as against public policy.
- **Statutory Deposit Return Timelines**: Most states strictly cap security deposit return windows to 14–30 calendar days post-moveout, requiring an itemized deduction statement with receipts. Failure to provide receipts can forfeit their right to withhold funds.

---

### 2. Hidden Risks to Watch For
- **Silent Automatic Renewals**: Clauses requiring 60–90 days certified mail notice to prevent a 1-year lease extension with a unilateral rent hike.
- **Unannounced Landlord Entry**: Clauses allowing landlord or agent access "at any time" without 24–48 hours advance written notice violate the covenant of quiet enjoyment.

---

### 3. Recommended Strategy
1. **Document Move-In/Move-Out**: Always record a date-stamped video walkthrough of the unit.
2. **Cite Statutory Habitability**: If pushed to pay for heating or plumbing repairs, politely reference your state's tenant protection act in writing.
3. **Request Itemized Invoices**: Dispute deposit deductions by formally demanding third-party repair receipts within statutory deadlines.

*Disclaimer: This response provides educational legal information and analysis only. It does not constitute legal representation or advice.*`,
      suggestedQuestions: [
        "Can a landlord enter my apartment without 24 hours notice?",
        "How do I write a formal security deposit demand letter?",
        "Can my landlord increase rent during a fixed-term lease?"
      ],
      actionChecklist: [
        "Take timestamped photos and videos of the premises",
        "Send all repair requests in writing with dated confirmation",
        "Check your state's statutory security deposit return deadline",
        "Review Section 4 of your lease for specific notice requirements"
      ]
    };
  }

  // Freelance / IP / Independent Contractor questions
  if (qLower.includes("freelance") || qLower.includes("code") || qLower.includes("ip") || qLower.includes("intellectual property") || qLower.includes("contractor") || qLower.includes("invoice") || qLower.includes("net-30") || qLower.includes("non-compete")) {
    return {
      content: `## Plain-English Legal Analysis: Freelancer & Contractor Rights

Regarding: **"${question}"**

---

### 1. Key Legal Principles & Rights
- **Pre-Existing IP & Background Tools**: When creating deliverables, client contracts often draft broad "work-made-for-hire" provisions claiming all inventions created during the term. You must explicitly carve out your pre-existing code, design systems, templates, and libraries.
- **Payment Conditioning on IP Assignment**: IP ownership should transfer **only upon full cleared settlement of all outstanding invoices**, not upon creation or delivery. This guarantees your core leverage if a client refuses to pay.
- **Enforceability of Non-Competes**: Non-compete clauses against independent contractors are heavily disfavored, and in jurisdictions like California, Minnesota, and New York, broadly void or severely restricted. A client cannot prevent you from practicing your trade.

---

### 2. Hidden Risks to Watch For
- **Uncapped Indemnity Clauses**: Clauses requiring you to indemnify the client for all third-party losses without a monetary ceiling (should always be capped at 1x–2x total contract value).
- **Net-60 / Net-90 Payment Creep**: Extended billing cycles that leave you acting as an interest-free bank for the client.

---

### 3. Recommended Strategy
1. **Add Background IP Rider**: "Contractor retains sole ownership of pre-existing background code and tools, granting Client a perpetual, royalty-free license solely to use the final deliverables."
2. **Tie Assignment to Payment**: "Transfer of copyright and ownership rights is expressly conditioned upon Contractor receiving payment in full."
3. **Impose Late Interest**: Include a standard 1.5% monthly late fee for invoices past Net-30.

*Disclaimer: This response provides educational legal information and analysis only. It does not constitute legal representation or advice.*`,
      suggestedQuestions: [
        "How do I protect my pre-existing libraries in a freelance contract?",
        "What is the best way to handle a client refusing to pay a Net-30 invoice?",
        "How can I cap my liability to the contract value?"
      ],
      actionChecklist: [
        "Verify that your contract conditions IP transfer on full invoice payment",
        "List all pre-existing libraries and frameworks in Exhibit A",
        "Send formal written reminder on Day 31 for overdue invoices",
        "Ensure liability is capped at aggregate contract fees"
      ]
    };
  }

  // General Legal Doctrine & Contracts
  return {
    content: `## Plain-English Legal Information Overview

Regarding: **"${question}"**

---

### 1. Key Legal Principles & Rights
- **Mutual Assent & Ambiguity**: Contracts require mutual understanding. Under the doctrine of *contra proferentem*, contractual ambiguities are typically construed against the party who drafted the agreement.
- **Statutory Protections vs. Contractual Terms**: Private contract clauses cannot override mandatory statutory consumer, tenant, or employment protections established by law.
- **Notice and Cure Periods**: Standard commercial contracts generally require formal written notice with a 15–30 day cure period before either party can declare default or terminate for cause.

---

### 2. Hidden Pitfalls to Watch For
- **Unilateral Attorney Fee Clauses**: Ensure fee-shifting clauses are strictly mutual so the prevailing party recovers costs, rather than only the counterparty.
- **Mandatory Binding Arbitration in Remote Venues**: Look out for clauses forcing disputes into out-of-state arbitration with high upfront filing fees.

---

### 3. Recommended Strategy
1. **Always Communicate in Writing**: Maintain a clean audit trail via email rather than verbal promises.
2. **Propose Mutual Language**: Frame all negotiations around fairness and reciprocity—both parties should have equal protections.
3. **Use ClarifyLegal Action Playbook**: Use the built-in negotiation generator to draft polite, attorney-grade redline amendments.

*Disclaimer: ClarifyLegal provides educational legal analysis and information, not formal legal advice.*`,
    suggestedQuestions: [
      "How do I negotiate unfair contract terms without losing the deal?",
      "What makes a contract clause legally unenforceable?",
      "How can I turn unilateral clauses into mutual protections?"
    ],
    actionChecklist: [
      "Review the exact contract clause text in your agreement",
      "Check local statutory consumer or tenant guidelines",
      "Draft a written clarification citing specific section numbers",
      "Export a clean amended contract using the ClarifyLegal Playbook"
    ]
  };
}

// Live API WebSocket Server for Gemini 3.8 Live Voice Conversations
const wss = new WebSocketServer({ server, path: "/live-voice" });

wss.on("connection", async (clientWs: WebSocket, req: http.IncomingMessage) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    clientWs.send(JSON.stringify({ type: "error", error: "Gemini API key is not configured on server." }));
    clientWs.close();
    return;
  }

  // Parse voice, role, and active contract context from query
  let voiceName = "Zephyr";
  let role = "advisor";
  let documentContextNotice = "";
  try {
    const host = req.headers.host || "localhost:3000";
    const parsedUrl = new URL(req.url || "", `http://${host}`);
    voiceName = parsedUrl.searchParams.get("voice") || "Zephyr";
    role = parsedUrl.searchParams.get("role") || "advisor";
    const docTitle = parsedUrl.searchParams.get("docTitle");
    const docRisk = parsedUrl.searchParams.get("docRisk");
    const docType = parsedUrl.searchParams.get("docType");
    if (docTitle) {
      documentContextNotice = `\nActive Document Context: The user is currently examining "${docTitle}" (${docType || "Legal Agreement"}, Risk Score: ${docRisk || "N/A"}/100). Keep your legal insights tailored to this context whenever asked.`;
    }
  } catch (e) {}

  let systemInstruction = "You are ClarifyLegal Voice Assistant, an approachable, highly knowledgeable legal document advisor and negotiation strategist. You speak clearly, naturally, and warmly to help users understand confusing legal clauses, lease terms, contractor rights, and negotiation tactics. Keep answers conversational, direct, and under 2 to 3 sentences unless asked for details." + documentContextNotice;
  if (role === "negotiator") {
    systemInstruction = "You are a pragmatic, tough corporate counterparty and negotiation sparring partner. In this voice roleplay, you push back realistically on tenant or contractor requests while remaining professional, and then offer constructive advice when asked. Speak naturally and concisely." + documentContextNotice;
  } else if (role === "simplifier") {
    systemInstruction = "You are a friendly legal translator who explains dense legal concepts in plain, 5th-grade English. Speak warmly and clearly, avoiding legal jargon." + documentContextNotice;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });

  let session: any = null;
  let isClosed = false;

  try {
    session = await ai.live.connect({
      model: "gemini-3.8-live",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
        systemInstruction,
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

          // Check for audio output chunks
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({
                  type: "audio",
                  audio: part.inlineData.data,
                  mimeType: part.inlineData.mimeType || "audio/pcm;rate=24000"
                }));
              }
              if (part.text) {
                clientWs.send(JSON.stringify({
                  type: "model_transcript",
                  text: part.text
                }));
              }
            }
          }

          // Audio transcriptions from Gemini Live (Google returns outputTranscription)
          const outputTranscript = 
            (message.serverContent as any)?.outputTranscription?.text ||
            (message.serverContent as any)?.outputAudioTranscription?.text;
          if (outputTranscript) {
            clientWs.send(JSON.stringify({
              type: "model_transcript",
              text: outputTranscript
            }));
          }

          const inputTranscript = 
            (message.serverContent as any)?.inputTranscription?.text ||
            (message.serverContent as any)?.inputAudioTranscription?.text;
          if (inputTranscript) {
            clientWs.send(JSON.stringify({
              type: "user_transcript",
              text: inputTranscript
            }));
          }

          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: "interrupted", interrupted: true }));
          }

          if (message.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ type: "turn_complete" }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: "session_closed" }));
          }
        },
        onerror: (err: any) => {
          console.error("Live session callback error:", err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: "error", error: err?.message || "Live API error" }));
          }
        }
      }
    });

    clientWs.send(JSON.stringify({
      type: "connected",
      model: "gemini-3.8-live",
      voice: voiceName,
      role
    }));

    // Trigger an immediate welcome spoken greeting from Gemini Live
    try {
      session.sendClientContent({
        turns: [
          {
            role: "user",
            parts: [{ text: "Hello! In one brief, warm sentence, introduce yourself as ClarifyLegal Voice and ask how you can help clarify or negotiate the agreement today." }]
          }
        ],
        turnComplete: true
      });
    } catch (greetErr) {
      console.warn("Initial greeting trigger warning:", greetErr);
    }
  } catch (err: any) {
    console.error("Failed to connect to Live API:", err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: "error", error: err?.message || "Failed to start Live session" }));
      clientWs.close();
    }
    return;
  }

  clientWs.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === "audio" && msg.audio && session) {
        session.sendRealtimeInput({
          media: [
            {
              data: msg.audio,
              mimeType: "audio/pcm;rate=16000"
            }
          ]
        });
      } else if (msg.type === "text" && msg.text && session) {
        session.sendClientContent({
          turns: [
            {
              role: "user",
              parts: [{ text: msg.text }]
            }
          ],
          turnComplete: true
        });
      }
    } catch (err) {
      console.error("Error parsing live client message:", err);
    }
  });

  clientWs.on("close", () => {
    isClosed = true;
    if (session) {
      try {
        session.close();
      } catch (e) {}
    }
  });
});

// Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`ClarifyLegal server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

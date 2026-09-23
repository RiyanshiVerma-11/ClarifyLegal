import { ContractAnalysisResult, DocumentComparisonResult } from '../types';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';

const RECENT_ANALYSES_KEY = 'clarifylegal_recent_analyses';
const RECENT_COMPARISONS_KEY = 'clarifylegal_recent_comparisons';

export function getSavedAnalyses(): ContractAnalysisResult[] {
  try {
    const raw = localStorage.getItem(RECENT_ANALYSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load saved analyses from localStorage', e);
    return [];
  }
}

export function saveAnalysis(analysis: ContractAnalysisResult): void {
  try {
    const existing = getSavedAnalyses();
    const filtered = existing.filter((item) => item.id !== analysis.id && item.documentTitle.trim().toLowerCase() !== analysis.documentTitle.trim().toLowerCase());
    const updated = [analysis, ...filtered].slice(0, 15);
    localStorage.setItem(RECENT_ANALYSES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save analysis to localStorage', e);
  }
}

export function deleteAnalysis(id: string): ContractAnalysisResult[] {
  try {
    const existing = getSavedAnalyses();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(RECENT_ANALYSES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete analysis from localStorage', e);
    return [];
  }
}

export function clearSavedAnalyses(): void {
  try {
    localStorage.removeItem(RECENT_ANALYSES_KEY);
  } catch (e) {
    console.error('Failed to clear analyses', e);
  }
}

export function getSavedComparisons(): DocumentComparisonResult[] {
  try {
    const raw = localStorage.getItem(RECENT_COMPARISONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load saved comparisons from localStorage', e);
    return [];
  }
}

export function saveComparison(comparison: DocumentComparisonResult): void {
  try {
    const existing = getSavedComparisons();
    const filtered = existing.filter((item) => item.id !== comparison.id);
    const updated = [comparison, ...filtered].slice(0, 10);
    localStorage.setItem(RECENT_COMPARISONS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save comparison to localStorage', e);
  }
}

export function seedBothLeaseAndContractorAnalyses(): ContractAnalysisResult[] {
  try {
    const lease = getPresetSampleAnalysis('residential-lease');
    const contractor = getPresetSampleAnalysis('freelance-contractor');
    const results: ContractAnalysisResult[] = [];
    if (lease) results.push(lease);
    if (contractor) results.push(contractor);

    // Merge with any existing analyses without duplicating
    const existing = getSavedAnalyses();
    const map = new Map<string, ContractAnalysisResult>();
    // Put existing first
    existing.forEach(item => map.set(item.id, item));
    // Ensure demo lease and contractor exist
    if (contractor) map.set(contractor.id, contractor);
    if (lease) map.set(lease.id, lease);

    const merged = Array.from(map.values());
    localStorage.setItem(RECENT_ANALYSES_KEY, JSON.stringify(merged));
    return [lease, contractor].filter(Boolean) as ContractAnalysisResult[];
  } catch (e) {
    console.error('Failed to seed both demo analyses:', e);
    return [];
  }
}

export function seedDemoAnalysesIfEmpty(): void {
  try {
    const existing = getSavedAnalyses();
    if (existing.length === 0) {
      seedBothLeaseAndContractorAnalyses();
    }
  } catch (e) {
    console.error('Failed to seed demo analyses:', e);
  }
}

export function getPresetSampleAnalysis(sampleId: string): ContractAnalysisResult | null {
  const normId = (sampleId || '').toLowerCase();

  // 1. Residential Lease
  if (normId.includes('lease') || normId === 'residential-lease') {
    const sample = SAMPLE_CONTRACTS.find(s => s.id === 'residential-lease') || SAMPLE_CONTRACTS[0];
    return {
      id: 'demo-residential-lease',
      documentTitle: 'Residential Apartment Lease (442 Elmwood Ave)',
      documentType: 'Residential Tenancy Lease',
      analyzedAt: new Date().toISOString(),
      rawText: sample.content,
      summary: `**Executive Summary:** This residential lease shifts substantial maintenance costs onto the tenant and introduces an aggressive 90-day automatic renewal trap.\n\n**Primary Risk Exposures:**\n1. **Shifted Repair Costs**: Section 4 requires you to pay for plumbing and heating maintenance up to $350 even if caused by ordinary wear.\n2. **Automatic Renewal Trap**: Section 5 automatically locks you into a new 12-month lease with up to a 25% rent increase unless you give 90 days certified mail notice.\n3. **Arbitrary Landlord Entry**: Section 6 grants landlord unrestricted unannounced entry.\n4. **Broad Liability Waiver**: Section 7 attempts to waive claims even for gross landlord negligence.`,
      riskScore: 78,
      riskLevel: 'High',
      categoryRisks: {
        financialLiability: {
          score: 84,
          level: 'Severe',
          flaggedCount: 3,
          keyFinding: 'Tenant pays for HVAC/plumbing up to $350 plus $4,900 deposit held for 90 days.'
        },
        ipRights: {
          score: 12,
          level: 'Low',
          flaggedCount: 0,
          keyFinding: 'Residential agreement; no intellectual property assignments or licenses.'
        },
        termination: {
          score: 90,
          level: 'Severe',
          flaggedCount: 2,
          keyFinding: 'Strict 90-day certified mail renewal opt-out with up to 25% automatic rent hike.'
        },
        hiddenPenalties: {
          score: 76,
          level: 'High',
          flaggedCount: 2,
          keyFinding: '$15/day compounding late fees after 48h and unannounced landlord entry.'
        }
      },
      keyParties: {
        party1: 'Crestview Properties LLC (Landlord)',
        party2: 'Jane Doe (Tenant)',
        userPerspective: 'Tenant',
      },
      criticalClauses: [
        {
          id: 'clause-1',
          title: 'Shifted Maintenance & Habitability Liability',
          originalExcerpt: 'Tenant agrees to bear full financial responsibility for any plumbing clogs, heating repairs under $350.00, window maintenance, and appliance servicing regardless of whether caused by normal wear and tear or tenant misuse.',
          simplifiedMeaning: 'You must pay up to $350 every time the heater or pipes break, even if the equipment broke because of old age.',
          risk: 'Severe',
          obligationType: 'Your Obligation',
          potentialPitfall: 'You could end up paying thousands in cumulative repair bills for a neglected heating system that the landlord is legally obligated to maintain.',
          recommendation: 'Amend to: "Landlord warrants implied warranty of habitability and shall maintain all major systems; Tenant liable strictly for tenant-caused negligence."',
        },
        {
          id: 'clause-2',
          title: 'Strict 90-Day Automatic Renewal Forfeiture',
          originalExcerpt: 'Unless Tenant provides written notice by certified registered mail at least ninety (90) calendar days prior to expiration, this Lease shall automatically renew for an additional twelve (12) month period at a rate determined solely by Landlord, not to exceed a 25% increase.',
          simplifiedMeaning: 'If you do not send a registered letter 3 full months before move-out, you are locked into a whole new year with a 25% rent spike.',
          risk: 'High',
          obligationType: 'Your Obligation',
          potentialPitfall: 'Forgetting this early deadline traps you for another year at $3,062/month.',
          recommendation: 'Amend to standard 30 or 60 days written notice, transitioning to month-to-month tenancy thereafter.',
        },
        {
          id: 'clause-3',
          title: 'Unrestricted Landlord Entry Without Notice',
          originalExcerpt: 'Landlord or Landlord\'s agents may enter the Premises at any time without prior written notice for inspection, showing to prospective buyers, or arbitrary checks.',
          simplifiedMeaning: 'The landlord or their agents can walk into your home whenever they want with zero advance warning.',
          risk: 'High',
          obligationType: 'Counterparty Right',
          potentialPitfall: 'Violates your legal right to quiet enjoyment; exposes you to unexpected inspections.',
          recommendation: 'Require minimum 24 hours advance written notice except during life-safety emergencies.',
        },
        {
          id: 'clause-4',
          title: 'Gross Negligence Liability Waiver',
          originalExcerpt: 'Tenant agrees to release, indemnify, defend, and hold harmless Landlord and its agents from any and all damages, personal injury, theft, or property loss occurring on the Premises, even if resulting from Landlord\'s gross negligence or deferred building maintenance.',
          simplifiedMeaning: 'If the ceiling falls because the landlord failed to fix a leaking roof, you cannot sue them for your injuries or damaged belongings.',
          risk: 'Severe',
          obligationType: 'Your Obligation',
          potentialPitfall: 'Leaves you with zero legal recourse for serious injuries or property loss caused by landlord neglect.',
          recommendation: 'Strike "gross negligence or deferred building maintenance"; standard residential law forbids waiving gross negligence.',
        }
      ],
      financialTerms: [
        {
          item: 'Monthly Rent',
          amountOrFormula: '$2,450.00 / month',
          condition: 'Due on or before the 1st of each month',
          isUnusualOrAggressive: false,
        },
        {
          item: 'Compounding Late Charge',
          amountOrFormula: '$150 base + $15/day',
          condition: 'Triggers immediately after 5:00 PM on 2nd day',
          isUnusualOrAggressive: true,
        },
        {
          item: 'Security Deposit Retention',
          amountOrFormula: '$4,900.00 (2 months)',
          condition: 'Held up to 90 days with routine cleaning deductions',
          isUnusualOrAggressive: true,
        }
      ],
      deadlinesAndMilestones: [
        {
          event: 'Non-Renewal Notice Cutoff',
          timeline: '90 days before lease expiration (Certified Mail)',
          consequenceIfMissed: 'Automatic 12-month renewal at up to 25% rent increase',
        },
        {
          event: 'Rent Late Penalty Cutoff',
          timeline: '5:00 PM on 2nd calendar day of the month',
          consequenceIfMissed: 'Instant $150 penalty + daily compounding charges',
        }
      ],
      missingProtections: [
        'No 24-hour advance written notice requirement for landlord inspections',
        'No statutory cap on security deposit deductions for ordinary wear and tear',
        'No mutual right for tenant to terminate early upon landlord breach of habitability'
      ],
      actionChecklist: [
        {
          id: 'act-1',
          action: 'Request removal of the $350 tenant repair obligation in Section 4',
          priority: 'urgent',
          explanation: 'State tenancy codes obligate landlords to maintain heating and plumbing under the Implied Warranty of Habitability.',
        },
        {
          id: 'act-2',
          action: 'Amend 90-day certified mail renewal clause to standard 30 or 60 days',
          priority: 'urgent',
          explanation: 'A 90-day window is unusually aggressive and easy to miss.',
        },
        {
          id: 'act-3',
          action: 'Insist on 24-hour advance notice for non-emergency entry',
          priority: 'recommended',
          explanation: 'Protects your constitutional and statutory right to quiet enjoyment.',
        }
      ]
    };
  }

  // 2. Freelance Contractor Agreement
  if (normId.includes('contractor') || normId.includes('freelance') || normId === 'freelance-contractor') {
    const sample = SAMPLE_CONTRACTS.find(s => s.id === 'freelance-contractor') || SAMPLE_CONTRACTS[1];
    return {
      id: 'demo-freelance-contractor',
      documentTitle: 'Independent Contractor Services Agreement (Apex Digital)',
      documentType: 'Freelance & Independent Contractor Agreement',
      analyzedAt: new Date().toISOString(),
      rawText: sample.content,
      summary: `**Executive Summary:** An overreaching contractor agreement featuring Net-90 payment terms, unconditional pre-assignment of pre-existing tools, an 18-month North America non-compete, and uncapped client indemnification.\n\n**Primary Risk Exposures:**\n1. **IP Pre-Assignment**: Section 3 attempts to seize tools and code libraries you built before signing.\n2. **Extended Net-90 Terms**: Section 2 delays payment for 3 full months and allows withholding 40% arbitrarily.\n3. **Broad Non-Compete**: Section 5 bans you from the entire digital/tech sector across North America for 18 months.\n4. **Uncapped Indemnity**: Section 4 forces you to pay unlimited client legal fees for indirect claims.`,
      riskScore: 86,
      riskLevel: 'Severe',
      categoryRisks: {
        financialLiability: {
          score: 82,
          level: 'Severe',
          flaggedCount: 2,
          keyFinding: 'Net-90 payment terms with unilateral right to withhold up to 40% of invoiced fees.'
        },
        ipRights: {
          score: 95,
          level: 'Severe',
          flaggedCount: 2,
          keyFinding: 'Irrevocable universal transfer of pre-existing libraries, tools, and moral rights.'
        },
        termination: {
          score: 75,
          level: 'High',
          flaggedCount: 1,
          keyFinding: 'Company may terminate immediately for convenience; contractor must give 60 days notice.'
        },
        hiddenPenalties: {
          score: 88,
          level: 'Severe',
          flaggedCount: 2,
          keyFinding: '18-month continent-wide non-compete restriction and unlimited third-party indemnity.'
        }
      },
      keyParties: {
        party1: 'Apex Digital Corp (Company)',
        party2: 'Marcus Vance (Contractor)',
        userPerspective: 'Contractor',
      },
      criticalClauses: [
        {
          id: 'fc-1',
          title: 'Universal Pre-Assignment of Pre-Existing Tools & IP',
          originalExcerpt: 'Contractor hereby irrevocably assigns, transfers, and conveys to Company all rights, title, and interest throughout the universe in perpetuity to all Deliverables, inventions, tools, pre-existing design frameworks, code libraries, and concepts created, conceived, or utilized by Contractor prior to or during the term of this Agreement. Contractor unconditionally waives all moral rights.',
          simplifiedMeaning: 'The client is trying to take legal ownership of all code libraries, templates, and tools you created years before you even met them.',
          risk: 'Severe',
          obligationType: 'Your Obligation',
          potentialPitfall: 'You would lose the legal right to reuse your own design frameworks or software starter templates on any other client project.',
          recommendation: 'Carve out pre-existing IP: Contractor retains sole ownership of background tools, granting Company a non-exclusive perpetual license solely for deliverables.',
        },
        {
          id: 'fc-2',
          title: 'Uncapped Direct & Indirect Indemnification',
          originalExcerpt: 'Contractor shall defend, indemnify, and hold harmless Company, its officers, affiliates, and clients against any claim, loss, expense, or attorney fees arising directly or indirectly from Contractor\'s services, performance, or alleged infringement, without limitation or cap on liability.',
          simplifiedMeaning: 'You agree to pay 100% of the client\'s legal fees and damages without any financial ceiling, even for indirect claims.',
          risk: 'Severe',
          obligationType: 'Your Obligation',
          potentialPitfall: 'A single customer lawsuit against the client could bankrupt you personally for hundreds of thousands of dollars.',
          recommendation: 'Cap indemnification liability strictly to total fees actually paid to Contractor under the project brief.',
        },
        {
          id: 'fc-3',
          title: '18-Month Continent-Wide Non-Compete',
          originalExcerpt: 'During the term of this Agreement and for a period of eighteen (18) months following termination, Contractor shall not directly or indirectly provide design, software, or advisory services to any business operating in the digital or technology sector within North America.',
          simplifiedMeaning: 'You cannot work for any tech or digital business in North America for a year and a half after finishing this project.',
          risk: 'Severe',
          obligationType: 'Your Obligation',
          potentialPitfall: 'Severely impedes your ability to earn a living as a software/design professional.',
          recommendation: 'Completely strike the non-compete clause. Independent contractors must remain free to serve multiple non-direct clients.',
        },
        {
          id: 'fc-4',
          title: 'Net-90 Payment & Unilateral Withholding',
          originalExcerpt: 'Company shall remit payment under Net-90 terms following formal acceptance of deliverables. Company reserves the right to withhold up to 40% of invoiced amounts if deliverables require revision.',
          simplifiedMeaning: 'You won\'t get paid until 3 months after work is accepted, and they can hold back 40% whenever they request edits.',
          risk: 'High',
          obligationType: 'Counterparty Right',
          potentialPitfall: 'Forces you to finance the client\'s operations interest-free for 90 days with risk of arbitrary fee cuts.',
          recommendation: 'Amend to Net-30 payment with a maximum 10% retention strictly tied to mutually agreed milestone criteria.',
        }
      ],
      financialTerms: [
        {
          item: 'Hourly Compensation',
          amountOrFormula: '$85.00 / hour',
          condition: 'Subject to monthly invoicing and formal acceptance',
          isUnusualOrAggressive: false,
        },
        {
          item: 'Disbursement Schedule',
          amountOrFormula: 'Net-90 Payment Window',
          condition: 'Remitted 90 days after formal deliverable sign-off',
          isUnusualOrAggressive: true,
        },
        {
          item: 'Arbitrary Fee Withholding',
          amountOrFormula: 'Up to 40% of invoice amount',
          condition: 'Company may withhold if deliverables require revision',
          isUnusualOrAggressive: true,
        }
      ],
      deadlinesAndMilestones: [
        {
          event: 'Termination for Convenience Window',
          timeline: 'Immediate for Company; 60 days advance written for Contractor',
          consequenceIfMissed: 'Contractor forced into uncompensated standby',
        },
        {
          event: 'Post-Contract Restrictive Window',
          timeline: '18 months following contract end',
          consequenceIfMissed: 'Banned from digital sector across North America',
        }
      ],
      missingProtections: [
        'No mutual liability cap tied to fees paid',
        'No explicit reservation of Contractor pre-existing background IP',
        'No late payment interest penalty for delayed client remittance'
      ],
      actionChecklist: [
        {
          id: 'act-fc-1',
          action: 'Strike pre-existing IP assignment and moral rights waiver in Section 3',
          priority: 'urgent',
          explanation: 'Only work product specifically created and paid for should transfer.',
        },
        {
          id: 'act-fc-2',
          action: 'Reject 18-month non-compete clause entirely',
          priority: 'urgent',
          explanation: 'Independent contractors cannot legally be barred from practicing their profession across an entire continent.',
        },
        {
          id: 'act-fc-3',
          action: 'Negotiate Net-30 payment and maximum 14-day deliverable review period',
          priority: 'recommended',
          explanation: 'Prevents indefinite client payment delays and stabilizes cash flow.',
        }
      ]
    };
  }

  // 3. SaaS Terms of Service
  if (normId.includes('saas') || normId === 'saas-terms') {
    const sample = SAMPLE_CONTRACTS.find(s => s.id === 'saas-terms') || SAMPLE_CONTRACTS[2];
    return {
      id: 'demo-saas-terms',
      documentTitle: 'SaaS Platform Terms of Service & Privacy (CloudSync)',
      documentType: 'Software as a Service (SaaS) Agreement',
      analyzedAt: new Date().toISOString(),
      rawText: sample.content,
      summary: `**Executive Summary:** A standard consumer-facing SaaS agreement containing a sweeping license to sublicense your uploaded content and train AI models, a $20 liability cap, and mandatory confidential arbitration.\n\n**Primary Risk Exposures:**\n1. **User Content Commercialization**: Section 2 gives the vendor a perpetual license to use, sublicense, and train AI models on all your uploaded data.\n2. **Unilateral Modifications**: Section 1 lets the vendor change terms anytime with no individual notice.\n3. **Near-Zero Liability**: Section 4 caps vendor liability to $20 regardless of data loss or server downtime.\n4. **Mandatory Arbitration & Class Action Waiver**: Section 5 blocks you from joining class action lawsuits or court litigation.`,
      riskScore: 71,
      riskLevel: 'High',
      categoryRisks: {
        financialLiability: {
          score: 65,
          level: 'High',
          flaggedCount: 1,
          keyFinding: 'Vendor aggregate liability is capped at 1 month\'s fee or $20.00, whichever is less.'
        },
        ipRights: {
          score: 90,
          level: 'Severe',
          flaggedCount: 1,
          keyFinding: 'Perpetual, royalty-free license to train AI models and commercially sublicense user data.'
        },
        termination: {
          score: 68,
          level: 'Moderate',
          flaggedCount: 1,
          keyFinding: 'Unilateral amendments effective immediately upon posting without affirmative user notice.'
        },
        hiddenPenalties: {
          score: 82,
          level: 'Severe',
          flaggedCount: 2,
          keyFinding: 'Mandatory confidential individual arbitration in Delaware with class action lawsuit waiver.'
        }
      },
      keyParties: {
        party1: 'CloudSync Inc. (Provider)',
        party2: 'End User / Subscriber (Consumer)',
        userPerspective: 'End User',
      },
      criticalClauses: [
        {
          id: 'saas-1',
          title: 'Commercial AI Training & Content Sublicense',
          originalExcerpt: 'You grant CloudSync a perpetual, irrevocable, worldwide, royalty-free, transferable license to use, reproduce, modify, distribute, create derivative works from, display, train artificial intelligence models upon, and commercially sublicense all data, files, and content uploaded to the service.',
          simplifiedMeaning: 'Anything you upload can be used forever to train AI models or be sold to third parties without paying you anything.',
          risk: 'Severe',
          obligationType: 'Your Obligation',
          potentialPitfall: 'Proprietary trade secrets or confidential client files uploaded to this cloud drive lose their confidentiality protections.',
          recommendation: 'Restrict license strictly to what is necessary to operate the cloud storage service; exclude AI model training and commercial sublicensing.',
        },
        {
          id: 'saas-2',
          title: 'Unilateral Modification Without Individual Notice',
          originalExcerpt: 'We reserve the right to amend, alter, or replace these Terms at any time without individual notice. Your continued use following any change constitutes unconditional acceptance.',
          simplifiedMeaning: 'They can change the contract, pricing, or data rules at 3:00 AM without emailing you, and you automatically agree by logging in.',
          risk: 'High',
          obligationType: 'Counterparty Right',
          potentialPitfall: 'You may unknowingly agree to higher fees, reduced privacy protections, or new usage restrictions.',
          recommendation: 'Require minimum 30 days advance email notice for material modifications with right to cancel without penalty.',
        },
        {
          id: 'saas-3',
          title: 'Mandatory Arbitration & Class Action Waiver',
          originalExcerpt: 'All disputes shall be resolved exclusively through confidential individual binding arbitration in Wilmington, Delaware. YOU WAIVE ANY RIGHT TO PARTICIPATE AS A CLASS REPRESENTATIVE OR CLASS MEMBER IN ANY CLASS ACTION LAWSUIT AGAINST CLOUDSYNC.',
          simplifiedMeaning: 'You give up your constitutional right to sue in open court or join other users in a class action if they leak your data.',
          risk: 'Severe',
          obligationType: 'Your Obligation',
          potentialPitfall: 'Arbitrating in Delaware individually is prohibitively expensive for individual consumers, effectively stripping legal remedy.',
          recommendation: 'Review if the platform offers a 30-day arbitration opt-out notice procedure.',
        }
      ],
      financialTerms: [
        {
          item: 'Subscription Fees',
          amountOrFormula: 'Monthly / Annual SaaS Tier',
          condition: 'Subject to recurring billing without prior notice',
          isUnusualOrAggressive: false,
        },
        {
          item: 'Liability Ceiling',
          amountOrFormula: '$20.00 or 1 month fee max',
          condition: 'Applies even in catastrophic data breach or service failure',
          isUnusualOrAggressive: true,
        }
      ],
      deadlinesAndMilestones: [
        {
          event: 'Unilateral Terms Modification',
          timeline: 'Instantaneous upon posting',
          consequenceIfMissed: 'Deemed unconditional legal acceptance of revised terms',
        }
      ],
      missingProtections: [
        'No data breach indemnification or customer notification SLA',
        'No commitment that customer data is deleted from backup servers upon account cancellation',
        'No service uptime level guarantee (SLA) or credit for downtime'
      ],
      actionChecklist: [
        {
          id: 'act-saas-1',
          action: 'Do not upload unencrypted sensitive personal data or proprietary client source code',
          priority: 'urgent',
          explanation: 'The AI training and commercial sublicensing clause destroys confidentiality privilege.',
        },
        {
          id: 'act-saas-2',
          action: 'Opt out of mandatory binding arbitration within 30 days if permitted',
          priority: 'recommended',
          explanation: 'Preserves your right to join collective legal actions if a mass data breach occurs.',
        }
      ]
    };
  }

  // 4. Employment Offer Letter
  if (normId.includes('employment') || normId.includes('offer') || normId === 'employment-offer') {
    const sample = SAMPLE_CONTRACTS.find(s => s.id === 'employment-offer') || SAMPLE_CONTRACTS[3];
    return {
      id: 'demo-employment-offer',
      documentTitle: 'Executive Offer of Employment & Proprietary Rights (Horizon Tech)',
      documentType: 'Employment Offer & Restrictive Covenants',
      analyzedAt: new Date().toISOString(),
      rawText: sample.content,
      summary: `**Executive Summary:** An attractive $145,000 employment offer bundled with aggressive post-employment non-compete provisions and overreaching assignment of personal off-hours inventions.\n\n**Primary Risk Exposures:**\n1. **Off-Hours Inventions Assignment**: Section 3 attempts to seize personal software or writings developed on personal laptops outside work hours.\n2. **100-Mile / Online Non-Compete**: Section 2(a) bans working for any competitor within 100 miles or anywhere the employer conducts online business.\n3. **Extended 24-Month Non-Solicitation**: Section 2(b) restricts hiring or communicating with former colleagues for 2 full years.\n4. **Strict At-Will Status**: Section 1 offers zero severance or notice protection if terminated.`,
      riskScore: 66,
      riskLevel: 'Moderate',
      categoryRisks: {
        financialLiability: {
          score: 25,
          level: 'Low',
          flaggedCount: 1,
          keyFinding: 'Base salary of $145,000 annualized; no direct personal monetary liability.'
        },
        ipRights: {
          score: 84,
          level: 'Severe',
          flaggedCount: 1,
          keyFinding: 'Inventions conceived off-hours on personal equipment vest automatically in employer.'
        },
        termination: {
          score: 55,
          level: 'Moderate',
          flaggedCount: 1,
          keyFinding: 'Strict at-will employment without severance guarantees or advance notice.'
        },
        hiddenPenalties: {
          score: 86,
          level: 'Severe',
          flaggedCount: 2,
          keyFinding: '12-month online/100-mile non-compete and 24-month coworker non-solicitation restriction.'
        }
      },
      keyParties: {
        party1: 'Horizon Tech Solutions (Employer)',
        party2: 'Alex Rivera (Employee / Product Manager)',
        userPerspective: 'Employee',
      },
      criticalClauses: [
        {
          id: 'emp-1',
          title: 'Off-Hours Personal Inventions Assignment',
          originalExcerpt: 'All ideas, software, writings, patents, and business methodologies conceived or developed by you, whether during work hours or off-hours on personal equipment, during the period of employment, shall automatically vest in Horizon Tech as sole property.',
          simplifiedMeaning: 'Any mobile app, book, or weekend coding project you make at home on your own computer automatically belongs to the company.',
          risk: 'Severe',
          obligationType: 'Your Obligation',
          potentialPitfall: 'Completely strips your ability to build personal side projects or open-source software outside company hours.',
          recommendation: 'Incorporate state statutory carve-out (e.g. Cal. Lab. Code § 2870): Inventions developed entirely on personal time and hardware that do not relate to employer business remain employee property.',
        },
        {
          id: 'emp-2',
          title: 'Broad 100-Mile & Online Commerce Non-Compete',
          originalExcerpt: 'You shall not accept employment, consult, or invest in any entity competing with Horizon Tech within a 100-mile radius or anywhere Horizon conducts online commerce.',
          simplifiedMeaning: 'Because the company does business online, you cannot work for any competitor anywhere on earth for 12 months after leaving.',
          risk: 'Severe',
          obligationType: 'Your Obligation',
          potentialPitfall: 'Could prevent you from accepting product management jobs at any tech firm in your field.',
          recommendation: 'Limit restriction to direct competitive solicitation of Horizon\'s existing active enterprise clients rather than an industry-wide employment ban.',
        },
        {
          id: 'emp-3',
          title: '24-Month Coworker Non-Solicitation Bar',
          originalExcerpt: 'You shall not solicit, recruit, or attempt to hire any current or former Horizon employee or contractor for twenty-four (24) months.',
          simplifiedMeaning: 'For 2 years after departing, you cannot recruit or work with any former colleagues at your new company.',
          risk: 'High',
          obligationType: 'Your Obligation',
          potentialPitfall: 'Unusually long 2-year duration restricts standard professional networking.',
          recommendation: 'Reduce duration to standard 12 months and limit strictly to direct inducement of current employees.',
        }
      ],
      financialTerms: [
        {
          item: 'Annualized Base Salary',
          amountOrFormula: '$145,000 / year',
          condition: 'Payable semi-monthly subject to standard withholdings',
          isUnusualOrAggressive: false,
        }
      ],
      deadlinesAndMilestones: [
        {
          event: 'Post-Employment Non-Compete Window',
          timeline: '12 months following termination for any reason',
          consequenceIfMissed: 'Risk of cease-and-desist injunction from former employer',
        },
        {
          event: 'Coworker Non-Solicit Window',
          timeline: '24 months following separation',
          consequenceIfMissed: 'Legal claim for tortious interference with contractual relations',
        }
      ],
      missingProtections: [
        'No statutory invention carve-out disclosure schedule (Exhibit A)',
        'No severance payout clause in the event of termination without cause',
        'No explicit continuation of equity vesting during cure periods'
      ],
      actionChecklist: [
        {
          id: 'act-emp-1',
          action: 'Attach a written list of Prior Inventions and side projects to exclude from assignment',
          priority: 'urgent',
          explanation: 'Protects existing code repositories and domains you created before your start date.',
        },
        {
          id: 'act-emp-2',
          action: 'Request removal or narrowing of the non-compete clause to direct client solicitation',
          priority: 'urgent',
          explanation: 'Broad online non-competes are increasingly unenforceable and harm your career mobility.',
        }
      ]
    };
  }

  return null;
}

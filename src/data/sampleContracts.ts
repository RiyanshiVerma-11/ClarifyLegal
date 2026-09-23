export interface SampleContract {
  id: string;
  title: string;
  category: string;
  badge: string;
  description: string;
  riskExpectation: 'High' | 'Moderate' | 'Low';
  content: string;
}

export interface SampleComparisonPair {
  id: string;
  title: string;
  description: string;
  docA: {
    title: string;
    content: string;
  };
  docB: {
    title: string;
    content: string;
  };
}

export const SAMPLE_CONTRACTS: SampleContract[] = [
  {
    id: 'residential-lease',
    title: 'Residential Apartment Lease Agreement',
    category: 'Tenancy & Housing',
    badge: 'Popular • High Risk Clauses',
    description: 'A 12-month lease with hidden repair liabilities, automatic 60-day renewal forfeiture, and landlord entry terms.',
    riskExpectation: 'High',
    content: `RESIDENTIAL LEASE AGREEMENT

This Agreement is entered into on September 1, 2024, by and between Crestview Properties LLC ("Landlord") and Jane Doe ("Tenant").

1. PREMISES AND TERM. Landlord hereby leases to Tenant the apartment located at 442 Elmwood Ave, Unit 3B, for a term of twelve (12) months commencing October 1, 2024, and ending September 30, 2025.

2. RENT AND LATE CHARGES. Tenant agrees to pay Landlord $2,450.00 per month on or before the first (1st) day of each month. A late fee of $150.00 plus $15.00 per day shall apply automatically if payment is received after 5:00 PM on the 2nd day of the month.

3. SECURITY DEPOSIT. Tenant shall deposit $4,900.00 (two months' rent) as security. Landlord may deduct any costs for routine cleaning, repainting, and administration fees upon move-out. The deposit shall be returned within ninety (90) days following vacancy.

4. MAINTENANCE AND REPAIRS. Tenant agrees to bear full financial responsibility for any plumbing clogs, heating repairs under $350.00, window maintenance, and appliance servicing regardless of whether caused by normal wear and tear or tenant misuse. Tenant shall not withhold rent under any circumstances for failure to provide habitability services.

5. AUTOMATIC RENEWAL. Unless Tenant provides written notice by certified registered mail at least ninety (90) calendar days prior to expiration, this Lease shall automatically renew for an additional twelve (12) month period at a rate determined solely by Landlord, not to exceed a 25% increase.

6. ACCESS AND INSPECTION. Landlord or Landlord's agents may enter the Premises at any time without prior written notice for inspection, showing to prospective buyers, or arbitrary checks.

7. INDEMNIFICATION AND LIABILITY. Tenant agrees to release, indemnify, defend, and hold harmless Landlord and its agents from any and all damages, personal injury, theft, or property loss occurring on the Premises, even if resulting from Landlord's gross negligence or deferred building maintenance.`
  },
  {
    id: 'freelance-contractor',
    title: 'Independent Contractor Services Agreement',
    category: 'Freelance & Business',
    badge: 'Freelancer Alert • Overreaching IP',
    description: 'Contract with Net-90 payment terms, unconditional IP pre-assignment, and unbounded client indemnification.',
    riskExpectation: 'High',
    content: `INDEPENDENT CONTRACTOR AGREEMENT

This Agreement is entered into between Apex Digital Corp ("Company") and Marcus Vance ("Contractor").

1. SCOPE OF SERVICES. Contractor agrees to perform web design, UX strategy, and front-end engineering as assigned by Company in various task briefs.

2. COMPENSATION AND PAYMENT. Company shall compensate Contractor at the rate of $85.00 per hour. Contractor shall submit invoices monthly. Company shall remit payment under Net-90 terms following formal acceptance of deliverables. Company reserves the right to withhold up to 40% of invoiced amounts if deliverables require revision.

3. INTELLECTUAL PROPERTY & MORAL RIGHTS. Contractor hereby irrevocably assigns, transfers, and conveys to Company all rights, title, and interest throughout the universe in perpetuity to all Deliverables, inventions, tools, pre-existing design frameworks, code libraries, and concepts created, conceived, or utilized by Contractor prior to or during the term of this Agreement. Contractor unconditionally waives all moral rights.

4. UNLIMITED INDEMNIFICATION. Contractor shall defend, indemnify, and hold harmless Company, its officers, affiliates, and clients against any claim, loss, expense, or attorney fees arising directly or indirectly from Contractor's services, performance, or alleged infringement, without limitation or cap on liability.

5. NON-COMPETE RESTRICTION. During the term of this Agreement and for a period of eighteen (18) months following termination, Contractor shall not directly or indirectly provide design, software, or advisory services to any business operating in the digital or technology sector within North America.

6. TERMINATION. Company may terminate this Agreement immediately for convenience without penalty or obligation to pay unaccepted work. Contractor may terminate only upon sixty (60) days advance written notice.`
  },
  {
    id: 'saas-terms',
    title: 'SaaS Platform Terms of Service & Privacy',
    category: 'Consumer & Digital Rights',
    badge: 'Consumer Trap • Arbitration & Data Resale',
    description: 'End-user agreement with unilateral change rights, mandatory arbitration, and unrestricted user content licensing.',
    riskExpectation: 'Moderate',
    content: `TERMS OF SERVICE AND USER LICENSE

Last Modified: August 2024

1. ACCEPTANCE AND MODIFICATION. By accessing the CloudSync Service, you agree to these Terms. We reserve the right to amend, alter, or replace these Terms at any time without individual notice. Your continued use following any change constitutes unconditional acceptance.

2. LICENSE TO USER CONTENT. You grant CloudSync a perpetual, irrevocable, worldwide, royalty-free, transferable license to use, reproduce, modify, distribute, create derivative works from, display, train artificial intelligence models upon, and commercially sublicense all data, files, and content uploaded to the service.

3. DISCLAIMER OF WARRANTIES. The service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind. CloudSync expressly disclaims responsibility for data loss, service interruption, unauthorized third-party access, or system failure.

4. LIMITATION OF LIABILITY. In no event shall CloudSync's aggregate liability exceed the total amount paid by you in the preceding one (1) month, or $20.00, whichever is less.

5. MANDATORY BINDING ARBITRATION & CLASS ACTION WAIVER. All disputes shall be resolved exclusively through confidential individual binding arbitration in Wilmington, Delaware. YOU WAIVE ANY RIGHT TO PARTICIPATE AS A CLASS REPRESENTATIVE OR CLASS MEMBER IN ANY CLASS ACTION LAWSUIT AGAINST CLOUDSYNC.`
  },
  {
    id: 'employment-offer',
    title: 'Employment Offer Letter & Non-Compete',
    category: 'Employment',
    badge: 'Restrictive Covenants',
    description: 'Offer letter with broad non-compete radius, non-solicitation of coworkers, and ownership of outside inventions.',
    riskExpectation: 'Moderate',
    content: `EXECUTIVE OFFER OF EMPLOYMENT & PROPRIETARY RIGHTS

Dear Alex Rivera,

We are pleased to extend an offer for the position of Senior Product Manager at Horizon Tech Solutions.

1. POSITION AND COMPENSATION. Your initial annualized salary will be $145,000, payable semi-monthly, subject to standard withholdings. Employment is strictly "at-will" and may be terminated by either party at any time with or without cause or notice.

2. RESTRICTIVE COVENANTS & NON-COMPETITION. You acknowledge that during your employment and for a period of twelve (12) months after termination for any reason:
(a) You shall not accept employment, consult, or invest in any entity competing with Horizon Tech within a 100-mile radius or anywhere Horizon conducts online commerce.
(b) You shall not solicit, recruit, or attempt to hire any current or former Horizon employee or contractor for twenty-four (24) months.

3. INVENTIONS AND PROPRIETARY DEVELOPMENTS. All ideas, software, writings, patents, and business methodologies conceived or developed by you, whether during work hours or off-hours on personal equipment, during the period of employment, shall automatically vest in Horizon Tech as sole property.`
  }
];

export const SAMPLE_COMPARISON_PAIRS: SampleComparisonPair[] = [
  {
    id: 'nda-standard-vs-strict',
    title: 'Mutual NDA: Standard Balanced vs. Aggressive One-Way',
    description: 'Compare a balanced mutual non-disclosure agreement against a vendor-skewed one-way restrictive NDA.',
    docA: {
      title: 'Standard Balanced Mutual NDA (Version A)',
      content: `MUTUAL NON-DISCLOSURE AGREEMENT (STANDARD)

1. CONFIDENTIAL INFORMATION. "Confidential Information" means proprietary information marked as confidential or that a reasonable person would understand to be confidential. It excludes information publicly known through no breach, independently developed, or rightfully received from third parties.

2. MUTUAL OBLIGATIONS. Both parties agree to protect each other's Confidential Information with the same degree of care as their own confidential information (at least reasonable care) and disclose only to employees with a need to know under written confidentiality duties.

3. TERM AND SURVIVAL. This Agreement shall remain in effect for two (2) years from disclosure date. After two years, confidentiality duties expire, except for bona fide trade secrets.

4. REMEDIES. Either party may seek injunctive relief in addition to monetary damages in the event of unauthorized disclosure.`
    },
    docB: {
      title: 'Vendor Heavy Unilateral NDA (Version B)',
      content: `CONFIDENTIALITY AND PROPRIETARY PROTECTION AGREEMENT (VENDOR VERSION)

1. CONFIDENTIAL INFORMATION. "Confidential Information" means all information, data, concepts, source code, business forecasts, and conversations disclosed by Vendor to Recipient. There shall be no requirement to mark materials as confidential. Recipient bears the burden of proof to demonstrate any exclusion.

2. STRICT OBLIGATIONS. Recipient warrants that it will hold all Vendor information under absolute security protocols. Any accidental release, even absent negligence, constitutes an immediate material breach. Recipient shall be strictly liable for any leak by any affiliate or contractor.

3. PERPETUAL OBLIGATION. Recipient's confidentiality obligations shall endure in perpetuity without time limitation.

4. DAMAGES AND INDEMNIFICATION. In the event of any alleged breach, Recipient agrees to pay liquidated damages of $100,000 per occurrence plus full legal fees, without requiring Vendor to prove actual financial harm.`
    }
  },
  {
    id: 'lease-original-vs-rider',
    title: 'Apartment Lease: Original vs. Tenant Amendment Rider',
    description: 'See how a tenant successfully negotiated security deposit return, repair caps, and notice periods.',
    docA: {
      title: 'Original Landlord Lease Draft',
      content: `MAINTENANCE & REPAIR: Tenant is responsible for all plumbing, fixture replacements, and HVAC servicing up to $500 per incident. Rent may not be withheld.
SECURITY DEPOSIT: Held in non-interest bearing account; Landlord has 90 days post-moveout to return remaining balance.
TERMINATION & RENEWAL: Automatically renews for 1 year unless Tenant gives 90 days written notice. Early termination requires 3 months rent penalty.`
    },
    docB: {
      title: 'Tenant Revised Rider & Addendum',
      content: `MAINTENANCE & REPAIR: Landlord warrants premises are habitable. Tenant is responsible only for tenant-inflicted damage. All routine plumbing, structural, and HVAC maintenance is 100% Landlord responsibility.
SECURITY DEPOSIT: Deposit to be held in a state-compliant escrow account. Landlord must return deposit with itemized receipts within 21 days as mandated by state law.
TERMINATION & RENEWAL: Converts to month-to-month upon lease expiration with 30 days written notice. Early termination permitted with 30 days notice and 1 month re-letting fee if tenant relocates for employment.`
    }
  }
];

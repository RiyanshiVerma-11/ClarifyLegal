import { GlossaryTerm } from '../types';

export const LEGAL_GLOSSARY: GlossaryTerm[] = [
  {
    term: 'Indemnification (Hold Harmless)',
    pronunciation: 'in-dem-nuh-fuh-KAY-shun',
    category: 'Liability & Risk',
    definition: 'A contractual commitment where one party promises to compensate or defend the other for legal liabilities, damages, or lawsuit costs incurred from third-party claims.',
    plainEnglish: 'If someone gets sued or incurs a loss because of something related to this agreement, you promise to pay for their lawyers and any court judgment.',
    realWorldExample: 'A client gets sued by a competitor for copyright infringement on a design you built, and demands you pay their $50,000 legal defense bill.',
    watchOutFor: 'Watch for "unlimited indemnification" or indemnifying for things outside your direct control (e.g. client gross negligence or broad third-party claims).'
  },
  {
    term: 'Force Majeure',
    pronunciation: 'forss ma-ZHUR',
    category: 'Contract Basics',
    definition: 'A clause that frees both parties from liability or obligation when an extraordinary event or circumstance beyond their control (act of God, war, pandemic) prevents performance.',
    plainEnglish: 'The "unforeseen catastrophe" clause: if a natural disaster, war, or government shutdown stops you from fulfilling the contract, you cannot be sued for breach.',
    realWorldExample: 'A hurricane destroys the event venue the week before a wedding, releasing both the caterer and the couple from breach penalties.',
    watchOutFor: 'Check whether payments are excused during a force majeure event, or whether only operational performance is paused.'
  },
  {
    term: 'Severability',
    pronunciation: 'sev-er-uh-BIL-ih-tee',
    category: 'Contract Basics',
    definition: 'A provision stating that if one term of the contract is declared illegal or unenforceable by a court, the remainder of the agreement remains valid and in effect.',
    plainEnglish: 'The "cut the bad apple" rule: if a judge strikes down clause #5 as illegal, clauses #1 through #4 and #6 through #10 still hold strong.',
    realWorldExample: 'If a 2-year non-compete is deemed illegal in California, the non-disclosure clause in the same contract remains valid.',
    watchOutFor: 'Usually standard and beneficial, but make sure critical core rights cannot be amputated without renegotiating the core deal.'
  },
  {
    term: 'Liquidated Damages',
    pronunciation: 'LIK-wih-day-tid DAM-ih-jez',
    category: 'Liability & Risk',
    definition: 'A predetermined amount of money agreed upon by the parties during contract formation to be paid as compensation if one party breaches the agreement.',
    plainEnglish: 'A pre-set penalty fee: instead of arguing in court over actual financial losses, you agree in advance on an exact dollar amount for breaking a rule.',
    realWorldExample: 'Breaking an apartment lease early triggers a flat $3,000 fee instead of paying the remaining 8 months of rent.',
    watchOutFor: 'Ensure the amount is a reasonable estimate of actual anticipated harm, not an illegal punitive extortion fee.'
  },
  {
    term: 'Joint and Several Liability',
    pronunciation: 'joynt and SEV-er-ul',
    category: 'Liability & Risk',
    definition: 'A legal rule whereby two or more parties can each be held individually liable for the full amount of a debt or damages, regardless of their individual share of fault.',
    plainEnglish: 'The "all on you" rule: if three roommates sign a lease and two skip town without paying, the landlord can legally demand the entire rent check from you alone.',
    realWorldExample: 'Signing a co-working space contract with a business partner where the landlord can collect 100% of missed rent from either one of you.',
    watchOutFor: 'Avoid agreeing to joint liability with people or contractors whose financial responsibility you cannot personally control.'
  },
  {
    term: 'Binding Arbitration',
    pronunciation: 'BIND-ing ar-buh-TRAY-shun',
    category: 'Dispute Resolution',
    definition: 'A dispute resolution process where a private neutral arbitrator, rather than a judge or jury in a public court, issues a final, legally enforceable decision that usually cannot be appealed.',
    plainEnglish: 'Giving up your right to sue in court: disputes are handled behind closed doors by a private referee whose ruling is final with virtually zero appeal rights.',
    realWorldExample: 'A consumer terms of service requiring disputes to go to the American Arbitration Association rather than a small claims or state civil court.',
    watchOutFor: 'Watch out for who pays the steep arbitrator filing fees and whether class action lawsuits are waived.'
  },
  {
    term: 'Class Action Waiver',
    pronunciation: 'klass AK-shun WAY-vur',
    category: 'Dispute Resolution',
    definition: 'A clause requiring users or signers to resolve disputes solely on an individual basis, prohibiting them from joining collective lawsuits with other affected persons.',
    plainEnglish: 'You cannot team up with other victims: if a bank improperly charges 10,000 customers $15 each, you must spend hundreds of dollars fighting for your $15 alone.',
    realWorldExample: 'Credit card user agreements requiring single-claimant dispute resolution.',
    watchOutFor: 'Removes consumer collective bargaining power and disincentivizes pursuing small but systematic unlawful charges.'
  },
  {
    term: 'Non-Disparagement',
    pronunciation: 'non-dih-SPAIR-ij-ment',
    category: 'Contract Basics',
    definition: 'A clause forbidding a party from making negative statements, reviews, or comments that could damage the reputation or business of the other party.',
    plainEnglish: 'A gag order on negative reviews: you promise never to say bad things publicly or privately about the company, its products, or management.',
    realWorldExample: 'A severance agreement or apartment lease forbidding you from posting negative reviews on Google or Yelp.',
    watchOutFor: 'Ensure it is mutual (the company cannot disparage you either) and carves out truthful testimony required by law or regulatory agencies.'
  },
  {
    term: 'At-Will Employment',
    pronunciation: 'at-wil em-PLOY-ment',
    category: 'Employment & IP',
    definition: 'An employment doctrine where either the employer or the employee may terminate the employment relationship at any time, for any lawful reason or no reason, without advance notice.',
    plainEnglish: 'No guaranteed job security: your boss can fire you tomorrow for virtually any reason that is not unlawful discrimination, and you can quit whenever you want.',
    realWorldExample: 'Being let go on a Friday afternoon without severance or prior performance warnings.',
    watchOutFor: 'Know that offers promising "long term partnership" mean very little if the contract states employment is strictly at-will.'
  },
  {
    term: 'Habitability Warranty',
    pronunciation: 'hab-ih-tuh-BIL-ih-tee',
    category: 'Real Estate',
    definition: 'An implied or statutory obligation of a landlord to maintain residential rental premises in a safe, sanitary, and livable condition meeting building codes.',
    plainEnglish: 'The landlord must keep the place livable: working heat, running water, weatherproof roof, and no toxic mold or rodent infestations.',
    realWorldExample: 'A landlord attempting to put a clause saying "Tenant must fix heating at tenant\'s expense" is usually violating state habitability law.',
    watchOutFor: 'Clauses where landlords try to waive habitability obligations or shift structural plumbing and heating repairs onto tenants.'
  },
  {
    term: 'Work Made For Hire',
    pronunciation: 'wurk mayd for hire',
    category: 'Employment & IP',
    definition: 'A statutory doctrine under copyright law where the commissioning entity, rather than the original creator, is deemed the initial legal author and owner of the work.',
    plainEnglish: 'The employer owns your work from second one: you do not own the copyright and cannot claim ownership unless reserved in writing.',
    realWorldExample: 'A software engineer coding an app while employed at a firm; the firm owns 100% of the repository.',
    watchOutFor: 'As an independent contractor, only grant "work for hire" ownership upon full receipt of payment.'
  },
  {
    term: 'Subrogation Waiver',
    pronunciation: 'sub-roh-GAY-shun',
    category: 'Liability & Risk',
    definition: 'A provision where an insured party waives the right of their insurance company to sue a negligent third party to recover amounts paid out for a claim.',
    plainEnglish: 'Your insurance company cannot sue the other person to get its money back after paying your claim.',
    realWorldExample: 'Common in commercial leases so that neither party\'s insurance company tries to bankrupt the other after a fire.',
    watchOutFor: 'Verify that your insurance policy allows you to sign subrogation waivers, or you could jeopardize your coverage.'
  }
];

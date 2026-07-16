# Privacy Policy

**OfflineGameNia**  
**Website:** https://offlinegamenia.com  
**Last updated:** July 15, 2026

> **Disclaimer:** These documents are drafted to match OfflineGameNia's current product and technical implementation. They are not a substitute for legal advice. Have a qualified attorney review before publication, especially regarding shared-account models and jurisdiction-specific consumer rights.

---

## Table of Contents

1. [Who We Are](#1-who-we-are)
2. [Scope](#2-scope)
3. [Data We Collect](#3-data-we-collect)
4. [How We Use Data](#4-how-we-use-data)
5. [Legal Bases (GDPR / Similar Laws)](#5-legal-bases-gdpr--similar-laws)
6. [Third-Party Processors](#6-third-party-processors)
7. [Cookies and Similar Technologies](#7-cookies-and-similar-technologies)
8. [Data Sharing](#8-data-sharing)
9. [International Transfers](#9-international-transfers)
10. [Retention](#10-retention)
11. [Your Rights](#11-your-rights)
12. [California Residents (CCPA / CPRA)](#12-california-residents-ccpa--cpra)
13. [Children](#13-children)
14. [Security](#14-security)
15. [Account Deletion](#15-account-deletion)
16. [Changes to This Policy](#16-changes-to-this-policy)
17. [Contact](#17-contact)

---

## 1. Who We Are

This Privacy Policy explains how **OfflineGameNia** ("**OfflineGameNia**," "**we**," "**us**," or "**our**") collects, uses, stores, and shares personal information when you use our website and related services at [https://offlinegamenia.com](https://offlinegamenia.com) (the "**Service**").

| Field | Value |
|-------|-------|
| Operator | OfflineGameNia |
| Website | https://offlinegamenia.com |
| Registered address | [Registered Address] |
| Country | [Country/Jurisdiction] |
| Privacy / support contact | support@offlinegamenia.com |
| Data Protection Officer (if appointed) | [DPO Name / Email, or "Not appointed — contact support@offlinegamenia.com"] |

This Policy should be read together with our [Terms of Service](./terms-of-service.md) and [Refund Policy](./refund-policy.md).

---

## 2. Scope

This Policy applies to personal information processed in connection with:

- Browsing the website and catalog;
- Creating or signing in to an account;
- One-time purchases and Subscriptions;
- License Activation, My Games, and Steam Guard / credential features;
- Contact forms and support requests;
- Interactions with our Discord community and support bot (when you choose to use them);
- Optional newsletter signup (when that feature is active and you subscribe).

This Policy does **not** apply to third-party Platforms (Steam, Epic Games, Microsoft, Discord as a platform, payment networks, etc.) that process data under their own policies when you use their services.

---

## 3. Data We Collect

### 3.1 Account and identity data

When you register or sign in, we (and our authentication provider) may process:

- Email address;
- First name and last name (if provided);
- Authentication identifiers (for example Clerk user ID);
- Role indicators (for example user vs admin, for staff accounts only).

### 3.2 Purchase and License data

When you buy a Product or Subscription, we may process:

- Buyer email (including guest checkout email from Stripe);
- Order identifiers, amounts, currency (typically USD), and status;
- Stripe checkout session IDs, payment IDs, and Subscription IDs;
- License Keys and License status (available, activated, expired, revoked);
- Links between Licenses, Orders, games, Shared Account assignments, and Subscriptions;
- Optional country fields on Licenses when set for administrative purposes.

### 3.3 Technical and security data

We may collect:

- Internet Protocol (IP) address;
- User-Agent / browser or client information;
- Timestamps and metadata for security-sensitive actions (checkout creation, License validate/activate, Steam Guard requests, payment webhooks, admin actions, session revoke events);
- Rate-limit and abuse-prevention signals.

This information is primarily stored in audit logs for security, fraud prevention, and operational integrity.

### 3.4 Support and community data

If you contact us:

- Messages and attachments you send via contact channels;
- Discord usernames, message content, and channel context when you interact with our Discord support bot or staff;
- Case notes created when issues are escalated to human support.

Our Discord support bot may use AI models (see processors below) to generate suggested replies. Support messages should not include passwords for your **personal** accounts or unrelated sensitive data.

### 3.5 Payment card data

Card numbers, CVC, and full payment credentials are collected and processed by **Stripe** on Stripe Checkout pages. **OfflineGameNia does not store full payment card numbers** on our servers.

### 3.6 Marketing / newsletter data

If and when you subscribe to a newsletter or marketing emails, we process the email address you provide and your subscription preferences. If the newsletter form is not yet connected to a backend, we will not process newsletter email until the feature is functional and you have submitted a real subscription.

### 3.7 Data we do not intentionally collect

We do not intentionally collect government ID numbers, precise GPS location, biometric templates, or special-category (sensitive) personal data as part of standard checkout. Please do not submit such data through support forms unless we specifically request it for a lawful reason.

### 3.8 Shared Account credentials (not your personal Steam/Epic login)

Platform credentials for **Shared Accounts** (username, encrypted passwords, shared secrets for 2FA) are stored to fulfill Products. Those credentials belong to OfflineGameNia's service infrastructure—not to your personal Platform account—and are protected with encryption at rest. They are sensitive operational secrets but are not your identity data; nonetheless we treat them with high security.

---

## 4. How We Use Data

We use personal information to:

1. **Provide the Service** — account authentication, catalog browsing, checkout, License issuance, Activation, My Games, Steam Guard codes, Subscriptions.
2. **Process payments and prevent fraud** — work with Stripe; detect abuse; protect Shared Account pools.
3. **Customer support** — respond to tickets, Discord escalations, License recovery, warranty replacements.
4. **Security and audit** — investigate incidents, enforce Terms, rate-limit misuse.
5. **Operate and improve** — diagnose errors (for example via optional Sentry), maintain reliability, develop features.
6. **Communicate** — transaction-related notices, service messages, and, with consent where required, marketing.
7. **Legal compliance** — tax, accounting, responding to lawful requests, enforcing agreements, defending legal claims.

We do **not** sell your personal information for money.

---

## 5. Legal Bases (GDPR / Similar Laws)

If you are in the European Economic Area (EEA), United Kingdom, Switzerland, or a jurisdiction with similar rules, we rely on these legal bases:

| Purpose | Typical legal basis |
|---------|---------------------|
| Creating accounts, fulfilling purchases, Activation, Subscriptions | **Contract performance** (Art. 6(1)(b) GDPR) |
| Fraud prevention, security audit logs, abuse detection | **Legitimate interests** (Art. 6(1)(f)) — keeping the Service secure and viable |
| Marketing newsletters (when offered) | **Consent** (Art. 6(1)(a)) — withdraw anytime |
| Legal obligations (records, lawful requests) | **Legal obligation** (Art. 6(1)(c)) |
| Establishing or defending legal claims | **Legitimate interests** and/or legal obligation |

You may object to processing based on legitimate interests as described in Section 11.

---

## 6. Third-Party Processors

We use carefully selected service providers ("processors") who process data on our behalf or as independent controllers for their parts of the stack:

| Provider | Role | Data typically involved |
|----------|------|-------------------------|
| **Clerk** | Authentication, sessions, user identity | Email, name, auth tokens/cookies, user ID |
| **Stripe** | Payment processing, Subscriptions, refunds | Buyer email, payment method metadata, transaction amounts, billing identifiers |
| **Neon (PostgreSQL)** | Primary application database | Account, Order, License, Subscription, audit records |
| **Discord** | Community and support channels | Username, messages, escalation content (if you use Discord) |
| **Google Gemini (or similar AI)** | Assist Discord / support automation | Support message text sent to the model for reply generation |
| **IGDB / Twitch API** | Admin game metadata import | Generally not end-user personal data |
| **Sentry** (if enabled) | Error monitoring | Technical error data, possibly truncated request context |
| **Hosting (e.g. Vercel / Railway)** | Application hosting and transport | IP addresses, logs, request metadata |

Each provider has its own privacy policy. We configure them to process only what is needed for the Service.

---

## 7. Cookies and Similar Technologies

### 7.1 Essential cookies

We use **essential cookies and local storage** required for the Service to function, especially:

- **Clerk authentication and session cookies** to keep you signed in and secure;
- Security and load-balancing cookies provided by hosting infrastructure.

These are necessary for core features; disabling them may break login and purchase flows.

### 7.2 Analytics cookies

As of the Last updated date, OfflineGameNia does **not** operate a first-party Google Analytics / PostHog / Plausible-style analytics stack in the product. If we add analytics later, we will update this Policy and, where required, obtain consent.

### 7.3 Stripe and third-party checkout

When you are redirected to Stripe Checkout, Stripe may set cookies or use similar technologies subject to Stripe's policies.

### 7.4 Your controls

You can control cookies through your browser settings. Blocking essential cookies may prevent account and payment features from working. We may add a cookie preference banner in the future if required by law or if we introduce non-essential cookies.

---

## 8. Data Sharing

We share personal information only as follows:

1. **Processors** listed in Section 6, under contracts or terms requiring appropriate protection;
2. **Professional advisors** (lawyers, accountants) under confidentiality where needed;
3. **Authorities** when required by law, court order, or to protect rights, safety, and security;
4. **Business transfers** if we merge, sell, or restructure (your information may transfer as part of that transaction, subject to this Policy or successor notice).

We do **not** sell personal information. We do **not** share personal information for cross-context behavioral advertising as a business model. If that ever changes, we will update this Policy and provide required opt-outs.

---

## 9. International Transfers

OfflineGameNia and some processors may process data in the United States, the European Union, and other countries.

Where personal data is transferred from the EEA/UK to countries without an adequacy decision, we rely on appropriate safeguards such as **Standard Contractual Clauses (SCCs)** or equivalent mechanisms provided by our processors, together with supplemental measures where applicable.

---

## 10. Retention

We retain personal information only as long as needed for the purposes described, including:

| Data category | Typical retention |
|---------------|-------------------|
| Account profile | For the life of the account, then deleted or anonymized after account deletion (subject to backups and legal holds) |
| Orders and Licenses | For the License Term plus a reasonable period for warranty, disputes, accounting, and legal retention (often several years) |
| Subscription records | For the Subscription life plus legal/accounting retention |
| Audit logs (IP, User-Agent, actions) | For a limited security period unless needed longer for investigations |
| Support / Discord tickets | For as long as needed to resolve issues and improve support, then archived or deleted per operational practice |
| Stripe records | Retained by Stripe per Stripe's policies and applicable financial regulations; we retain payment identifiers needed for reconciliation |

When data is no longer needed, we delete or anonymize it, except where continued retention is required by law or necessary for dispute resolution.

---

## 11. Your Rights

Depending on your location, you may have the right to:

1. **Access** — obtain confirmation and a copy of personal data we hold about you;
2. **Rectification** — correct inaccurate or incomplete data;
3. **Erasure** — request deletion ("right to be forgotten") where applicable;
4. **Restriction** — request limited processing in certain cases;
5. **Portability** — receive certain data in a structured, commonly used format;
6. **Object** — object to processing based on legitimate interests (including profiling where applicable);
7. **Withdraw consent** — where processing is consent-based, withdraw at any time without affecting prior lawful processing;
8. **Lodge a complaint** — with your local data protection supervisory authority (EEA/UK) if you believe we mishandled your data.

**How to exercise rights:** email **support@offlinegamenia.com** with the subject line "Privacy Request," and include enough information for us to verify your identity (for example the email used for your account or purchases). We will respond within the timeframe required by applicable law (generally within 30 days under GDPR, subject to extensions for complex requests).

Some requests may be denied or limited where an exemption applies (for example preventing fraud, complying with legal obligations, or where deletion would impair ongoing dispute records).

---

## 12. California Residents (CCPA / CPRA)

If you are a California resident, you may have rights under the CCPA/CPRA, including to:

- Know the categories and specific pieces of personal information we collect, use, and disclose;
- Delete personal information (subject to exceptions);
- Correct inaccurate personal information;
- Opt out of "sale" or "sharing" of personal information for cross-context behavioral advertising;
- Not be discriminated against for exercising privacy rights.

**Sale / sharing:** We do not sell personal information for monetary consideration. We do not knowingly share personal information for cross-context behavioral advertising. If this changes, we will provide a "Do Not Sell or Share My Personal Information" mechanism.

**Categories collected:** identifiers (email, name, IP), commercial information (purchases), internet/activity information (audit logs), and inferences only as needed for fraud prevention—not for advertising profiles.

To exercise California rights, contact **support@offlinegamenia.com**. We will verify requests as required by law. You may use an authorized agent subject to verification requirements.

---

## 13. Children

The Service is **not directed to children under 18**. We do not knowingly collect personal information from children under 18 (or under the digital age of consent in your jurisdiction). If you believe a child has provided us personal information, contact us and we will take appropriate steps to delete it.

---

## 14. Security

We implement technical and organizational measures appropriate to the risk, including:

- HTTPS encryption in transit;
- Encryption at rest for Shared Account credentials and related secrets;
- Access controls and role-based permissions for administrative functions;
- Authentication via a reputable provider (Clerk);
- Payment handling by Stripe (PCI-DSS compliant provider);
- Rate limiting on sensitive endpoints (checkout, Activation, Steam Guard);
- Audit logging of security-relevant events.

No method of transmission or storage is 100% secure. You are responsible for safeguarding your OfflineGameNia account credentials and for not posting Shared Account credentials publicly.

---

## 15. Account Deletion

15.1. Where available, you may delete your account from account settings on the Service. This typically removes your OfflineGameNia user profile from our application database and deletes the corresponding Clerk authentication user.

15.2. Consequences of deletion may include loss of access to Licenses and purchase history associated with the account.

15.3. Account deletion does **not** by itself entitle you to a refund. See the [Refund Policy](./refund-policy.md).

15.4. We may retain limited records after deletion where needed for legal obligations, fraud prevention, accounting, or dispute resolution (for example Stripe transaction records and anonymized audit trails).

15.5. To request deletion if self-service is unavailable, email **support@offlinegamenia.com**.

---

## 16. Changes to This Policy

We may update this Privacy Policy from time to time. The "Last updated" date will change when we do. Material changes will be posted on the Service. Where required by law, we will seek additional consent.

---

## 17. Contact

For privacy questions or requests:

| Channel | Details |
|---------|---------|
| Email | support@offlinegamenia.com |
| Website | https://offlinegamenia.com/contact |
| Postal | [Registered Address] |
| Supervisory authority | You may also contact your local data protection authority if you are in the EEA/UK |

---

*End of Privacy Policy*

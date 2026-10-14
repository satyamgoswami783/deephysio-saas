# Google Play Data Safety Technical Inventory & Matrix

This document provides a complete technical audit of all data collected, processed, and stored across the **deePhysio Clinical SaaS** ecosystem (React frontend, Capacitor Android shell, Node.js backend, and MySQL database).

---

## 1. Subsystem Audit Inventory

### A. React Frontend & Capacitor Android Shell
- **User Credentials & Auth State:** Tokens and session identifiers stored locally for session continuity.
- **Photos & Documents:** Photos taken with `@capacitor/camera` (e.g., patient posture photos, clinical body charts, X-ray scans) or files picked via native file picker for attachment to medical records.
- **Push Notification Device Tokens:** FCM registration tokens obtained via `@capacitor/push-notifications` to receive appointment reminders and emergency clinical schedule alerts.
- **Network State:** Network connectivity monitored via `@capacitor/network` to provide offline indicators without destroying authenticated sessions.
- **Hardware/Sensors:** No background location tracking, no contacts, no call logs, no microphone recordings, no SMS read/write.

### B. Node.js Backend & Database (MySQL / Prisma)
- **User Profile Data:** Practitioner name, email, phone number, clinic identifier, hashed password (bcrypt), role, allowed module permissions.
- **Patient Clinical Records:** Patient full name, age/DOB, contact number, emergency contact, medical history, SOAP assessment notes, diagnosis, treatment plans, exercise prescriptions, and discharge summaries.
- **Financial & Invoicing Data:** Invoice numbers, service line items, billed amounts, payment status, payment mode (cash, card, UPI, bank transfer). *Raw payment card numbers are NEVER processed or stored on our servers.*
- **System Activity & Audit Logs:** IP addresses, login timestamps, and record update audit trails for clinical accountability.

### C. Third-Party Integrations
- **Payment Gateways (Razorpay / Stripe):** Customer email, transaction amount, order identifiers for subscription processing.
- **SMS & Messaging (Twilio / WhatsApp Baileys):** Patient phone number and appointment confirmation message text.
- **Email Infrastructure (Nodemailer / SMTP):** Notification emails, password reset tokens, and PDF invoice receipts.

---

## 2. Google Play Data Safety Matrix

| Data Type | Collected? | Shared? | Purpose | Required / Optional | Stored? | Retention Policy | Third-Party Service |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Personal Name** | Yes | No | Account management, clinic staff identification, patient charts | Required | Yes (Encrypted DB) | Active account + statutory medical chart retention | None (Stored in core cloud DB) |
| **Email Address** | Yes | Yes (Transactional) | Authentication, password recovery, invoices, support | Required | Yes | Active account lifetime; deleted upon account deletion | AWS / Host SMTP |
| **Phone Number** | Yes | Yes (SMS/WhatsApp) | Two-factor verification, appointment alerts | Optional / Configurable | Yes | Active account lifetime; deleted upon account deletion | Twilio / WhatsApp Provider |
| **Health & Medical Info** | Yes | No | Physical therapy assessments, SOAP notes, exercise prescriptions | Required for clinical features | Yes | Subject to statutory healthcare chart retention (5–7 yrs) | None |
| **Photos & Scans** | Yes | No | Patient injury posture, X-ray / MRI diagnostic attachments | Optional | Yes (Secure Cloud Storage) | Lifetime of patient medical episode | None |
| **Files & Documents** | Yes | No | PDF invoices, intake forms, clinical summaries | Optional | Yes | Retained for clinic records | None |
| **Financial / Payment Info** | Yes (Metadata only) | Yes (Tokenized) | SaaS subscription billing and clinic invoicing records | Required for paid tiers | Yes (Transaction IDs only; no raw card data) | Retained for tax / accounting audit compliance | Razorpay / Stripe (PCI-DSS Level 1) |
| **Device / Push Token** | Yes | Yes (Push Delivery) | Delivering real-time appointment reminders | Optional (Can disable notifications) | Yes | Valid until app uninstalled or logout token invalidation | Google Firebase Cloud Messaging (FCM) |
| **Diagnostics & Crash Logs** | Yes | No | App reliability, performance monitoring, network fault recovery | Automatic | Temporary | 30 days rolling logs | None |
| **Location Data** | **No** | **No** | N/A | N/A | No | N/A | None |
| **Contacts / SMS Read** | **No** | **No** | N/A | N/A | No | N/A | None |

---

## 3. Security Practices Declaration

- **Data in Transit:** All network traffic between React/Capacitor, Node.js API, and database uses TLS 1.3 / HTTPS encryption.
- **Data at Rest:** Database passwords hashed with `bcryptjs` (salt rounds 10). Relational tables encrypted at storage volume level.
- **Account Deletion Mechanism:** Provided both **in-app** (`Settings → Account → Delete Account`) and **public web** (`https://deephysiosoftware.kiaansoftware.com/account-deletion`).
- **Child Policy:** This application is intended for physical therapy clinics, healthcare providers, and adults managing health records. It is not directed at children under the age of 13.

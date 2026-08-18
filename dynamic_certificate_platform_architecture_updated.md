# Dynamic Certificate Platform — High-Level Architecture

## 1. Overview

The platform is a single, configuration-driven certificate application.

The certificate PDF is generated dynamically with **pdf-lib** after a user successfully matches the configured recipient data. The generated PDF is returned directly to the user's browser/device as a download. Generated certificate PDFs are **not permanently stored** in object storage.

It supports:

- Multiple organizations
- Multiple events per organization
- Multiple certificates per event
- CSV/XLSX recipient imports
- Dynamic certificate field mapping
- Dynamic public certificate lookup forms
- Dynamic certificate generation with `pdf-lib`
- Direct certificate downloads to the user's device
- Analytics
- Platform-wide administration
- Organization-level administration

The key architectural principle is:

> **Code defines how the platform works. Database configuration defines what each organization, event, certificate, template, and public form looks like.**

A new certificate should not require a new application or certificate-specific code.

---

## 2. Roles

There are two authenticated roles:

### SUPER_ADMIN

Platform-wide access:

- All organizations
- All organization users
- All events
- All certificates
- All recipients
- Global analytics
- Audit logs
- Platform settings

### ORG_ADMIN

Organization-level access:

- Their organization
- Organization users
- Events
- Certificates
- Recipients
- Event/certificate analytics
- Organization settings

### Public Users

Students/recipients do not need an account.

They access a public URL, submit the dynamically configured lookup form, find their certificate, and download it.

---

## 3. High-Level System Architecture

```mermaid
flowchart TB

    SUPER["SUPER_ADMIN"]
    ORGADMIN["ORG_ADMIN"]
    PUBLIC["PUBLIC USER<br/>(No Login Required)"]

    PLATFORM["CERTIFICATE PLATFORM"]

    AUTH["Authentication & Authorization"]

    ORGS["Organizations"]
    EVENTS["Events"]
    CERTS["Certificates"]

    TEMPLATE["Certificate Template"]
    FIELDS["Certificate Fields"]
    DATASET["Recipient Dataset<br/>CSV / XLSX"]
    COLUMNS["Dataset Columns"]
    MAPPING["Field Mapping"]
    FORM["Public Form Configuration"]
    RECIPIENTS["Recipients"]

    GENERATED["Generated Certificates"]
    STORAGE["Object/File Storage<br/>PDFs, templates, logos, datasets"]

    PUBLICPAGE["Public Certificate Page"]
    LOOKUP["Dynamic Certificate Lookup"]
    DOWNLOAD["Certificate Download"]

    ANALYTICS["Analytics"]
    DOWNLOADLOG["Download Logs"]
    AUDIT["Audit Logs"]

    SUPER --> PLATFORM
    ORGADMIN --> PLATFORM
    PUBLIC --> PUBLICPAGE

    PLATFORM --> AUTH
    AUTH --> ORGS

    ORGS --> EVENTS
    EVENTS --> CERTS

    CERTS --> TEMPLATE
    CERTS --> FIELDS
    CERTS --> DATASET
    CERTS --> FORM

    DATASET --> COLUMNS
    COLUMNS --> MAPPING
    FIELDS --> MAPPING

    MAPPING --> RECIPIENTS
    FORM --> PUBLICPAGE

    CERTS --> GENERATED
    RECIPIENTS --> GENERATED
    GENERATED --> STORAGE

    PUBLICPAGE --> LOOKUP
    LOOKUP --> RECIPIENTS
    LOOKUP --> GENERATED
    GENERATED --> DOWNLOAD

    DOWNLOAD --> DOWNLOADLOG
    DOWNLOADLOG --> ANALYTICS
    EVENTS --> ANALYTICS
    CERTS --> ANALYTICS

    PLATFORM --> AUDIT
    ORGS --> AUDIT
    EVENTS --> AUDIT
    CERTS --> AUDIT
```

---

## 4. Organization Hierarchy

```mermaid
flowchart TD

    ADMIN["SUPER_ADMIN"]

    ADMIN --> ORG1["Organization A"]
    ADMIN --> ORG2["Organization B"]

    ORG1 --> EVENT1["ICPC 2026"]
    ORG1 --> EVENT2["AI Workshop 2026"]
    ORG1 --> EVENT3["Internship 2026"]

    ORG2 --> EVENT4["Conference 2026"]
    ORG2 --> EVENT5["Faculty Program"]

    EVENT1 --> CERT1["Participation Certificate"]
    EVENT1 --> CERT2["Volunteer Certificate"]

    EVENT2 --> CERT3["Workshop Certificate"]

    EVENT3 --> CERT4["Internship Certificate"]

    EVENT4 --> CERT5["Conference Certificate"]
```

---

## 5. Main Organizer Workflow

```mermaid
flowchart LR

    A["Create Event"] --> B["Create Certificate"]
    B --> C["Configure Template"]
    C --> D["Upload CSV/XLSX"]
    D --> E["Detect Columns"]
    E --> F["Map Columns"]
    F --> G["Select Mandatory<br/>Public Form Fields"]
    G --> H["Preview Certificate"]
    H --> I["Validate"]
    I --> J["Publish"]
    J --> K["Generate Certificates"]
    K --> L["Store PDFs"]
    L --> M["Generate Public URL"]
```

---

## 6. Certificate Configuration

```mermaid
flowchart TD

    CERT["Certificate"]

    CERT --> TEMPLATE["Template"]
    CERT --> CFIELDS["Certificate Fields"]
    CERT --> DATA["Dataset"]
    CERT --> MAPPING["Field Mapping"]
    CERT --> FORM["Public Form"]
    CERT --> REC["Recipients"]
    CERT --> GENERATED["Generated Certificates"]

    TEMPLATE --> DESIGN["Background / Logo / Layout"]

    CFIELDS --> NAME["Student Name"]
    CFIELDS --> COLLEGE["College"]
    CFIELDS --> COURSE["Course"]
    CFIELDS --> DATE["Date"]
    CFIELDS --> ID["Certificate ID"]

    DATA --> CSV["CSV/XLSX"]
    CSV --> COLUMNS["Detected Columns"]

    COLUMNS --> MAPPING
    CFIELDS --> MAPPING

    MAPPING --> REC
```

---

## 7. Dynamic Public Form

The public form must not be hardcoded for individual events.

The organizer selects which available fields are required.

For example:

```text
Available columns:

Name
Email
College
Course
Registration ID
Phone

Selected required fields:

Email
Registration ID
```

The application then automatically renders:

```text
ICPC 2026

Email *
[________________________]

Registration ID *
[________________________]

[ Find Certificate ]
```

Another event can have a different configuration without any code changes.

```mermaid
flowchart TD

    CONFIG["Certificate Form Configuration"]

    CONFIG --> FIELD1["Email - Required"]
    CONFIG --> FIELD2["Registration ID - Required"]
    CONFIG --> FIELD3["Name - Optional"]

    FIELD1 --> FORM["Dynamic Public Form"]
    FIELD2 --> FORM
    FIELD3 --> FORM

    FORM --> SEARCH["Certificate Search"]
    SEARCH --> RESULT["Certificate Result"]
```

---

## 8. Certificate Generation and Download

Certificates should preferably be generated once and stored.

Do not regenerate a PDF on every download.

```mermaid
flowchart TD

    PUBLISH["Publish Certificate"]
    PUBLISH --> VALIDATE["Validate Dataset"]
    VALIDATE --> GENERATE["Generate Certificates"]
    GENERATE --> STORE["Store Generated PDFs"]

    STUDENT["Student"]
    STUDENT --> PUBLICURL["Public Certificate URL"]
    PUBLICURL --> FORM["Dynamic Lookup Form"]
    FORM --> SEARCH["Search Recipient"]
    SEARCH --> FOUND{"Certificate Found?"}

    FOUND -->|No| ERROR["Show Error"]
    FOUND -->|Yes| EXISTING["Get Existing Generated PDF"]

    EXISTING --> DOWNLOAD["Download"]
    DOWNLOAD --> LOG["Create Download Log"]
    LOG --> ANALYTICS["Analytics"]
```

---

## 9. Database ER Diagram

```mermaid
erDiagram

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        string role
        datetime createdAt
        datetime updatedAt
    }

    ORGANIZATION {
        string id PK
        string name
        string logo
        string email
        string status
        datetime createdAt
        datetime updatedAt
    }

    ORGANIZATION_MEMBER {
        string id PK
        string userId FK
        string organizationId FK
        string role
        datetime createdAt
    }

    EVENT {
        string id PK
        string organizationId FK
        string name
        string description
        string logo
        string publicSlug UK
        string status
        datetime startDate
        datetime endDate
        datetime createdAt
        datetime updatedAt
    }

    EVENT_MEMBER {
        string id PK
        string eventId FK
        string userId FK
        datetime createdAt
    }

    CERTIFICATE {
        string id PK
        string eventId FK
        string name
        string status
        string publicSlug UK
        datetime publishedAt
        datetime createdAt
        datetime updatedAt
    }

    CERTIFICATE_TEMPLATE {
        string id PK
        string certificateId FK
        string fileKey
        string metadata
        datetime createdAt
        datetime updatedAt
    }

    CERTIFICATE_FIELD {
        string id PK
        string certificateId FK
        string name
        string label
        string type
        float positionX
        float positionY
        float width
        float height
        string fontFamily
        int fontSize
        string fontColor
        string alignment
        boolean required
        int sortOrder
    }

    DATASET {
        string id PK
        string certificateId FK
        string fileKey
        string fileName
        string fileType
        string status
        int rowCount
        datetime uploadedAt
    }

    DATASET_COLUMN {
        string id PK
        string datasetId FK
        string columnName
        string dataType
        int columnIndex
    }

    FIELD_MAPPING {
        string id PK
        string certificateId FK
        string datasetColumnId FK
        string certificateFieldId FK
    }

    FORM_FIELD {
        string id PK
        string certificateId FK
        string datasetColumnId FK
        string label
        string inputType
        boolean required
        int sortOrder
    }

    RECIPIENT {
        string id PK
        string certificateId FK
        string externalId
        string data
        datetime createdAt
        datetime updatedAt
    }

    GENERATED_CERTIFICATE {
        string id PK
        string certificateId FK
        string recipientId FK
        string certificateNumber UK
        string fileKey
        string status
        datetime generatedAt
    }

    DOWNLOAD_LOG {
        string id PK
        string generatedCertificateId FK
        datetime downloadedAt
        string ipAddress
        string userAgent
        string referrer
    }

    AUDIT_LOG {
        string id PK
        string userId FK
        string organizationId FK
        string eventId FK
        string action
        string entityType
        string entityId
        string metadata
        datetime createdAt
    }

    USER ||--o{ ORGANIZATION_MEMBER : belongs_to
    ORGANIZATION ||--o{ ORGANIZATION_MEMBER : has

    ORGANIZATION ||--o{ EVENT : owns
    EVENT ||--o{ EVENT_MEMBER : has
    USER ||--o{ EVENT_MEMBER : assigned_to

    EVENT ||--o{ CERTIFICATE : contains

    CERTIFICATE ||--|| CERTIFICATE_TEMPLATE : uses
    CERTIFICATE ||--o{ CERTIFICATE_FIELD : has

    CERTIFICATE ||--o{ DATASET : imports
    DATASET ||--o{ DATASET_COLUMN : contains

    CERTIFICATE ||--o{ FIELD_MAPPING : has
    DATASET_COLUMN ||--o{ FIELD_MAPPING : maps_from
    CERTIFICATE_FIELD ||--o{ FIELD_MAPPING : maps_to

    CERTIFICATE ||--o{ FORM_FIELD : configures
    DATASET_COLUMN ||--o{ FORM_FIELD : uses

    CERTIFICATE ||--o{ RECIPIENT : has
    RECIPIENT ||--o{ GENERATED_CERTIFICATE : receives

    CERTIFICATE ||--o{ GENERATED_CERTIFICATE : generates
    GENERATED_CERTIFICATE ||--o{ DOWNLOAD_LOG : records

    USER ||--o{ AUDIT_LOG : performs
    ORGANIZATION ||--o{ AUDIT_LOG : relates_to
    EVENT ||--o{ AUDIT_LOG : relates_to
```

> **Note:** `EVENT_MEMBER` is optional if you are keeping only `SUPER_ADMIN` and `ORG_ADMIN`. It can be removed initially. It is shown as an extension point if event-level assignment is needed later.

---

## 10. Application Architecture

A modular monolith is recommended for the first version.

```mermaid
flowchart TB

    CLIENT["Browser / Client"]

    NEXT["Next.js Application"]

    UI["Frontend UI<br/>React + Tailwind + shadcn"]
    API["API / Server Actions"]
    AUTH["Auth & Authorization"]

    ORG["Organization Module"]
    EVENT["Event Module"]
    CERT["Certificate Module"]
    DATA["Dataset / Import Module"]
    FORM["Dynamic Form Module"]
    PUBLIC["Public Certificate Module"]
    ANALYTICS["Analytics Module"]
    AUDIT["Audit Module"]

    DB["PostgreSQL"]
    STORAGE["Object Storage"]
    WORKER["Background Worker / Job Queue"]
    PDF["Certificate PDF Generator"]

    CLIENT --> NEXT

    NEXT --> UI
    NEXT --> API

    API --> AUTH

    API --> ORG
    API --> EVENT
    API --> CERT
    API --> DATA
    API --> FORM
    API --> PUBLIC
    API --> ANALYTICS
    API --> AUDIT

    ORG --> DB
    EVENT --> DB
    CERT --> DB
    DATA --> DB
    FORM --> DB
    PUBLIC --> DB
    ANALYTICS --> DB
    AUDIT --> DB

    DATA --> STORAGE
    CERT --> STORAGE

    CERT --> WORKER
    WORKER --> PDF
    PDF --> STORAGE
    PDF --> DB
```

---

## 11. File / Template Handling

Generated certificate PDFs do **not** need permanent storage.

The user receives the generated PDF directly as an HTTP download.

```mermaid
flowchart LR

    APP["Application"]

    DB["PostgreSQL<br/>Configuration + Recipient Data"]

    TEMPLATE["Certificate Template<br/>Background / Design"]

    PDF["pdf-lib<br/>Dynamic PDF Generation"]

    DEVICE["User Device<br/>Downloaded PDF"]

    APP --> DB
    APP --> TEMPLATE
    APP --> PDF
    DB --> PDF
    TEMPLATE --> PDF
    PDF --> DEVICE
```

The database stores certificate configuration, field positions, mappings, recipient data, and references to reusable template assets.

The certificate generation flow is:

```text
User opens public certificate page
        ↓
User fills dynamically generated form
        ↓
Backend validates the submitted fields
        ↓
Find matching recipient record
        ↓
If no match → show error
        ↓
If match → load certificate configuration
        ↓
Load template/background asset
        ↓
Use pdf-lib to generate the certificate
        ↓
Return PDF response
        ↓
Browser downloads PDF to user's device
```

### Important

Do **not** store every generated PDF permanently unless a future requirement makes this necessary.

This keeps the initial architecture simpler and avoids unnecessary storage costs.

For high traffic, PDF generation can later be optimized using caching, controlled concurrency, or background processing without changing the public workflow.

## 12. Admin Architecture

```mermaid
flowchart TD

    ADMIN["SUPER_ADMIN"]

    ADMIN --> DASH["Admin Dashboard"]

    DASH --> OVERVIEW["Overview"]
    DASH --> ORGS["Organizations"]
    DASH --> USERS["Users"]
    DASH --> EVENTS["All Events"]
    DASH --> CERTS["All Certificates"]
    DASH --> ANALYTICS["Global Analytics"]
    DASH --> AUDIT["Audit Logs"]
    DASH --> SETTINGS["Platform Settings"]

    ORGS --> ORGDETAIL["Organization Details"]

    ORGDETAIL --> ORGUSERS["Organization Users"]
    ORGDETAIL --> ORGEVENTS["Organization Events"]
    ORGDETAIL --> ORGANALYTICS["Organization Analytics"]

    ORGEVENTS --> EVENTDETAIL["Event Details"]

    EVENTDETAIL --> EVENTCERT["Certificates"]
    EVENTDETAIL --> RECIPIENTS["Recipients"]
    EVENTDETAIL --> EVENTANALYTICS["Event Analytics"]
```

---

## 13. Organization Admin Architecture

```mermaid
flowchart TD

    ADMIN["ORG_ADMIN"]

    ADMIN --> DASH["Organization Dashboard"]

    DASH --> OVERVIEW["Overview"]
    DASH --> EVENTS["Events"]
    DASH --> CERTS["Certificates"]
    DASH --> RECIPIENTS["Recipients"]
    DASH --> ANALYTICS["Analytics"]
    DASH --> SETTINGS["Organization Settings"]

    EVENTS --> CREATE["Create Event"]

    CREATE --> CERT["Create Certificate"]
    CERT --> TEMPLATE["Configure Template"]
    CERT --> DATA["Upload Dataset"]
    DATA --> MAP["Map Columns"]
    MAP --> FORM["Configure Public Form"]
    FORM --> PREVIEW["Preview & Validate"]
    PREVIEW --> PUBLISH["Publish"]
```

---

## 14. Public User Architecture

No account is required.

```mermaid
flowchart TD

    USER["Student / Recipient"]

    USER --> URL["Public Event / Certificate URL"]

    URL --> LOAD["Load Published Configuration"]

    LOAD --> FORM["Render Dynamic Form"]

    FORM --> SEARCH["Search Certificate"]

    SEARCH --> VALIDATE{"Valid Match?"}

    VALIDATE -->|No| ERROR["Show Error"]
    VALIDATE -->|Yes| CERT["Show Certificate"]

    CERT --> DOWNLOAD["Download PDF"]
    DOWNLOAD --> LOG["Download Log"]
```

---

## 15. Publishing Lifecycle

```mermaid
stateDiagram-v2

    [*] --> DRAFT

    DRAFT --> VALIDATING
    VALIDATING --> READY
    VALIDATING --> DRAFT

    READY --> PUBLISHED

    PUBLISHED --> PAUSED
    PAUSED --> PUBLISHED

    PUBLISHED --> ARCHIVED
    PAUSED --> ARCHIVED

    ARCHIVED --> [*]
```

Recommended states:

- `DRAFT`
- `VALIDATING`
- `READY`
- `PUBLISHED`
- `PAUSED`
- `ARCHIVED`

---

## 16. Analytics Architecture

Use logs as the source of truth.

```mermaid
flowchart LR

    SEARCH["Certificate Search"]
    DOWNLOAD["Certificate Download"]

    SEARCH --> SEARCHLOG["Search Events"]
    DOWNLOAD --> DOWNLOADLOG["Download Logs"]

    SEARCHLOG --> ANALYTICS["Analytics Engine"]
    DOWNLOADLOG --> ANALYTICS

    ANALYTICS --> EVENTSTATS["Event Statistics"]
    ANALYTICS --> CERTSTATS["Certificate Statistics"]
    ANALYTICS --> ORGSTATS["Organization Statistics"]
    ANALYTICS --> GLOBAL["Global Platform Statistics"]
```

Metrics can include:

- Total searches
- Successful searches
- Failed searches
- Total generated certificates
- Total downloads
- Unique downloads
- Downloads per day
- Downloads by date range
- Certificate-specific statistics
- Event-specific statistics
- Organization-specific statistics

---

## 17. Performance / Scaling Principle

The default workflow generates a certificate only after a valid recipient lookup.

```mermaid
flowchart TD

    USER["Student"]
    USER --> FORM["Dynamic Lookup Form"]
    FORM --> SEARCH["Search Recipient"]
    SEARCH --> MATCH{"Data Match?"}

    MATCH -->|No| ERROR["Show Error"]
    MATCH -->|Yes| CONFIG["Load Certificate Configuration"]

    CONFIG --> PDF["Generate PDF with pdf-lib"]
    PDF --> RESPONSE["HTTP PDF Response"]
    RESPONSE --> DEVICE["User Device"]
    DEVICE --> DOWNLOAD["Downloaded Certificate"]

    DOWNLOAD --> LOG["Download Log"]
    LOG --> ANALYTICS["Analytics"]
```

This means:

- No permanent generated-PDF storage is required.
- No PDF is generated when the lookup fails.
- The PDF is generated only after a valid match.
- The generated PDF is sent directly to the user's browser/device.
- The download event is recorded for analytics.

For large datasets or high simultaneous traffic, use controlled PDF generation/concurrency. Do not introduce a complex distributed architecture unless actual load requires it.

## 18. Core API Structure

The API should be generic and resource-based.

```text
/api/auth

/api/organizations
/api/organizations/:id

/api/events
/api/events/:id

/api/certificates
/api/certificates/:id

/api/certificates/:id/template
/api/certificates/:id/fields

/api/certificates/:id/datasets
/api/certificates/:id/mappings
/api/certificates/:id/form

/api/certificates/:id/recipients
/api/certificates/:id/publish

/api/public/:slug
/api/public/:slug/search
/api/public/:slug/download

/api/analytics
/api/analytics/:certificateId
```

Do NOT create certificate-specific APIs such as:

```text
/api/icpc-certificate
/api/workshop-certificate
/api/internship-certificate
```

---

## 19. Project Structure

A possible project organization:

```text
src/
│
├── auth/
│
├── admin/
│
├── organizations/
│
├── events/
│
├── certificates/
│   ├── designer/
│   ├── fields/
│   ├── templates/
│   └── generation/
│
├── datasets/
│   ├── csv/
│   ├── xlsx/
│   └── mapping/
│
├── recipients/
│
├── public/
│   ├── lookup/
│   └── certificate/
│
├── analytics/
│
├── storage/
│
└── audit/
```

---

## 20. Most Important Design Rule

Never create certificate-specific code when the difference can be represented as configuration.

Bad:

```text
if event === "ICPC":
    show ICPC form

if event === "Workshop":
    show Workshop form

if event === "Internship":
    show Internship form
```

Good:

```text
Load certificate.formFields
        ↓
Render fields dynamically
```

Similarly:

```text
certificate.fields
        ↓
Render certificate dynamically
```

and:

```text
certificate.fieldMappings
        ↓
Populate recipient data
```

---

## 21. Complete Business Flow

```mermaid
flowchart TB

    ADMIN["SUPER_ADMIN / ORG_ADMIN"]
    ADMIN --> ORG["Organization"]
    ORG --> EVENT["Event"]
    EVENT --> CERT["Certificate"]

    CERT --> TEMPLATE["Template"]
    CERT --> DATA["Dataset"]
    CERT --> FORMCONFIG["Form Configuration"]

    DATA --> COLUMNS["Dataset Columns"]

    TEMPLATE --> MAPPING["Field Mapping"]
    COLUMNS --> MAPPING

    MAPPING --> RECIPIENTS["Recipients"]

    FORMCONFIG --> VALIDATE["Preview / Validate"]
    MAPPING --> VALIDATE

    VALIDATE --> PUBLISH["Publish"]

    PUBLISH --> PUBLIC["Public Certificate URL"]
    RECIPIENTS --> FIND


    PUBLIC --> DYNAMICFORM["Dynamic Lookup Form"]
    DYNAMICFORM --> SEARCH["Certificate Search"]

    SEARCH --> FIND["Find Recipient"]
    FIND --> MATCH{"Data Match?"}

    MATCH -->|No| ERROR["Show Error"]
    MATCH -->|Yes| GENERATE

    GENERATE --> DOWNLOAD["Direct PDF Download"]
    DOWNLOAD --> LOG["Download Log"]

    LOG --> ANALYTICS["Analytics"]

    ANALYTICS --> EVENTAN["Event Analytics"]
    ANALYTICS --> ORGAN["Organization Analytics"]
    ANALYTICS --> GLOBAL["Global Analytics"]
```

---

## 22. PDF Generation

Use **pdf-lib** for dynamic certificate generation.

The certificate template/design should be treated as reusable configuration/assets, while recipient-specific values are inserted at request time.

Example conceptual flow:

```mermaid
flowchart LR

    CONFIG["Certificate Configuration"]
    RECIPIENT["Matched Recipient"]
    TEMPLATE["Certificate Template"]

    CONFIG --> PDF["pdf-lib"]
    RECIPIENT --> PDF
    TEMPLATE --> PDF

    PDF --> RESPONSE["PDF HTTP Response"]
    RESPONSE --> DEVICE["User Device"]
```

Example dynamic values:

```text
{{student_name}}
{{college}}
{{course}}
{{event_name}}
{{certificate_id}}
{{date}}
```

The backend resolves these values from the mapped recipient record and writes them into the PDF using `pdf-lib`.

Do not expose the full recipient dataset to the browser. The browser should submit the configured lookup values to the backend, and the backend should perform the matching.

## 23. Implementation Strategy

Do not blindly delete the existing application.

First:

1. Audit the existing application.
2. Identify reusable certificate/PDF generation logic.
3. Identify reusable analytics/download tracking.
4. Identify authentication and storage logic.
5. Design and migrate the new database schema.
6. Implement organizations and roles.
7. Implement events.
8. Implement dynamic certificates.
9. Implement CSV/XLSX import.
10. Implement field mapping.
11. Implement dynamic public forms.
12. Implement preview/validation.
13. Implement publishing.
14. Connect certificate generation.
15. Connect existing analytics.
16. Implement admin dashboard.
17. Test with multiple completely different certificate types.

The final system should satisfy this rule:

> **Creating a new certificate must require configuration, not writing new certificate-specific code.**

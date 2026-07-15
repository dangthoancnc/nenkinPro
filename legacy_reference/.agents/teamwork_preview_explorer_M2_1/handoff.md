# Handoff Report: Template Analysis

## 1. Observation
- **Schema (`prisma/schema.prisma`)**: The `Customer` table currently has `id`, `code`, `cardNumber`, `fullName`, `dob`, `passwordPin`, `status`, `zairyuAddress`, `zairyuRomajiAddress`, `postalCode`, `taxOfficeId`, `nenkinNumber`, `bankName`, `branchName`, `accountNumber`, `accountName`, `swiftCode`, and several image URLs.
- **Template 1 (`委 任 状.docx`)**: The Power of Attorney form requires:
  - `基礎年金番号` (Basic Pension Number) -> exists as `nenkinNumber`.
  - `生年月日` (DOB) -> exists as `dob`.
  - `フリガナ` (Name in Katakana) -> missing in DB.
  - `氏名` (Full Name) -> exists as `fullName`.
  - `性別` (Gender) -> missing in DB.
  - `電話` (Phone number) -> missing in DB.
- **Template 2 (`脱退一時金請求書.docx`)**: The Lump-sum Withdrawal Claim Form requires:
  - `国籍` (Nationality) -> missing in DB.
  - `離日後の住所` (Address after leaving Japan) -> missing in DB.
  - `支店の所在地` (Bank branch address) -> missing in DB.
- **Passport Details**: The user specified "(Surname, Given Names, Nationality, Date of Issue, Expiry Date, Sex, Place of Birth)". Additionally, a passport number is universally required for verification purposes (the DB has `cardNumber` but no explicit `passportNumber`).

## 2. Logic Chain
1. By cross-referencing the explicit placeholders in the `.docx` files with the `Customer` table in `schema.prisma`, it's clear that several demographic and contact fields are missing.
2. The `委 任 状.docx` (Power of Attorney) explicitly demands a phone number and a furigana name. Since the DB lacks a phone number field on the `Customer` table, the agent cannot automatically fill this in.
3. The `脱退一時金請求書.docx` explicitly demands a home country address ("Address after leaving Japan") and the bank branch's address (not just its name). It also requires Nationality.
4. The user asked to verify the passport details: Surname, Given Names, Nationality, Date of Issue, Expiry Date, Sex, Place of Birth. These must all be added. I also recommend adding `passportNumber` as it is typically vital when passport details are captured.

## 3. Caveats
- I did not parse the PDF forms (`確定申告...pdf`) as standard Python PDF libraries (like `PyPDF2` or `PyMuPDF`) were not installed in the environment. However, tax returns generally require the same foundational data (name, address, dob, bank info) which are covered by the additions recommended below.
- `cardNumber` in the schema likely refers to the Zairyu card or MyNumber card. I assumed `passportNumber` should be its own distinct field.

## 4. Conclusion
I recommend adding the following fields to the `Customer` model in `prisma/schema.prisma`:

**Passport & Demographic Details:**
- `passportSurname` (String?)
- `passportGivenNames` (String?)
- `passportNumber` (String? - recommended addition)
- `nationality` (String?)
- `passportDateOfIssue` (DateTime?)
- `passportExpiryDate` (DateTime?)
- `sex` (String?) — or an Enum (MALE, FEMALE, OTHER)
- `placeOfBirth` (String?)
- `nameFurigana` (String?) — for the 委任状

**Contact & Address Details:**
- `phoneNumber` (String?) — for the 委任状
- `overseasAddress` (String?) — for 離日後の住所 (Address after leaving Japan)
- `bankBranchAddress` (String?) — for 支店の所在地 on the withdrawal form

## 5. Verification Method
- **Verify Schema**: Inspect `prisma/schema.prisma` after the implementer adds these fields.
- **Run Prisma Validation**: Run `npx prisma validate` or `npx prisma generate` in `E:\AntiGravity\apps\nenkin` to ensure the schema updates are syntactically correct.
- **Check Form Completion Logic**: When the document generation logic is implemented, verify that these new DB fields map correctly to the extracted placeholders in the templates.

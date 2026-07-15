# Handoff Report: Missing Database Fields from Templates

## 1. Observation
1. Examined the `prisma/schema.prisma` file, specifically the `Customer` model, which currently contains fields like `fullName`, `dob`, `zairyuAddress`, `nenkinNumber`, and basic bank details (`bankName`, `accountNumber`, `swiftCode`), along with document URLs like `passportUrl`.
2. Extracted and analyzed the contents of the `.docx` and `.pdf` templates in `E:\AntiGravity\apps\nenkin\public\templates`, including:
   - `脱退一時金請求書.docx` (Lump-sum Withdrawal Payment Claim Form / Dattai)
   - `委 任 状.docx` (Power of Attorney / Ininjo)
   - `納税管理人の提出書類.pdf` (Tax Manager Submission Documents)
   - `確定申告第一、第二.pdf` (Tax Declaration)
3. The templates contain several fields that do not map directly to the existing `Customer` database schema.
4. The user specifically asked to verify if passport details (Surname, Given Names, Nationality, Date of Issue, Expiry Date, Sex, Place of Birth) and other fields are needed.

## 2. Logic Chain
1. **Passport & Identity Details:** The Dattai form explicitly asks for "Quốc tịch / 国籍" (Nationality) and a passport copy to verify "Name, DOB, Nationality, Signature". The Ininjo form requires "性別" (Sex). The Tax Declaration forms require "フリガナ" (Furigana name) and "個人番号" (MyNumber). Adding explicit passport fields (Surname, Given Names, Place of Birth, Issue Date, Expiry Date) is highly recommended for generating accurate documents without manual re-entry from the `passportUrl` image.
2. **Contact & Address Details:** The Dattai form requires an address for after the person leaves Japan ("離日後の住所"). This is distinct from the current `zairyuAddress`. Both the Ininjo and Tax Declaration forms require a telephone number ("電話" / "電話番号"), which is completely missing from the `Customer` schema.
3. **Banking Details:** The Dattai form for overseas remittances asks for "支店の所在地" (Bank Branch Address) and "国" (Bank Country). The schema currently only has `branchName` and `swiftCode`.
4. **Tax-Specific Fields:** The Tax Manager form requires "職業" (Occupation) and "出国（予定）年月日" (Expected Departure Date). Tax Declaration forms require Head of Household details ("世帯主の氏名", "世帯主との続柄").

## 3. Caveats
- I did not review the full business logic of how the PDF/DOCX templates are populated (e.g. if the system expects users to just type these into a one-time form vs saving them to the DB). However, since these forms represent standard, recurring bureaucratic procedures, storing them in the `Customer` schema (or a related table) is standard practice.
- The tax forms also include sections for spouse and dependents, which might require a one-to-many `Dependent` relationship table rather than flat fields on `Customer`.

## 4. Conclusion
I recommend adding the following fields to the database to support the template generation:

**To `Customer` (or a `PassportInfo` relation):**
- `surname` (String?)
- `givenNames` (String?)
- `fullNameFurigana` / `nameKatakana` (String?) - required by Ininjo, Tax, and Bank forms.
- `nationality` (String?) - required by Dattai.
- `sex` (String / Enum) - required by Ininjo.
- `placeOfBirth` (String?)
- `passportIssueDate` (DateTime?)
- `passportExpiryDate` (DateTime?)
- `myNumber` (String?) - crucial for Tax forms.
- `occupation` (String?) - required for Tax Manager form.
- `departureDate` (DateTime?) - required for Tax Manager form.

**To `Customer` (Contact/Address info):**
- `phoneNumber` (String?) - required by Ininjo and Tax forms.
- `overseasAddress` / `homeCountryAddress` (String?) - required by Dattai.

**To `Customer` (Bank details):**
- `bankBranchAddress` (String?) - required by Dattai.
- `bankCountry` (String?) - required by Dattai.

**To `Customer` (Tax Household info - Optional but recommended):**
- `headOfHouseholdName` (String?)
- `relationshipToHead` (String?)

## 5. Verification Method
- Review the fields against the official Japanese pension and tax templates (`脱退一時金請求書.docx`, `委 任 状.docx`, `確定申告.pdf`) in the `public/templates` directory.
- Update `prisma/schema.prisma` and run `npx prisma format` and `npx prisma db push` to verify schema validity.

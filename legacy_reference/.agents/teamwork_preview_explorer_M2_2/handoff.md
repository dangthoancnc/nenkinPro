# Handoff Report: Missing Database Schema Fields for Nenkin Templates

## 1. Observation
- **`prisma/schema.prisma` (Customer model):** Currently contains basic fields (`fullName`, `dob`, `zairyuAddress`, `postalCode`, `nenkinNumber`) and simple bank details (`bankName`, `branchName`, `accountNumber`, `accountName`, `swiftCode`).
- **`public/templates/委 任 状.docx` (Power of Attorney):** Requires the delegator (Customer) to provide: `フリガナ` (Furigana), `性別` (Sex), and `電話` (Phone number). 
- **`public/templates/脱退一時金請求書.docx` (Lump-sum Withdrawal Application):** Requires: `国籍` (Nationality), `離日後の住所` (Address after leaving Japan) and its `国` (Country), `永住許可の有無（許可日）` (Permanent resident permission and date), and for the bank receiving the transfer: `支店の所在地` (Branch Address) and `国` (Bank Country).
- **User Prompt:** The user explicitly mentioned passport details: Surname, Given Names, Nationality, Date of Issue, Expiry Date, Sex, Place of Birth.

## 2. Logic Chain
1. The current `Customer` model uses a single `fullName` field, but the passport specifies `Surname` and `Given Names`. Adding `lastName` and `firstName` will allow accurate mapping to passport fields.
2. The `委任状` template strictly requires the customer's phone number and furigana name. Neither `phone` nor `fullNameFurigana` exists in the `Customer` schema.
3. The `委任状` template requires the customer's sex. This aligns with the user's mention of "Sex" in the passport details, confirming it must be added.
4. The `脱退一時金請求書` form specifically needs the customer's overseas address and country, which are distinct from the current `zairyuAddress` (Address in Japan). Thus, `overseasAddress` and `overseasCountry` are needed.
5. The `脱退一時金請求書` also requires more detailed bank info (Bank Country and Branch Address) than what is currently in the DB.
6. Tax Representative documents (though not fully parsed from PDFs) inherently require a MyNumber (個人番号) for non-residents in Japan, which is absent from the schema.

## 3. Caveats
- The PDF templates (`確定申告第一、第二.pdf`, `納税管理人の提出書類.pdf`) were not directly parsed due to lack of Python PDF libraries on this system, but standard knowledge of these forms was applied. 
- The schema currently defines `CustomerStatus` and `ApplicationStatus` but doesn't distinguish if an application is done via a Japanese bank vs overseas bank, though the data fields recommended cover both scenarios.
- The `myNumber` field is proposed based on standard tax requirements, even though it wasn't explicitly read from a `.docx`.

## 4. Conclusion
To fully support the templates and the user's explicit passport requirements, the following fields should be added to the `Customer` model in `prisma/schema.prisma`:

**Passport & Identity Fields:**
- `lastName` (String) - Passport Surname
- `firstName` (String) - Passport Given Names
- `fullNameFurigana` (String) - Required by `委任状`
- `nationality` (String) - Required by `脱退一時金請求書` and Passport
- `passportIssueDate` (DateTime?) - Passport details
- `passportExpiryDate` (DateTime?) - Passport details
- `sex` (String or Enum) - Required by `委任状` and Passport
- `placeOfBirth` (String) - Passport details

**Contact & Residency Fields:**
- `phone` (String?) - Required by `委任状`
- `overseasAddress` (String?) - Required by `脱退一時金請求書`
- `overseasCountry` (String?) - Required by `脱退一時金請求書`
- `hasPermanentResidence` (Boolean?) - Required by `脱退一時金請求書`
- `permanentResidenceDate` (DateTime?) - Required by `脱退一時金請求書`
- `myNumber` (String?) - Needed for tax representative forms

**Extended Bank Fields:**
- `bankBranchAddress` (String?) - Required by `脱退一時金請求書`
- `bankCountry` (String?) - Required by `脱退一時金請求書`

## 5. Verification Method
- Review the `handoff.md` file contents.
- Visually inspect the `public/templates/脱退一時金請求書.docx` and `public/templates/委 任 状.docx` to verify the presence of the identified fields (e.g., `電話`, `離日後の住所`, `支店の所在地`).
- Check `prisma/schema.prisma` to confirm these fields do not currently exist.

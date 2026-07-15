# M4 Form Generator - Mapping Guide

This guide details the `{{tags}}` available for use in Microsoft Word templates (`.docx`) when configuring the Nenkin Form Generator.
These tags are generated dynamically by `src/lib/documentMapper.ts`.

## Personal Information (Customer)

- `{{fullName}}` - Full Name of the Customer
- `{{address}}` - Address in Japan (Zairyu Address)
- `{{taxOfficeName}}` - Name of the assigned Tax Office
- `{{taxOfficeAddress}}` - Address of the assigned Tax Office

## Sliced Variables (One Character Per Tag)

Many Japanese government forms require filling out fields with one character per box. The system automatically splits the text and makes each character available as a separate tag.

### Postal Code (7 digits)
Use tags `{{post_1}}` through `{{post_7}}`.
Example:
- `{{post_1}}` `{{post_2}}` `{{post_3}}` - `{{post_4}}` `{{post_5}}` `{{post_6}}` `{{post_7}}`

### Bank Account (7 digits)
Use tags `{{bank_1}}` through `{{bank_7}}`.

### Nenkin Number (10 digits)
Use tags `{{nenkin_1}}` through `{{nenkin_10}}`.

### My Number (12 digits)
Use tags `{{my_num_1}}` through `{{my_num_12}}`.

## Dates (e.g., Date of Birth)

Dates are split into year, month, and day. They also have Japanese Era equivalents.
Prefix `dob` is used for Date of Birth.

- `{{dob_y}}` - 4-digit Year (e.g., 1990)
- `{{dob_m}}` - 2-digit Month (e.g., 05)
- `{{dob_d}}` - 2-digit Day (e.g., 12)

**Character-split dates:**
- `{{dob_y_1}}` to `{{dob_y_4}}`
- `{{dob_m_1}}` to `{{dob_m_2}}`
- `{{dob_d_1}}` to `{{dob_d_2}}`

**Japanese Era Dates:**
- `{{dob_era}}` - Era in Romaji (e.g., Heisei)
- `{{dob_era_jp}}` - Era in Kanji (e.g., 平成)
- `{{dob_era_yr}}` - Year within the Era (e.g., 02)
- `{{dob_era_yr_1}}`, `{{dob_era_yr_2}}` - Split digits of the Era year

## Tax Representative (Lần 2)

If a Tax Representative is assigned to the application, their details are mapped.

- `{{rep_fullName}}` - Full Name
- `{{rep_address}}` - Address
- `{{rep_post_1}}` to `{{rep_post_7}}` - Postal Code split into 7 characters

## Financial Variables

The following Decimal fields are converted to plain string formats:

- `{{totalExpectedJpy}}` - 支給額 (Total Expected JPY)
- `{{received1stJpy}}` - 控除後支払額 (Received 1st JPY)
- `{{received2ndJpy}}` - Received 2nd JPY
- `{{tax2ndJpy}}` - 所得税額 (Tax 2nd JPY)
- `{{serviceFeeJpy}}`
- `{{exchangeRate}}`
- `{{serviceFeeVnd}}`

---
*Note: Always use docxtemplater tags in the format `{{variable_name}}` inside your Word file.*

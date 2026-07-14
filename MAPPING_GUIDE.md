# MAPPING_GUIDE

This document lists all the variables that can be used in the docxtemplater templates for the Nenkin Application.

## String Splitting Variables
The following fields are split into individual characters. For example, for a 7-digit postal code, you can use `{post_1}` through `{post_7}`.
- `post_1` to `post_7`: Customer Postal Code
- `bank_1` to `bank_7`: Customer Bank Account Number
- `nenkin_1` to `nenkin_10`: Customer Nenkin Number
- `my_num_1` to `my_num_12`: Customer MyNumber
- `rep_post_1` to `rep_post_7`: Tax Representative Postal Code

## Date Variables (Date of Birth)
- `dob_y`: Year (4 digits)
- `dob_m`: Month (2 digits)
- `dob_d`: Day (2 digits)
- `dob_y_1` to `dob_y_4`: Year split into digits
- `dob_m_1` to `dob_m_2`: Month split into digits
- `dob_d_1` to `dob_d_2`: Day split into digits
- `dob_era`: Japanese Era Name (e.g. Reiwa)
- `dob_era_jp`: Japanese Era Name in Kanji (e.g. 令和)
- `dob_era_yr`: Japanese Era Year (2 digits)
- `dob_era_yr_1` to `dob_era_yr_2`: Japanese Era Year split into digits

## General Customer Info
- `fullName`: Customer's Full Name
- `address`: Customer's Zairyu Address

## Tax Office Info
- `taxOfficeName`: Tax Office Name
- `taxOfficeAddress`: Tax Office Address

## Tax Representative Info
- `rep_fullName`: Tax Representative's Full Name
- `rep_address`: Tax Representative's Address

## Application Monetary / Decimal Fields
- `totalExpectedJpy`
- `received1stJpy`
- `received2ndJpy`
- `tax2ndJpy`
- `serviceFeeJpy`
- `exchangeRate`
- `serviceFeeVnd`

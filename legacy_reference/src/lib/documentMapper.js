"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapApplicationToTemplate = mapApplicationToTemplate;
function mapApplicationToTemplate(application) {
    var result = {};
    var splitStr = function (str, prefix, maxLength) {
        if (!str)
            return;
        var cleanStr = str.replace(/[^a-zA-Z0-9]/g, '');
        var len = maxLength || cleanStr.length;
        for (var i = 0; i < len; i++) {
            if (i < cleanStr.length) {
                result["".concat(prefix, "_").concat(i + 1)] = cleanStr[i];
            }
            else {
                result["".concat(prefix, "_").concat(i + 1)] = '';
            }
        }
    };
    var getJapaneseEra = function (date) {
        var ymd = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
        if (ymd >= 20190501)
            return { name: 'Reiwa', nameJp: '令和', year: date.getFullYear() - 2018 };
        if (ymd >= 19890108)
            return { name: 'Heisei', nameJp: '平成', year: date.getFullYear() - 1988 };
        if (ymd >= 19261225)
            return { name: 'Showa', nameJp: '昭和', year: date.getFullYear() - 1925 };
        return { name: 'Unknown', nameJp: '', year: date.getFullYear() };
    };
    var mapDate = function (dateVal, prefix) {
        if (!dateVal)
            return;
        var d = new Date(dateVal);
        if (isNaN(d.getTime()))
            return;
        var yyyy = d.getFullYear().toString();
        var mm = (d.getMonth() + 1).toString().padStart(2, '0');
        var dd = d.getDate().toString().padStart(2, '0');
        result["".concat(prefix, "_y")] = yyyy;
        result["".concat(prefix, "_m")] = mm;
        result["".concat(prefix, "_d")] = dd;
        splitStr(yyyy, "".concat(prefix, "_y"), 4);
        splitStr(mm, "".concat(prefix, "_m"), 2);
        splitStr(dd, "".concat(prefix, "_d"), 2);
        var era = getJapaneseEra(d);
        result["".concat(prefix, "_era")] = era.name;
        result["".concat(prefix, "_era_jp")] = era.nameJp;
        var eraYrStr = era.year.toString().padStart(2, '0');
        result["".concat(prefix, "_era_yr")] = eraYrStr;
        splitStr(eraYrStr, "".concat(prefix, "_era_yr"), 2);
    };
    if (application.customer) {
        var c = application.customer;
        result['fullName'] = c.fullName || '';
        result['address'] = c.zairyuAddress || '';
        splitStr(c.postalCode, 'post', 7);
        splitStr(c.accountNumber, 'bank', 7);
        splitStr(c.nenkinNumber, 'nenkin', 10);
        splitStr(c.myNumber, 'my_num', 12);
        mapDate(c.dob, 'dob');
        if (c.taxOffice) {
            result['taxOfficeName'] = c.taxOffice.name || '';
            result['taxOfficeAddress'] = c.taxOffice.address || '';
        }
    }
    if (application.taxRepresentative) {
        var rep = application.taxRepresentative;
        result['rep_fullName'] = rep.fullName || '';
        result['rep_address'] = rep.address || '';
        splitStr(rep.postalCode, 'rep_post', 7);
    }
    // Format Decimal values as strings
    var decimalFields = [
        'totalExpectedJpy',
        'received1stJpy',
        'received2ndJpy',
        'tax2ndJpy',
        'serviceFeeJpy',
        'exchangeRate',
        'serviceFeeVnd',
    ];
    for (var _i = 0, decimalFields_1 = decimalFields; _i < decimalFields_1.length; _i++) {
        var field = decimalFields_1[_i];
        var val = application[field];
        if (val !== undefined && val !== null) {
            result[field] = val.toString();
        }
    }
    return result;
}

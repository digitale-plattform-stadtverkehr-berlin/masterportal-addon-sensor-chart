import moment from "moment";

/**
 * adds new entries with value null in a single day dataset where time slots are missing
 * @pre the given timeData might have gaps
 * @post the given timeData has no gaps and the seconds are zeroed
 * @param {String} from the starting date based on the calender as "YYYY-MM-DD HH:mm:ss"
 * @param {Object} timeData a single dataset object{date: value}
 * @param {Integer} minuteInterval the underlying interval of the time data in minutes (ie. 1, 5, 15...), default 5
 * @returns {Object}  a new dataset object{date: value} without any gaps in the timeline
 */
export function addMissingDataDay (from, timeData, minuteInterval = 5) {
    const zeroedData = {},
        result = {},
        datePrefix = moment(from, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD ");
    let h,
        m,
        key;

    for (key in timeData) {
        zeroedData[moment(key, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:00")] = timeData[key];
    }

    // add missing datasets
    for (h = 0; h < 24; h++) {
        for (m = 0; m < 60 / minuteInterval; m++) {
            key = datePrefix + String(h).padStart(2, "0") + ":" + String(m * minuteInterval).padStart(2, "0") + ":00";

            if (Object.prototype.hasOwnProperty.call(zeroedData, key)) {
                result[key] = zeroedData[key];
            }
            else {
                result[key] = null;
            }
        }
    }

    return result;
}


/**
 * adds new entries with value null in a single day dataset where time slots are missing
 * @pre the given timeData might have gaps
 * @post the given timeData has no gaps and the seconds are zeroed
 * @param {String} from the starting date based on the calender as "YYYY-MM-DD HH:mm:ss"
 * @param {String} until the end date based on the calender as "YYYY-MM-DD HH:mm:ss"
 * @param {Object} timeData a single dataset object{date: value}
 * @param {Integer} interval the underlying interval of the time data in minutes (ie. 1, 5, 15...), default 5
 * @returns {Object}  a new dataset object{date: value} without any gaps in the timeline
 */
export function addMissingDataFlex (from, until, timeData, interval) {
    const zeroedData = {},
        result = {},
        startTime = moment(from, "YYYY-MM-DD HH:mm:ss"),
        endTime = moment(until, "YYYY-MM-DD HH:mm:ss");
    let currentTime,
        key;

    for (key in timeData) {
        zeroedData[moment(key, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:00")] = timeData[key];
    }
    currentTime = startTime;
    while (!currentTime.isAfter(endTime)) {
        key = currentTime.format("YYYY-MM-DD HH:mm:00");
        currentTime = currentTime.add(interval.value, interval.unit);

        if (Object.prototype.hasOwnProperty.call(zeroedData, key)) {
            result[key] = zeroedData[key];
        }
        else {
            result[key] = null;
        }
    }

    return result;
}

/**
 * adds new entries with value null in a single week dataset where time slots are missing
 * @pre the given timeData might have gaps
 * @post the given timeData has no gaps and the seconds are zeroed
 * @param {String} from the starting date based on the calender as "YYYY-MM-DD HH:mm:ss"
 * @param {Object} timeData a single dataset object{date: value}
 * @returns {Object}  a new dataset object{date: value} without any gaps in the timeline
 */
export function addMissingDataWeek (from, timeData) {
    const zeroedData = {},
        result = {};
    let wd,
        key;

    for (key in timeData) {
        zeroedData[moment(key, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:00")] = timeData[key];
    }

    // add missing datasets
    for (wd = 1; wd <= 7; wd++) {
        key = moment(from, "YYYY-MM-DD HH:mm:ss").isoWeekday(wd).format("YYYY-MM-DD HH:mm:00");

        if (Object.prototype.hasOwnProperty.call(zeroedData, key)) {
            result[key] = zeroedData[key];
        }
        else {
            result[key] = null;
        }
    }

    return result;
}

/**
 * adds new entries with value null in a single year dataset where time slots are missing
 * @pre the given timeData might have gaps
 * @post the given timeData has no gaps and the seconds are zeroed
 * @param {(String|Number)} year the year to cover based on the calender as "YYYY"
 * @param {Object} timeData a single dataset object{date: value}
 * @returns {Object}  a new dataset object{date: value} without any gaps in the timeline
 */
export function addMissingDataYear (year, timeData) {
    const zeroedData = {},
        result = {},
        // set objMoment to the first thursday (00:00:00) of the year, as the first thursday of january is always in the first calendar week of the year
        objMoment = moment(String(year) + "-1", "YYYY-W").add(3, "days");
    let key;

    for (key in timeData) {
        zeroedData[moment(key, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:00")] = timeData[key];
    }

    // add missing datasets
    // objMoment is always thursday of the week, as only the last thursday of the year is always in the current year
    while (objMoment.format("YYYY") === String(year)) {
        key = objMoment.isoWeekday(1).format("YYYY-MM-DD HH:mm:00");

        if (Object.prototype.hasOwnProperty.call(zeroedData, key)) {
            result[key] = zeroedData[key];
        }
        else {
            result[key] = null;
        }

        objMoment.add(1, "week");
    }

    return result;
}

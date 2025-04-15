import {SensorChartApi} from "./sensorChartApi";

/**
 * SensorChartCache is the layer between the sensorChartApi and the model of the SensorChart GFI Theme
 * <pre>
 * The SensorChartCache interfaces the SensorChartApi to provide a simple access for the SensorChart GFI Theme
 * The SensorChartCache caches requests to the api and reacts to subscriptions.
 *
 * To import SensorChartCache: import {SensorChartCache} from "./sensorChartCache";
 * create a new object:        const obj = new SensorChartCache(...);
 * remember to only unsubscribe when gfi theme is closed:    obj.unsubscribeEverything();
 * unsubscribeEverything clears the cache!
 * </pre>
 * @class
 * @memberof Tools.GFI.Themes.SensorChart
 */
export class SensorChartCache {
    /**
     * constructor of SensorChartCache
     * @param {String} httpHost the host (incl. protocol) to call any http request with or "test://api" if SensorChartApi shouldn't be initialized
     * @param {String} sensorThingsVersion the used version of the SensorThingsAPI (e.g. "v1.0")
     * @param {Object} [mqttOptions] the options to connect to mqtt with
     * @param {Object} [sensorThingsApiOpt] an optional api for testing
     * @constructor
     * @returns {SensorChartCache}  the instance of SensorChartCache
     */
    constructor (httpHost, sensorThingsVersion, mqttOptions, sensorThingsApiOpt) {
        /** @private */
        this.api = sensorThingsApiOpt || (httpHost === "test://api" ? {
            // please check with SensorChart.vue created & mounted which functions are needed
            updateTitle: () => {
                return false;
            },
            updateDescription: () => {
                return false;
            },
            updatePosition: () => {
                return false;
            },
            updateDirection: () => {
                return false;
            }
        } : new SensorChartApi(httpHost, sensorThingsVersion, mqttOptions));
        /** @private */
        this.cache = {};
    }

    /**
     * gets the title of the thing
     * @param {Integer} thingId the ID of the thing
     * @param {Function} [onupdate] as function(title) to set the title with
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {Function} [simpleCacheCallOpt=null] using this function instead of inner simpleCacheCall (for testing)
     * @param {SensorChartApi} [sensorChartApiOpt=null] the api to use (for testing)
     * @returns {Void}  -
     */
    updateTitle (thingId, onupdate, onerror, onstart, oncomplete, simpleCacheCallOpt = null, sensorChartApiOpt = null) {
        const key = "updateTitle" + thingId;

        (simpleCacheCallOpt || this.simpleCacheCall).bind(this)(key, (callback) => {
            (sensorChartApiOpt || this.api).updateTitle(thingId, (...args) => {
                if (typeof callback === "function") {
                    return callback(...args);
                }
                return null;
            }, onerror);
        }, onupdate, onupdate, onstart, oncomplete);
    }

    /**
     * gets the description of the thing
     * @param {Integer} thingId the ID of the thing
     * @param {Function} [onupdate] as function(description) to set the description with
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {Function} [simpleCacheCallOpt=null] using this function instead of inner simpleCacheCall (for testing)
     * @param {SensorChartApi} [sensorChartApiOpt=null] the api to use (for testing)
     * @returns {Void}  -
     */
    updateDescription (thingId, onupdate, onerror, onstart, oncomplete, simpleCacheCallOpt = null, sensorChartApiOpt = null) {
        const key = "updateDescription" + thingId;

        (simpleCacheCallOpt || this.simpleCacheCall).bind(this)(key, (callback) => {
            (sensorChartApiOpt || this.api).updateDescription(thingId, (...args) => {
                if (typeof callback === "function") {
                    return callback(...args);
                }
                return null;
            }, onerror);
        }, onupdate, onupdate, onstart, oncomplete);
    }

    /**
     * gets a property of the thing
     * @param {Integer} thingId the ID of the thing
     * @param {String} propertyName the property name to get (should be available under "properties" in the things dataset)
     * @param {Function} [onupdate] as function(operation_start) to set the operation_start with
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {Function} [simpleCacheCallOpt=null] using this function instead of inner simpleCacheCall (for testing)
     * @param {SensorChartApi} [sensorChartApiOpt=null] the api to use (for testing)
     * @returns {Void}  -
     */
    updateProperty (thingId, propertyName, onupdate, onerror, onstart, oncomplete, simpleCacheCallOpt = null, sensorChartApiOpt = null) {
        const key = "updateProperty" + thingId + propertyName;

        (simpleCacheCallOpt || this.simpleCacheCall).bind(this)(key, (callback) => {
            (sensorChartApiOpt || this.api).updateProperty(thingId, propertyName, (...args) => {
                if (typeof callback === "function") {
                    return callback(...args);
                }
                return null;
            }, onerror);
        }, onupdate, onupdate, onstart, oncomplete);
    }

    /**
     * gets the sum for a single day excluding todays last 15 minutes
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @param {String} dayInterval measurement interval on day tab
     * @param {String} day the day as String in format YYYY-MM-DD
     * @param {Function} [onupdate] as event function(date, value) fires initialy and anytime server site changes are made
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {Function} [simpleCacheCallOpt=null] using this function instead of inner simpleCacheCall (for testing)
     * @param {SensorChartApi} [sensorChartApiOpt=null] the api to use (for testing)
     * @returns {Void}  -
     */
    updateDay (thingId, selects, options, dayInterval, day, onupdate, onerror, onstart, oncomplete, simpleCacheCallOpt = null, sensorChartApiOpt = null) {
        const key = "updateDay" + thingId + JSON.stringify(selects) + day;

        (simpleCacheCallOpt || this.simpleCacheCall).bind(this)(key, (callback) => {
            (sensorChartApiOpt || this.api).updateDay(thingId, selects, options, dayInterval, day, (...args) => {
                if (typeof callback === "function") {
                    return callback(...args);
                }
                return null;
            }, onerror);
        }, onupdate, onupdate, onstart, oncomplete);
    }

    /**
     * gets the speed medium for a single day
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @param {String} day the day as String in format YYYY-MM-DD
     * @param {Function} [onupdate] as event function(date, value) fires initialy and anytime server site changes are made
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [simpleCacheCallOpt=null] alternative call to get data
     * @param {SensorChartApi} [sensorChartApiOpt=null] the api to use (for testing)
     * @returns {Void}  -
     */
    updateDaySingle (thingId, selects, options, day, onupdate, onerror, simpleCacheCallOpt = null, sensorChartApiOpt = null) {
        const key = "updateDaySingle" + thingId + JSON.stringify(selects) + day;

        (simpleCacheCallOpt || this.simpleCacheCall).bind(this)(key, (callback) => {
            (sensorChartApiOpt || this.api).updateDaySingle(thingId, selects, options, day, (...args) => {
                if (typeof callback === "function") {
                    return callback(...args);
                }
                return null;
            }, onerror);
        }, onupdate, onupdate, null, null);
    }

    /**
     * gets the sum of a year excluding todays last 15 minutes
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @param {String} year the year as String in format YYYY
     * @param {Function} onupdate as event function(year, value) fires initialy and anytime server site changes are made
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {Function} [simpleCacheCallOpt=null] using this function instead of inner simpleCacheCall (for testing)
     * @param {SensorChartApi} [sensorChartApiOpt=null] the api to use (for testing)
     * @returns {Void}  -
     */
    updateYear (thingId, selects, options, year, onupdate, onerror, onstart, oncomplete, simpleCacheCallOpt = null, sensorChartApiOpt = null) {
        const key = "updateYear" + thingId + JSON.stringify(selects) + year;

        (simpleCacheCallOpt || this.simpleCacheCall).bind(this)(key, (callback) => {
            (sensorChartApiOpt || this.api).updateYear(thingId, selects, options, year, (...args) => {
                if (typeof callback === "function") {
                    return callback(...args);
                }
                return null;
            }, onerror);
        }, onupdate, onupdate, onstart, oncomplete);
    }

    /**
     * gets the total sum excluding todays last 15 minutes
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {String} dayInterval measurement interval on day tab
     * @param {Function} onupdate as event function(firstDate, value) fires initialy and anytime server site changes are made
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {Function} [simpleCacheCallOpt=null] using this function instead of inner simpleCacheCall (for testing)
     * @param {SensorChartApi} [sensorChartApiOpt=null] the api to use (for testing)
     * @returns {Void}  -
     */
    updateTotal (thingId, meansOfTransport, dayInterval, onupdate, onerror, onstart, oncomplete, simpleCacheCallOpt = null, sensorChartApiOpt = null) {
        const key = "updateTotal" + thingId + meansOfTransport + dayInterval;

        (simpleCacheCallOpt || this.simpleCacheCall).bind(this)(key, callback => {
            (sensorChartApiOpt || this.api).updateTotal(thingId, meansOfTransport, dayInterval, (...args) => {
                if (typeof callback === "function") {
                    return callback(...args);
                }
                return null;
            }, onerror);
        }, onupdate, onupdate, onstart, oncomplete);
    }

    /**
     * gets the strongest day in the given year excluding today
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @param {String} year the year as String in format YYYY
     * @param {Function} onupdate as event function(date, value)
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {Function} [simpleCacheCallOpt=null] using this function instead of inner simpleCacheCall (for testing)
     * @param {SensorChartApi} [sensorChartApiOpt=null] the api to use (for testing)
     * @returns {Void}  -
     */
    updateHighestWorkloadDay (thingId, selects, options, year, onupdate, onerror, onstart, oncomplete, simpleCacheCallOpt = null, sensorChartApiOpt = null) {
        const key = "updateHighestWorkloadDay" + thingId + JSON.stringify(selects) + year;

        (simpleCacheCallOpt || this.simpleCacheCall).bind(this)(key, (callback) => {
            (sensorChartApiOpt || this.api).updateHighestWorkloadDay(thingId, selects, options, year, (...args) => {
                if (typeof callback === "function") {
                    return callback(...args);
                }
                return null;
            }, onerror);
        }, onupdate, onupdate, onstart, oncomplete);
    }

    /**
     * gets the strongest week in the given year excluding the current week
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @param {String} year the year as String in format YYYY
     * @param {Function} onupdate as event function(calendarWeek, value)
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {Function} [simpleCacheCallOpt=null] using this function instead of inner simpleCacheCall (for testing)
     * @param {SensorChartApi} [sensorChartApiOpt=null] the api to use (for testing)
     * @returns {Void}  -
     */
    updateHighestWorkloadWeek (thingId, selects, options, year, onupdate, onerror, onstart, oncomplete, simpleCacheCallOpt = null, sensorChartApiOpt = null) {
        const key = "updateHighestWorkloadWeek" + thingId + JSON.stringify(selects) + year;

        (simpleCacheCallOpt || this.simpleCacheCall).bind(this)(key, (callback) => {
            (sensorChartApiOpt || this.api).updateHighestWorkloadWeek(thingId, selects, options, year, (...args) => {
                if (typeof callback === "function") {
                    return callback(...args);
                }
                return null;
            }, onerror);
        }, onupdate, onupdate, onstart, oncomplete);
    }

    /**
     * gets the strongest month in the given year including the current month
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @param {String} year the year as String in format YYYY
     * @param {Function} onupdate as event function(month, value)
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {Function} [simpleCacheCallOpt=null] using this function instead of inner simpleCacheCall (for testing)
     * @param {SensorChartApi} [sensorChartApiOpt=null] the api to use (for testing)
     * @returns {Void}  -
     */
    updateHighestWorkloadMonth (thingId, selects, options, year, onupdate, onerror, onstart, oncomplete, simpleCacheCallOpt = null, sensorChartApiOpt = null) {
        const key = "updateHighestWorkloadMonth" + thingId + JSON.stringify(selects) + year;

        (simpleCacheCallOpt || this.simpleCacheCall).bind(this)(key, (callback) => {
            (sensorChartApiOpt || this.api).updateHighestWorkloadMonth(thingId, selects, options, year, (...args) => {
                if (typeof callback === "function") {
                    return callback(...args);
                }
                return null;
            }, onerror);
        }, onupdate, onupdate, onstart, oncomplete);
    }

    /**
     * recursive function for updateDataset
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @param {String[]} timeSettings array of time configurations
     * @param {String} timeSettings.interval the interval to call as '15-Min', '1-Stunde' or '1-Woche'
     * @param {String} timeSettings.from the day to start from (inclusive) as String in format YYYY-MM-DD
     * @param {String} timeSettings.until the day to end with (inclusive) as String in format YYYY-MM-DD
     * @param {Object[]} datasets an array of datasets to be filled by ref through recursion
     * @param {Function} onsuccess as event function(datasets) triggert after datasets are complete
     * @param {Function} [observer] a function() to be triggert when data is updated via subscription
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [simpleCacheCallOpt=null] using this function instead of inner simpleCacheCall (for testing)
     * @param {SensorChartApi} [sensorChartApiOpt] the api to use (for testing)
     * @returns {Void}  -
     */
    updateDatasetHelper (thingId, selects, options, timeSettings, datasets, onsuccess, observer, onerror, simpleCacheCallOpt, sensorChartApiOpt) {
        const timeSet = Array.isArray(datasets) && Array.isArray(timeSettings) ? timeSettings[datasets.length] : undefined,
            key = "updateDatasetHelper" + thingId + JSON.stringify(selects) + JSON.stringify(timeSet);

        if (timeSet === undefined) {
            // end of recursion
            if (typeof onsuccess === "function") {
                onsuccess(datasets);
            }
            return;
        }

        (simpleCacheCallOpt || this.simpleCacheCall).bind(this)(key, callback => {
            // apiCall
            (sensorChartApiOpt || this.api).updateDataset(thingId, selects, options, timeSet, dataset => {
                // onupdate of api.updateDataset
                if (typeof callback === "function") {
                    return callback(dataset);
                }
                return null;
            }, onerror);
        }, dataset => {
            // onupdate
            datasets.push(dataset);
            this.updateDatasetHelper(thingId, selects, options, timeSettings, datasets, onsuccess, observer, onerror, simpleCacheCallOpt, sensorChartApiOpt);
        }, observer);
    }

    /**
     * gets the data for a diagram or table for the given interval
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @param {String[]} timeSettings array of time configurations
     * @param {String} timeSettings.interval the interval to call as '15-Min', '1-Stunde' or '1-Woche'
     * @param {String} timeSettings.from the day to start from (inclusive) as String in format YYYY-MM-DD
     * @param {String} timeSettings.until the day to end with (inclusive) as String in format YYYY-MM-DD
     * @param {Function} onupdate as event function(data) fires initialy and anytime server site changes are made; with data as object {meansOfTransport: {date: value}}
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {Function} [updateDatasetHelperOpt] the helper function to use for testing
     * @returns {Void}  -
     */
    updateDataset (thingId, selects, options, timeSettings, onupdate, onerror, onstart, oncomplete, updateDatasetHelperOpt) {
        if (typeof onstart === "function") {
            onstart();
        }

        (updateDatasetHelperOpt || this.updateDatasetHelper).bind(this)(thingId, selects, options, timeSettings, [], datasets => {
            // onsuccess
            if (typeof onupdate === "function") {
                onupdate(datasets);
            }
            if (typeof oncomplete === "function") {
                oncomplete();
            }
        }, () => {
            // observer (triggert by subscription)
            (updateDatasetHelperOpt || this.updateDatasetHelper).bind(this)(thingId, selects, options, timeSettings, [], datasets => {
                // onsuccess
                if (typeof onupdate === "function") {
                    onupdate(datasets);
                }
            }, false, onerror);
        }, onerror);
    }

    /**
     * subscribes the last change of data based on 15 minutes
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects the choosen parameters
     * @param {Function} [onupdate] as event function(phenomenonTime) fires initialy and anytime server site changes are made
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {Function} [simpleCacheCallOpt=null] using this function instead of inner simpleCacheCall (for testing)
     * @param {SensorChartApi} [sensorChartApiOpt=null] the api to use (for testing)
     * @returns {Void}  -
     */
    subscribeLastUpdate (thingId, selects, onupdate, onerror, onstart, oncomplete, simpleCacheCallOpt = null, sensorChartApiOpt = null) {
        const key = "subscribeLastUpdate" + thingId + JSON.stringify(selects);

        (simpleCacheCallOpt || this.simpleCacheCall).bind(this)(key, (callback) => {
            (sensorChartApiOpt || this.api).subscribeLastUpdate(thingId, selects, (...args) => {
                if (typeof callback === "function") {
                    return callback(...args);
                }
                return null;
            }, onerror);
        }, onupdate, onupdate, onstart, oncomplete);
    }

    /**
     * unsubscribes all subscriptions that have been made and clears the cache
     * @param {Function} [onsuccess] an event function() to fire when done
     * @param {SensorChartApi} [sensorChartApiOpt] the api to use (for testing)
     * @returns {Void}  -
     */
    unsubscribeEverything (onsuccess, sensorChartApiOpt) {
        // cancel subscriptions
        (sensorChartApiOpt || this.api).unsubscribeEverything(() => {
            // clear cache
            this.setCache({});
            if (typeof onsuccess === "function") {
                onsuccess();
            }
        });
    }

    /**
     * gets the title and the data without subscription for the given thingId, meansOfTransport and timeSettings
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {String} timeSettings time configuration
     * @param {String} timeSettings.interval the interval to call as '15-Min', '1-Stunde' or '1-Woche'
     * @param {String} timeSettings.from the day to start from (inclusive) as String in format YYYY-MM-DD
     * @param {String} timeSettings.until the day to end with (inclusive) as String in format YYYY-MM-DD
     * @param {Object} options contains the default label
     * @param {Function} onsuccess as event function(result) with result{title, dataset} and dataset{meansOfTransport: {date: value}}; fired once on success (no subscription)
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {Void}  -
     */
    downloadData (thingId, meansOfTransport, timeSettings, options, onsuccess, onerror, onstart, oncomplete) {
        // this is just a gateway - no cache needed
        this.api.downloadData(thingId, meansOfTransport, timeSettings, options, onsuccess, onerror, onstart, oncomplete);
    }

    /**
     * gets the first date on a weekly basis ever recorded without subscription
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {Function} onsuccess as event function(firstDate) fires once
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {Function} [simpleCacheCallOpt=null] using this function instead of inner simpleCacheCall (for testing)
     * @param {SensorChartApi} [sensorChartApiOpt=null] the api to use (for testing)
     * @returns {Void}  -
     */
    getFirstDateEver (thingId, meansOfTransport, onsuccess, onerror, onstart, oncomplete, simpleCacheCallOpt = null, sensorChartApiOpt = null) {
        const key = "getFirstDateEver" + thingId + meansOfTransport;

        (simpleCacheCallOpt || this.simpleCacheCall).bind(this)(key, callback => {
            (sensorChartApiOpt || this.api).getFirstDateEver(thingId, meansOfTransport, (...args) => {
                if (typeof callback === "function") {
                    return callback(...args);
                }
                return null;
            }, onerror);
        }, onsuccess, false, onstart, oncomplete);
    }

    /**
     * gets units of measurement
     * @param {Integer} thingId the ID of the thing
     * @param {String} selects the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {String} interval the interval ("5-Min", "1-Tag", "1-Woche")
     * @param {Function} onsuccess as event function(firstDate) fires once
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {Function} [simpleCacheCallOpt=null] using this function instead of inner simpleCacheCall (for testing)
     * @param {SensorChartApi} [sensorChartApiOpt=null] the api to use (for testing)
     * @returns {Void}  -
     */
    getUnitOfMeasurement (thingId, selects, interval, onsuccess, onerror, onstart, oncomplete, simpleCacheCallOpt = null, sensorChartApiOpt = null) {
        const key = "getUnitOfMeasurement" + thingId + JSON.stringify(selects);

        (simpleCacheCallOpt || this.simpleCacheCall).bind(this)(key, callback => {
            (sensorChartApiOpt || this.api).getUnitOfMeasurement(thingId, selects, interval, (...args) => {
                if (typeof callback === "function") {
                    return callback(...args);
                }
                return null;
            }, onerror);
        }, onsuccess, false, onstart, oncomplete);
    }

    /**
     * uses the cache to make the given api call
     * this helper should be used for all simple data (e.g. updateTitle, updateYear, updateDay)
     * this is no solution for complex data (e.g. updateData)
     * @param {String} key the cache key to use
     * @param {Function} apiCall a function(callback) with callback a function(data) to call the api and get the data with
     * @param {Function} [onupdate] as event function(phenomenonTime) fires initialy and anytime server site changes are made
     * @param {(Function|Boolean)} [observer] a function(data) to call when the subscription triggers new data - this is the onupdate function, most of the time; if flaged false the observer not overriden
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {Void}  -
     */
    simpleCacheCall (key, apiCall, onupdate, observer, onstart, oncomplete) {
        if (typeof onstart === "function") {
            onstart();
        }

        if (this.cacheIsReady(key)) {
            if (observer !== false) {
                this.cacheSetObserver(key, observer);
            }
            if (typeof onupdate === "function") {
                onupdate(...this.cacheGetValue(key));
            }
            if (typeof oncomplete === "function") {
                oncomplete();
            }
        }
        else if (this.cacheInProgress(key)) {
            this.cacheAddToWaitlist(key, () => {
                if (observer !== false) {
                    this.cacheSetObserver(key, observer);
                }
                if (typeof onupdate === "function") {
                    onupdate(...this.cacheGetValue(key));
                }
                if (typeof oncomplete === "function") {
                    oncomplete();
                }
            });
        }
        else {
            this.cacheCreate(key);
            this.cacheSetInProgress(key, true);
            this.cacheSetIsReady(key, false);
            this.cacheAddToWaitlist(key, () => {
                if (observer !== false) {
                    this.cacheSetObserver(key, observer);
                }
                if (typeof onupdate === "function") {
                    onupdate(...this.cacheGetValue(key));
                }
                if (typeof oncomplete === "function") {
                    oncomplete();
                }
            });

            if (typeof apiCall === "function") {
                apiCall((...args) => {
                    if (this.cacheInProgress(key) === true && this.cacheIsReady(key) === false) {
                        this.cacheSetValue(key, args);
                        this.cacheSetIsReady(key, true);
                        this.cacheSetInProgress(key, false);

                        this.cacheWorkOffWaitlist(key);
                    }
                    else {
                        // update from subscription
                        this.cacheSetValue(key, args);
                        if (typeof this.cacheGetObserver(key) === "function") {
                            this.cacheGetObserver(key)(...this.cacheGetValue(key));
                        }
                    }
                });
            }
        }
    }

    /**
     * creates a new empty cache entry for key
     * @param {String} key the key
     * @post a new empty entry is created for key
     * @returns {Void}  -
     */
    cacheCreate (key) {
        this.cache[key] = {
            value: [],
            isReady: false,
            inProgress: false,
            waitlist: [],
            observer: null
        };
    }

    /**
     * gets the value from the cache
     * @param {String} key the key to lookup the value
     * @returns {*}  the value from the cache or undefined if key wasn't found
     */
    cacheGetValue (key) {
        if (!Object.prototype.hasOwnProperty.call(this.cache, key)) {
            return undefined;
        }

        return this.cache[key].value;
    }

    /**
     * checks if the cache for the given key is ready to be used
     * @param {String} key the key to be checked
     * @returns {Boolean}  true ready, false not ready (check isInProgress next)
     */
    cacheIsReady (key) {
        return Object.prototype.hasOwnProperty.call(this.cache, key) && this.cache[key].isReady === true;
    }

    /**
     * checks if the cache for the given key is in progress
     * e.g. if a former call has called the api for this key, but has not yet finished
     * @param {String} key the key to be checked
     * @returns {Boolean}  true in progress (just put your stuff on the waiting list), false not in progress
     */
    cacheInProgress (key) {
        return Object.prototype.hasOwnProperty.call(this.cache, key) && this.cache[key].inProgress === true;
    }

    /**
     * gets the waitlist from the cache of key
     * this is used for testing only
     * @param {String} key the key to use
     * @returns {Function[]}  an array of functions
     */
    cacheGetWaitlist (key) {
        if (!Object.prototype.hasOwnProperty.call(this.cache, key)) {
            return [];
        }

        return this.cache[key].waitlist;
    }

    /**
     * calls and removes all handlers from waitlist
     * @param {String} key the key
     * @pre the waitlist of key has at least one entry
     * @post the waitlist of the key is emtpy, all handlers are called
     * @returns {Void}  -
     */
    cacheWorkOffWaitlist (key) {
        if (!Object.prototype.hasOwnProperty.call(this.cache, key) || Array.isArray(!this.cache[key])) {
            return;
        }

        this.cache[key].waitlist.forEach(handler => {
            if (typeof handler !== "function") {
                return;
            }
            handler();
        });

        this.cache[key].waitlist = [];
    }

    /**
     * gets the observer from the cache
     * @param {String} key the key to lookup the observer
     * @returns {Function}  the observer from the cache or null if no observer was found
     */
    cacheGetObserver (key) {
        if (!Object.prototype.hasOwnProperty.call(this.cache, key)) {
            return null;
        }

        return this.cache[key].observer;
    }

    /**
     * setter for cache value
     * @param {String} key the key
     * @param {Boolean} value the new value
     * @returns {Void}  -
     */
    cacheSetValue (key, value) {
        if (!Object.prototype.hasOwnProperty.call(this.cache, key)) {
            return;
        }

        this.cache[key].value = value;
    }

    /**
     * setter for isReady
     * @param {String} key the key
     * @param {Boolean} status the new status
     * @returns {Void}  -
     */
    cacheSetIsReady (key, status) {
        if (!Object.prototype.hasOwnProperty.call(this.cache, key)) {
            return;
        }

        this.cache[key].isReady = status;
    }

    /**
     * setter for inProgress
     * @param {String} key the key
     * @param {Boolean} status the new status
     * @returns {Void}  -
     */
    cacheSetInProgress (key, status) {
        if (!Object.prototype.hasOwnProperty.call(this.cache, key)) {
            return;
        }

        this.cache[key].inProgress = status;
    }

    /**
     * adds the given handler to the waitlist of the key
     * e.g. if a former call is currently in progress - the given handler will be called as soon as the former call is finished
     * @param {String} key the key
     * @param {String} handler the handler to be called when the former call is finished
     * @returns {Void}  -
     */
    cacheAddToWaitlist (key, handler) {
        if (!Object.prototype.hasOwnProperty.call(this.cache, key)) {
            return;
        }

        if (!Array.isArray(this.cache[key].waitlist)) {
            this.cache[key].waitlist = [];
        }
        this.cache[key].waitlist.push(handler);
    }

    /**
     * setter for observer
     * the observer is triggert if a subscribed topic changes
     * @param {String} key the key
     * @param {Function} observer the new observer
     * @returns {Void}  -
     */
    cacheSetObserver (key, observer) {
        if (!Object.prototype.hasOwnProperty.call(this.cache, key)) {
            return;
        }

        this.cache[key].observer = observer;
    }


    /**
     * returns the current cache
     * this is used only for testing
     * @returns {Object}  the current cache
     */
    getCache () {
        return this.cache;
    }

    /**
     * overrides the entire cache with the given object
     * @param {Object} cache the new cache
     * @returns {Void}  -
     */
    setCache (cache) {
        this.cache = cache;
    }
}

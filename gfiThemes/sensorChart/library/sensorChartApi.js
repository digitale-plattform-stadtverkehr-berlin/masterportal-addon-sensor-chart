import {SensorThingsMqtt} from "../../../../src/utils/sensorThingsMqtt.js";
import {SensorThingsHttp} from "../../../../src/utils/sensorThingsHttp.js";
import moment from "moment";

// change language from moment.js to german
moment.locale("de");

/**
 * SensorChartApi is the api for the SensorChart GFI Theme
 * <pre>
 * The SensorChartApi uses SensorThingsHttp and SensorThingsMqtt to provide simple access to basic functions for the SensorChart GFI Theme
 * Any subscription is handled by the SensorChartApi.
 *
 * To import SensorChartApi: import {SensorChartApi} from "./sensorChartApi";
 * create a new object:        const obj = new SensorChartApi(...);
 * remember to unsubscribe:    obj.unsubscribeEverything();
 * </pre>
 * @class
 * @memberof Tools.GFI.Themes.SensorChart
 */
export class SensorChartApi {

    /**
     * constructor of SensorChartApi
     * @param {String} httpHost the host (incl. protocol) to call any http request with
     * @param {String} sensorThingsVersion the used version of the SensorThingsAPI (e.g. "v1.0")
     * @param {Object} [mqttOptions] the options to connect to mqtt with
     * @param {Object} [sensorThingsHttpOpt] an optional http client for testing
     * @param {Object} [sensorThingsMqttOpt] an optional mqtt client for testing
     * @param {Boolean} [noSingletonOpt=false] for testing only - set true to turn off singleton behavior for testing
     * @constructor
     * @returns {SensorChartApi}  the instance of SensorChartApi (singleton)
     */
    constructor (httpHost, sensorThingsVersion, mqttOptions, sensorThingsHttpOpt, sensorThingsMqttOpt, noSingletonOpt) {
        if (!noSingletonOpt) {
            // make this instance a multiton based on httpHost (one singleton for each unique host)
            if (typeof SensorChartApi.instance !== "object" || SensorChartApi.instance === null) {
                SensorChartApi.instance = {};
            }

            if (Object.prototype.hasOwnProperty.call(SensorChartApi.instance, httpHost)) {
                return SensorChartApi.instance[httpHost];
            }

            SensorChartApi.instance[httpHost] = this;
        }

        /** @private */
        this.sensorThingsVersion = sensorThingsVersion;
        /** @private */
        this.http = sensorThingsHttpOpt || new SensorThingsHttp({removeIotLinks: true});
        /** @private */
        this.mqttClient = sensorThingsMqttOpt || new SensorThingsMqtt(mqttOptions);
        /** @private */
        this.httpHost = httpHost;
        /** @private */
        this.baseUrlHttp = httpHost + "/" + this.sensorThingsVersion;
        /** @private */
        this.subscriptionTopics = {};
        /** @private */
        // this.layerNameInfix = "";
        // this.layerNameInfix = "_Zaehlfeld";
        this.layerNameInfix = "_Zaehlstelle";

        // set the mqtt listener
        if (this.mqttClient && typeof this.mqttClient.on === "function") {
            this.mqttClient.on("message", (topic, payload, packet) => {
                if (Object.prototype.hasOwnProperty.call(this.subscriptionTopics, topic)) {
                    if (!Array.isArray(this.subscriptionTopics[topic])) {
                        return;
                    }

                    this.subscriptionTopics[topic].forEach(callback => {
                        if (typeof callback !== "function") {
                            // continue
                            return;
                        }
                        callback(payload, packet);
                    });
                }
            });
        }
    }

    /**
     * the default function to call on error
     * @param {String[]} errorargs the error messages as array of Strings
     * @returns {Void}  -
     */
    defaultErrorHandler (...errorargs) {
        console.warn(errorargs);
    }

    /**
     * checks if the given dataset has a datastream with an id and an array of observations
     * @param {Object} dataset the dataset to check
     * @returns {Boolean}  true/false
     */
    checkForObservations (dataset) {
        return Array.isArray(dataset) && dataset.length > 0 && Object.prototype.hasOwnProperty.call(dataset[0], "Datastreams")
            && Array.isArray(dataset[0].Datastreams) && dataset[0].Datastreams.length > 0 && Object.prototype.hasOwnProperty.call(dataset[0].Datastreams[0], "@iot.id")
            && Array.isArray(dataset[0].Datastreams[0].Observations);
    }

    /**
     * checks if the given dataset has a datastream with an id and an array of unitOfMeasurement
     * @param {Object} dataset the dataset to check
     * @returns {Boolean}  true/false
     */
    checkForUnits (dataset) {
        return Array.isArray(dataset) && dataset.length > 0 && Object.prototype.hasOwnProperty.call(dataset[0], "Datastreams")
            && Array.isArray(dataset[0].Datastreams) && dataset[0].Datastreams.length > 0 && Object.prototype.hasOwnProperty.call(dataset[0].Datastreams[0], "@iot.id")
            && Object.prototype.hasOwnProperty.call(dataset[0].Datastreams[0], "unitOfMeasurement");
    }

    /**
     * sums up the observation results of the given structure, used for counting streams
     * @param {Object} dataset the dataset to go through
     * @returns {Integer|Boolean}  the sum of all found observation results
     */
    sumObservations (dataset) {
        if (!this.checkForObservations(dataset)) {
            return false;
        }

        let sum = 0;

        dataset[0].Datastreams[0].Observations.forEach(observation => {
            if (!Object.prototype.hasOwnProperty.call(observation, "result")) {
                // continue
                return;
            }

            sum += observation.result;
        });

        return sum;
    }

    /**
     * Group the first oberservations of
     * @param {Object} dataset contains the data from the STA-Server
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @returns {{}|boolean} the bucketed Values or false for empty dataset
     */
    bucketSingleValues (dataset, selects, options) {
        if (!this.checkForObservations(dataset)) {
            return false;
        }

        const results = {},
            dates = {};

        dataset[0].Datastreams.forEach(datastream => {
            let labelString = Object.keys(selects).filter(select => !selects[select].overwritten).filter(select => Array.isArray(selects[select].value) && selects[select].value.length > 1).map((select) => selects[select].description + ": '" + datastream.properties[select] + "'").join(" und ");

            if (!labelString) {
                labelString = Object.keys(selects).filter(select => selects[select].isDefaultLabel).map((select) => datastream.properties[select]).join("");
            }

            if (!labelString && options.defaultLabel) {
                labelString = options.defaultLabel;
            }

            results[labelString] = datastream.Observations[0].result + " " + datastream.unitOfMeasurement.symbol;
            dates[labelString] = "";
        });

        return results;
    }

    /**
     * sums up the observation results of the given structure, used for counting streams
     * @param {Object} dataset the dataset to go through
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @returns {Integer|Boolean}  the sum of all found observation results
     */
    bucketObservations (dataset, selects, options) {
        if (!this.checkForObservations(dataset)) {
            return false;
        }

        const results = {},
            dates = {};

        dataset[0].Datastreams.forEach(datastream => {
            let labelString = Object.keys(selects).filter(select => !selects[select].overwritten).filter(select => Array.isArray(selects[select].value) && selects[select].value.length > 1).map((select) => selects[select].description + ": '" + datastream.properties[select] + "'").join(" und "),
                sum = 0;

            if (!labelString) {
                labelString = Object.keys(selects).filter(select => selects[select].isDefaultLabel).map((select) => datastream.properties[select]).join("");
            }

            if (!labelString && options.defaultLabel) {
                labelString = options.defaultLabel;
            }

            datastream.Observations.forEach(observation => {
                if (!Object.prototype.hasOwnProperty.call(observation, "result")) {
                    // continue
                    return;
                }

                sum += observation.result;
            });
            results[labelString] = sum;
            dates[labelString] = "";
        });

        return results;
    }

    /**
     * calculate the medium speed of the observation results of the given structure, weighted by count for the same structure
     * @param {Object} datasetSpeed the speed dataset to go through
     * @param {Object} datasetCount the count dataset to go through
     * @returns {Integer|Boolean}  the sum of all found observation results
     */
    getMediumSpeed (datasetSpeed, datasetCount) {
        if (!this.checkForObservations(datasetSpeed)) {
            return false;
        }
        if (!this.checkForObservations(datasetCount)) {
            return false;
        }

        const counts = [];
        let countsSum = 0,
            weightedTotal = 0;

        datasetCount[0].Datastreams[0].Observations.forEach(observation => {
            if (!Object.prototype.hasOwnProperty.call(observation, "result")) {
                return;
            }
            counts[observation.phenomenonTime] = observation.result;
            countsSum += observation.result;
        });

        datasetSpeed[0].Datastreams[0].Observations.forEach(observation => {
            if (!Object.prototype.hasOwnProperty.call(observation, "result")) {
                return;
            }
            weightedTotal += counts[observation.phenomenonTime] * observation.result;
        });
        return (weightedTotal / countsSum).toFixed(2);
    }

    /**
     * returns the oldest date as phenomenonTime of the given structure
     * @param {Object} dataset the dataset to go through
     * @param {String} [firstDateSoFar] the firstDate to account for the "firstest" so far, todays date if no firstDateSoFar is given
     * @returns {String|Boolean}  the first date as phenomenonTime (in format YYYY-MM-DDTHH:mm:ss.SSSZ) or false if no observations were found
     */
    getFirstDate (dataset, firstDateSoFar) {
        if (!this.checkForObservations(dataset)) {
            return false;
        }

        // set firstDate to today
        let firstDate = firstDateSoFar || moment().toISOString(),
            phenomenonTime = "";

        dataset[0].Datastreams[0].Observations.forEach(observation => {
            if (!Object.prototype.hasOwnProperty.call(observation, "phenomenonTime")) {
                // continue
                return;
            }

            phenomenonTime = this.parsePhenomenonTime(observation.phenomenonTime);
            if (phenomenonTime < firstDate) {
                firstDate = phenomenonTime;
            }
        });

        return firstDate;
    }

    /**
     * returns the oldest date as phenomenonTime of the given structure
     * @param {Object} dataset the dataset to go through
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @param {String} formatterFunction the format String for the returned dates
     * @param {String} [firstDateSoFar] the firstDate to account for the "firstest" so far, todays date if no firstDateSoFar is given
     * @returns {String[]|Boolean}  the first date by datastream as phenomenonTime (in format YYYY-MM-DDTHH:mm:ss.SSSZ) or false if no observations were found
     */
    bucketDates (dataset, selects, options, formatterFunction, firstDateSoFar) {
        if (!this.checkForObservations(dataset)) {
            return false;
        }

        const dates = {};

        dataset[0].Datastreams.forEach(datastream => {
            let labelString = Object.keys(selects).filter(select => !selects[select].overwritten).filter(select => Array.isArray(selects[select].value) && selects[select].value.length > 1).map((select) => selects[select].description + ": '" + datastream.properties[select] + "'").join(" und "),
                firstDate = firstDateSoFar || moment().toISOString(),
                phenomenonTime = "";

            if (!labelString) {
                labelString = Object.keys(selects).filter(select => selects[select].isDefaultLabel).map((select) => datastream.properties[select]).join("");
            }
            if (!labelString && options.defaultLabel) {
                labelString = options.defaultLabel;
            }

            datastream.Observations.forEach(observation => {
                if (!Object.prototype.hasOwnProperty.call(observation, "phenomenonTime")) {
                    // continue
                    return;
                }

                phenomenonTime = this.parsePhenomenonTime(observation.phenomenonTime);
                if (phenomenonTime < firstDate) {
                    firstDate = phenomenonTime;
                }
            });
            dates[labelString] = formatterFunction(firstDate);
        });

        return dates;
    }

    /**
     * checks a phenomenonTime for interval, if not phenomenonTime is returned, if so the first part of the interval is returned
     * @info phenomenonTime could be either "2020-03-16T14:30:01.000Z" or "2020-03-16T14:30:01.000Z/2020-03-16T14:45:00.000Z"
     * @param {String} phenomenonInterval the phenomenonTime either as value or interval (see info)
     * @returns {String} the phenomenonTime
     */
    parsePhenomenonTime (phenomenonInterval) {
        if (typeof phenomenonInterval !== "string") {
            return "";
        }

        const phenomenonArray = phenomenonInterval.split("/");

        // return the first part of the interval
        return phenomenonArray[0];
    }

    /**
     * subscribes to a topic
     * @param {String} topic the topic to subscribe to
     * @param {Object} options the options for the mqtt client
     * @param {callback} handler the event as function(payload) to be called when receiving new data
     * @returns {Void}  -
     */
    mqttSubscribe (topic, options, handler) {
        if (!Object.prototype.hasOwnProperty.call(this.subscriptionTopics, topic)) {
            // new subscription
            this.subscriptionTopics[topic] = [];
        }
        this.subscriptionTopics[topic].push(handler);

        if (this.mqttClient && typeof this.mqttClient.subscribe === "function") {
            this.mqttClient.subscribe(topic, options);
        }
    }

    /**
     * gets the title of the thing
     * @param {Integer} thingId the ID of the thing
     * @param {Function} [onupdate] as function(title) to set the title with
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {Void}  -
     */
    updateTitle (thingId, onupdate, onerror, onstart, oncomplete) {
        const url = this.baseUrlHttp + "/Things(" + thingId + ")";

        return this.http.get(url, (dataset) => {
            if (Array.isArray(dataset) && dataset.length > 0 && Object.prototype.hasOwnProperty.call(dataset[0], "name")) {
                if (typeof onupdate === "function") {
                    onupdate(dataset[0].name);
                }
            }
            else {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.updateTitle: the response does not include a Thing with a proper name", dataset);
            }
        }, onstart, oncomplete, onerror || this.defaultErrorHandler);
    }

    /**
     * gets the description of the thing
     * @param {Integer} thingId the ID of the thing
     * @param {Function} [onupdate] as function(description) to set the description with
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {Void}  -
     */
    updateDescription (thingId, onupdate, onerror, onstart, oncomplete) {
        const url = this.baseUrlHttp + "/Things(" + thingId + ")";

        return this.http.get(url, (dataset) => {
            if (Array.isArray(dataset) && dataset.length > 0 && Object.prototype.hasOwnProperty.call(dataset[0], "description")) {
                if (typeof onupdate === "function") {
                    onupdate(dataset[0].description);
                }
            }
            else {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.updateDescription: the response does not include a Thing with a proper name", dataset);
            }
        }, onstart, oncomplete, onerror || this.defaultErrorHandler);
    }

    /**
     * gets a property of the thing
     * @param {Integer} thingId the ID of the thing
     * @param {String} propertyName the property name to get (should be available under "properties" in the things dataset)
     * @param {Function} [onupdate] as function(operation_start) to set the operation_start with
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {Void}  -
     */
    updateProperty (thingId, propertyName, onupdate, onerror, onstart, oncomplete) {
        const url = this.baseUrlHttp + "/Things(" + thingId + ")";

        return this.http.get(url, (dataset) => {
            if (Array.isArray(dataset) && dataset.length > 0 && Object.prototype.hasOwnProperty.call(dataset[0], "properties") && Object.prototype.hasOwnProperty.call(dataset[0].properties, propertyName)) {
                if (typeof onupdate === "function") {
                    onupdate(dataset[0].properties[propertyName]);
                }
            }
            else {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.updateProperty: the response does not include a property " + propertyName + " of the Thing", dataset);
            }
        }, onstart, oncomplete, onerror || this.defaultErrorHandler);
    }

    /**
     * gets the sum for a single day excluding todays last 5 minutes
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @param {Integer} dayInterval measurement interval on day tab
     * @param {String} day the day as String in format YYYY-MM-DD
     * @param {Function} [onupdate] as event function(date, value) fires initialy and anytime server site changes are made
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {String} [dayTodayOpt=NOW] as a String marking todays date in format YYYY-MM-DD; if left false, today is set automatically
     * @returns {Void}  -
     */
    updateDay (thingId, selects, options, dayInterval, day, onupdate, onerror, onstart, oncomplete, dayTodayOpt) {
        let sum = 0;
        const startDate = moment(day, "YYYY-MM-DD").toISOString(),
            endDate = moment(day, "YYYY-MM-DD").add(1, "day").toISOString(),
            selectString = this.getSelectString(selects),
            url = this.baseUrlHttp + "/Things(" + thingId + ")?$expand=Datastreams($filter=" + selectString + ";$expand=Observations($filter=phenomenonTime ge " + startDate + " and phenomenonTime lt " + endDate + "))";

        return this.http.get(url, (dataset) => {
            if (!this.checkForObservations(dataset)) {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.updateDay: the dataset does not include a datastream with an observation", dataset);
                return;
            }

            sum = this.bucketObservations(dataset, selects, options);

            if (typeof onupdate === "function") {
                onupdate(day, sum);
            }

            // if day equals dayToday: make a mqtt subscription to refresh sum
            if (day !== (dayTodayOpt || moment().format("YYYY-MM-DD"))) {
                return;
            }

            // subscribe via mqtt
            const datastreamId = dataset[0].Datastreams[0]["@iot.id"],
                topic = this.sensorThingsVersion + "/Datastreams(" + datastreamId + ")/Observations";

            // set retain handling rh to 2 to avoid getting the last message from the server, as this message is already included in the server call above (see doc\sensorThings_EN.md)
            this.mqttSubscribe(topic, {rh: 2}, (payload, packet) => {
                if (packet && Object.prototype.hasOwnProperty.call(packet, "retain") && packet.retain === true) {
                    // this message is a retained message, so its content is already in sum
                    return;
                }
                if (payload && Object.prototype.hasOwnProperty.call(payload, "result")) {
                    sum += payload.result;

                    if (typeof onupdate === "function") {
                        onupdate(day, sum);
                    }
                }
                else {
                    (onerror || this.defaultErrorHandler)("SensorChartAPI.updateDay: the payload does not include a result", payload);
                }
            });
        }, onstart, oncomplete, onerror || this.defaultErrorHandler);
    }

    /**
     * gets the speed medium for a single day
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @param {String} day the day as String in format YYYY-MM-DD
     * @param {Function} [onupdate] as event function(date, value) fires initialy and anytime server site changes are made
     * @param {Function} [onerror] as function(error) to fire on error
     * @returns {Void}  -
     */
    updateDaySingle (thingId, selects, options, day, onupdate, onerror) {
        const startDate = moment(day, "YYYY-MM-DD").startOf("day").toISOString(),
            endDate = moment(day, "YYYY-MM-DD").startOf("day").add(1, "day").toISOString(),
            selectString = this.getSelectString(selects),
            url = this.baseUrlHttp + "/Things(" + thingId + ")?$expand=Datastreams($filter=" + selectString + ";$expand=Observations($filter=phenomenonTime ge " + startDate + " and phenomenonTime lt " + endDate + "))";

        // get speed
        return this.http.get(url, (dataset) => {
            if (!this.checkForObservations(dataset)) {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.updateDay: the datasetSpeed does not include a datastream with an observation", dataset);
                return;
            }

            const values = this.bucketSingleValues(dataset, selects, options);

            onupdate(day, values);
        }, null, null, onerror || this.defaultErrorHandler);
    }

    /**
     * gets the sum of a year excluding todays last 5 minutes
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @param {String} year the year as String in format YYYY
     * @param {Function} onupdate as event function(year, value) fires initialy and anytime server site changes are made
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {String} [yearTodayOpt=NOW] as a String marking todays year in format YYYY; if left false, todays year is set automatically
     * @returns {Void}  -
     */
    updateYear (thingId, selects, options, year, onupdate, onerror, onstart, oncomplete, yearTodayOpt) {
        let sumYear = 0;
        const startDate = moment(year, "YYYY").toISOString(),
            endDate = moment(year, "YYYY").add(1, "year").toISOString(),
            lastMidnight = moment().startOf("day").toISOString(),
            yearToday = yearTodayOpt || moment().format("YYYY"),
            selectString = this.getSelectString(selects),
            urlYear = this.baseUrlHttp + "/Things(" + thingId + ")?$expand=Datastreams($filter=" + selectString + ";$expand=Observations($filter=phenomenonTime ge " + startDate + " and phenomenonTime lt " + (year === yearToday ? lastMidnight : endDate) + ";$orderBy=phenomenonTime asc))";

        return this.http.get(urlYear, (datasetYear) => {
            if (!this.checkForObservations(datasetYear)) {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.updateYear: datasetYear does not include a datastream with an observation", datasetYear);
                return;
            }

            sumYear = this.bucketObservations(datasetYear, selects, options);

            if (typeof onupdate === "function") {
                onupdate(year, sumYear);
            }
        }, onstart, year !== yearToday ? oncomplete : false, onerror || this.defaultErrorHandler);
    }

    /**
     * gets the total sum excluding todays last 5 minutes
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {Integer} dayInterval measurement interval on day tab
     * @param {Function} onupdate as event function(firstDate, value) fires initialy and anytime server site changes are made
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {Void}  -
     */
    updateTotal (thingId, meansOfTransport, dayInterval, onupdate, onerror, onstart, oncomplete) {
        let sumWeekly = 0,
            sumThisWeek = 0,
            firstDate = false;
        const lastMonday = moment().startOf("isoWeek").toISOString(),
            urlWeekly = this.baseUrlHttp + "/Things(" + thingId + ")?$expand=Datastreams($filter=properties/layerName eq '" + meansOfTransport + this.layerNameInfix + "_1-Woche';$expand=Observations($filter=phenomenonTime lt " + lastMonday + "))",
            urlThisWeeks5min = this.baseUrlHttp + "/Things(" + thingId + ")?$expand=Datastreams($filter=properties/layerName eq '" + meansOfTransport + this.layerNameInfix + "_" + dayInterval + "';$expand=Observations($filter=phenomenonTime ge " + lastMonday + "))";

        return this.http.get(urlWeekly, (datasetWeekly) => {
            if (!this.checkForObservations(datasetWeekly)) {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.updateTotal: datasetWeekly does not include a datastream with an observation", datasetWeekly);
            }
            sumWeekly = this.sumObservations(datasetWeekly);
            firstDate = this.getFirstDate(datasetWeekly);

            this.http.get(urlThisWeeks5min, (dataset5min) => {
                if (!this.checkForObservations(dataset5min)) {
                    (onerror || this.defaultErrorHandler)("SensorChartAPI.updateTotal: dataset5min does not include a datastream with an observation", dataset5min);
                }
                sumThisWeek = this.sumObservations(dataset5min);
                firstDate = this.getFirstDate(dataset5min, firstDate);

                if (typeof onupdate === "function") {
                    onupdate(moment(firstDate).format("YYYY-MM-DD"), sumWeekly + sumThisWeek);
                }

                // subscribe via mqtt
                const datastreamId = dataset5min[0].Datastreams[0]["@iot.id"],
                    topic = this.sensorThingsVersion + "/Datastreams(" + datastreamId + ")/Observations";

                // set retain to 2 to avoid getting the last message from the server, as this message is already included in the server call above (see doc\sensorThings_EN.md)
                this.mqttSubscribe(topic, {rh: 2}, (payload, packet) => {
                    if (packet && Object.prototype.hasOwnProperty.call(packet, "retain") && packet.retain === true) {
                        // this message is a retained message, so its content is already in sum
                        return;
                    }
                    if (!payload || !Object.prototype.hasOwnProperty.call(payload, "result")) {
                        (onerror || this.defaultErrorHandler)("SensorChartAPI.updateTotal: the payload does not include a result", payload);
                    }
                    sumThisWeek += payload.result;

                    if (typeof onupdate === "function") {
                        onupdate(moment(firstDate).format("YYYY-MM-DD"), sumWeekly + sumThisWeek);
                    }
                });
            }, false, oncomplete, onerror || this.defaultErrorHandler);
        }, onstart, false, onerror || this.defaultErrorHandler);
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
     * @returns {Void}  -
     */
    updateHighestWorkloadDay (thingId, selects, options, year, onupdate, onerror, onstart, oncomplete) {
        const startDate = moment(year, "YYYY").toISOString(),
            endDate = moment(year, "YYYY").add(1, "year").toISOString(),
            selectString = this.getSelectString(selects),
            url = this.baseUrlHttp + "/Things(" + thingId + ")?$expand=Datastreams($filter=" + selectString + ";$expand=Observations($filter=phenomenonTime ge " + startDate + " and phenomenonTime lt " + endDate + ";$orderby=result DESC;$top=1))";

        return this.http.get(url, (dataset) => {
            if (this.checkForObservations(dataset)) {
                const value = this.bucketObservations(dataset, selects, options),
                    dates = this.bucketDates(dataset, selects, options, (date) => moment(date).format("DD.MM."));

                if (typeof onupdate === "function") {
                    onupdate(dates, value);
                }
            }
            else {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.updateHighestWorkloadDay: dataset does not include a datastream with an observation", dataset);
            }
        }, onstart, oncomplete, onerror || this.defaultErrorHandler);
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
     * @returns {Void}  -
     */
    updateHighestWorkloadWeek (thingId, selects, options, year, onupdate, onerror, onstart, oncomplete) {
        const startDate = moment(year, "YYYY").toISOString(),
            endDate = moment(year, "YYYY").add(1, "year").toISOString(),
            selectString = this.getSelectString(selects),
            url = this.baseUrlHttp + "/Things(" + thingId + ")?$expand=Datastreams($filter=" + selectString + ";$expand=Observations($filter=phenomenonTime ge " + startDate + " and phenomenonTime lt " + endDate + ";$orderby=result DESC;$top=1))";

        return this.http.get(url, (dataset) => {
            if (this.checkForObservations(dataset)) {
                const value = this.bucketObservations(dataset, selects, options),
                    dates = this.bucketDates(dataset, selects, options, (date) => "KW " + moment(date).week());

                if (typeof onupdate === "function") {
                    onupdate(dates, value);
                }
            }
            else {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.updateHighestWorkloadWeek: dataset does not include a datastream with an observation", dataset);
            }
        }, onstart, oncomplete, onerror || this.defaultErrorHandler);
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
     * @returns {Void}  -
     */
    updateHighestWorkloadMonth (thingId, selects, options, year, onupdate, onerror, onstart, oncomplete) {
        const startDate = moment(year, "YYYY").toISOString(),
            endDate = moment(year, "YYYY").add(1, "year").toISOString(),
            selectString = this.getSelectString(selects),
            url = this.baseUrlHttp + "/Things(" + thingId + ")?$expand=Datastreams($filter=" + selectString + ";$expand=Observations($filter=phenomenonTime ge " + startDate + " and phenomenonTime lt " + endDate + "))",
            values = {},
            dates = {};
        let month;

        return this.http.get(url, (dataset) => {
            if (this.checkForObservations(dataset)) {

                dataset[0].Datastreams.forEach(datastream => {
                    const sumMonths = {"01": 0};
                    let bestMonth = 0,
                        bestSum = 0,
                        labelString = Object.keys(selects).filter(select => !selects[select].overwritten).filter(select => Array.isArray(selects[select].value) && selects[select].value.length > 1).map((select) => selects[select].description + ": '" + datastream.properties[select] + "'").join(" und ");

                    if (!labelString) {
                        labelString = Object.keys(selects).filter(select => selects[select].isDefaultLabel).map((select) => datastream.properties[select]).join("");
                    }
                    if (!labelString && options.defaultLabel) {
                        labelString = options.defaultLabel;
                    }

                    datastream.Observations.forEach(observation => {
                        if (!Object.prototype.hasOwnProperty.call(observation, "result") || !Object.prototype.hasOwnProperty.call(observation, "phenomenonTime")) {
                            // continue
                            return;
                        }

                        month = moment(this.parsePhenomenonTime(observation.phenomenonTime)).format("MM");
                        if (!Object.prototype.hasOwnProperty.call(sumMonths, month)) {
                            sumMonths[month] = 0;
                        }
                        sumMonths[month] += observation.result;

                        if (sumMonths[month] > bestSum) {
                            bestSum = sumMonths[month];
                            bestMonth = month;
                        }
                    });
                    values[labelString] = bestSum;
                    dates[labelString] = moment(bestMonth, "MM").format("MMMM");
                });

                if (typeof onupdate === "function") {
                    onupdate(dates, values);
                }
            }
            else {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.updateHighestWorkloadMonth: dataset does not include a datastream with an observation", dataset);
            }
        }, onstart, oncomplete, onerror || this.defaultErrorHandler);
    }

    /**
     * gets the data for a diagram or table for the given interval
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects contains the current selected parameter values
     * @param {Object} options contains the default label
     * @param {String} timeSettings configuration
     * @param {String} timeSettings.interval the interval to call as '5-Min', '1-Stunde' or '1-Woche'
     * @param {String} timeSettings.from the day to start from (inclusive) as String in format YYYY-MM-DD
     * @param {String} timeSettings.until the day to end with (inclusive) as String in format YYYY-MM-DD
     * @param {Function} onupdate as event function(data) fires initialy and anytime server site changes are made; with data as object {meansOfTransport: {date: value}}
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @param {String} [todayUntilOpt=NOW] as a String marking todays date in format YYYY-MM-DD; if left false, today is set automatically
     * @returns {Void}  -
     */
    updateDataset (thingId, selects, options, timeSettings, onupdate, onerror, onstart, oncomplete, todayUntilOpt) {
        const from = timeSettings.from,
            until = timeSettings.until,
            startDate = moment(from, "YYYY-MM-DD").toISOString(),
            endDate = moment(until, "YYYY-MM-DD").add(1, "day").toISOString(),
            selectString = this.getSelectString(selects),

            url = this.baseUrlHttp + "/Things(" + thingId + ")?$expand=Datastreams($filter=" + selectString + ";$expand=Observations($filter=phenomenonTime ge " + startDate + " and phenomenonTime le " + endDate + ";$orderby=phenomenonTime asc))",

            result = {},
            todayUntil = todayUntilOpt || moment().format("YYYY-MM-DD");

        let labelString = Object.keys(selects).filter(select => !selects[select].overwritten).filter(select => Array.isArray(selects[select].value) && selects[select].value.length > 1).map((select) => selects[select].description + ": '" + selects[select].value + "'").join(" und ");


        return this.http.get(url, (dataset) => {
            if (this.checkForObservations(dataset)) {
                dataset[0].Datastreams.forEach(datastream => {
                    const dateLabelFrom = moment(from, "YYYY-MM-DD").format("DD.MM.YYYY"),
                        dateLabelUntil = moment(until, "YYYY-MM-DD").format("DD.MM.YYYY"),
                        dateLabel = dateLabelFrom === dateLabelUntil ? dateLabelFrom : dateLabelFrom + " bis " + dateLabelUntil;

                    labelString = Object.keys(selects).filter(select => !selects[select].overwritten).filter(select => Array.isArray(selects[select].value) && selects[select].value.length > 1).map((select) => selects[select].description + ": '" + datastream.properties[select] + "'").join(" und ");

                    if (!labelString) {
                        labelString = Object.keys(selects).filter(select => selects[select].isDefaultLabel).map((select) => datastream.properties[select]).join("");
                    }
                    if (!labelString && options.defaultLabel) {
                        labelString = options.defaultLabel;
                    }
                    labelString += " " + dateLabel;

                    result[labelString] = {};
                    datastream.Observations.forEach(observation => {
                        if (!Object.prototype.hasOwnProperty.call(observation, "result") || !Object.prototype.hasOwnProperty.call(observation, "phenomenonTime")) {
                            // continue
                            return;
                        }

                        const datetime = moment(this.parsePhenomenonTime(observation.phenomenonTime)).format("YYYY-MM-DD HH:mm:ss");

                        result[labelString][datetime] = observation.result;
                    });
                });

                if (typeof onupdate === "function") {
                    onupdate(result);
                }

                if (until >= todayUntil) {
                    // subscribe via mqtt
                    const datastreamId = dataset[0].Datastreams[0]["@iot.id"],
                        topic = this.sensorThingsVersion + "/Datastreams(" + datastreamId + ")/Observations";

                    // set retain to 2 to avoid getting the last message from the server, as this message is already included in the server call above (see doc\sensorThings_EN.md)
                    this.mqttSubscribe(topic, {rh: 2}, (payload, packet) => {
                        if (packet && Object.prototype.hasOwnProperty.call(packet, "retain") && packet.retain === true) {
                            // this message is a retained message, so its content is already in sum
                            return;
                        }
                        if (payload && Object.prototype.hasOwnProperty.call(payload, "result") && Object.prototype.hasOwnProperty.call(payload, "phenomenonTime")) {
                            const datetime = moment(this.parsePhenomenonTime(payload.phenomenonTime)).format("YYYY-MM-DD HH:mm:ss");

                            result[labelString][datetime] = payload.result;

                            if (typeof onupdate === "function") {
                                onupdate(result);
                            }
                        }
                        else {
                            (onerror || this.defaultErrorHandler)("SensorChartAPI.updateDataset: the payload does not include a result", selectString, payload);
                        }
                    });
                }
            }
            else {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.updateDataset: dataset does not include a datastream with an observation", selectString, dataset);
            }
        }, onstart, oncomplete, onerror || this.defaultErrorHandler);
    }

    /**
     * Builds the select String for STA-Request from selected options
     * @param {Object} selects Selected Parameter
     * @returns {string} the URL-Parameter
     */
    getSelectString (selects) {
        return Object.keys(selects).map(
            (select) => Array.isArray(selects[select].value) ?
                "(" + selects[select].value.map(selectValue => "(properties/" + select + " eq '" + selectValue + "')").join(" or ") + ")"
                : "(properties/" + select + " eq '" + selects[select].value + "')"
        ).join(" and ");
    }

    /**
     * subscribes the last change of data based on 5 minutes
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects the choosen parameters
     * @param {Function} [onupdate] as event function(phenomenonTime) fires initialy and anytime server site changes are made
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {Void}  -
     */
    subscribeLastUpdate (thingId, selects, onupdate, onerror, onstart, oncomplete) {
        const selectString = this.getSelectString(selects);
        let url = this.baseUrlHttp + "/Things(" + thingId + ")?$expand=Datastreams";

        if (Object.keys(selects).length > 0) {
            url += "($filter=" + selectString + ")";
        }

        // get the datastreamId via http to subscribe to with mqtt
        return this.http.get(url, (dataset) => {
            if (
                Array.isArray(dataset) && dataset.length > 0 && Object.prototype.hasOwnProperty.call(dataset[0], "Datastreams")
                && Array.isArray(dataset[0].Datastreams) && dataset[0].Datastreams.length > 0 && Object.prototype.hasOwnProperty.call(dataset[0].Datastreams[0], "resultTime")
            ) {
                let resultTime = dataset[0].Datastreams[0].resultTime,
                    datetime = null;
                const idx = resultTime.indexOf("/");

                resultTime = resultTime.slice(idx + 1);
                datetime = moment(resultTime).format("YYYY-MM-DD HH:mm:ss");

                onupdate(datetime);
            }
            /*
            if (
                Array.isArray(dataset) && dataset.length > 0 && dataset[0].hasOwnProperty("Datastreams")
                && Array.isArray(dataset[0].Datastreams) && dataset[0].Datastreams.length > 0 && dataset[0].Datastreams[0].hasOwnProperty("@iot.id")
            ) {
                // subscribe via mqtt
                const datastreamId = dataset[0].Datastreams[0]["@iot.id"],
                    topic = this.sensorThingsVersion + "/Datastreams(" + datastreamId + ")/Observations";

                // set retain to 0 to get the last message from the server immediately (see doc\sensorThings_EN.md)
                this.mqttSubscribe(topic, {rh: 0}, (payload) => {
                    if (payload && Object.prototype.hasOwnProperty.call(payload, "resultTime")) {
                        if (typeof onupdate === "function") {
                            const datetime = moment(payload.resultTime).format("YYYY-MM-DD HH:mm:ss");

                            onupdate(datetime);
                        }
                    }
                    else {
                        (onerror || this.defaultErrorHandler)("SensorChartAPI.subscribeLastUpdate: the payload does not include a resultTime", payload);
                    }
                });
            }
            else {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.subscribeLastUpdate: the response does not include a Datastream with a proper @iot.id", dataset);
            }

             */
        }, onstart, oncomplete, onerror || this.defaultErrorHandler);
    }

    /**
     * unsubscribe all subscriptions that have been made so far by any function of this api
     * @param {Function} [onsuccess] an event function() to fire when all subscriptions have been successfully canceled
     * @returns {Void}  -
     */
    unsubscribeEverything (onsuccess) {
        const topics = Object.keys(this.getSubscriptionTopics());

        this.setSubscriptionTopics({});

        if (this.mqttClient && typeof this.mqttClient.unsubscribe === "function" && Array.isArray(topics) && topics.length > 0) {
            topics.forEach(topic => {
                this.mqttClient.unsubscribe(topic);
            });
        }

        if (typeof onsuccess === "function") {
            onsuccess();
        }
    }

    /**
     * gets the title and the data without subscription for the given thingId, meansOfTransport and timeSettings
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {String} timeSettings time configuration
     * @param {String} timeSettings.interval the interval to call as '5-Min', '1-Stunde' or '1-Woche'
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
        if (typeof onstart === "function") {
            onstart();
        }

        this.updateTitle(thingId, title => {
            this.updateDataset(thingId, meansOfTransport, timeSettings, options, dataset => {
                if (typeof onsuccess === "function") {
                    onsuccess({
                        title: title,
                        data: dataset
                    });
                }
                if (typeof oncomplete === "function") {
                    oncomplete();
                }

                // prohibit subscription by using the last param with a future date for today
            }, onerror, false, false, moment().add(1, "month").format("YYYY-MM-DD"));
        }, onerror);
    }

    /**
     * gets the first date on a weekly basis ever recorded without subscription
     * @param {Integer} thingId the ID of the thing
     * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
     * @param {Function} onsuccess as event function(firstDate) fires once
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {Void}  -
     */
    getFirstDateEver (thingId, meansOfTransport, onsuccess, onerror, onstart, oncomplete) {
        const urlWeekly = this.baseUrlHttp + "/Things(" + thingId + ")?$expand=Datastreams($filter=properties/layerName eq '" + meansOfTransport + this.layerNameInfix + "_1-Woche';$expand=Observations)";

        return this.http.get(urlWeekly, (datasetWeekly) => {
            if (!this.checkForObservations(datasetWeekly)) {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.getFirstDate: datasetWeekly does not include a datastream with an observation", datasetWeekly);
                return;
            }

            if (typeof onsuccess === "function") {
                onsuccess(this.getFirstDate(datasetWeekly));
            }
        }, onstart, oncomplete, onerror || this.defaultErrorHandler);
    }

    /**
     * gets units of measurement
     * @param {Integer} thingId the ID of the thing
     * @param {Object} selects the choosen parameters
     * @param {String} interval the interval ("5-Min", "1-Tag", "1-Woche")
     * @param {Function} onsuccess as event function(firstDate) fires once
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {Void}  -
     */
    getUnitOfMeasurement (thingId, selects, interval, onsuccess, onerror, onstart, oncomplete) {
        const selectString = this.getSelectString(selects),
            url = this.baseUrlHttp + "/Things(" + thingId + ")?$expand=Datastreams($filter=" + selectString + ")";

        return this.http.get(url, (dataset) => {
            if (!this.checkForUnits(dataset)) {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.getUnitOfMeasurement: dataset does not include a datastream with an unitOfMeasurement", dataset);
                return;
            }
            if (typeof onsuccess === "function") {
                onsuccess(dataset[0].Datastreams[0].unitOfMeasurement);
            }
        }, onstart, oncomplete, onerror || this.defaultErrorHandler);
    }

    /**
     * gets base datastreams
     * @param {Integer} thingId the ID of the thing
     * @param {String} interval the interval ("5-Min", "1-Tag", "1-Woche")
     * @param {Function} onsuccess as event function(firstDate) fires once
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {Void}  -
     */
    getBaseDataStreams (thingId, interval, onsuccess, onerror, onstart, oncomplete) {
        const url = this.baseUrlHttp + "/Things(" + thingId + ")/Datastreams?$filter=properties/periodLength eq '" + interval + "'";

        return this.http.get(url, (datastreams) => {
            if (!datastreams) {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.getBaseDataStreams: no Datastreams found!", datastreams);
                return;
            }
            if (typeof onsuccess === "function") {
                onsuccess(datastreams);
            }
        }, onstart, oncomplete, onerror || this.defaultErrorHandler);
    }

    /**
     * gets base datastreams
     * @param {Integer} thingId the ID of the thing
     * @param {Function} onsuccess as event function(firstDate) fires once
     * @param {Function} [onerror] as function(error) to fire on error
     * @param {Function} [onstart] as function() to fire before any async action has started
     * @param {Function} [oncomplete] as function() to fire after every async action no matter what
     * @returns {Void}  -
     */
    getDataStreams (thingId, onsuccess, onerror, onstart, oncomplete) {
        const url = this.baseUrlHttp + "/Things(" + thingId + ")/Datastreams?$orderBy=@iot.id";

        return this.http.get(url, (datastreams) => {
            if (!datastreams) {
                (onerror || this.defaultErrorHandler)("SensorChartAPI.getBaseDataStreams: no Datastreams found!", datastreams);
                return;
            }
            if (typeof onsuccess === "function") {
                onsuccess(datastreams);
            }
        }, onstart, oncomplete, onerror || this.defaultErrorHandler);
    }

    /**
     * gets the subscribed topics
     * @returns {Object}  an object {topic => [callback(payload)]} with all subscriptions
     */
    getSubscriptionTopics () {
        return this.subscriptionTopics;
    }

    /**
     * sets the subscribed topics
     * @info this is for the purpose of testing
     * @param {Object} object an object {topic => [callback(payload)]} with all subscriptions
     * @returns {Void}  -
     */
    setSubscriptionTopics (object) {
        this.subscriptionTopics = object;
    }

    /**
     * gets the base url for http calls
     * @returns {String}  the used base url vor http calls
     */
    getBaseUrlHttp () {
        return this.baseUrlHttp;
    }

    /**
     * gets the on construction initialized mqtt client
     * @returns {Object}  the mqtt client
     */
    getMqttClient () {
        return this.mqttClient;
    }

    /**
     * gets the on construction initialized http connector
     * @returns {Object}  the SensorThingsHttp
     */
    getSensorThingsHttp () {
        return this.http;
    }

    /**
     * gets the layerName infix (this is used for testing)
     * @returns {String}  the currently used layerName infix
     */
    getLayerNameInfix () {
        return this.layerNameInfix;
    }
}

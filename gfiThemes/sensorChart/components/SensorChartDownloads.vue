<script>
import moment from "moment";
import ExportButtonModel from "../snippets/exportButton/model";
import ExportButtonView from "../snippets/exportButton/view";

export default {
    name: "SensorChartDownloads",
    props: {
        /**
         * the array as it comes from the api
         * e.g. [{bikes: {date: value}}]
         */
        apiData: {
            type: Array,
            required: true
        },
        label: {
            type: String,
            required: true
        },

        /**
         * the title of the table - this is the top left field
         */
        setTableTitle: {
            type: Function,
            required: true
        },
        /**
         * a function to create the title of a column, the given values are only from the first line
         * if you need to differ between datasets, use a second and third table instead
         * @param {String} date the date of the first dataset for this column
         * @return {String}  the title of the column - use param date and e.g. moment to create your title
         */
        setColTitle: {
            type: Function,
            required: true
        },
        /**
         * a function to create the row title
         * @param {String} key the dataset key of this row (e.g. car)
         * @param {Object} dataset the dataset of this row as Object{date: value}
         * @return {String}  the row title - use the key and date from dataset to create your title
         */
        setRowTitle: {
            type: Function,
            required: true
        },
        /**
         * a function to manipulate the value of a table field
         * @param {String|null} value the value of the field - this may be null if no data was given
         * @return {String}  the new value of the field
         */
        setFieldValue: {
            type: Function,
            required: true
        }
    },
    data () {
        return {
            customStyle: {},
            lastUpdate: "",
            // dayInterval: "5-Min",
            dayInterval: this.motDayInterval,
            weekInterval: "1-Tag",
            yearInterval: "1-Woche",
            exportModel: new ExportButtonModel({
                tag: "Download CSV",
                rawData: [],
                fileExtension: "csv"
            })
        };
    },
    computed: {
        exportView: function () {
            return new ExportButtonView({
                model: this.exportModel
            });
        },

        exportButtonTemplate: function () {
            return this.exportView.render().el;
        }
    },
    methods: {

        /**
         * a very special function to grap the first dataset of the first dataObj from the given apiData
         * @param {Object[]} apiDataRef an array of data, e.g. [{bikes: {date: valueBike}, cars: {date: valueCar}}]
         * @returns {Object}  the first dataset of the first dataObj, e.g. {date: valueBike}
         */
        getFirstDataset (apiDataRef) {
            if (!Array.isArray(apiDataRef) || apiDataRef.length === 0) {
                return {};
            }

            const keys = Object.keys(apiDataRef[0]);

            if (keys.length === 0) {
                return {};
            }

            return apiDataRef[0][keys[0]];
        },
        /**
         * returns the first key in an object
         * @param {Object} obj the object
         * @returns {String|Boolean}  the first key or false if no key was found
         */
        getFirstKeyOfObject (obj) {
            if (typeof obj !== "object" || obj === null) {
                return false;
            }

            const keys = Object.keys(obj);

            if (keys.length === 0) {
                return false;
            }

            return keys[0];
        },
        /**
         * flattens the given apiData by pushing keys and datasets into a new Object{key, dataset}
         * @param {Object[]} apiDataRef an array of data, e.g. [{bikes: {date: valueBike1}}, {bikes: {date: valueBike2}}]
         * @returns {Object[]}  an array of Object{key, dataset}, e.g. [{key: "bikes", dataset: {date: valueBike1}}, {key: "bikes", dataset: {date: valueBike2}}]
         */
        getFlatApiData (apiDataRef) {
            if (!Array.isArray(apiDataRef) || apiDataRef.length === 0) {
                return [];
            }

            const result = [];
            let key = null;

            apiDataRef.forEach(dataObj => {
                for (key in dataObj) {
                    result.push({
                        key,
                        dataset: dataObj[key]
                    });
                }
            });

            return result;
        },

        /**
         * updates the downloads of the sensorChart gfi
         * @param {Function} oncomplete callback function
         * @post the downloads is updated to show the identified tab
         * @returns {Void}  -
         */
        updateDownloads: function (oncomplete) {
            const result = this.prepareDataForDownload(this.apiData);

            this.exportModel.set("rawData", result);
            // this.exportModel.set("tag", "Download CSV");
            this.exportModel.set("filename", "export");


            this.exportModel.set("disabled", false);
            oncomplete();
        },

        /**
         * gets the download data for the last 7 days for the given thingId and meansOfTransport
         * @param {Integer} thingId the ID of the thing
         * @param {String} meansOfTransport the transportation as 'Anzahl_Fahrraeder' or 'Anzahl_Kfz'
         * @param {Function} onsuccess as event function(result) with result{title, dataset} and dataset{meansOfTransport: {date: value}}; fired once on success (no subscription)
         * @param {Function} [onerror] as function(error) to fire on error
         * @param {Function} [onstart] as function() to fire before any async action has started
         * @param {Function} [oncomplete] as function() to fire after every async action no matter what
         * @returns {Void}  -
         */
        downloadDataDay: function (thingId, meansOfTransport, onsuccess, onerror, onstart, oncomplete) {
            const api = this.api,
                timeSet = {
                    interval: this.dayInterval,
                    from: moment().subtract(7, "days").format("YYYY-MM-DD"),
                    until: moment().format("YYYY-MM-DD")
                };

            api.downloadData(thingId, meansOfTransport, {defaultLabel: this.label}, timeSet, onsuccess, onerror, onstart, oncomplete);
        },

        /**
         * converts the data object into an array of objects for the csv download
         * @param {Object} data - the data for download
         * @param {String} tabValue - day | week | year
         * @returns {Object[]} objArr - converted data
         */
        prepareDataForDownload: function (data) {
            const objs = {};

            data.forEach(dataset => {
                Object.keys(dataset).forEach(label => {
                    Object.keys(dataset[label]).forEach(key => {
                        if (objs[key]) {
                            objs[key][this.removeDateFromLabel(label)] = dataset[label][key];
                        }
                        else {
                            const obj = {},
                                date = key.split(" ");

                            obj.Datum = date[0];
                            obj.Uhrzeit = date[1].slice(0, -3);
                            // obj.Anzahl = data[key];
                            obj[this.removeDateFromLabel(label)] = dataset[label][key] !== null ? dataset[label][key] : "";
                            objs[key] = obj;
                        }
                    });
                });
            });

            return Object.entries(objs).sort((a, b) => a[0].localeCompare(b[0])).map(entry => entry[1]);
        },

        removeDateFromLabel: function (label) {
            if (label.match(/.* \d{2}\.\d{2}\.\d{4} bis \d{2}\.\d{2}\.\d{4}/)) {
                return label.substring(0, label.length - 26);
            }
            else if (label.match(/.* \d{2}\.\d{2}\.\d{4}/)) {
                return label.substring(0, label.length - 11);
            }
            return label;
        },

        /**
         * trigger the export function from snippet exportButton
         * @returns {Void}  -
         */
        exportFile: function () {
            this.updateDownloads(() => this.exportView.export());
        },

        /**
         * setter for lastUpdate
         * @param {String} value the datetime of the last update to be shown in the template
         * @returns {Void}  -
         */
        setLastUpdate: function (value) {
            this.lastUpdate = value;
        }
    }
};
</script>

<template>
    <div>
        <div
            :id="`DownloadButton`"
            class="button-container"
            @click="exportFile"
            @keydown.enter="exportFile"
            v-html="exportButtonTemplate.innerHTML"
        />
    </div>
</template>

<style lang="scss" scoped>

.button-container {
  margin: 20px 5px;
}

</style>

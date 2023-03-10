<script>
import moment from "moment";
import thousandsSeparator from "../../../../src/utils/thousandsSeparator";


export default {
    name: "SensorChartInfo",
    props: {
        label: {
            type: String,
            required: true
        },
        api: {
            type: Object,
            required: true
        },
        motType: {
            type: String,
            required: true
        },
        motDayInterval: {
            type: String,
            required: false,
            default: "5-min"
        },
        thingId: {
            type: Number,
            required: true
        },
        selects: {
            type: Object,
            required: true
        },
        infoSelects: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            totalDesc: "",
            totalValue: "",
            totalMediumToday: "",
            totalMediumYesterday: "",
            totalMediumTwoDaysAgo: "",
            descToday: "",
            descYesterday: "",
            descTwoDaysAgo: "",
            thisYearDesc: "",
            thisYearValue: "",
            lastYearDesc: "",
            lastYearValue: "",
            lastDayDesc: "",
            lastDayValue: "",
            highestWorkloadDayDesc: "",
            highestWorkloadDayValue: "",
            highestWorkloadWeekDesc: "",
            highestWorkloadWeekValue: "",
            highestWorkloadMonthDesc: "",
            highestWorkloadMonthValue: "",
            dayInterval: this.motDayInterval
        };
    },
    computed: {
        period: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.period");
        },

        number: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.number");
        },

        intersectionToday: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.intersectionToday");
        },

        intersectionYesterday: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.intersectionYesterday");
        },

        intersectionTwoDaysAgo: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.intersectionTwoDaysAgo");
        },

        medium: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.medium");
        },

        totalSince: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.totalSince");
        },

        sinceBeginningOfTheYear: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.sinceBeginningOfTheYear");
        },

        overThePastYear: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.overThePastYear");
        },

        onThePreviousDay: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.onThePreviousDay");
        },

        highestDay: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.highestDay");
        },

        highestWeek: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.highestWeek");
        },

        highestMonth: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.highestMonth");
        },

        calendarweek: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.calendarweek");
        }
    },
    watch: {
        // When the gfi window switched with arrow, the new data will be fetched from api
        thingId: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    if (Object.prototype.hasOwnProperty.call(this.selects, "name")) {
                        this.setupTabInfo(this.api, newVal, this.selects, this.dayInterval);
                    }
                }
            }
        },
        selects: {
            handler (newVal) {
                this.setupTabInfo(this.api, this.thingId, newVal, this.dayInterval);
            }
        }
    },
    mounted: function () {
        if (Object.prototype.hasOwnProperty.call(this.infoSelects, "day")) {
            this.setupTabInfo(this.api, this.thingId, this.selects, this.dayInterval);
        }
    },
    methods: {
        /**
         * setup of the info tab
         * @param {Object} api instance of SensorChartApi
         * @param {String} thingId the thingId to be send to any api call
         * @param {String} selects the meansOfTransport to be send with any api call
         * @param {Integer} dayInterval measurement interval on day tab
         * @fires   Alerting#RadioTriggerAlertAlert
         * @returns {Void}  -
         */
        setupTabInfo: function (api, thingId, selects, dayInterval) {
            const daySelects = {...selects},
                weekSelects = {...selects},
                monthSelects = {...selects},
                yearSelects = {...selects};

            Object.keys(this.infoSelects.day).forEach(select => {
                daySelects[select] = {...daySelects[select]};
                daySelects[select].value = this.infoSelects.day[select];
            });

            Object.keys(this.infoSelects.week).forEach(select => {
                weekSelects[select] = {...weekSelects[select]};
                weekSelects[select].value = this.infoSelects.week[select];
            });

            Object.keys(this.infoSelects.month).forEach(select => {
                monthSelects[select] = {...monthSelects[select]};
                monthSelects[select].value = this.infoSelects.month[select];
            });

            Object.keys(this.infoSelects.year).forEach(select => {
                yearSelects[select] = {...yearSelects[select]};
                yearSelects[select].value = this.infoSelects.year[select];
            });

            // SPEED
            if (this.motType === "speed") {
                // update day speed medium today
                api.updateDaySpeedMedium(thingId, selects, selects.replace("Geschwindigkeit", "Anzahl"), dayInterval, moment().format("YYYY-MM-DD"), (date, value) => {
                    this.setDescToday(moment().format("dd Do MM YYYY"));
                    this.setTotalMediumToday(thousandsSeparator(value));
                }, errormsg => {
                    this.setDescToday("(nicht empfangen)");
                    this.setTotalMediumToday("(nicht empfangen)");
                    console.warn("The last update today is incomplete:", errormsg);
                });

                // update day speed medium yesterday
                api.updateDaySpeedMedium(thingId, selects, selects.replace("Geschwindigkeit", "Anzahl"), dayInterval, moment().subtract(1, "days").format("YYYY-MM-DD"), (date, value) => {
                    this.setDescYesterday(moment().subtract(1, "days").format("dd Do MM YYYY"));
                    this.setTotalMediumYesterday(thousandsSeparator(value));
                }, errormsg => {
                    this.setDescYesterday("(nicht empfangen)");
                    this.setTotalMediumYesterday("(nicht empfangen)");
                    console.warn("The last update last day is incomplete:", errormsg);
                });

                // update day speed medium two days ago
                api.updateDaySpeedMedium(thingId, selects, selects.replace("Geschwindigkeit", "Anzahl"), dayInterval, moment().subtract(2, "day").format("YYYY-MM-DD"), (date, value) => {
                    this.setDescTwoDaysAgo(moment().subtract(2, "days").format("dd Do MM YYYY"));
                    this.setTotalMediumTwoDaysAgo(thousandsSeparator(value));
                }, errormsg => {
                    this.setDescTwoDaysAgo("(nicht empfangen)");
                    this.setTotalMediumTwoDaysAgo("(nicht empfangen)");
                    console.warn("The last update two days ago is incomplete:", errormsg);
                });

            }
            else {
                api.updateYear(thingId, yearSelects, moment().format("YYYY"), (year, value) => {
                    this.setThisYearDesc(typeof year === "string" ? "01.01." + year : "");
                    this.setThisYearValue(thousandsSeparator(value));
                }, errormsg => {
                    this.setThisYearDesc("(nicht");
                    this.setThisYearValue("empfangen)");
                    console.warn("The last update year is incomplete:", errormsg);
                    Radio.trigger("Alert", "alert", {
                        content: "Der Wert für \"seit Jahresbeginn\" wurde wegen eines API-Fehlers nicht empfangen.",
                        category: "Info"
                    });
                });

                api.updateYear(thingId, yearSelects, moment().subtract(1, "year").format("YYYY"), (year, value) => {
                    this.setLastYearDesc(typeof year === "string" ? year : "");
                    this.setLastYearValue(thousandsSeparator(value));
                }, errormsg => {
                    this.setLastYearDesc("(nicht");
                    this.setLastYearValue("empfangen)");
                    console.warn("The last update last year is incomplete:", errormsg);
                    Radio.trigger("Alert", "alert", {
                        content: "Der Wert für \"im Vorjahr\" wurde wegen eines API-Fehlers nicht empfangen.",
                        category: "Info"
                    });
                });

                api.updateDay(thingId, daySelects, dayInterval, moment().subtract(1, "day").format("YYYY-MM-DD"), (date, value) => {
                    this.setLastDayDesc(typeof date === "string" ? moment(date, "YYYY-MM-DD").format("DD.MM.YYYY") : "");
                    this.setLastDayValue(thousandsSeparator(value));
                }, errormsg => {
                    this.setLastDayDesc("(nicht");
                    this.setLastDayValue("empfangen)");
                    console.warn("The last update last day is incomplete:", errormsg);
                    Radio.trigger("Alert", "alert", {
                        content: "Der Wert für \"am Vortag\" wurde wegen eines API-Fehlers nicht empfangen.",
                        category: "Info"
                    });
                });

                api.updateHighestWorkloadDay(thingId, daySelects, moment().format("YYYY"), (date, value) => {
                    this.setHighestWorkloadDayDesc(typeof date === "string" ? moment(date, "YYYY-MM-DD").format("DD.MM.YYYY") : "");
                    this.setHighestWorkloadDayValue(thousandsSeparator(value));
                }, errormsg => {
                    this.setHighestWorkloadDayDesc("(nicht");
                    this.setHighestWorkloadDayValue("empfangen)");
                    console.warn("The last update HighestWorkloadDay is incomplete:", errormsg);
                    Radio.trigger("Alert", "alert", {
                        content: "Der Wert für \"Stärkster Tag im Jahr\" wurde wegen eines API-Fehlers nicht empfangen.",
                        category: "Info"
                    });
                });

                api.updateHighestWorkloadWeek(thingId, weekSelects, moment().format("YYYY"), (calendarWeek, value) => {
                    this.setHighestWorkloadWeekDesc(!isNaN(calendarWeek) || typeof calendarWeek === "string" ? this.calendarweek + " " + calendarWeek : "");
                    this.setHighestWorkloadWeekValue(thousandsSeparator(value));
                }, errormsg => {
                    this.setHighestWorkloadWeekDesc("(nicht");
                    this.setHighestWorkloadWeekValue("empfangen)");
                    console.warn("The last update HighestWorkloadWeek is incomplete:", errormsg);
                    Radio.trigger("Alert", "alert", {
                        content: "Der Wert für \"Stärkste Woche im Jahr\" wurde wegen eines API-Fehlers nicht empfangen.",
                        category: "Info"
                    });
                });

                api.updateHighestWorkloadMonth(thingId, monthSelects, moment().format("YYYY"), (month, value) => {
                    this.setHighestWorkloadMonthDesc(typeof month === "string" ? month : "");
                    this.setHighestWorkloadMonthValue(thousandsSeparator(value));
                }, errormsg => {
                    this.setHighestWorkloadMonthDesc("(nicht");
                    this.setHighestWorkloadMonthValue("empfangen)");
                    console.warn("The last update HighestWorkloadMonth is incomplete:", errormsg);
                    Radio.trigger("Alert", "alert", {
                        content: "Der Wert für \"Stärkster Monat im Jahr\" wurde wegen eines API-Fehlers nicht empfangen.",
                        category: "Info"
                    });
                });

            }
        },

        /**
         * setter for the value of total
         * @param {String} value the value
         * @returns {Void}  -
         */
        setTotalValue: function (value) {
            this.totalValue = value;
        },

        /**
         * setter for the description of total
         * @param {String} value the description
         * @returns {Void}  -
         */
        setTotalDesc: function (value) {
            this.totalDesc = value;
        },

        /**
         * setter for the description of Today
         * @param {String} value the description
         * @returns {Void}  -
         */
        setDescToday: function (value) {
            this.descToday = value;
        },

        /**
         * setter for the total medium of today
         * @param {String} value the value
         * @returns {Void}  -
         */
        setTotalMediumToday: function (value) {
            this.totalMediumToday = value;
        },

        /**
         * setter for the description of Yesterday
         * @param {String} value the description
         * @returns {Void}  -
         */
        setDescYesterday: function (value) {
            this.descYesterday = value;
        },

        /**
         * setter for the total medium of yesterday
         * @param {String} value the value
         * @returns {Void}  -
         */
        setTotalMediumYesterday: function (value) {
            this.totalMediumYesterday = value;
        },

        /**
         * setter for the description of Two Days Ago
         * @param {String} value the description
         * @returns {Void}  -
         */
        setDescTwoDaysAgo: function (value) {
            this.descTwoDaysAgo = value;
        },

        /**
         * setter for the total medium of two days ago
         * @param {String} value the value
         * @returns {Void}  -
         */
        setTotalMediumTwoDaysAgo: function (value) {
            this.totalMediumTwoDaysAgo = value;
        },

        /**
         * setter for the description of thisYearDesc
         * @param {String} value the description
         * @returns {Void}  -
         */
        setThisYearDesc: function (value) {
            this.thisYearDesc = value;
        },

        /**
         * setter for the value of thisYearValue
         * @param {String} value the value
         * @returns {Void}  -
         */
        setThisYearValue: function (value) {
            this.thisYearValue = value;
        },

        /**
         * setter for the description of lastYearDesc
         * @param {String} value the description
         * @returns {Void}  -
         */
        setLastYearDesc: function (value) {
            this.lastYearDesc = value;
        },

        /**
         * setter for the value of lastYearValue
         * @param {String} value the value
         * @returns {Void}  -
         */
        setLastYearValue: function (value) {
            this.lastYearValue = value;
        },

        /**
         * setter for the description of lastDayDesc
         * @param {String} value the description
         * @returns {Void}  -
         */
        setLastDayDesc: function (value) {
            this.lastDayDesc = value;
        },

        /**
         * setter for the value of lastDayValue
         * @param {String} value the value
         * @returns {Void}  -
         */
        setLastDayValue: function (value) {
            this.lastDayValue = value;
        },

        /**
         * setter for the description of highestWorkloadDayDesc
         * @param {String} value the description
         * @returns {Void}  -
         */
        setHighestWorkloadDayDesc: function (value) {
            this.highestWorkloadDayDesc = value;
        },

        /**
         * setter for the value of highestWorkloadDayValue
         * @param {String} value the value
         * @returns {Void}  -
         */
        setHighestWorkloadDayValue: function (value) {
            this.highestWorkloadDayValue = value;
        },

        /**
         * setter for the description of highestWorkloadWeekDesc
         * @param {String} value the description
         * @returns {Void}  -
         */
        setHighestWorkloadWeekDesc: function (value) {
            this.highestWorkloadWeekDesc = value;
        },

        /**
         * setter for the value of highestWorkloadWeekValue
         * @param {String} value the value
         * @returns {Void}  -
         */
        setHighestWorkloadWeekValue: function (value) {
            this.highestWorkloadWeekValue = value;
        },

        /**
         * setter for the description of highestWorkloadMonthDesc
         * @param {String} value the description
         * @returns {Void}  -
         */
        setHighestWorkloadMonthDesc: function (value) {
            this.highestWorkloadMonthDesc = value;
        },

        /**
         * setter for the value of highestWorkloadMonthValue
         * @param {String} value the value
         * @returns {Void}  -
         */
        setHighestWorkloadMonthValue: function (value) {
            this.highestWorkloadMonthValue = value;
        }
    }
};
</script>

<template>
    <div
        id="infos"
        class="infos"
    >
        <div
            id="sensorchart-info-table"
            class="padded"
        >
            <table class="table table-hover table-striped">
                <tbody v-if="motType === 'speed'">
                    <tr>
                        <td class="bold">
&nbsp;
                        </td>
                        <td class="bold">
                            {{ period }}
                        </td>
                        <td class="bold">
                            {{ medium }}
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ intersectionToday }}
                        </td>
                        <td>{{ descToday }}</td>
                        <td class="bold">
                            {{ totalMediumToday }}
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ intersectionYesterday }}
                        </td>
                        <td>{{ descYesterday }}</td>
                        <td class="bold">
                            {{ totalMediumYesterday }}
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ intersectionTwoDaysAgo }}
                        </td>
                        <td>{{ descTwoDaysAgo }}</td>
                        <td class="bold">
                            {{ totalMediumTwoDaysAgo }}
                        </td>
                    </tr>
                </tbody>
                <tbody v-else>
                    <tr>
                        <td class="bold">
&nbsp;
                        </td>
                        <td class="bold">
                            {{ period }}
                        </td>
                        <td class="bold">
                            {{ number }}
                        </td>
                    </tr><!--
                    <tr>
                        <td class="bold">{{ totalSince }}</td>
                        <td>{{ totalDesc }}</td>
                        <td class="bold">{{ totalValue }}</td>
                    </tr>-->
                    <tr>
                        <td class="bold">
                            {{ sinceBeginningOfTheYear }}
                        </td>
                        <td>{{ thisYearDesc }}</td>
                        <td class="bold">
                            {{ thisYearValue }}
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ overThePastYear }}
                        </td>
                        <td>{{ lastYearDesc }}</td>
                        <td class="bold">
                            {{ lastYearValue }}
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ onThePreviousDay }}
                        </td>
                        <td>{{ lastDayDesc }}</td>
                        <td class="bold">
                            {{ lastDayValue }}
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ highestDay }}
                        </td>
                        <td>{{ highestWorkloadDayDesc }}</td>
                        <td class="bold">
                            {{ highestWorkloadDayValue }}
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ highestWeek }}
                        </td>
                        <td>{{ highestWorkloadWeekDesc }}</td>
                        <td class="bold">
                            {{ highestWorkloadWeekValue }}
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ highestMonth }}
                        </td>
                        <td>{{ highestWorkloadMonthDesc }}</td>
                        <td class="bold">
                            {{ highestWorkloadMonthValue }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #sensorchart-info-table {
        h1 {margin-top:20px;}
        table {
            margin: 0;
            tbody {
                tr:first-child {
                    td {
                        text-align: right;
                    }
                }
            }
            td {
                text-align: right;
                width: 20%;
            }
             td:first-child{
                 text-align: left;
                 width: 65%;
             }
             td:last-child{
                 width: 15%;
             }
        }
}
</style>

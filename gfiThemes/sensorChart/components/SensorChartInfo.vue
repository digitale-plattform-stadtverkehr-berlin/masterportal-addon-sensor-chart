<script>
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import thousandsSeparator from "../../../../src/shared/js/utils/thousandsSeparator.js";

dayjs.extend(advancedFormat);

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
            dayInterval: this.motDayInterval,
            motType: "",
            isSingleValueMode: false
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
                if (this.infoSelects.day) {
                    this.setupTabInfo(this.api, this.thingId, newVal, this.dayInterval);
                }
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

            this.isSingleValueMode = this.checkSingleValue(selects);

            Object.keys(this.infoSelects.day).forEach(select => {
                daySelects[select] = {...daySelects[select]};
                daySelects[select].value = this.infoSelects.day[select];
                daySelects[select].overwritten = true;
            });

            Object.keys(this.infoSelects.week).forEach(select => {
                weekSelects[select] = {...weekSelects[select]};
                weekSelects[select].value = this.infoSelects.week[select];
                weekSelects[select].overwritten = true;
            });

            Object.keys(this.infoSelects.month).forEach(select => {
                monthSelects[select] = {...monthSelects[select]};
                monthSelects[select].value = this.infoSelects.month[select];
                monthSelects[select].overwritten = true;
            });

            Object.keys(this.infoSelects.year).forEach(select => {
                yearSelects[select] = {...yearSelects[select]};
                yearSelects[select].value = this.infoSelects.year[select];
                yearSelects[select].overwritten = true;
            });

            // SPEED
            if (this.isSingleValueMode) {
                // update day speed medium today
                api.updateDaySingle(thingId, daySelects, {defaultLabel: this.label}, dayjs().format("YYYY-MM-DD"), (date, values) => {

                    Object.keys(values).forEach(label => {
                        values[label] = thousandsSeparator(values[label]);
                    });
                    this.setDescToday(dayjs().format("dd Do MM YYYY"));
                    this.setTotalMediumToday(values);
                }, errormsg => {
                    this.setDescToday({"(nicht empfangen)": "(nicht empfangen)"});
                    this.setTotalMediumToday({"(nicht empfangen)": "(nicht empfangen)"});
                    console.warn("The last update today is incomplete:", errormsg);
                });
                api.updateDaySingle(thingId, daySelects, {defaultLabel: this.label}, dayjs().subtract(1, "days").format("YYYY-MM-DD"), (date, values) => {

                    Object.keys(values).forEach(label => {
                        values[label] = thousandsSeparator(values[label]);
                    });
                    this.setDescYesterday(dayjs().format("dd Do MM YYYY"));
                    this.setTotalMediumYesterday(values);
                }, errormsg => {
                    this.setDescYesterday({"(nicht empfangen)": "(nicht empfangen)"});
                    this.setTotalMediumYesterday({"(nicht empfangen)": "(nicht empfangen)"});
                    console.warn("The last update today is incomplete:", errormsg);
                });
                api.updateDaySingle(thingId, daySelects, {defaultLabel: this.label}, dayjs().subtract(2, "days").format("YYYY-MM-DD"), (date, values) => {

                    Object.keys(values).forEach(label => {
                        values[label] = thousandsSeparator(values[label]);
                    });
                    this.setDescTwoDaysAgo(dayjs().format("dd Do MM YYYY"));
                    this.setTotalMediumTwoDaysAgo(values);
                }, errormsg => {
                    this.setDescTwoDaysAgo({"(nicht empfangen)": "(nicht empfangen)"});
                    this.setTotalMediumTwoDaysAgo({"(nicht empfangen)": "(nicht empfangen)"});
                    console.warn("The last update today is incomplete:", errormsg);
                });
            }
            else {
                api.updateYear(thingId, yearSelects, {defaultLabel: this.label}, dayjs().format("YYYY"), (year, values) => {
                    this.setThisYearDesc(typeof year === "string" ? "01.01." + year : "");
                    Object.keys(values).forEach(label => {
                        values[label] = thousandsSeparator(values[label]);
                    });
                    this.setThisYearValue(values);
                }, errormsg => {
                    this.setThisYearDesc({"(nicht empfangen)": "(nicht empfangen)"});
                    this.setThisYearValue({"(nicht empfangen)": "(nicht empfangen)"});
                    console.warn("The last update year is incomplete:", errormsg);
                    Radio.trigger("Alert", "alert", {
                        content: "Der Wert für \"seit Jahresbeginn\" wurde wegen eines API-Fehlers nicht empfangen.",
                        category: "Info"
                    });
                });

                api.updateYear(thingId, yearSelects, {defaultLabel: this.label}, dayjs().subtract(1, "year").format("YYYY"), (year, values) => {
                    this.setLastYearDesc(typeof year === "string" ? year : "");
                    Object.keys(values).forEach(label => {
                        values[label] = thousandsSeparator(values[label]);
                    });
                    this.setLastYearValue(values);
                }, errormsg => {
                    this.setLastYearDesc({"(nicht empfangen)": "(nicht empfangen)"});
                    this.setLastYearValue({"(nicht empfangen)": "(nicht empfangen)"});
                    console.warn("The last update last year is incomplete:", errormsg);
                    Radio.trigger("Alert", "alert", {
                        content: "Der Wert für \"im Vorjahr\" wurde wegen eines API-Fehlers nicht empfangen.",
                        category: "Info"
                    });
                });

                api.updateDay(thingId, daySelects, {defaultLabel: this.label}, dayInterval, dayjs().subtract(1, "day").format("YYYY-MM-DD"), (date, values) => {
                    this.setLastDayDesc(typeof date === "string" ? dayjs(date, "YYYY-MM-DD").format("DD.MM.YYYY") : "");
                    Object.keys(values).forEach(label => {
                        values[label] = thousandsSeparator(values[label]);
                    });
                    this.setLastDayValue(values);
                }, errormsg => {
                    this.setLastDayDesc({"(nicht empfangen)": "(nicht empfangen)"});
                    this.setLastDayValue({"(nicht empfangen)": "(nicht empfangen)"});
                    console.warn("The last update last day is incomplete:", errormsg);
                    Radio.trigger("Alert", "alert", {
                        content: "Der Wert für \"am Vortag\" wurde wegen eines API-Fehlers nicht empfangen.",
                        category: "Info"
                    });
                });

                api.updateHighestWorkloadDay(thingId, daySelects, {defaultLabel: this.label}, dayjs().format("YYYY"), (dates, values) => {
                    this.setHighestWorkloadDayDesc(dates);
                    Object.keys(values).forEach(label => {
                        values[label] = thousandsSeparator(values[label]);
                    });
                    this.setHighestWorkloadDayValue(values);
                }, errormsg => {
                    this.setHighestWorkloadDayDesc({"(nicht empfangen)": "(nicht empfangen)"});
                    this.setHighestWorkloadDayValue({"(nicht empfangen)": "(nicht empfangen)"});
                    console.warn("The last update HighestWorkloadDay is incomplete:", errormsg);
                    Radio.trigger("Alert", "alert", {
                        content: "Der Wert für \"Stärkster Tag im Jahr\" wurde wegen eines API-Fehlers nicht empfangen.",
                        category: "Info"
                    });
                });

                api.updateHighestWorkloadWeek(thingId, weekSelects, {defaultLabel: this.label}, dayjs().format("YYYY"), (weeks, values) => {
                    this.setHighestWorkloadWeekDesc(weeks);
                    Object.keys(values).forEach(label => {
                        values[label] = thousandsSeparator(values[label]);
                    });
                    this.setHighestWorkloadWeekValue(values);
                }, errormsg => {
                    this.setHighestWorkloadWeekDesc({"(nicht empfangen)": "(nicht empfangen)"});
                    this.setHighestWorkloadWeekValue({"(nicht empfangen)": "(nicht empfangen)"});
                    console.warn("The last update HighestWorkloadWeek is incomplete:", errormsg);
                    Radio.trigger("Alert", "alert", {
                        content: "Der Wert für \"Stärkste Woche im Jahr\" wurde wegen eines API-Fehlers nicht empfangen.",
                        category: "Info"
                    });
                });

                api.updateHighestWorkloadMonth(thingId, monthSelects, {defaultLabel: this.label}, dayjs().format("YYYY"), (months, values) => {
                    this.setHighestWorkloadMonthDesc(months);
                    Object.keys(values).forEach(label => {
                        values[label] = thousandsSeparator(values[label]);
                    });
                    this.setHighestWorkloadMonthValue(values);
                }, errormsg => {
                    this.setHighestWorkloadMonthDesc({"(nicht empfangen)": "(nicht empfangen)"});
                    this.setHighestWorkloadMonthValue({"(nicht empfangen)": "(nicht empfangen)"});
                    console.warn("The last update HighestWorkloadMonth is incomplete:", errormsg);
                    Radio.trigger("Alert", "alert", {
                        content: "Der Wert für \"Stärkster Monat im Jahr\" wurde wegen eines API-Fehlers nicht empfangen.",
                        category: "Info"
                    });
                });

            }
        },

        checkSingleValue: function (selects) {
            let isSingleValue = false;

            if (this.infoSelects.singleValues) {
                Object.keys(this.infoSelects.singleValues).forEach(key => {
                    if (Object.prototype.hasOwnProperty.call(selects, key)) {
                        if (selects[key].value.includes(this.infoSelects.singleValues[key])) {
                            isSingleValue = true;
                        }
                    }
                });
            }
            return isSingleValue;
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
                <tbody v-if="isSingleValueMode">
                    <tr>
                        <td class="bold">
                        &nbsp;
                        </td>
                        <td
                            v-for="(columnLabel, idx) in Object.keys(totalMediumToday)"
                            :key="idx"
                            class="bold"
                        >
                            {{ columnLabel }}
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ intersectionToday }}
                        </td>
                        <td
                            v-for="(todayColumn, idx) in Object.keys(totalMediumToday)"
                            :key="idx"
                            class="bold"
                        >
                            {{ totalMediumToday[todayColumn] }}
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ intersectionYesterday }}
                        </td>
                        <td
                            v-for="(yesterdayColumn, idx) in Object.keys(totalMediumToday)"
                            :key="idx"
                            class="bold"
                        >
                            {{ totalMediumYesterday[yesterdayColumn] }}
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ intersectionTwoDaysAgo }}
                        </td>
                        <td
                            v-for="(twoDaysAgo, idx) in Object.keys(totalMediumToday)"
                            :key="idx"
                            class="bold"
                        >
                            {{ totalMediumTwoDaysAgo[twoDaysAgo] }}
                        </td>
                    </tr>
                </tbody>
                <tbody v-else>
                    <tr>
                        <td class="bold">
&nbsp;
                        </td>
                        <td
                            v-for="(columnLabel, idx) in Object.keys(thisYearValue)"
                            :key="idx"
                            class="bold"
                        >
                            {{ columnLabel }}
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
                        <td
                            v-for="(thisYearColumn, idx) in Object.keys(thisYearValue)"
                            :key="idx"
                            class="bold"
                        >
                            {{ thisYearValue[thisYearColumn] }}
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ overThePastYear }}
                        </td>
                        <td
                            v-for="(lastYearColumn, idx) in Object.keys(thisYearValue)"
                            :key="idx"
                            class="bold"
                        >
                            {{ lastYearValue[lastYearColumn] }}
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ onThePreviousDay }}
                        </td>
                        <td
                            v-for="(lastDayColumn, idx) in Object.keys(thisYearValue)"
                            :key="idx"
                            class="bold"
                        >
                            {{ lastDayValue[lastDayColumn] }}
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ highestDay }}
                        </td>
                        <td
                            v-for="(highestWorkloadDayColumn, idx) in Object.keys(thisYearValue)"
                            :key="idx"
                        >
                            <span class="bold">{{ highestWorkloadDayValue[highestWorkloadDayColumn] }}</span>
                            ({{ highestWorkloadDayDesc[highestWorkloadDayColumn] }})
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ highestWeek }}
                        </td>
                        <td
                            v-for="(highestWorkloadWeekColumn, idx) in Object.keys(thisYearValue)"
                            :key="idx"
                        >
                            <span class="bold">{{ highestWorkloadWeekValue[highestWorkloadWeekColumn] }}</span>
                            ({{ highestWorkloadWeekDesc[highestWorkloadWeekColumn] }})
                        </td>
                    </tr>
                    <tr>
                        <td class="bold">
                            {{ highestMonth }}
                        </td>
                        <td
                            v-for="(highestWorkloadMonthColumn, idx) in Object.keys(thisYearValue)"
                            :key="idx"
                        >
                            <span class="bold">{{ highestWorkloadMonthValue[highestWorkloadMonthColumn] }}</span>
                            ({{ highestWorkloadMonthDesc[highestWorkloadMonthColumn] }})
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #sensorchart-info-table {
        overflow: scroll;
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

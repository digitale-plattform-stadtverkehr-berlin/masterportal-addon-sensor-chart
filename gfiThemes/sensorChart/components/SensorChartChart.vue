<script>
import SensorChartCompDiagram from "./SensorChartCompDiagram.vue";
import SensorChartCompTable from "./SensorChartCompTable.vue";
import SensorChartCheckbox from "./SensorChartCheckbox.vue";
import SensorChartDownloads from "./SensorChartDownloads.vue";
import thousandsSeparator from "../../../../src/utils/thousandsSeparator.js";
import moment from "moment";

import DatePicker from "vue2-datepicker";
import "vue2-datepicker/index.css";
import "vue2-datepicker/locale/de";

import {addMissingDataFlex} from "../library/addMissingData.js";

export default {
    name: "SensorChartChart",
    components: {
        SensorChartCompDiagram,
        SensorChartCompTable,
        SensorChartDownloads,
        SensorChartCheckbox,
        DatePicker
    },
    props: {
        label: {
            type: String,
            required: true
        },
        motId: {
            type: String,
            required: true
        },
        motType: {
            type: String,
            required: true
        },
        dayStartOffset: {
            type: Number,
            required: true
        },
        selects: {
            type: Object,
            required: true
        },
        api: {
            type: Object,
            required: true
        },
        thingId: {
            type: Number,
            required: true
        },
        intervals: {
            type: Object,
            required: true
        },
        archiveStartDate: {
            type: String,
            required: true
        }
    },
    data () {
        return {
            apiData: [],
            dates: [],

            // props for diagram
            setTooltipValue: (tooltipItem) => {
                return moment(tooltipItem.datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.sensorChart.clockLabel") + ": " + thousandsSeparator(tooltipItem.value);
            },
            xAxisTicks: 12,
            yAxisTicks: 8,
            renderLabelXAxis: (datetime) => {
                return moment(datetime, "YYYY-MM-DD HH:mm:ss").format("HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.sensorChart.clockLabel");
            },
            renderLabelYAxis: (yValue) => {
                return thousandsSeparator(yValue);
            },

            // will be set on mount
            measureName: "", // this.$t("additional:modules.tools.gfi.themes.sensorChart.yAxisTextDay");

            renderLabelLegend: (selects) => {
                return selects;
            },

            doInterpolate: false,

            // props for table
            setTableTitle: () => {
                if (this.motType === "speed") {
                    return this.label + " " + this.measureName;
                }
                return this.label;

            },
            setColTitle: datetime => {
                return moment(datetime, "YYYY-MM-DD HH:mm:ss").format("HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.sensorChart.clockLabel");
            },
            setRowTitle: (meansOfTransports, datetime) => {
                return moment(datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY");
            },
            setFieldValue: value => {
                return thousandsSeparator(value);
            },
            // dayInterval: "5-Min",
            diagramDayId: "diagramDay" + this.motId,
            tableDayId: "tableDay" + this.motId,

            startOf: "day"
        };
    },
    watch: {
        dates () {
            if (typeof this.intervals === "object" && this.intervals !== null && typeof this.intervals.field === "string") {
                this.dates[1] = this.timespanConstraints(this.dates);
                this.setXAxis();
                this.reloadData();
            }
        },
        selects: { // selects a the top
            handler (newVal, oldVal) {
                if (oldVal) {
                    this.dates[1] = this.timespanConstraints(this.dates);
                    this.setXAxis();
                    this.reloadData();
                }
                this.setMeasureName();
            }
        }
    },
    created () {
        moment.locale(i18next.language);
        this.dates = [moment().subtract(this.dayStartOffset, "days").startOf("day").toDate(), moment().subtract(this.dayStartOffset, "days").endOf("day").toDate()];
    },
    mounted () {
        this.setMeasureName();

        // hack for setting cur month in 2nd calendar instead of next month when next date is in cur month
        const updateCalendars = DatePicker.CalendarRange.methods.updateCalendars;

        DatePicker.CalendarRange.methods.updateCalendars = function (...args) {
            updateCalendars.apply(this, args);
            if (args.length === 1) {
                this.calendars = this.calendars.map((v, idx) => {
                    const next = new Date(v);

                    if (idx === 1) {
                        next.setMonth(moment(next.getMonth()).add(1, "days").toDate());
                    }
                    return next;
                });
            }
        };
    },
    methods: {
        setMeasureName: function () {
            if (Object.keys(this.selects).length > 0) {
                const api = this.api,
                    thingId = this.thingId,
                    interval = 15;

                api.getUnitOfMeasurement(thingId, this.selects, interval, units => {
                    this.measureName = units.symbol;
                }, () => {
                    // console.log("received errornous symbol");
                    this.measureName = "??";
                }, false, false);
            }
            else {
                this.measureName = "??";
            }
        },

        setXAxis: function () {
            const timespan = moment.duration(moment(this.dates[1]).diff(moment(this.dates[0])));

            if (timespan.asDays() >= 365) {
                this.renderLabelXAxis = (datetime) => {
                    return moment(datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.sensorChart.clockLabel");
                };
                this.setColTitle = (datetime) => {
                    return moment(datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.sensorChart.clockLabel");
                };
                this.setRowTitle = (meansOfTransports) => {
                    return meansOfTransports;
                };
            }
            else if (timespan.asDays() > 4) {
                this.renderLabelXAxis = (datetime) => {
                    return moment(datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM. HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.sensorChart.clockLabel");
                };
                this.setColTitle = (datetime) => {
                    return moment(datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM. HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.sensorChart.clockLabel");
                };
                this.setRowTitle = (meansOfTransports) => {
                    return meansOfTransports;
                };
            }
            else if (timespan.asHours() > 24) {
                this.renderLabelXAxis = (datetime) => {
                    const timeStamp = moment(datetime, "YYYY-MM-DD HH:mm:ss"),
                        timeString = timeStamp.hour() === 0 && timeStamp.minute() === 0 ? timeStamp.format("DD.MM. HH:mm") : timeStamp.format("HH:mm");

                    return timeString + " " + this.$t("additional:modules.tools.gfi.themes.sensorChart.clockLabel");
                };
                this.setColTitle = (datetime) => {
                    const timeStamp = moment(datetime, "YYYY-MM-DD HH:mm:ss"),
                        timeString = timeStamp.hour() === 0 && timeStamp.minute() === 0 ? timeStamp.format("DD.MM. HH:mm") : timeStamp.format("HH:mm");

                    return timeString + " " + this.$t("additional:modules.tools.gfi.themes.sensorChart.clockLabel");
                };
                this.setRowTitle = (meansOfTransports) => {
                    return meansOfTransports;
                };
            }
            else {
                this.renderLabelXAxis = (datetime) => {
                    return moment(datetime, "YYYY-MM-DD HH:mm:ss").format("HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.sensorChart.clockLabel");
                };
                this.setColTitle = (datetime) => {
                    return moment(datetime, "YYYY-MM-DD HH:mm:ss").format("HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.sensorChart.clockLabel");
                };
                this.setRowTitle = (meansOfTransports) => {
                    return meansOfTransports;
                };
            }
        },

        /**
         * Function for measuring constraints for the given dates
         * @param   {Date[]} mdates array of dates to measure
         * @fires   Alerting#RadioTriggerAlertAlert
         * @returns {Date}  the new end date which is guaranteed within the constraint boundaries
         */
        timespanConstraints: function (mdates) {
            const curInterval = this.selects[this.intervals.field].value,
                maxDuration = this.intervals.values[curInterval].maxLength,
                startOf = this.intervals.values[curInterval].startOf,
                endTimeLimit = moment.min(moment().endOf("date"), moment(mdates[0]).clone().add(startOf, maxDuration));

            if (moment(mdates[1]).isAfter(endTimeLimit)) {
                Radio.trigger("Alert", "alert", {
                    content: "Maximale Anzahl an " + curInterval + " erreicht, schneide Endzeitpunkt auf " + endTimeLimit.startOf("day").format("DD.MM.YYYY") + " ab", category: "Info"
                });
                return endTimeLimit.clone().startOf("day").toDate();
            }
            return mdates[1];
        },

        /**
         * Function is initially triggered and on update
         * @fires   Alerting#RadioTriggerAlertAlert
         * @returns {Void}  -
         */
        reloadData: function () {
            const api = this.api,
                thingId = this.thingId,
                timeSettings = [],
                intervalField = this.intervals.field,
                intervalKey = this.selects[intervalField].value,
                intervalEntry = this.intervals.values[intervalKey];

            timeSettings.push({
                from: moment(this.dates[0]).clone().startOf(intervalEntry.startOf),
                until: moment(this.dates[1]).clone().endOf(intervalEntry.startOf)
            });

            api.updateDataset(thingId, this.selects, timeSettings, datasets => {
                this.doInterpolate = false;
                if (Array.isArray(datasets)) {
                    datasets.forEach((transportData, idx) => {
                        const from = typeof timeSettings[idx] === "object" ? moment(timeSettings[idx].from).format("YYYY-MM-DD") + " 00:00:00" : "",
                            until = typeof timeSettings[idx] === "object" ? moment(timeSettings[idx].until).format("YYYY-MM-DD") + " 23:59:59" : "";

                        Object.keys(transportData).forEach(transportKey => {
                            datasets[idx][transportKey] = addMissingDataFlex(from, until, datasets[idx][transportKey], intervalEntry);
                            if (Object.keys(datasets[idx][transportKey]).length > 50) {
                                this.doInterpolate = true;
                            }
                        });
                    });
                }
                this.apiData = datasets;
            }, errormsg => {
                this.apiData = [];

                console.warn("The data received from api are incomplete:", errormsg);
                Radio.trigger("Alert", "alert", {
                    content: "Die gewünschten Daten wurden wegen eines API-Fehlers nicht korrekt empfangen.",
                    category: "Info"
                });
            }, () => {
                document.querySelector("#" + this.diagramDayId).style.filter = "blur(3px)";
            }, () => {
                document.querySelector("#" + this.diagramDayId).style.filter = "";
            });
        },

        /**
         * Checks if a date should be disabled.
         * @param {Date} date The date in question.
         * @returns {Boolean} true if disabled, false if enabled.
         */
        isDateDisabled (date) {
            if (!(date instanceof Date)) {
                return true;
            }
            if (date > moment().subtract(this.dayStartOffset, "days").endOf("day")) { // >= tomorrow
                return true;
            }
            return date < moment(this.archiveStartDate);
        }
    }
};
</script>

<template>
    <div>
        <div
            :id="'dayDateRangeSelector'+motId"
            class="dateRangeSelector"
        >
            <section>
                <DatePicker
                    v-model="dates"
                    type="date"
                    range
                    :disabled-date="isDateDisabled"
                    range-separator=" bis "
                    :editable="false"
                    :clearable="false"
                />
            </section>
        </div>
        <SensorChartCheckbox
            :table-diagram-id="diagramDayId"
        />
        <div :id="diagramDayId">
            <SensorChartCompDiagram
                v-if="measureName"
                :api-data="apiData"
                :set-tooltip-value="setTooltipValue"
                :x-axis-ticks="xAxisTicks"
                :y-axis-ticks="yAxisTicks"
                :render-label-x-axis="renderLabelXAxis"
                :render-label-y-axis="renderLabelYAxis"
                :description-y-axis="measureName"
                :render-label-legend="renderLabelLegend"
                :do-interpolate="doInterpolate"
            />
        </div>
        <SensorChartCheckbox
            :table-diagram-id="tableDayId"
        />
        <div :id="tableDayId">
            <SensorChartCompTable
                v-if="measureName"
                :api-data="apiData"
                :set-table-title="setTableTitle"
                :set-col-title="setColTitle"
                :set-row-title="setRowTitle"
                :set-field-value="setFieldValue"
            />
        </div>

        <div class="downloads">
            <SensorChartDownloads
                :label="label"
                :set-verbose-label="setTableTitle"
                current-tab-id="day"
                :api-data="apiData"
                :set-table-title="setTableTitle"
                :set-col-title="setColTitle"
                :set-row-title="setRowTitle"
                :set-field-value="setFieldValue"
            />
        </div>
    </div>
</template>

<style scoped>

.mx-datepicker-range {
    width:100%;
    margin: 8px 0;
}

.downloads {
  display: flex;
  justify-content: flex-start;
  margin: 0;
  flex-wrap: wrap;
}
</style>

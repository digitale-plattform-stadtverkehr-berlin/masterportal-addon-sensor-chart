<script>
import dayjs from "dayjs";

export default {
    name: "SensorChartFooter",
    props: {
        api: {
            type: Object,
            required: true
        },
        thingId: {
            type: Number,
            required: true
        },
        selects: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            lastUpdate: "",
            currentTabId: "infos",
            dayInterval: this.motDayInterval
        };
    },
    computed: {
        lastupdateLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.lastupdateLabel");
        }
    },
    watch: {
        // When the gfi window switched with arrow, the new data will be fetched from api
        thingId: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    if (this.meansOfTransport !== "undefined") {
                        this.setFooterLastUpdate(this.api, newVal, this.selects);
                    }
                }
            },
            immediate: true
        },
        selects: function (newVal) {
            this.setFooterLastUpdate(this.api, this.thingId, newVal);
        },
        currentTabId: function (newVal) {
            this.setFooterLastUpdate(this.api, newVal, this.selects);
        }
    },
    mounted: function () {
        // set the date
        if (this.selects !== undefined) {
            this.setFooterLastUpdate(this.api, this.thingId, this.selects);
        }
    },
    methods: {
        /**
         * setup of the last update date
         * @param {Object} api instance of SensorChartApi
         * @param {String} thingId the thingId to be send to any api call
         * @param {String} selects the meansOfTransport to be send with any api call
         * @fires   Alerting#RadioTriggerAlertAlert
         * @returns {Void}  -
         */
        setFooterLastUpdate: function (api, thingId, selects) {
            api.subscribeLastUpdate(thingId, selects, datetime => {
                this.setLastUpdate(dayjs(datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY, HH:mm:ss"));
            }, errormsg => {
                this.setLastUpdate("(aktuell keine Zeitangabe)");
                console.warn("The last update received is incomplete:", errormsg);
                Radio.trigger("Alert", "alert", {
                    content: "Das vom Sensor-Server erhaltene Datum der letzten Aktualisierung kann wegen eines API-Fehlers nicht ausgegeben werden.",
                    category: "Info"
                });
            });
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
        <div class="update">
            <p><strong>{{ lastupdateLabel }}:</strong> {{ lastUpdate }}</p>
        </div>
    </div>
</template>


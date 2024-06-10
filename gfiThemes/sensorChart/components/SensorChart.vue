<script>
import {mapGetters} from "vuex";

import {SensorChartCache} from "../library/sensorChartCache";
import {SensorChartApi} from "../library/sensorChartApi";
import SensorChartInfo from "./SensorChartInfo.vue";
import SensorChartChart from "./SensorChartChart.vue";
import SensorChartFooter from "./SensorChartFooter.vue";
import Multiselect from "vue-multiselect";

export default {
    name: "SensorChart",
    components: {
        SensorChartInfo,
        SensorChartChart,
        SensorChartFooter,
        Multiselect
    },
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            api: null,
            customStyle: {},
            propThingId: 0,
            meansOfTransports: [],
            meansOfTransportsCount: [],
            meansOfTransportsSpeed: [],
            title: "",
            description: "",
            headerProperties: [],
            headerSelects: {},
            infoSelects: {},
            selectedValues: {},
            hasPhotos: false,
            headerPhotosUrls: [],
            archiveStartDate: "2020-01-01",
            dayStartOffset: 0,
            weekStartOffset: 1,
            meansOfTransport: "",
            intervals: {},
            currentTabId: "infos",
            keyInfo: "info",
            keyChart: "chart",
            keyDay: "day",
            keyWeek: "week",
            keyYear: "year",
            chart_reload: 0,
            defaultLabel: ""
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        infoLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.infoLabel");
        },

        chartLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.chartLabel");
        },

        dayLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.dayLabel");
        },

        weekLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.weekLabel");
        },

        yearLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.yearLabel");
        },

        idLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.idLabel");
        },

        meansOfTransportLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.meansOfTransportLabel");
        },

        descriptionLabel: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.descriptionLabel");
        },
        indication: function () {
            return this.$t("additional:modules.tools.gfi.themes.sensorChart.notice");
        }
    },
    watch: {
        // When the gfi window switched with arrow, the connection will be refreshed
        feature: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    this.init();
                }
            },
            immediate: true
        },

        // When language is switched, the header will be rerendered
        currentLocale: function (newVal, oldVal) {
            if (oldVal) {
                // this.setHeader(this.api, this.propThingId, this.propMeansOfTransportKfz);
                this.setHeader(this.api, this.propThingId, this.meansOfTransportsCount[0], this.headerProperties);
                this.setComponentKey(newVal);
                this.setActiveDefaultTab();
            }
        }
    },
    created: function () {
        this.init();
    },
    mounted: function () {
        this.setHeader(this.api, this.propThingId, this.meansOfTransportsCount[0], this.headerProperties);
        this.setGfiDiagramWidth(); // init size
    },
    beforeDestroy: function () {
        this.api.unsubscribeEverything();
    },
    methods: {
        init: function () {
            const gfiTheme = this.feature?.getTheme(),
                gfiParams = gfiTheme?.params;

            this.meansOfTransports = typeof gfiParams === "object" && Object.prototype.hasOwnProperty.call(gfiParams, "meansOfTransports") ? gfiParams.meansOfTransports : [];
            this.createDataConnection(this.feature.getProperties(), null).then(() => {
                this.meansOfTransportsCount = this.meansOfTransports.filter(function isCount (mot) {
                    return mot.type === "counting";
                });
                this.meansOfTransportsSpeed = this.meansOfTransports.filter(function isSpeed (mot) {
                    return mot.type === "speed";
                });

                const headerPropertyNames = typeof gfiParams === "object" && Object.prototype.hasOwnProperty.call(gfiParams, "headerProperties") ? gfiParams.headerProperties : [];

                this.defaultLabel = typeof gfiParams === "object" && Object.prototype.hasOwnProperty.call(gfiParams, "defaultLabel") ? gfiParams.defaultLabel : "";

                this.infoSelects = typeof gfiParams === "object" && Object.prototype.hasOwnProperty.call(gfiParams, "infoSelects") ? gfiParams.infoSelects : {};

                this.headerProperties = [];
                Object.entries(headerPropertyNames).forEach(hp => {
                    const hpKey = hp[0],
                        hpDef = hp[1],
                        headerProperty = {
                            name: hpKey,
                            label: "",
                            value: "",
                            model: ""
                        };
                    let hpLabel,
                        hpDefault,
                        hpInfo,
                        isSelect = false,
                        isMultiple = false,
                        isSelectAll = false;

                    if (typeof hpDef === "string") {
                        hpLabel = hpDef;
                    }
                    else {
                        hpLabel = hpDef.name;
                        hpDefault = hpDef.default;
                        hpInfo = hpDef.infoText;
                        if (hpDef.isSelect) {
                            isSelect = true;
                        }
                        if (hpDef.isMultiple) {
                            isMultiple = true;
                        }
                        if (hpDef.isSelectAll) {
                            isSelectAll = true;
                        }
                    }
                    headerProperty.label = hpLabel;

                    if (isSelect) {
                        headerProperty.isSelect = true;
                        headerProperty.isMultiple = isMultiple;
                        headerProperty.isSelectAll = isSelectAll;
                        if (hpDefault) {
                            headerProperty.default = hpDefault;
                            headerProperty.model = hpDefault;
                        }
                    }

                    if (Object.prototype.hasOwnProperty.call(gfiParams, "defaultLabelField") && (gfiParams.defaultLabelField === hpKey)) {
                        headerProperty.isDefaultLabel = true;
                    }

                    if (hpInfo) {
                        headerProperty.infoText = hpInfo;
                    }

                    this.headerProperties.push(headerProperty);
                });

                // get special property "photos" from properties
                if (typeof gfiParams === "object" && Object.prototype.hasOwnProperty.call(gfiParams, "headerPhotos") && gfiParams.headerPhotos) {
                    this.hasPhotos = true;
                }

                this.archiveStartDate = typeof gfiParams === "object" && Object.prototype.hasOwnProperty.call(gfiParams, "archiveStartDate") ? gfiParams.archiveStartDate : this.archiveStartDate;

                this.dayStartOffset = typeof gfiParams === "object" && Object.prototype.hasOwnProperty.call(gfiParams, "dayStartOffset") ? gfiParams.dayStartOffset : this.dayStartOffset;

                this.weekStartOffset = typeof gfiParams === "object" && Object.prototype.hasOwnProperty.call(gfiParams, "weekStartOffset") ? gfiParams.weekStartOffset : this.weekStartOffset;

                this.intervals = typeof gfiParams === "object" && Object.prototype.hasOwnProperty.call(gfiParams, "intervals") ? gfiParams.intervals : this.intervals;

                this.setHeader(this.api, this.propThingId, this.meansOfTransportsCount[0], this.headerProperties);
                this.setComponentKey(this.propThingId);
                this.setActiveDefaultTab();
            });
        },

        /**
         * it will make conntection to thing api
         * @param {Object[]} feature the feature properties from thing
         * @param {Object} [sensorThingsApiOpt=null] an optional api for testing
         * @returns {Void} -
         */
        createDataConnection: function (feature, sensorThingsApiOpt = null) {
            return new Promise((resolve) => {
                const thingId = feature["@iot.id"],
                    url = feature.requestUrl,
                    sensorThingsApiVersion = "v" + feature.versionUrl,
                    mqttOptions = {
                        host: url.split("/")[2],
                        mqttUrl: "wss://" + url.split("/")[2] + "/mqtt",
                        mqttVersion: "3.1.1",
                        rhPath: url,
                        context: this
                    },
                    tcApi = new SensorChartApi(url, sensorThingsApiVersion, mqttOptions, sensorThingsApiOpt);

                this.api = new SensorChartCache(url, sensorThingsApiVersion, mqttOptions, sensorThingsApiOpt);
                this.propThingId = thingId;

                tcApi.getDataStreams(thingId, datastreams => {
                    feature.Datastreams = datastreams;
                }, false, false, () => {
                    this.headerSelects = {};
                    for (let i = 0; i < this.meansOfTransports.length; i++) {
                        feature.Datastreams.forEach(datastream => Object.keys(datastream.properties).forEach(property => {
                            if (this.headerSelects[property] === undefined) {
                                this.headerSelects[property] = [];
                            }
                            if (!this.headerSelects[property].includes(datastream.properties[property])) {
                                this.headerSelects[property].push(datastream.properties[property]);
                            }
                        }));
                        this.meansOfTransports[i].stream =
                            this.getMeansOfTransportFromDatastream(feature.Datastreams, [this.meansOfTransports[i].id]);
                    }
                    resolve();

                });

            });
        },

        /**
         * returns the value in meansOfTransportArray that matches the start of the given array of datastreams property layerName, returns first match
         * @param {Object[]} datastreams the array of datastreams from the SensorThingsAPI
         * @param {String[]} meansOfTransportArray an array representing all terms to look for in the datastreams layerName
         * @returns {String|Boolean}  a string representing the means of transport (e.g. Anzahl_Kfz, Anzahl_Fahrraeder) or false if no means of transport where found
         */
        getMeansOfTransportFromDatastream: function (datastreams, meansOfTransportArray) {
            let key,
                i,
                datastream = null;

            if (!Array.isArray(datastreams) || datastreams.length === 0) {
                return false;
            }

            for (i in datastreams) {
                datastream = datastreams[i];

                if (!datastream || typeof datastream !== "object" || !Object.prototype.hasOwnProperty.call(datastream, "properties") || !Object.prototype.hasOwnProperty.call(datastream.properties, "layerName")) {
                    continue;
                }

                for (key in meansOfTransportArray) {
                    if (datastream.properties.layerName.indexOf(meansOfTransportArray[key]) === 0) {
                        return meansOfTransportArray[key];
                    }
                }
            }

            return false;
        },

        /**
         * set the default infos tab active when switch the language by triggering the click event
         * @returns {Void} -
         */
        setActiveDefaultTab: function () {
            this.$el.querySelector("li[value='infos'] a").click();
        },

        /**
         * set the current tab id after clicking.
         * @param {Object[]} evt the target of current click event
         * @returns {Void} -
         */
        setCurrentTabId: function (evt) {
            if (evt && evt.target && evt.target.hash) {
                this.currentTabId = evt.target.hash.substring(1);
            }
        },


        /**
         * set the selected option.
         * @param {Object[]} field the name of the values to change
         * @param {Object[]} values the new values
         * @returns {Void} -
         */
        setSelectedValue: function (field, values) {
            const newSelects = {},
                headerProperty = this.headerProperties.find(headerProperty => headerProperty.name === field);

            newSelects[field] = {};

            Object.keys(this.selectedValues).forEach(key => {
                newSelects[key] = this.selectedValues[key];
            });

            if (values.length > 0) {
                newSelects[field].value = values;
            }
            else {
                newSelects[field].value = headerProperty.default;
                headerProperty.model = headerProperty.default;
            }
            this.selectedValues = newSelects;
        },

        /**
         * set the header of gfi theme
         * @param {Object} api the api from library
         * @param {String} thingId the current thing Id
         * @param {String} meansOfTransport the means of transportation
         * @param {Array} headerProperties the properties for the header
         * @returns {Void} -
         */
        setHeader: function (api, thingId, meansOfTransport, headerProperties) {
            // title
            api.updateTitle(thingId, title => {
                this.setTitle(title);
            }, errormsg => {
                this.setTitle("(nicht bekannt)");
                console.warn("The title received is incomplete:", errormsg);
            });

            // description
            api.updateDescription(thingId, description => {
                this.setDescription(description);
            }, errormsg => {
                this.setDescription("(nicht bekannt)");
                console.warn("The description received is incomplete:", errormsg);
            });

            this.selectedValues = {};
            headerProperties.forEach(headerProperty => {
                if (!headerProperty.isSelect) {
                    api.updateProperty(thingId, headerProperty.name, hpValue => {
                        this.setHeaderProperty(headerProperty.name, hpValue);
                    }, errormsg => {
                        this.setHeaderProperty(headerProperty.name, "(nicht bekannt)");
                        console.warn("The header property received is incomplete:", errormsg);
                    });
                }
                else if (this.headerSelects[headerProperty.name] !== undefined) {
                    this.setHeaderProperty(headerProperty.name, this.headerSelects[headerProperty.name]);
                    this.selectedValues[headerProperty.name] = {
                        "value": Object.prototype.hasOwnProperty.call(headerProperty, "default") && this.headerSelects[headerProperty.name].includes(headerProperty.default) ? headerProperty.default : this.headerSelects[headerProperty.name][0],
                        "label": headerProperty.name,
                        "description": headerProperty.label
                    };
                    if (headerProperty.isDefaultLabel) {
                        this.selectedValues[headerProperty.name].isDefaultLabel = true;
                    }
                }
            });

            // photos from header getProperties
            if (this.hasPhotos) {
                api.updateProperty(thingId, "photos", urlArray => {
                    this.headerPhotosUrls = urlArray;
                }, errormsg => {
                // this.setHeaderPhotos("fallback.png");
                    this.headerPhotosUrls = [];
                    console.warn("The header property photos is invalid:", errormsg);
                });
            }

            // means of transport
            if (meansOfTransport) {
                this.meansOfTransport = meansOfTransport.label;
            }
            else {
                this.meansOfTransport = "";
            }
        },

        /**
         * setter for title
         * @param {String} value the title to be shown in the template
         * @returns {Void}  -
         */
        setTitle: function (value) {
            this.title = value;
        },

        /**
         * setter for description
         * @param {String} value the description to be shown in the template
         * @returns {Void}  -
         */
        setDescription: function (value) {
            this.description = value;
        },

        /**
         * setter for header property
         * @param {String} name the name of the property
         * @param {String} value the value
         * @returns {Void}  -
         */
        setHeaderProperty: function (name, value) {
            this.headerProperties.forEach(headerProperty => {
                if (headerProperty.name === name) {
                    headerProperty.value = value;
                }
            });
        },

        /**
         * setter for the component key
         * @param {String} value the dynamic changed value from watch hook
         * @returns {Void}  -
         */
        setComponentKey: function (value) {
            this.keyInfo = value + "info";
            this.keyChart = value + "chart";
            this.keyDay = value + "day";
            this.keyWeek = value + "week";
            this.keyYear = value + "year";
        },

        /**
         * setting the width for day, week and year tabs to show the whole diagram
         * @returns {void}  -
         */
        setGfiDiagramWidth: function () {
            const gfiWrapper = document.querySelector(".tool-window-vue"),
                gfiContent = document.querySelector(".gfi-content");

            if (gfiWrapper) {
                gfiWrapper.style.right = "auto";
                gfiWrapper.style.left = "10px";
                gfiWrapper.style.top = "10px";
                gfiWrapper.style.width = "98%";
                gfiWrapper.style.maxWidth = "992px";
            }
            if (gfiContent) {
                gfiContent.style.width = "100%";
                gfiContent.style.maxWidth = "none";
            }
        }
    }
};
</script>

<template>
    <div class="sensorChart-gfi">
        <div class="header">
            <div class="properties">
                <b>{{ idLabel }}:</b> {{ title }}<br><br>
                <b>{{ descriptionLabel }}:</b><br>{{ description }}<br><br>
                <table>
                    <tr
                        v-for="(headerProperty, index) in headerProperties"
                        :key="'headerProperty.'+headerProperty.name"
                    >
                        <td class="label">
                            <b>{{ headerProperty.label }}:</b>
                            <span
                                v-if="headerProperty.infoText"
                                class="infotip"
                            >
                                <i class="bi bi-info-square-fill icon-big" />
                                <span class="infotip-text">{{ headerProperty.infoText }}</span>
                            </span>
                        </td>
                        <template v-if="headerProperty.isSelect">
                            <td class="box">
                                <label>
                                    <Multiselect
                                        v-model="headerProperty.model"
                                        :options="(headerProperty.isMultiple && headerProperty.isSelectAll)?[{'all': 'Alle', 'values': headerProperty.value}]:headerProperty.value"
                                        :group-values="(headerProperty.isMultiple && headerProperty.isSelectAll)? 'values' : undefined"
                                        :group-label="(headerProperty.isMultiple && headerProperty.isSelectAll)? 'all' : undefined"
                                        :group-select="(headerProperty.isMultiple && headerProperty.isSelectAll)"
                                        :multiple="headerProperty.isMultiple"
                                        :preselect-first="false"
                                        :searchable="false"
                                        deselect-group-label=""
                                        select-label=""
                                        deselect-label=""
                                        selected-label=""
                                        placeholder=""
                                        select-group-label=""
                                        :allow-empty="false"

                                        :value="headerProperty.model"
                                        @input="setSelectedValue(headerProperty.name, $event)"
                                    />
                                </label>
                            </td>
                        </template>
                        <template v-else>
                            <td>{{ headerProperty.value }}</td>
                        </template>
                    </tr>
                </table>
                <div
                    class="indication"
                    :style="customStyle"
                >
                    {{ indication }}
                </div>
            </div>
            <div
                v-if="hasPhotos"
                class="photos"
            >
                <img
                    v-for="(srcUrl, index) in headerPhotosUrls"
                    :key="index"
                    :src="srcUrl"
                    :alt="srcUrl"
                >
            </div>
        </div>

        <div>
            <ul
                class="nav nav-tabs"
                @click="setCurrentTabId"
                @keypress="setCurrentTabId"
            >
                <li
                    value="infos"
                    class="nav-item"
                    :class="(currentTabId === 'infos') ? 'active' : ''"
                >
                    <a
                        href="#infos"
                        class="nav-link"
                    >{{ infoLabel }}</a>
                </li>
                <li
                    value="chart"
                    class="nav-item"
                    :class="(currentTabId === 'chart') ? 'active' : ''"
                >
                    <a
                        href="#chart"
                        class="nav-link"
                    >{{ chartLabel }}</a>
                </li>
            </ul>
            <div class="tab-content">
                <div
                    :key="keyInfo"
                    :class="(currentTabId === 'infos') ? 'd-block' : 'd-none'"
                >
                    <SensorChartInfo
                        :label="defaultLabel"
                        :api="api"
                        :thing-id="propThingId"
                        :selects="selectedValues"
                        :info-selects="infoSelects"
                    />
                </div>
                <div
                    :key="keyChart"
                    :class="(currentTabId === 'chart') ? 'd-block' : 'd-none'"
                >
                    <SensorChartChart
                        :key="chart_reload"
                        :label="defaultLabel"
                        :mot-id="meansOfTransports[0]['id']"
                        :mot-type="meansOfTransports[0]['type']"
                        :selects="selectedValues"
                        :api="api"
                        :thing-id="propThingId"
                        :day-start-offset="dayStartOffset"
                        :intervals="intervals"
                        :archive-start-date="archiveStartDate"
                    />
                </div>
            </div>
        </div>

        <br><br>
        <SensorChartFooter
            class="footer"
            :api="api"
            :thing-id="propThingId"
            :selects="selectedValues"
        />
    </div>
</template>

<style lang="css">
.multiselect {
  border:1px solid black;
  min-height: auto;
  /* height: 28px; */
}
.multiselect__tags {
  min-height: auto;
  padding-top: 4px;
  font-size: 0;
}
.multiselect__single {
  min-height: auto;
  font-size: 0.75rem;
  margin-bottom: 0px;
  padding-top: 0;
  padding-bottom: 4px;
}
.multiselect__select::before {
  top: 50%;
}
.multiselect--active .multiselect__select {
  transform: none;
}
.multiselect__content {
  border:1px solid black;
}
.multiselect__option {
  font-size: 0.75rem;
  color: black;
  min-height: auto;
  padding: 4px;
}
.multiselect__option--highlight,
.multiselect__option--selected,
.multiselect__option--selected.multiselect__option--highlight {
  background-color:#337ab7;
  color: white;
}
.multiselect__tag {
  background-color:#337ab7;
  border-radius: none;
  font-size: 0.75rem;
}
.multiselect__tag-icon:hover {
  background-color:#337ab7;
}
.multiselect__tag-icon::after {
  color: white;
}
</style>

<style lang="scss" scoped>
.sensorChart-gfi {
    padding: 10px 15px 0 15px;
    @media (max-width: 600px) {
        width: inherit;
        height: inherit;
        padding-left: 10px;
        padding-right: 10px;
        div.graph {
            width: inherit;
            height: inherit;
        }
    }
    .header {
        margin: 0 0 30px 0;
        padding: 0;
        display: flex;
        justify-content: space-between;
        .properties {
          // width: 100%;
          box-sizing: border-box;
          margin-right: 16px;
          table tr td:last-child {
            padding-left:12px;
          }
        }
        .photos {
          width: 35%;
          box-sizing: border-box;
          img {
              max-width: 100%;
              max-height: 450px;
          }
        }
    }
    .tab-content {
      border: 1px solid grey;
      padding: 0 5px;
    }
     ul.nav-tabs {
      li {
        margin: 0;
        border-top: 1px solid grey;
        border-right: 1px solid grey;
        a {
          padding: 0.5rem 1rem;
        }
        a:hover {
          background-color: #eee;
        }
      }
      li:first-child {
        border-left: 1px solid grey;
      }
      li.active {
        a {
          color: #fff;
          background-color: #337ab7;
        }
      }
    }
    .footer {
        position: relative;
        display: block;
        width: 100%;
        margin-bottom: 20px
    }
    .indication {
        font-size: 12px;
        margin-top: 5px;
        left: 0px;
    }

    .properties {
      width: 100%;
      margin-right: 0;
    }
    table {
      width: 100%;
      td.box {
        width: 100%;
        padding-left: 16px;
      }
      td.label {
        white-space: nowrap;
      }
      label {
          height: 50px;
          display: flex;
          flex-direction: column;
          justify-content: center;
      }
    }
}
.icon-big {
  font-size: 16px;
}
.infotip {
    position: relative;
    .infotip-text {
        visibility: hidden;
        // width: 100%;
        white-space: nowrap;
        background-color: black;
        color: #fff;
        padding: 2px 8px;

        position: absolute;
        z-index: 1;
        top: -5px;
        left: 105%;
    }
}
.infotip:hover .infotip-text {
  visibility: visible;
}

</style>

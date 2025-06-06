<script>
import ChartJs from "chart.js/auto";
import {mapGetters} from "vuex";
import {shallowRef} from "vue";

export default {
    name: "SensorChartCompDiagram",
    props: {
        /**
         * the data from the api (without gaps and in order)
         * the diagram will take the first occuring entry of meansOfTransport (make sure to order apiData first)
         * e.g. [{bikes: {date: bikevalue1}, cars: {date: carvalue1}}, {bikes: {date: bikevalue2}, cars: {date: carvalue2}}]
         * (! first entry is bikes, so only bikes will be shown)
         */
        apiData: {
            type: Array,
            required: true
        },

        /**
         * sets the tooltip if the mouse hovers over a point
         * @param {Object} tooltipItem the tooltipItem from chartjs (see https://www.chartjs.org/docs/latest/configuration/tooltip.html?h=tooltipitem)
         * @returns {String}  the String to show
         */
        setTooltipValue: {
            type: Function,
            required: true
        },
        /**
         * the ticks on the x axis (e.g. 12 for the day)
         */
        xAxisTicks: {
            type: Number,
            required: false,
            default: 0
        },
        /**
         * the ticks on the y axis
         */
        yAxisTicks: {
            type: Number,
            require: false,
            default: 0
        },
        /**
         * sets the label of the x axis
         * @param {String} datetime the value of the x axis - the datetime in our case
         * @returns {String}  the label of the x axis
         */
        renderLabelXAxis: {
            type: Function,
            required: true
        },
        /**
         * sets the label of the y axis
         * @param {String} yValue the value of the y axis
         * @returns {String}  the label of the y axis
         */
        renderLabelYAxis: {
            type: Function,
            required: true
        },
        /**
         * sets the description for the x axis
         */
        descriptionXAxis: {
            type: String,
            required: false,
            default: ""
        },
        /**
         * sets the description for the y axis
         */
        descriptionYAxis: {
            type: String,
            required: false,
            default: ""
        },
        /**
         * a function (datetime) to write the text of the legend with
         * @param {String} datetime the full datetime of the first element in a dataset (format "YYYY-MM-DD HH:mm:ss")
         * @returns {String}  the text for the legend
         */
        renderLabelLegend: {
            type: Function,
            required: true
        },

        doInterpolate: {
            type: Boolean,
            required: false,
            default: true
        },
        colors: {
            type: Array,
            required: true
        },
        interpolatedColors: {
            type: Array,
            required: true
        }
    },
    data () {
        return {
            chartData: {},
            ctx: "",
            fontColorGraph: "black",
            fontColorLegend: "#555555",
            fontSizeGraph: 10,
            fontSizeLegend: 12,
            gridLinesColor: "black",
            colorTooltipFont: "#555555",
            colorTooltipBack: "#f0f0f0",
            /**
             * the animation to use on diagram update
             * @see update https://www.chartjs.org/docs/latest/developers/api.html?h=update(config)
             */
            updateAnimation: {},

            chart: null
        };
    },
    computed: {
        ...mapGetters("Modules/SensorChart", [
            "activeTabId"
        ])
    },
    watch: {
        apiData (newData, oldValue) {
            if (!oldValue.length) {
                this.destroyChart();
                this.chartData = this.createDataForDiagram(newData, this.colors, this.renderLabelLegend);
                this.createChart(this.chartData, this.ctx);
            }
            else if (Array.isArray(newData) && newData.length) {
                this.chart.data = this.createDataForDiagram(newData, this.colors, this.renderLabelLegend);
                this.chart.update(this.updateAnimation);
            }
            else {
                this.destroyChart();
            }
        },
        renderLabelXAxis (newData) {
            this.chart.options.scales.x.ticks.callback = (xValue) => {
                return newData(this.chart.data.labels[xValue]);
            };
        },
        descriptionYAxis (newData) {
            this.chart.options.scales.y.title.text = newData;
            this.chart.options.scales.y.title.display = Boolean(newData);
        },
        activeTabId () {
            this.destroyChart();
        }
    },
    mounted () {
        this.chartData = this.createDataForDiagram(this.apiData, this.colors, this.renderLabelLegend);
        this.ctx = this.$el.getElementsByTagName("canvas")[0].getContext("2d");

        this.createChart(this.chartData, this.ctx);
    },
    methods: {
        calcMedium (values) {
            if (values.length === 0) {
                return 0;
            }

            let filteredValues = values.filter(function (val) {
                return val !== null;
            });

            filteredValues.sort(function (a, b) {
                return a - b;
            });

            if (filteredValues.length > 2) {
                filteredValues = filteredValues.slice(1, filteredValues.length - 1);
            }

            const sum = filteredValues.reduce((a, b) => a + b, 0);

            return Math.round(sum / filteredValues.length);

        },

        interpolateData (odata, medianSurround = 5) {
            const mdata = odata.slice(); // first copy old array

            for (let i = 0, len = odata.length | 0; i < len; i = i + 1 | 0) {
                if ((i >= 1) && (i < (odata.length - 1))) { // do not compute first or last element
                    const leftSurround = Math.max(0, i - medianSurround),
                        rightSurround = Math.min(i + medianSurround, odata.length - 1),
                        surrounding = odata.slice(leftSurround, rightSurround);

                    mdata[i] = this.calcMedium(surrounding);
                }
            }
            // cleanup
            for (let i = 0, len = mdata.length | 0; i < len; i = i + 1 | 0) {
                if (odata[i] === null) {
                    mdata[i] = null;
                }
            }
            return mdata;
        },

        /**
         * Creating the diagram from chart js
         * @param {Object[]} data parsed for chartjs format
         * @param {html} ctx the canvas container for diagram
         * @returns {Void}  -
         */
        createChart (data, ctx) {
            this.chart = shallowRef(new ChartJs(ctx, this.getChartJsConfig(data, {
                colorTooltipFont: this.colorTooltipFont,
                colorTooltipBack: this.colorTooltipBack,
                setTooltipValue: this.setTooltipValue,
                fontSizeGraph: this.fontSizeGraph,
                fontSizeLegend: this.fontSizeLegend,
                fontColorGraph: this.fontColorGraph,
                fontColorLegend: this.fontColorLegend,
                gridLinesColor: this.gridLinesColor,
                xAxisTicks: this.xAxisTicks,
                yAxisTicks: this.yAxisTicks,
                renderLabelXAxis: this.renderLabelXAxis,
                renderLabelYAxis: this.renderLabelYAxis,
                descriptionXAxis: this.descriptionXAxis,
                descriptionYAxis: this.descriptionYAxis
            })));
        },
        /**
         * Destroys the current chart if exists.
         * @returns {void}
         */
        destroyChart () {
            if (this.chart instanceof ChartJs) {
                this.chart.destroy();
                this.chart = null;
            }
        },
        /**
         * creates the datasets for chartjs
         * @param {Object[]} apiData the apiData as received by parent
         * @param {String[]} colors an array of colors to use for coloring the datasets
         * @param {Function} callbackRenderLabelLegend a function(datetime) to render the text of the legend
         * @returns {Object}  an object {labels, datasets} to use for chartjs
         */
        createDataForDiagram (apiData, colors, callbackRenderLabelLegend) {
            if (!Array.isArray(apiData) || apiData.length === 0 || typeof apiData[0] !== "object" || apiData[0] === null || Object.keys(apiData[0]).length === 0) {
                return [];
            }
            let meansOfTransportKey = Object.keys(apiData[0])[0];
            const labelsXAxis = [],
                datasets = [],
                keysOfFirstDataset = Object.keys(apiData[0][meansOfTransportKey]);

            keysOfFirstDataset.forEach(datetime => {
                labelsXAxis.push(datetime);
            });

            apiData.forEach((dataset, timeStampIdx) => {
                Object.entries(dataset).forEach((dataObj, idx) => {
                    meansOfTransportKey = dataObj[0];

                    const datetimes = Object.keys(dataObj[1]),

                        origData = Object.values(dataObj[1]),
                        useColorIdx = (timeStampIdx * Object.keys(dataset).length + idx) % colors.length;

                    if (this.doInterpolate) {
                        datasets.push({
                            label: typeof callbackRenderLabelLegend === "function" ? callbackRenderLabelLegend(meansOfTransportKey) : "",
                            data: origData,
                            backgroundColor: Array.isArray(colors) ? colors[useColorIdx] : "",
                            borderColor: Array.isArray(colors) ? colors[useColorIdx] : "",
                            spanGaps: false,
                            fill: false,
                            borderWidth: 1,
                            pointRadius: 1,
                            pointHoverRadius: 3,
                            showLine: false,
                            datetimes,
                            showInLegend: true // extra flag for hide or show legend
                        });

                        const interpolatedData = this.interpolateData(origData, Math.round(origData.length / 50));

                        datasets.push({
                            label: typeof callbackRenderLabelLegend === "function" ? callbackRenderLabelLegend(meansOfTransportKey) + "(" + this.$t("additional:modules.tools.gfi.themes.sensorChart.interpolated") + ")" : "",
                            data: interpolatedData,
                            backgroundColor: this.interpolatedColors[useColorIdx],
                            borderColor: this.interpolatedColors[useColorIdx],
                            spanGaps: true,
                            fill: false,
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 0,
                            tension: 0.4,
                            datetimes,
                            showInLegend: false // extra flag for hide or show legend (interpolated data should not be shown)
                        });
                    }
                    else { // do not interpolate, mostly in diagrams wout that many points
                    // do show lines between points with tension, use stronger colors
                        datasets.push({
                            label: typeof callbackRenderLabelLegend === "function" ? callbackRenderLabelLegend(meansOfTransportKey) : "",
                            data: origData,
                            backgroundColor: this.interpolatedColors[useColorIdx], // use stronger colors for normal line then
                            borderColor: this.interpolatedColors[useColorIdx],
                            spanGaps: false,
                            fill: false,
                            borderWidth: 2,
                            pointRadius: 3,
                            pointHoverRadius: 3,
                            tension: 0.4,
                            datetimes,
                            showInLegend: true // extra flag for hide or show legend
                        });
                    }
                });
            });

            return {labels: labelsXAxis, datasets};
        },
        /**
         * returns the config for chart js
         * @param {Object} data the data to use
         * @param {Object} givenOptions an object with the callbacks and values used to create the config
         * @returns {Object}  an object to use as config for chartjs
         */
        getChartJsConfig (data, givenOptions) {
            const options = Object.assign({
                colorTooltipFont: "#555555",
                colorTooltipBack: "#f0f0f0",
                setTooltipValue: tooltipItem => {
                    return tooltipItem.value;
                },
                fontSizeGraph: 10,
                fontSizeLegend: 12,
                fontColorGraph: "black",
                fontColorLegend: "#555555",
                gridLinesColor: "black",
                xAxisTicks: 0,
                yAxisTicks: 0,
                renderLabelXAxis: datetime => datetime,
                renderLabelYAxis: yValue => yValue,
                descriptionXAxis: "",
                descriptionYAxis: ""
            }, givenOptions);

            return {
                type: "line",
                data,
                options: {
                    title: {
                        display: false
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    elements: {
                        line: {
                            tension: 0
                        }
                    },
                    legend: {
                        // display: true,
                        onClick: (e) => e.stopPropagation(),
                        // labels: {
                        //     usePointStyle: true,
                        //     fontSize: options.fontSizeLegend,
                        //     fontColorLegend: options.fontColorLegend
                        // },
                        // align: "start"
                        display: false
                    },
                    legendCallback: function (chart) {
                        const text = [];

                        text.push("<p>");
                        for (let i = 0; i < chart.data.datasets.length; i++) {
                            if (chart.data.datasets[i].showInLegend) {
                                text.push("<span style=\"display:inline-block; width:15px; height: 15px; background-color:" + chart.data.datasets[i].borderColor + ";\"></span>&nbsp;" + chart.data.datasets[i].label + "&nbsp;&nbsp;&nbsp;&nbsp;");
                            }
                        }
                        text.push("</p>");
                        return text.join("");
                    },

                    tooltips: {
                        bodyFontColor: options.colorTooltipFont,
                        backgroundColor: options.colorTooltipBack,
                        yAlign: "bottom",
                        custom: (tooltip) => {
                            if (!tooltip) {
                                return;
                            }
                            // disable displaying the color box;
                            tooltip.displayColors = false;
                        },
                        callbacks: {
                            // use label callback to return the desired label
                            label: (tooltipItem, chartJsData) => {
                                if (
                                    typeof chartJsData === "object"
                                    && Array.isArray(chartJsData.datasets)
                                    && typeof chartJsData.datasets[tooltipItem.datasetIndex] === "object"
                                    && Array.isArray(chartJsData.datasets[tooltipItem.datasetIndex].datetimes)
                                    && chartJsData.datasets[tooltipItem.datasetIndex].datetimes[tooltipItem.index]
                                ) {
                                    tooltipItem.datetime = chartJsData.datasets[tooltipItem.datasetIndex].datetimes[tooltipItem.index];
                                }
                                else if (typeof tooltipItem === "object") {
                                    tooltipItem.datetime = tooltipItem.label;
                                }

                                return options.setTooltipValue(tooltipItem);
                            },
                            // remove title
                            title: () => {
                                return false;
                            }
                        }
                    },
                    hover: {
                        mode: "nearest",
                        intersect: true,
                        onHover: function (e) {
                            const point = this.getElementAtEvent(e);

                            if (point.length) {
                                e.target.style.cursor = "pointer";
                            }
                            else {
                                e.target.style.cursor = "default";
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            beginAtZero: true,
                            ticks: {
                                fontSize: options.fontSizeGraph,
                                fontColor: options.fontColorGraph,
                                autoSkip: true,
                                maxTicksLimit: options.xAxisTicks,
                                callback: (xValue) => {
                                    return options.renderLabelXAxis(data.labels[xValue]);
                                }
                            },
                            gridLines: {
                                color: options.gridLinesColor,
                                display: true,
                                drawBorder: true,
                                drawOnChartArea: false
                            },
                            title: {
                                display: Boolean(options.descriptionXAxis),
                                text: options.descriptionXAxis
                            }
                        },
                        y: {
                            display: true,
                            beginAtZero: true,
                            ticks: {
                                fontSize: options.fontSizeGraph,
                                fontColor: options.fontColorGraph,
                                maxTicksLimit: options.yAxisTicks,
                                callback: (yValue) => {
                                    return options.renderLabelYAxis(yValue);
                                }
                            },
                            gridLines: {
                                color: options.gridLinesColor,
                                display: true,
                                drawBorder: true,
                                drawOnChartArea: false
                            },
                            title: {
                                display: Boolean(options.descriptionYAxis),
                                labelString: options.descriptionYAxis
                            }
                        }
                    }
                }
            };
        }
    }
};
</script>

<template>
    <div class="graph">
        <canvas
            :id="`trafficCountChart_${activeTabId}`"
            :ref="`trafficCountChart_${activeTabId}`"
        />
    </div>
</template>

<style lang="scss" scoped>
    div.graph {
        // width: 580px;
        min-height: 285px;
        padding-bottom: 15px;
    }

    @media (max-width: 580px) {
        div.graph {
            width: inherit;
        }
    }
</style>

<style lang="scss">
    .sensorChart-gfi .dateSelector {
        margin: 20px 0;
        height: 35px;
        font-family: "MasterPortalFont Bold", "Arial Narrow", Arial, sans-serif;
    }

    @media (max-width: 580px) {
        .sensorChart-gfi .dateSelector {
            width: 100%;
            padding: 0 10px;
            margin-top: 10px;
            margin-right: 0px;
            margin-bottom: 20px;
        }
        #dayDateInput, #weekDateInput, #yearDateInput {
            text-align: center;
        }
    }
</style>

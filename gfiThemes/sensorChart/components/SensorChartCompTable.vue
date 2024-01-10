<script>
export default {
    name: "SensorChartCompTable",
    props: {
        /**
         * the array as it comes from the api
         * e.g. [{bikes: {date: value}}]
         */
        apiData: {
            type: Array,
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
        }
    }
};
</script>

<template>
    <div class="table-wrapper">
        <div class="table-responsive">
            <table class="table table-striped table-condensed table-bordered text-nowrap">
                <thead>
                    <tr>
                        <th class="th-first-col" />
                        <th
                            v-for="(value, datetime) in getFirstDataset(apiData)"
                            :key="datetime"
                            class="th-rest-cols"
                        >
                            {{ setColTitle(datetime) }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(dataObjFlat, idx) in getFlatApiData(apiData)"
                        :key="idx"
                    >
                        <td class="td-first-col">
                            {{ setRowTitle(dataObjFlat.key, getFirstKeyOfObject(dataObjFlat.dataset)) }}
                        </td>
                        <td
                            v-for="(value, datetime) of dataObjFlat.dataset"
                            :key="datetime"
                        >
                            {{ setFieldValue(value) }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    div.table {
        margin-top: 5px;
        margin-bottom: 10px;
        overflow: auto;
        text-align: center;
        tbody > tr > td {
            min-width: 50px;
            &:first-child {
                font-weight: bold;
            }
        }
    }
    .table-wrapper{
        width:100%;
        position:relative;
        max-height: 200px;
        overflow: scroll
    }
    .table-responsive {
        margin-bottom: 0px;
        width:100%;
    }
    .th-first-col {
        text-align: center;
        vertical-align: middle;
        font-size: 16px;
    }
    .th-rest-cols {
        text-align: center;
        vertical-align: middle;
        font-size: 13px;
    }
    .td-first-col {
        text-align: left;
    }
</style>

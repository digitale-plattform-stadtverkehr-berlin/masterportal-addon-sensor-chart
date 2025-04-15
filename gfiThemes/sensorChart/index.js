import component from "./components/SensorChart.vue";
import SensorChartStore from "./store/indexSensorChart";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: component,
    store: SensorChartStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};

import getters from "./gettersSensorChart";
import mutations from "./mutationsSensorChart";
import state from "./stateSensorChart";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};

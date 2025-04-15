import {generateSimpleGetters} from "../../../../src/shared/js/utils/generators";
import state from "./stateSensorChart";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;

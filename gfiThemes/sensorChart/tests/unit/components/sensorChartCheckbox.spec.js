import Vuex from "vuex";
import {shallowMount, createLocalVue, config} from "@vue/test-utils";
import {expect} from "chai";
import sensorChartCheckbox from "../../../components/SensorChartCheckbox.vue";

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

describe("addons/sensorChart/components/SensorChartCheckbox.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(sensorChartCheckbox, {
            propsData: {
                tableDiagramId: "diagramDay"
            },
            localVue
        });
    });

    describe("checkboxLabel", () => {
        it("should equal to diagramLabel", () => {
            expect(wrapper.vm.checkboxLabel).to.equal(wrapper.vm.diagramLabel);
        });

        it("should equal to tableLabel", () => {
            wrapper = shallowMount(sensorChartCheckbox, {
                propsData: {
                    tableDiagramId: "tableDay"
                },
                localVue
            });
            expect(wrapper.vm.checkboxLabel).to.equal(wrapper.vm.tableLabel);
        });
    });

    describe("isChecked", () => {
        it("should return false if it is by table", () => {
            wrapper = shallowMount(sensorChartCheckbox, {
                propsData: {
                    tableDiagramId: "tableDay"
                },
                localVue
            });
            expect(wrapper.vm.isChecked).to.be.false;
        });
    });
});

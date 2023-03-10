<script>
export default {
    name: "SensorChartCalendarButtonGroup",
    props: {
        inputId: {
            type: String,
            required: true
        }
    },
    methods: {
        openCalendar () {
            document.getElementById(this.inputId).focus();
        }
    }
};
</script>

<template>
    <span class="input-group-btn">
        <button
            :id="`${inputId}Button`"
            class="btn btn-outline-dark"
            type="button"
            @click="openCalendar"
        >
            <span
                class="bootstrap-icon"
                aria-hidden="true"
            >
                <i class="bi-grid-3x3-gap-fill" />
            </span>
        </button>
    </span>
</template>

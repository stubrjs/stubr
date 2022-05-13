<template>
    <div class="separator-line">
        <div class="separator-line-label">
            <span class="no-of-events">{{ noOfHiddenEntries }}</span>
            {{ labelText }}
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
    props: {
        noOfHiddenEntries: {
            type: Number,
        },
    },
    computed: {
        labelText() {
            if (this.noOfHiddenEntries === 1) {
                return 'event hidden';
            } else {
                return 'events hidden';
            }
        },
    },
});
</script>

<style lang="scss" scoped>
@import '@/scss/main';

.separator-line {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 2px;
    background: #e1e3ec;
    border-radius: 3px;
    position: relative;

    .separator-line-label {
        background: $c-background;
        padding: 0 10px;
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.1rem;
        color: darken($c-reduced-presence-level-1, 20%);
        vertical-align: middle;

        .no-of-events {
            font-size: 1.35em;
            padding-right: 3px;
            vertical-align: middle;
        }
    }
}
</style>

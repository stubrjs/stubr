<template>
    <div :class="{ badge: true, active: active }" @click="onClick()">
        <slot></slot>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
    props: {
        active: {
            type: Boolean,
        },
    },
    methods: {
        onClick() {
            this.$emit('change', !this.active);
        },
    },
});
</script>

<style lang="scss" scoped>
@import '@/scss/main';

.badge {
    font-size: 0.8rem;
    padding: 2px 10px;
    border-radius: 10px;
    color: #fff;
    background: #dde0e9;
    cursor: pointer;
    user-select: none;

    &:hover {
        background: darken(#dde0e9, 5%);
    }

    &.active {
        background: darken(#dde0e9, 20%);
        box-shadow: $l-tag-box-shadow-hover;

        &:hover {
            background: darken(#dde0e9, 15%);
        }
    }
}
</style>

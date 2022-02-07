<template>
    <div class="section">
        <div class="head">
            <slot name="name"></slot>
        </div>
        <div class="body">
            <slot name="body"></slot>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({});
</script>

<style lang="scss" scoped>
@import '@/scss/main';

.section {
    margin-top: 20px;

    .head {
        padding: 20px 0;
        //border-bottom: 2px solid $c-tile-separator;
        font-size: 19px;
        font-weight: 500;
        letter-spacing: 0.8px;
        color: #636e91;
    }

    .body {
        //padding: 20px 0;
    }
}
</style>

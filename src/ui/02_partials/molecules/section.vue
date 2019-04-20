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

    export default Vue.extend({
        
    });
</script>

<style lang="scss" scoped>
    @import "../../01_scss/main";

    .section {
        border-radius: 5px;
        background: #FFF;
        box-shadow: 0 1px 1px 0 rgba(213, 213, 213, 0.5);

        .head {
            padding: 10px;
            border-bottom: 1px solid $c-tile-separator;
            font-size: 15px;
            font-weight: 500;
            letter-spacing: 0.6px;
        }

        .body {
            padding: 20px 10px;
        }
    }
    
</style>


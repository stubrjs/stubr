<template>
    <div class="header">
        <div class="inner">
            <div v-html="logo" class="logo"></div>
            <div>
                <span
                    :class="{
                        'connection-status': true,
                        connected: connected,
                        disconnected: !connected
                    }"
                >
                    {{ connected ? 'connected' : 'disconnected' }}
                </span>
                <span class="version">v{{ version }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';
import pkg from '../../../package.json';
const Logo = require('@/assets/svg/logo.svg') as string;

export default Vue.extend({
    data() {
        return {
            logo: Logo
        };
    },
    computed: {
        ...mapGetters(['connected']),
        version() {
            return pkg?.version;
        }
    }
});
</script>

<style lang="scss" scoped>
@import '@/scss/main';

.header {
    z-index: 1;
    position: relative;
    top: 0;
    left: 0;
    height: $l-header-height;
    width: 100%;

    .inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        max-width: $l-max-content-width;
        margin: 0 auto;

        .logo {
            display: flex;
            align-items: center;
            width: 100px;
            height: 40px;

            .name {
                font-family: 'QuickSand';
                padding-left: 10px;
                font-size: 25px;
                font-weight: 500;
            }
        }

        .connection-status {
            font-size: 13px;
            padding-right: 10px;

            &.disconnected {
                color: $c-error;
            }

            &.connected {
                color: $c-success;
            }
        }

        .version {
            font-size: 13px;
            color: $c-reduced-presence-level-1;
        }
    }
}
</style>

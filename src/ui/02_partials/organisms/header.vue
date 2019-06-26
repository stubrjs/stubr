<template>
    <div class="header">
        <div class="inner">
            <div class="logo">
                <div>
                    <img src="../../00_assets/img/logo.png" />
                </div>
                <div class="name">Stubr</div>
            </div>
            <div>
                <span 
                    :class="{'connection-status': true, 'connected': connected, 'disconnected': !connected}">
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
    import * as pjson from '../../../../package.json';

    export default Vue.extend({
        computed: {
            ...mapGetters([
                'connected'
            ]),
            version () {
                return (<any>pjson).version;
            }
        }
    });
</script>

<style lang="scss" scoped>
    @import "../../01_scss/main";

    .header {
        z-index: 1;
        position: fixed;
        top: 0;
        left: 0;
        height: $l-header-height;
        width: 100%;
        background: #FFF;

        .inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            height: 100%;
            padding: 0 20px;
            max-width: $l-max-content-width;
            margin: 0 auto;

            .logo {
                display: flex;
                align-items: center;

                img {
                    display: block;
                    width: 35px;
                }

                .name {
                    font-family: "QuickSand";
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

<template>
    <div class="header">
        <div class="inner">
            <div class="logo">
                <div>
                    <img src="../../00_assets/img/logo.png" srcset="../../00_assets/img/logo.png 1x, ../../00_assets/img/logo@2x.png 2x" />
                </div>
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
    import pkg from '../../../../package.json';

    export default Vue.extend({
        computed: {
            ...mapGetters([
                'connected'
            ]),
            version () {
                return pkg?.version;
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

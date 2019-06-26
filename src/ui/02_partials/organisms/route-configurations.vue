<template>
    <div class="route-configurations-section">
        <div class="route-configurations">
            <transition-group name="route-configs">
                <v-route-configuration
                    v-for="routeConfiguration in visibleRouteConfigurations"
                    :key="routeConfiguration.id"
                    class="route-configuration"
                    :route-configuration="routeConfiguration" />
            </transition-group>
        </div>
        <div class="list-expander">
            <button 
                v-if="routeConfigurations && routeConfigurations.length > minimizedItemsMax"
                class="toggle-trigger"
                @click="isListExpanded = !isListExpanded">{{ expandListLabel }}</button>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import { mapGetters } from 'vuex';
    import RouteConfiguration from './route-configuration.vue';

    export default Vue.extend({
        data () {
            return {
                isListExpanded: false,
                minimizedItemsMax: 3
            }
        },
        computed: {
            ...mapGetters([
                'routeConfigurations'
            ]),
            expandListLabel () {
                return (this as any).isListExpanded ? "show less routes" : "show all routes";
            },
            visibleRouteConfigurations () {
                if ((this as any).isListExpanded) {
                    return (this as any).routeConfigurations;
                } else {
                    let _configurations: any[] = [];

                    // push min visible routes routes
                    _configurations = (this as any).routeConfigurations.slice(0, (this as any).minimizedItemsMax);

                    // push intercepted routes
                    const _interceptedRoutes = 
                        (this as any).routeConfigurations
                            .slice((this as any).minimizedItemsMax, (this as any).routeConfigurations.length)
                            .filter((config) => {
                                return config.methods.find((method) => {
                                    return method.intercepted === true;
                                });
                            });

                    _configurations = [..._configurations, ..._interceptedRoutes];

                    // reduce by not intercepted if _configurations.length > minimizedItemsMax
                    const _overhang = _configurations.length - (this as any).minimizedItemsMax
                    if (_overhang > 0) {
                        _configurations.reverse();
                        for (let i = _overhang; i > 0; i--) {
                            const _index = _configurations.findIndex((config) => {
                                return !config.methods.find((method) => {
                                    return method.intercepted === true;
                                });
                            });

                            if (_index >= 0) {
                                _configurations.splice(_index, 1);
                            }
                        }
                        _configurations.reverse();
                    }

                    return _configurations;
                }
            }
        },
        components: {
            vRouteConfiguration: RouteConfiguration
        }
    });
</script>


<style lang="scss" scoped>
    @import "../../01_scss/main";

    .route-configurations-section {
        position: relative;

        .route-configurations {
            .route-configuration {
                &:last-child {
                    border-bottom: 0;
                }
            }

            .route-configs-item {
                display: inline-block;
                margin-right: 10px;
                //height: 42px;
            }

            .route-configs-enter-active {
                //height: 32px;
                transition: all 0.35s;
            }

            .route-configs-enter, .route-configs-leave-to /* .list-leave-active below version 2.1.8 */ {
                opacity: 0;
            }
        }

        .list-expander {
            //background: #F00;
            text-align: center;

            .toggle-trigger {
                transition: all 0.2s;
                color: $c-highlight;
                font-size: 14px;
                padding: 4px 15px;
                border-radius: 3px;
                background: none;
                border: none;
                outline: 0;

                &:hover {
                    cursor: pointer;
                    background: $c-highlight;
                    color: #FFF;
                }
            }
        }
    }
</style>

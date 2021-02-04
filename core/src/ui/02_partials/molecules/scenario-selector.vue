<template>
    <div :class="['scenario-selection', color]">
        <div class="title">Manual Response Case Selection</div>
        <div class="tiles">
            <div 
                v-for="scenario in scenarios"
                :key="scenario.id"
                class="tile"
                @click="$emit('scenario-selected', scenario)">
                <div><span v-if="scenario.group">{{ scenario.group }}:</span> {{ scenario.name }}</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';

    export default Vue.extend({
        props: {
            scenarios: {
                type: Array
            },
            color: {
                type: String
            }
        }
    });
</script>

<style lang="scss" scoped>
    @import "../../01_scss/main";

    .scenario-selection {
        &.green {
            .tiles > .tile:hover {
                border-color: $c-green;
                background: $c-green;
                box-shadow: 0 1px 7px 0 rgba($c-green, 0.5);
            }
        }

        &.blue {
            .tiles > .tile:hover {
                border-color: $c-blue;
                background: $c-blue;
                box-shadow: 0 1px 7px 0 rgba($c-blue, 0.5);
            }
        }

        &.red {
            .tiles > .tile:hover {
                border-color: $c-red;
                background: $c-red;
                box-shadow: 0 1px 7px 0 rgba($c-red, 0.5);
            }
        }

        &.purple {
            .tiles > .tile:hover {
                border-color: $c-purple;
                background: $c-purple;
                box-shadow: 0 1px 7px 0 rgba($c-purple, 0.5);
            }
        }

        .title {
            color: $c-reduced-presence-level-1;
            font-size: 11px;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 10px;
        }

        .tiles {
            display: flex;
            flex-wrap: wrap;
            margin-bottom: -10px;
            margin-right: -10px;

            .tile {
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 14px;
                font-weight: 500;
                height: 100px;
                background: $c-reduced-presence-level-2;
                border-radius: 5px;
                border: 1px solid $c-tile-separator;
                margin-right: 10px;
                margin-bottom: 10px;
                padding: 10px;
                transition: all 0.2s;

                width: calc(25% - 10px);
                @media screen and (max-width: 720px) {
                    width: calc(33.33% - 10px);
                }

                &:hover {
                    background: $c-tile-separator;
                    color: #FFF;
                    cursor: pointer;
                    transform: scale(1.03);
                    box-shadow: 0 1px 7px 0rgba(#{$c-tile-separator}, 0.5);
                }
            }
        }
    }
</style>


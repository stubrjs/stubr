<template>
    <div :class="{'route-configuration': true, 'intercepted': intercepted}">
        <div class="route">{{ routeConfiguration.route }}</div>
        <div class="tags">
            <v-tag 
                v-for="entry in routeConfiguration.methods"
                :key="entry.id"
                :color="getTagColor(entry.method)" 
                :active="entry.intercepted"
                :clickable="true"
                @click="handleRouteMethodClick(entry.method, !entry.intercepted)">{{ entry.method }}</v-tag>
        </div>
    </div>
</template>

<script lang="ts">
    import { find } from 'lodash';
    import uuid from 'uuid/v1';
    import Vue from 'vue';
    import { mapActions } from 'vuex';
    import Tag from '../atoms/tag.vue';
    import { Method } from '../../interfaces/enums';
    import { RouteConfiguration, MethodContext } from '../../interfaces/events';

    export default Vue.extend({
        props: {
            routeConfiguration: {
                type: Object as () => RouteConfiguration
            }
        },
        computed: {
            intercepted (): boolean {
                return find(this.routeConfiguration.methods, (methodContext: MethodContext) => {
                    return methodContext.intercepted;
                }) != undefined || false;
            }
        },
        methods: {
            ...mapActions({
                toggleRouteInterception: 'toggleRouteInterception'
            }),
            getUuid(index: number): string {
                return uuid();
            },
            getTagColor (method: Method): string | void {
				switch (method) {
					case "POST":
						return 'blue';
					case "GET":
						return 'green';
					case "PUT":
						return 'purple';
					case "DELETE":
						return 'red';
					default:
						break;
				}
            },
            handleRouteMethodClick (method: Method, intercepted: boolean): void {
                // @ts-ignore
                this.toggleRouteInterception({
                    routeConfigurationId: this.routeConfiguration.id,
                    method: method,
                    intercepted: intercepted
                })
            }
        },
        components: {
            vTag: Tag
        }
    });
</script>

<style lang="scss" scoped>
    @import "../../01_scss/main.scss";

    .route-configuration {
        display: flex;
        align-items: center;
        position: relative;
        padding: 15px;
        border-bottom: 1px solid $c-tile-separator;
        border-left: 3px solid transparent;

        &.intercepted {
            &:after {
                position: absolute;
                top: 25%;
                left: 0;
                background: $c-interception;
                width: 3px;
                height: 50%;
                content: ""
            }
        }

        .route {
            display: inline-block;
            font-size: 14px;
            padding-left: 10px;
            padding-right: 40px;
            font-weight: 500;
        }

        .tags {
            .tag {
                margin: 0 4px;
            }
        }
    }
</style>


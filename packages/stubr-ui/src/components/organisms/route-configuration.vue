<template>
    <div
        :class="{
            'route-configuration': true,
            intercepted: intercepted,
            filtered: filterActive,
        }"
    >
        <div class="route">{{ routeConfiguration.route }}</div>
        <div class="tags">
            <v-tag
                v-for="entry in routeConfiguration.methods"
                :key="entry.id"
                :color="getTagColor(entry.method)"
                :active="entry.intercepted"
                :clickable="true"
                @click="
                    handleRouteMethodClick(entry.method, !entry.intercepted)
                "
                >{{ entry.method }}</v-tag
            >
        </div>
        <div v-if="noOfLogEntries > 0" class="badge">
            <v-badge
                @change="handleFilterBadgeChange($event)"
                :active="filterActive"
                >{{ noOfLogEntries }}</v-badge
            >
        </div>
    </div>
</template>

<script lang="ts">
import { find } from 'lodash';
import uuid from 'uuid/v1';
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import Tag from '../atoms/tag.vue';
import Badge from '../atoms/badge.vue';
import { Method } from '../../@types/enums';
import { RouteConfiguration, MethodContext } from '../../@types/events';

export default Vue.extend({
    props: {
        routeConfiguration: {
            type: Object as () => RouteConfiguration,
        },
    },
    computed: {
        intercepted(): boolean {
            return (
                find(
                    this.routeConfiguration.methods,
                    (methodContext: MethodContext) => {
                        return methodContext.intercepted;
                    }
                ) != undefined || false
            );
        },
        ...mapGetters(['logEntriesPerRoute', 'enabledRouteFilters']),
        noOfLogEntries(): number {
            return this.logEntriesPerRoute[this.routeConfiguration?.route]
                ? this.logEntriesPerRoute[this.routeConfiguration?.route]
                : 0;
        },
        filterActive(): boolean {
            return this.enabledRouteFilters?.[this.routeConfiguration?.route]
                ? this.enabledRouteFilters?.[this.routeConfiguration?.route]
                : false;
        },
    },
    methods: {
        ...mapActions({
            toggleRouteInterception: 'toggleRouteInterception',
            filterForRouteChanged: 'filterForRouteChanged',
        }),
        getUuid(): string {
            return uuid();
        },
        getTagColor(method: Method): string | void {
            switch (method) {
                case 'POST':
                    return 'blue';
                case 'GET':
                    return 'green';
                case 'PUT':
                    return 'purple';
                case 'PATCH':
                    return 'yellow';
                case 'DELETE':
                    return 'red';
                default:
                    break;
            }
        },
        handleRouteMethodClick(method: Method, intercepted: boolean): void {
            this.toggleRouteInterception({
                routeConfigurationId: this.routeConfiguration.id,
                method: method,
                intercepted: intercepted,
            });
        },
        handleFilterBadgeChange(status: boolean) {
            this.filterForRouteChanged({
                route: this.routeConfiguration?.route,
                status,
            });
        },
    },
    components: {
        vTag: Tag,
        vBadge: Badge,
    },
});
</script>

<style lang="scss" scoped>
@import '@/scss/main';

.route-configuration {
    display: flex;
    align-items: center;
    position: relative;
    padding: 12px 0;
    border-left: 3px solid transparent;

    &.intercepted {
        &:before {
            position: absolute;
            top: 50%;
            margin-top: -3px;
            left: -20px;
            background: $c-interception;
            box-shadow: 0 1px 7px 0 rgba(255, 104, 10, 0.5);
            width: 6px;
            height: 6px;
            border-radius: 50%;
            content: '';
        }

        &.filtered {
            &:after {
                left: -16px;
            }
        }
    }

    &.filtered {
        &:after {
            position: absolute;
            top: 50%;
            margin-top: -3px;
            left: -20px;
            background: $c-filter;
            box-shadow: 0 1px 7px 0 rgba(23, 77, 255, 0.5);
            width: 6px;
            height: 6px;
            border-radius: 50%;
            content: '';
        }

        &.intercepted {
            &:before {
                left: -24px;
            }
        }
    }

    .route {
        display: inline-block;
        font-size: 15px;
        padding-left: 0;
        padding-right: 30px;
        font-weight: 400;
    }

    .tags {
        .tag {
            margin: 0 4px;
        }
    }

    .badge {
        margin-left: 10px;
    }
}
</style>

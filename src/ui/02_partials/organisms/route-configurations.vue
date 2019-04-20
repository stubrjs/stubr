<template>
    <div class="route-configurations">
        <v-route-configuration
            v-for="(routeConfiguration, index) in routeConfigurations"
            :key="'rc-' + index"
            class="route-configuration"
            :route-configuration="routeConfiguration" />
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import { mapGetters } from 'vuex';
    import RouteConfiguration from './route-configuration.vue';

    export default Vue.extend({
        computed: {
            ...mapGetters([
                'routeConfigurations'
            ])
        },
        components: {
            vRouteConfiguration: RouteConfiguration
        }
    });
</script>


<style lang="scss" scoped>
    .route-configurations {
        .route-configuration {
            &:last-child {
                border-bottom: 0;
            }
        }
    }
</style>

<template>
	<div class="entry">
		<v-header></v-header>
		<v-section class="section">
			<span slot="name">
				<span>Routes</span>
				<span 
					v-if="numberOfInterceptionMarkers == 1" 
					class="interception-counter">
					{{ numberOfInterceptionMarkers }} route intercepted
				</span>
				<span 
					v-if="numberOfInterceptionMarkers > 1"
					class="interception-counter">
					{{ numberOfInterceptionMarkers }} routes intercepted
				</span>
			</span>
			<v-route-configurations slot="body"></v-route-configurations>
		</v-section>
		<v-section class="section">
			<span slot="name">Event Log</span>
			<v-log-tiles slot="body"></v-log-tiles>
		</v-section>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { mapActions, mapGetters } from 'vuex';

	import Header from '../02_partials/organisms/header.vue';
	import RouteConfigurations from '../02_partials/organisms/route-configurations.vue';
	import LogTiles from '../02_partials/organisms/log-tiles.vue';
	import Section from '../02_partials/molecules/section.vue';

	export default Vue.extend({
		computed: {
			...mapGetters([
				'numberOfInterceptionMarkers'
			])
		},
		methods: {
			...mapActions({
				initStore: 'init'
			})
		},
		mounted () {
			this.initStore();
		},
		components: {
			vHeader: Header,
			vRouteConfigurations: RouteConfigurations,
			vLogTiles: LogTiles,
			vSection: Section
		}
	})
</script>

<style lang="scss">
	@import "../01_scss/main.scss";

	.entry {
		padding: calc(#{$l-header-height} + 20px) 20px 20px 20px;
		max-width: $l-max-content-width;
		margin: 0 auto;

		.section {
			margin-bottom: 40px;

			&:last-child {
				margin-bottom: 0;
			}
		}

		.interception-counter {
			padding-left: 20px;
			color: $c-interception;
			font-size: 12px;
		}
	}
</style>

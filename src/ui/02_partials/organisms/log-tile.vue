<template>
	<div class="log-tile">
		<div class="head">
			<div class="head-left" style="display: flex; align-items: center;">
				<div :class="['route-type', routeClass]">{{ logEntry.method }}</div>
				<div class="route">{{ logEntry.route }}</div>
				<v-tag 
					v-if="noRouteMatch"
					color="red">NO ROUTE MATCH</v-tag>
				<v-tag 
					v-if="noScenarioMatch"
					color="red">NO CASE MATCH</v-tag>
				<v-tag 
					v-if="intercepted"
					color="orange">INTERCEPTED</v-tag>
				<v-icon
					v-if="caseMatch"
					class="checkmark"
					width="15px"
					height="15px"
					name="checkmark"
					color="green" />
				<div 
					v-if="logEntry.group" 
					class="group">
					{{ logEntry.group }}: 
				</div>
				<div 
					v-if="logEntry.name" 
					class="name">
					{{ logEntry.name }}
				</div>
			</div>
			<div class="head-right">
				<span 
					v-if="logEntry.delay"
					class="delay">
						delayed by {{ logEntry.delay }}ms
				</span>
			</div>
		</div>
		<div class="body">
			<v-formatted-payload 
				v-if="logEntry.request"
				title="Request"
				:icon-color="color"
				:headers="logEntry.request.headers"
				:body="logEntry.request.body"></v-formatted-payload>

			<v-scenario-selector 
				v-if="logEntry.scenarios"
				class="scenario-selector"
				:scenarios="logEntry.scenarios"
				:color="color"
				@scenario-selected="handleScenarioSelected" />

			<v-formatted-payload 
				v-if="logEntry.response"
				title="Response"
				:icon-color="color"
				:headers="logEntry.response.headers"
				:body="logEntry.response.body"
				:status-code="logEntry.response.status"></v-formatted-payload>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { mapActions } from 'vuex';
	import FormattedPayload from '../molecules/formatted-payload.vue';
	import ScenarioSelector from '../molecules/scenario-selector.vue';
	import Tag from '../atoms/tag.vue';
	import Icon from '../atoms/icon.vue';
	import { LogEntryLocal } from '../../interfaces/events';

	export default Vue.extend({
		props: {
			logEntry: {
				type: Object as () => LogEntryLocal
			}
		},
		computed: {
			routeClass (): string | void {
				switch (this.logEntry.method) {
					case "POST":
						return 'post';
					case "GET":
						return 'get';
					case "PUT":
						return 'put';
					case "DELETE":
						return 'delete';
					default:
						break;
				}
			},
			color (): string | void {
                switch (this.logEntry.method) {
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
			noRouteMatch (): boolean {
				return this.logEntry.error && this.logEntry.error.code == "NO_ROUTE_MATCH" || false;
			},
			noScenarioMatch (): boolean {
				return this.logEntry.error && this.logEntry.error.code == "NO_SCENARIO_MATCH" || false;
			},
			intercepted (): boolean {
				return this.logEntry.scenarios !== undefined;
			},
			caseMatch (): boolean {
				return !this.logEntry.error && !this.intercepted;
			}
		},
		methods: {
			...mapActions([
				'resolveRouteInterception'
			]),
			handleScenarioSelected(scenario: { id: string, group?: string, name: string }) {
				// @ts-ignore	
				this.resolveRouteInterception({
					logEntryId: this.logEntry.id,
					scenarioId: scenario.id
				});
			}
		},
		components: {
			vTag: Tag,
			vIcon: Icon,
			vFormattedPayload: FormattedPayload,
			vScenarioSelector: ScenarioSelector
		}
	});
</script>

<style lang="scss" scoped>
	@import "../../01_scss/main";

	.log-tile {
		border-radius: 5px;
		background: #FFF;
		box-shadow: 0 1px 5px 0 rgba(0, 0, 0, 0.15);

		.head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			height: 45px;
			padding: 10px;
			border-bottom: 1px solid $c-tile-separator;

			.route-type {
				display: block;
				font-size: 13px;
				font-weight: 600;
				width: 60px;

				&.post {
					color: $c-route-post;
				}

				&.get {
					color: $c-route-get;
				}

				&.put {
					color: $c-route-put;
				}

				&.delete {
					color: $c-route-delete;
				}
			}

			.route {
				display: block;
				font-size: 13px;
				font-weight: 400;
				padding-right: 40px;
			}

			.checkmark {
				margin-right: 30px;
			}

			.group, .name {
				font-size: 14px;
				color: $c-reduced-presence-level-1;
				font-weight: 400;
				padding-right: 5px;
			}
			
			.delay {
				color: $c-blue;
				font-size: 13px;
				font-weight: 500;
			}
		}

		.body {
			padding: 10px;

			.formatted-payload {
				margin-bottom: 10px;

				&:last-child {
					margin-bottom: 0;
				}
			}

			.scenario-selector {
				margin-top: 30px;
			}
		}
	}
</style>

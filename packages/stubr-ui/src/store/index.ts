import Vue from 'vue';
import Vuex, { MutationTree, ActionTree, GetterTree } from 'vuex';
import { io, Socket } from 'socket.io-client';
import { orderBy, findIndex, clone } from 'lodash';
import {
    RouteConfiguration,
    LogEntryRemote,
    LogEntryLocal,
    RouteInterception,
    ResolveInterception,
    MethodContext
} from '../@types/events';
import { EventType } from '../@types/enums';

Vue.use(Vuex);

interface RootState {
    socket: any;
    connected: boolean;
    routeConfigurations: RouteConfiguration[];
    logEntries: LogEntryLocal[];
}

const state: RootState = {
    socket: Socket,
    connected: false,
    routeConfigurations: [],
    logEntries: []
};

const mutations: MutationTree<RootState> = {
    SET_SOCKET(state, socket: any) {
        state.socket = socket;
    },
    SET_CONNECTED(state, isConnected: boolean) {
        state.connected = isConnected;
    },
    SET_ROUTE(state, routeConfiguration: RouteConfiguration) {
        const _foundRouteIndex = findIndex(
            state.routeConfigurations,
            (_routeConfiguration: RouteConfiguration): boolean => {
                return _routeConfiguration.id == routeConfiguration.id;
            }
        );

        if (_foundRouteIndex >= 0) {
            const _routeConfigurationsClone = clone(state.routeConfigurations);
            _routeConfigurationsClone[_foundRouteIndex] = routeConfiguration;
            state.routeConfigurations = _routeConfigurationsClone;
        } else {
            state.routeConfigurations = [
                ...state.routeConfigurations,
                routeConfiguration
            ];
        }
    },
    RESET_ROUTES(state) {
        state.routeConfigurations = [];
    },
    SET_LOG_ENTRY(state, logEntryLocal: LogEntryLocal) {
        const _foundLogEntryIndex = findIndex(
            state.logEntries,
            (logEntry: LogEntryLocal): boolean => {
                return logEntry.id == logEntryLocal.id;
            }
        );

        if (_foundLogEntryIndex >= 0) {
            const _logEntriesClone: LogEntryLocal[] = clone(state.logEntries);
            _logEntriesClone[_foundLogEntryIndex] = {
                ...logEntryLocal,
                timestamp: state.logEntries[_foundLogEntryIndex].timestamp
            };
            state.logEntries = _logEntriesClone;
        } else {
            state.logEntries = [...state.logEntries, logEntryLocal];
        }
    }
};

const actions: ActionTree<RootState, RootState> = {
    init({ commit, dispatch, state }) {
        if (!state.socket) {
            let socket: any = null;

            if (process.env.NODE_ENV == 'development') {
                socket = io('http://localhost:3000');
            } else {
                let _path = '/socket.io';
                if (window && window.location) {
                    _path = window.location.pathname + _path;
                }
                socket = io({ path: _path.replace('//', '/') });
            }

            socket.on('connect', () => {
                commit('RESET_ROUTES');
                commit('SET_CONNECTED', true);
            });

            socket.on('disconnect', () => {
                commit('SET_CONNECTED', false);
            });

            socket.on('LOG_ENTRY', (event: LogEntryRemote) => {
                dispatch('setLogEntry', event);
            });

            socket.on('ROUTE_CONFIG', (event: RouteConfiguration) => {
                dispatch('setRoute', event);
            });

            commit('SET_SOCKET', socket);
        }
    },
    setRoute({ commit }, routeConfiguration: RouteConfiguration) {
        commit('SET_ROUTE', routeConfiguration);
    },
    setLogEntry({ commit }, logEntryRemote: LogEntryRemote) {
        const _logEntryLocal: LogEntryLocal = {
            ...logEntryRemote,
            timestamp: new Date()
        };

        commit('SET_LOG_ENTRY', _logEntryLocal);
    },
    toggleRouteInterception(
        { state, dispatch },
        routeInterception: RouteInterception
    ) {
        if (state.socket) {
            state.socket.emit(
                EventType.MARK_ROUTE_FOR_INTERCEPTIONS,
                routeInterception,
                (routeConfiguration: RouteConfiguration) => {
                    dispatch('setRoute', routeConfiguration);
                }
            );
        } else {
            console.warn(
                'toggleRouteInterception() could not be executed since no socket being defined'
            );
        }
    },
    resolveRouteInterception(
        { state },
        resolveInterception: ResolveInterception
    ) {
        if (state.socket) {
            state.socket.emit(
                EventType.RESOLVE_INTERCEPTION,
                resolveInterception
            );
        } else {
            console.warn(
                'resolveRouteInterception() could not be executed since no socket being defined'
            );
        }
    }
};

const getters: GetterTree<RootState, RootState> = {
    connected(state): boolean {
        return state.connected;
    },
    routeConfigurations(state): RouteConfiguration[] {
        return state.routeConfigurations;
    },
    logEntries(state): LogEntryLocal[] {
        return orderBy(state.logEntries, ['timestamp'], 'desc');
    },
    numberOfInterceptionMarkers(state): number {
        let _counter = 0;
        state.routeConfigurations.forEach(
            (routeConfiguration: RouteConfiguration) => {
                routeConfiguration.methods.forEach(
                    (methodContext: MethodContext) => {
                        if (methodContext.intercepted) _counter++;
                    }
                );
            }
        );
        return _counter;
    }
};

const store = new Vuex.Store<RootState>({
    state,
    mutations,
    actions,
    getters
});

export default store;

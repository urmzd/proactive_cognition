import AsyncStorage from '@react-native-community/async-storage';
import {
	createSlice,
	createAsyncThunk,
	current,
	PayloadAction,
} from '@reduxjs/toolkit';
import moment from 'moment';
import { ErrorMessages, Errors, Statuses } from '../constants/Redux';
import { Keys } from '../constants/Misc';
import {
	LogTemplate,
	RejectedPayload,
	LogTemplateArray,
	RootState,
} from '../types';
import * as FileSystem from 'expo-file-system';

type OptionalLogTemplateProperties = Omit<
	LogTemplate,
	'startDateTime' | 'endDateTime'
>;

export const fetchLogs = createAsyncThunk<
	LogTemplateArray,
	undefined,
	{ rejectValue: RejectedPayload }
>('logs/fetchRecords', async (undefined, { rejectWithValue }) => {
	try {
		const logs = await AsyncStorage.getItem(Keys.LOGS);

		if (logs) {
			const parsedLogs: LogTemplateArray = JSON.parse(logs);

			return parsedLogs;
		} else {
			return rejectWithValue({
				type: Errors.EMPTY,
				message: ErrorMessages.EMPTY_LOG,
			});
		}
	} catch (error) {
		return rejectWithValue({
			type: Errors.RETRIEVAL_ERROR,
			message: ErrorMessages.RETRIEVAL_ERROR,
		});
	}
});

export const downloadLog = createAsyncThunk<
	undefined,
	number | 'all',
	{ rejectValue: RejectedPayload; state: RootState }
>(
	'logs/downloadLog',
	async (payload: number | 'all', { getState, rejectWithValue }) => {
		const header = `Start Date and Time, End Date and Time, Headache Rating, Numbness Rating, Vision Loss Rating, Confusion Rating, Dizziness Rating, Unsteadiness Rating, Notes`;

		const state = getState();
		let body = '';

		let logs =
			payload === 'all'
				? [...state.logs.container]
				: [...state.logs.container.slice(payload, payload + 1)];

		const container = logs.forEach((log: LogTemplate) => {
			const row = Object.values(log).join(', ');
			body += `${row}\n`;
		});

		const csv = `${header}\n${body}`;
		const fileDir = `${FileSystem.documentDirectory}/${moment().format(
			'YYYY-MM-DD-hh:mm-A'
		)}.csv`;

		console.log(csv);
		try {
			await FileSystem.writeAsStringAsync(fileDir, csv);
			return undefined;
		} catch (error) {
			return rejectWithValue({
				type: Errors.STORING_ERROR,
				message: ErrorMessages.STORING_ERROR,
				data: { fileDir, csv },
			});
		}
	}
);

export const completeLog = createAsyncThunk<
	LogTemplate,
	OptionalLogTemplateProperties,
	{ rejectValue: RejectedPayload; state: RootState }
>(
	'logs/completeRecord',
	async (
		payload: OptionalLogTemplateProperties,
		{ getState, rejectWithValue }
	) => {
		const { logs } = getState();
		const container = [...logs.container];

		const startDateTime = container.pop()?.startDateTime!;
		const updatedLog: LogTemplate = {
			startDateTime,
			endDateTime: moment().toString(),
			...payload,
		};

		const updatedLogs = [...container, updatedLog];
		const serializedUpdatedLogs = JSON.stringify(updatedLogs);

		try {
			await AsyncStorage.setItem(Keys.LOGS, serializedUpdatedLogs);

			return updatedLog;
		} catch (error) {
			return rejectWithValue({
				type: Errors.STORING_ERROR,
				message: ErrorMessages.STORING_ERROR,
				data: payload,
			});
		}
	},
	{
		condition: (undefined, { getState }) => {
			const { logs } = getState();
			const { container } = logs;

			if (container.length) {
				const currentRecord = container[container.length - 1];
				return currentRecord?.endDateTime ? false : true;
			}

			return false;
		},
	}
);

interface LogsSlice {
	container: LogTemplateArray;
	status: Statuses;
	error?: RejectedPayload;
}

const initialState: LogsSlice = {
	container: [],
	status: Statuses.PENDING,
};

const logs = createSlice({
	name: 'logs',
	initialState,
	reducers: {
		createLog: (state) => {
			const container = state.container;

			const defaultLog: LogTemplate = {
				startDateTime: moment().toString(),
				endDateTime: undefined,
				headacheRating: undefined,
				numbnessRating: undefined,
				notes: undefined,
			};

			container.push(defaultLog);
			(state.status = Statuses.PENDING), (state.container = container);
		},
	},
	extraReducers: (builder) => {
		builder.addCase(completeLog.pending, (state) => {
			state.status = Statuses.PENDING;
		});
		builder.addCase(completeLog.fulfilled, (state, action) => {
			state.container[state.container.length - 1] = action.payload;
			state.status = Statuses.FULFILLED;
		});
		builder.addCase(completeLog.rejected, (state, action) => {
			state.error = action.payload;
			state.status = Statuses.REJECTED;
		});
		builder.addCase(fetchLogs.pending, (state) => {
			state.container = [];
			state.status = Statuses.PENDING;
		});
		builder.addCase(fetchLogs.fulfilled, (state, action) => {
			state.container = action.payload;
			state.status = Statuses.FULFILLED;
		});
		builder.addCase(fetchLogs.rejected, (state, action) => {
			state.error = action.payload;
			state.status = Statuses.REJECTED;
		});
		builder.addCase(downloadLog.fulfilled, (state) => {
			state.status = Statuses.FULFILLED;
		});
		builder.addCase(downloadLog.pending, (state) => {
			state.status = Statuses.PENDING;
		});
		builder.addCase(downloadLog.rejected, (state, action) => {
			state.status = Statuses.REJECTED;
			state.error = action.payload;
		});
	},
});

export const { createLog } = logs.actions;
export default logs.reducer;

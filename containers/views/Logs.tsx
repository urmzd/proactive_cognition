import moment from 'moment';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
	Avatar,
	Button,
	Card,
	IconButton,
	Searchbar,
	Title,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { ColorPalette } from '../../constants/Misc';
import { downloadLog } from '../../features/Logs';
//import { downloadLog } from '../../features/Logs';
import { LogTemplate, RootState } from '../../types';
import { useAppDispatch } from '../../utils/Redux';

const Logs = ({ navigation }: any) => {
	const [query, setQuery] = useState<string>('LOOOL');
	const logs = useSelector((state: RootState) => state.logs);
	const [data, setData] = useState<Array<LogTemplate>>([...logs.container]);
	const dispatch = useAppDispatch();

	const filterByQuery = (query: string) => {
		const filteredData = logs.container.filter((log: LogTemplate) => {
			let { startDateTime, endDateTime } = log;
			startDateTime = moment(new Date(startDateTime)).format(
				'MM-DD-YYYY hh:mm A'
			);
			endDateTime =
				endDateTime &&
				moment(new Date(endDateTime)).format('MM-DD-YYYY hh:mm A');

			return (
				startDateTime.includes(query) || endDateTime?.includes(query)
			);
		});

		setQuery(query);
		setData(filteredData);
	};

	return (
		<SafeAreaView style={{ flex: 1, padding: 12 }}>
			<View style={{ paddingTop: 8, paddingBottom: 8 }}>
				<Searchbar
					placeholder='Search...'
					value={query}
					onChangeText={(query: string) => filterByQuery(query)}
					accessibilityValue={{ text: 'search bar' }}
					focusable={true}
					showSoftInputOnFocus={true}
				/>
			</View>

			<ScrollView
				contentContainerStyle={{
					flexGrow: 1,
				}}
			>
				{data.map((log: LogTemplate, index: number) => {
					const { startDateTime, endDateTime } = log;
					return (
						<View
							key={index}
							style={{
								flex: 1,
								paddingTop: 8,
								paddingBottom: 8,
							}}
						>
							<Card
								accessibilityValue={{
									text: 'Symptom Record',
								}}
								focusable={true}
							>
								<Card.Title
									title={moment(
										new Date(startDateTime)
									).format('MM-DD-YYYY hh:mm A')}
									subtitle={
										endDateTime &&
										moment(new Date(endDateTime)).format(
											'MM-DD-YYYY hh:mm A'
										)
									}
									accessibilityValue={{
										text: `${startDateTime} Symptom Record`,
									}}
									focusable={true}
									left={(props: any) => (
										<Avatar.Icon
											{...props}
											icon='file-delimited'
											color={ColorPalette.WHITE}
											style={{
												backgroundColor:
													ColorPalette.PRIMARY_BLUE,
											}}
										/>
									)}
									right={(props: any) => (
										<IconButton
											icon='download'
											color={ColorPalette.PRIMARY_BLUE}
											{...props}
											onPress={() =>
												dispatch(downloadLog(0))
											}
										/>
									)}
								></Card.Title>
							</Card>
						</View>
					);
				})}
			</ScrollView>

			<View style={{ flex: 1, justifyContent: 'flex-end' }}>
				<Button
					mode='contained'
					accessibilityValue={{ text: 'Download All Button' }}
					focusable={true}
					color={ColorPalette.PRIMARY_BLUE}
					style={{ borderRadius: 100 }}
				>
					<Title style={{ color: ColorPalette.WHITE }}>
						DOWNLOAD ALL
					</Title>
				</Button>
			</View>
		</SafeAreaView>
	);
};

export default Logs;

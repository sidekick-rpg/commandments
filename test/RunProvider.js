export function RunProvider(dataProvider, runner) {
	for (const description in dataProvider) {
		test(description, () => {
			runner.apply(null, dataProvider[description])
		})
	}
}

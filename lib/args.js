var parseArgs = require('minimist'),

	options = parseArgs(process.argv.slice(2), {
		string: ['report-dir', 'input-dir'];
		alias: {
			'reportDir': ['report-dir'],
			'inputDir': ['input-dir']
		}
	});

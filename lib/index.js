var parseArgs = require('minimist'),
	glob = require('glob-stream'),
	through = require('through'),
	path = require('path'),
	fs = require('fs'),
	q = require('q'),
	xml2js = require('xml2js'),
	readFile = q.denodeify(fs.readFile),
	map = require('map-stream'),
	options = parseArgs(process.argv.slice(2), {
		string: ['report-dir', 'input-dir', 'glob'],
		alias: {
			'reportDir': ['report-dir'],
			'inputDir': ['input-dir']
		},
		default: {
			'glob': '**/*.xml'
		}
	}),
	xmlFiles = glob.create(options.glob, {
		cwd: path.join(options.inputDir)
	}),

	Project = require(path.join(__dirname, 'model', 'project'));

var parser = new xml2js.Parser(),
	parseString = q.denodeify(parser.parseString),
	projects = [];

xmlFiles.pipe(
	map(function(file, callback) {
		readFile(file.path)
			.then(parseString)
			.nodeify(callback);
	})
).pipe(
	through(function(data) {
		console.log(JSON.stringify(data, null, 2));
		if (data.project) {
			projects.push(new Project(data.project));
		}
	}, function() {
		this.queue(null);
		console.log(JSON.stringify(projects, null, 2));
	})
);

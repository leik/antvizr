var parseArgs = require('minimist'),
	_ = require('lodash'),
	glob = require('glob-stream'),
	through = require('through'),
	path = require('path'),
	fs = require('fs-extra'),
	q = require('q'),
	xml2js = require('xml2js'),
	readFile = q.denodeify(fs.readFile),
	writeFile = q.denodeify(fs.writeFile),
	copy = q.denodeify(fs.copy),
	mkdirp = q.denodeify(require('mkdirp')),
	map = require('map-stream'),
	connect = require('connect'),

	options = parseArgs(process.argv.slice(2), {
		string: ['report-dir', 'input-dir', 'include', 'exclude'],
		alias: {
			'reportDir': ['report-dir'],
			'inputDir': ['input-dir']
		},
		default: {
			'reportDir': process.cwd(),
			'include': '**/*.xml'
		}
	}),

	globPattern = options.include.split(',')
		.concat(
			options.exclude.split(',')
			.map(function(glob) {
				return '!' + glob;
			})),

	xmlFiles = glob.create(globPattern, {
		cwd: path.join(options.inputDir)
	}),

	Project = require(path.join(__dirname, 'model', 'project'));

var parser = new xml2js.Parser(),
	parseString = q.denodeify(parser.parseString),
	projectsMap = {};

console.log('\nParsing XML Files.');
xmlFiles.pipe(
	map(function(file, callback) {
		readFile(file.path)
			.then(parseString)
			.then(function(data) {
				if (data.project) {
					projectsMap[file.path] = new Project(data.project, file.path);
				}
				process.stdout.write('.');
			})
			.nodeify(callback);
	})
).on('end', function() {
	//TODO use highland?
	_.forEach(projectsMap, function(project) {
		project.imports.forEach(function(importObj, index) {
			project.imports[index] = projectsMap[importObj.filePath];
		});
	});
	_.forEach(projectsMap, function(project) {
		project.targets.forEach(function(target) {
			target.depends.forEach(function(depend, index) {
				target.depends[index] = findTarget(depend);
			});
		});
	});

	function findTarget(targetName) {
		return _.find(_.map(projectsMap, function(project) {
			return _.find(project.targets, function(target) {
				return target.name === targetName || target.fullName === targetName;
			});
		}), function(target) {
			return target;
		});
	}

	function getTargetNode(target) {
		return targetNode = target ? {
			name: target.name,
			type: 'target',
			project: target.project.name,
			file: target.project.filePath,
			children: target.depends.map(getTargetNode)
		} : {};
	}

	console.log('\nGenerating HTML Reports.');

	copy(path.join(__dirname, '../template'), options.reportDir)
		.then(function() {
			return mkdirp(path.join(options.reportDir, 'data'))
		})
		.then(function() {
			return writeFile(path.join(options.reportDir, 'data', 'project-list.json'), JSON.stringify(
				_.map(projectsMap, function(project) {
					return project.name
				})
			));
		})
		.then(function() {
			return q.all(_.map(projectsMap, function(project) {
				process.stdout.write('.');
				return writeFile(path.join(options.reportDir, 'data', project.name + '.json'), JSON.stringify({
					name: project.name,
					type: 'project',
					children: project.targets.map(getTargetNode)
				}, null, 2));
			}));
		})
		.then(function() {
			connect.createServer(connect.static(path.join(options.reportDir))).listen(3000);
			console.log('\nServer started on port 3000 ...');
		});

	// console.log(JSON.stringify(tree, null, 2));
});

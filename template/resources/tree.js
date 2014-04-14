(function() {
	function getURLParameter(name) {
		return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null
	}

	var currentProject = getURLParameter('project');

	d3.json('data/project-list.json', function(projects) {
		var projectList = d3.select('#project-list');
		projects.forEach(function(project) {
			projectList.append('option').attr('value', project).text(project);
		});

		projectList.node().value = currentProject;

		projectList.on('change', function() {
			var projectName = this.options[this.selectedIndex].value;
			window.location.href = '?project=' + projectName;
		});
	});

	var tooltip = d3.select("#viz").append("div")
		.attr("class", "tooltip")
		.style("opacity", 0);

	var i = 0,
		root;

	var tree,
		vis,
		diagonal = d3.svg.diagonal()
			.projection(function(d) {
				return [d.y, d.x];
			});

	d3.json('./data/' + currentProject + '.json', function(json) {
		var m = [20, 120, 20, 120],
			w = 3000 - m[1] - m[3],
			h = 120 * json.children.length - m[0] - m[2];

		root = json;
		root.x0 = h / 2;
		root.y0 = 0;

		function toggleAll(d) {
			if (d.children) {
				d.children.forEach(toggleAll);
				toggle(d);
			}
		}

		tree = d3.layout.tree()
			.size([h, w]);

		vis = d3.select("#viz").append("svg:svg")
			.attr("width", w + m[1] + m[3])
			.attr("height", h + m[0] + m[2])
			.append("svg:g")
			.attr("transform", "translate(" + m[3] + "," + m[0] + ")");

		update(root);
	});

	function update(source) {
		var duration = d3.event && d3.event.altKey ? 5000 : 500;

		// Compute the new tree layout.
		var nodes = tree.nodes(root).reverse();

		// Normalize for fixed-depth.
		nodes.forEach(function(d) {
			d.y = d.depth * 180;
		});

		// Update the nodes…
		var node = vis.selectAll("g.node")
			.data(nodes, function(d) {
				return d.id || (d.id = ++i);
			});

		// Enter any new nodes at the parent's previous position.
		var nodeEnter = node.enter().append("svg:g")
			.attr("class", "node")
			.attr("transform", function(d) {
				return "translate(" + source.y0 + "," + source.x0 + ")";
			})
			.on("click", function(d) {
				toggle(d);
				update(d);
			})
			.on('dblclick', function(d) {
				view(d);
			}).on("mouseover", function(d) {
				tooltip.transition()
					.duration(200)
					.style("opacity", .9);
				tooltip.html('<b>Type:</b> ' + d.type + '<br/>' + '<b>Project:</b> ' + d.project + '<br/>' + '<b>File:</b> ' + d.file + '<br/>')
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY - 100) + "px");
			})
			.on("mouseout", function(d) {
				tooltip.transition()
					.duration(500)
					.style("opacity", 0);
			});

		nodeEnter.append("svg:circle")
			.attr("r", 1e-6)
			.style("fill", function(d) {
				return d._children ? "lightsteelblue" : "#fff";
			});

		nodeEnter.append("svg:text")
			.attr("x", function(d) {
				return d.children || d._children ? -10 : 10;
			})
			.attr("dy", ".35em")
			.attr("text-anchor", function(d) {
				return d.children || d._children ? "end" : "start";
			})
			.text(function(d) {
				return d.name;
			})
			.style("fill-opacity", 1e-6);

		// Transition nodes to their new position.
		var nodeUpdate = node.transition()
			.duration(duration)
			.attr("transform", function(d) {
				return "translate(" + d.y + "," + d.x + ")";
			});

		nodeUpdate.select("circle")
			.attr("r", 4.5)
			.style("fill", function(d) {
				return d._children ? "lightsteelblue" : "#fff";
			});

		nodeUpdate.select("text")
			.style("fill-opacity", 1);

		// Transition exiting nodes to the parent's new position.
		var nodeExit = node.exit().transition()
			.duration(duration)
			.attr("transform", function(d) {
				return "translate(" + source.y + "," + source.x + ")";
			})
			.remove();

		nodeExit.select("circle")
			.attr("r", 1e-6);

		nodeExit.select("text")
			.style("fill-opacity", 1e-6);

		// Update the links…
		var link = vis.selectAll("path.link")
			.data(tree.links(nodes), function(d) {
				return d.target.id;
			});

		// Enter any new links at the parent's previous position.
		link.enter().insert("svg:path", "g")
			.attr("class", "link")
			.attr("d", function(d) {
				var o = {
					x: source.x0,
					y: source.y0
				};
				return diagonal({
					source: o,
					target: o
				});
			})
			.transition()
			.duration(duration)
			.attr("d", diagonal);

		// Transition links to their new position.
		link.transition()
			.duration(duration)
			.attr("d", diagonal);

		// Transition exiting nodes to the parent's new position.
		link.exit().transition()
			.duration(duration)
			.attr("d", function(d) {
				var o = {
					x: source.x,
					y: source.y
				};
				return diagonal({
					source: o,
					target: o
				});
			})
			.remove();

		// Stash the old positions for transition.
		nodes.forEach(function(d) {
			d.x0 = d.x;
			d.y0 = d.y;
		});
	}

	function view(d) {
		if (d.project) {
			window.location.href = '?project=' + d.project;
		}
	}

	// Toggle children.

	function toggle(d) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
	}
}());

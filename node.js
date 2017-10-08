var fs = require('fs');
var nps = require('path');

exports.markdownTransfomer = function (opt, gift, require) {
	// var loaderUtil = require('loader-utils');
	var prefix = opt.prefix || '@'
	var suffix = opt.suffix || '@'
	var deep = ('deep' in opt) ? !!opt.deep : true;

	var filesMap = gift.filesMap;
	var path = gift.path;
	var publicPath = gift.publicPath;
	if (!gift.data) return gift.data;
	var filename = filesMap[path];
	// console.log(filename);

	function replace(content, filename) {
		var dirname = nps.dirname(filename);

		function checkPath(path) {
			path = path.trim();
			if (!path) return false;
			path = nps.join(dirname, path);
			try {
				path = require.resolve(path);
			} catch (err) {
				return false;
			}
			if (path === filename) {
				return false;
			}
			return path;
		}

		return content.replace(
			new RegExp('(^\\s*)' + prefix + '\\s*(.+?)\\s*' + suffix + '(\\s*\\n?)$', 'gm'),
			// /@\s*(.+?)\s*@/g,
			function (m, preappend, path, newlineOrNull) {
				var currLink = path.trim();
				var fullpath = '';

				// link::[why-need-require]../refs/why-need-require.md
				if (currLink.startsWith('link::')) {
					var title = '';
					path = '';

					if (/^link::\[(.+?)\](.+)/.test(currLink)) {
						title = RegExp.$1;
						path = RegExp.$2;
						title = title && title.trim() ? title.trim() : path;
					} else if (/^link::(.+)/.test(currLink)) {
						title = RegExp.$1;
						path = RegExp.$1;
					}

					// console.log(title, path);
					fullpath = checkPath(path);
					// console.log(fullpath);

					if (fullpath) {
						var link = Object.keys(filesMap).find(function (link) {
							return filesMap[link] === fullpath;
						});
						if (link) {
							link = link === 'INDEX' ? '' : link;
							return preappend + '[' + title + '](' + publicPath.replace(/\/*$/, '/') + link.replace(/^\/+/, '') + ')' + newlineOrNull;
						}
					}

				}

				fullpath = checkPath(currLink);
				if (fullpath) {
					var fileContent = fs.readFileSync(fullpath).toString();
					if (deep) {
						fileContent = replace(fileContent, fullpath);
					}

					return fileContent + newlineOrNull;
				}
				return m;
			}
		);
	}

	gift.data = replace(gift.data, filename);
	return gift.data;
};

var fs = require('fs');
var nps = require('path');
var disableKey = 'disable-file-syntax';

function findLink(filesMap, fullpath) {
	var link = Object.keys(filesMap).find(function (link) {
		return filesMap[link] === fullpath;
	});
	if (link != null) {
		link = link === 'inde' ? '' : link;
		return link.replace(/^\/*/, '/');
	}
	return false;
}

function checkPath(path, dirname, filename, allowEquals, alias) {
	path = path.trim();
	if (!path) return false;

	if (path.startsWith('.')) {
        path = nps.join(dirname, path);
	} else if (path.startsWith('/')) {
		// path = path
	} else {
		alias = alias || {};
        var keys = Object.keys(alias);
        var matchedAlias = keys.find(function (key) {
            if (path === key.trim() || path.startsWith(key.trim().replace(/\/*$/, '/'))) {
                return true;
            }
        });
        if (matchedAlias == null) {
        	return false
        }
		path = nps.resolve(
			alias[matchedAlias],
			path.replace(
				new RegExp('^' + matchedAlias.replace(/\/*$/, '/?')),
				''
			)
		);
	}

	try {
		path = require.resolve(path);
	} catch (err) {
		return false;
	}
	if (!allowEquals && path === filename) {
		return false;
	}
	return path;
}

exports.markdownTransformer = function (opt, gift, require) {
	// var loaderUtil = require('loader-utils');
	var prefix = opt.prefix || '@'
	var suffix = opt.suffix || '@'
	var alias = opt.alias || {}
	var deep = ('deep' in opt) ? !!opt.deep : true;

	var filesMap = gift.filesMap;
	var path = gift.path;
	var meta = gift.meta || {};
	var disableValue = meta[disableKey]
	if (!gift.data) return gift.data;
	var selfFilename = filesMap[path];
	// console.log(filename);

	function replace(content, filename) {

		var dirname = nps.dirname(filename);

		return content.replace(
			new RegExp('(^\\s*)' + prefix + '\\s*(.+?)\\s*' + suffix + '(\\s*\\n?)$', 'gm'),
			// /@\s*(.+?)\s*@/g,
			function (m, preappend, path, newlineOrNull) {
				var currLink = path.trim();
				var fullpath = '';

				// link::[why-need-require]../refs/why-need-require.md
				if (disableValue !== 'link' && currLink.startsWith('link::')) {
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
					fullpath = checkPath(path, dirname, selfFilename, true, alias);
					// console.log(fullpath);

					if (fullpath) {
						var link = findLink(filesMap, fullpath);
						if (link !== false) {
							return preappend + '[' + title + '](' + link + ')' + newlineOrNull;
						}
					}

				}

				if (disableValue !== 'file-content') {
					fullpath = checkPath(currLink, dirname, filename, false, alias);
					if (fullpath) {
						var fileContent = fs.readFileSync(fullpath).toString();
						if (deep) {
							fileContent = replace(fileContent, fullpath);
						}

						return fileContent + newlineOrNull;
					}
				}

				return m;
			}
		);
	}

	if (disableValue === 'both') {
		return gift.data;
	}

	gift.data = replace(gift.data, selfFilename);
	return gift.data;
};


exports.htmlTransformer = function (opt, gift, require) {
	var alias = opt.alias || {}
	var filesMap = gift.filesMap;
	var filename = filesMap[gift.path];
	var fullpath = '';
	var link = '';
    var dirname = nps.dirname(filename);

	gift.data.content = gift.data.content
				.replace(
					/(<a.*?href=")(.*?)(".*?)(>[^]*?<\/a>)/gi,
					function (matched, prev, href, next, other) {
						href = href.trim();
						if (/^(http:|https:|ftp:|file:)?\/\//i.test(href)) {
							return matched;
						}

						fullpath = checkPath(href, dirname, filename, true, alias);
						if (fullpath) {
							link = findLink(filesMap, fullpath);
							if (link !== false) {
								// console.log(link, '->', fullpath);
								// console.log(prev + link + next + other);
								return prev + link + next + other;
							}
						}
						return matched;
					}
				)

	return gift.data;
};

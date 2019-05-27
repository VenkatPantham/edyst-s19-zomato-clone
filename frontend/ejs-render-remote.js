//this uses jQuery for now because ie11 support is needed (promises, fetch, Object.assign)

(function($) {
	var uuidv4 = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0;
			var v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	};

	var overwriteWithCacheOptions = function(options, cacheName) {
		var cacheOptions = {
			cache: true,
			filename: cacheName
		};

		var templateOptions = options || {};

		return $.extend(templateOptions, cacheOptions);
	};

	ejs.zomato = function(templateUrl, data, options) {
		var templateFn = ejs.cache.get(templateUrl);

		//if the template is already cached, return it and we are done
		if (templateFn) {
			return templateFn(data);

		} else { //if the template is not cached, we need to get it and render it later once we have it. remember: this happens only if the template is not already cached

			//is there a getFn for this template?
			var getTemplateFn = ejs.cache.get('getFnFor' + templateUrl);
			if (!getTemplateFn) {
				getTemplateFn = $.get(templateUrl);
				ejs.cache.set('getFnFor' + templateUrl, getTemplateFn);
			}

			var r = uuidv4();
			getTemplateFn.then(function(template) {
				var templateOptions = overwriteWithCacheOptions(options, templateUrl);

				$('#' + r).replaceWith(ejs.render(
					template,
					data,
					templateOptions
				));

				//clean up the getFnFor
				if (ejs.cache.remove && ejs.cache.get('getFnFor' + templateUrl)) {
					ejs.cache.remove('getFnFor' + templateUrl);
				}
			});

			return '<span class="ejs-templateplaceholder" style="display: none;" id="' + r + '"></span>';
		}
	};

	ejs.preloadTemplate = function(templateUrl, options) {
		var d = $.Deferred();

		//if the template is already cached, just return.
		if (ejs.cache.get(templateUrl)) {
			d.resolve(templateUrl);
		} else {
			$.get(templateUrl)
			.then(function(template) {
				var templateOptions = overwriteWithCacheOptions(options, templateUrl);
				var templateFn = ejs.compile(template, templateOptions);
				ejs.cache.set(templateUrl, templateFn);

				d.resolve(templateUrl);
			});
		}

		return d;
	};
})(jQuery);

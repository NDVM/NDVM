////////////////////////////////////////////////////////////////////////////////
// Media Entry
//
// Single video entry.
// Available views:
// - compact: checkbox, filename, rater, and tagger controls as a row
// - thumb: checker, thumbnail, filename, and rater overlayed
// - expanded: all controls (checkbox, thumbnail, filename, rater, keywords, tagger)
////////////////////////////////////////////////////////////////////////////////
/*global jQuery, window */
var app = app || {};

app.controls = function (controls, $, services, data) {
	var

	VIEWS = {
		'thumb': 'thumb',
		'compact': 'compact',
		'expanded': 'expanded'
	},

	// static properties
	lastOpen,				// control reference to the last opened medium (thumb or compact to expanded)

	// static event handlers
	onClick,
	onChecked,
	onResize;

	controls.medium = function (mediaid) {
		var self = controls.control.create(),

		// flags
		view = 'thumb',
		expanded = null;

		self.data.mediaid = mediaid;

		// sub-controls
		self.rater = null;
		self.tagger = null;
		self.keywords = null;

		//////////////////////////////
		// Getters / setters

		self.view = function (value) {
			if (typeof value !== 'undefined') {
				view = value;
				return self;
			} else {
				return view;
			}
		};

		// true or false
		self.expanded = function (value) {
			if (typeof value !== 'undefined') {
				expanded = value ? 'expanded' : null;
				return self;
			} else {
				return expanded ? true : false;
			}
		};

		//////////////////////////////
		// Business functions

		// calls playback service
		self.play = function (elem) {
			elem
				.siblings().removeClass('playing').end()
				.addClass('playing');
			services.media.play(mediaid);
			
			services.media.html5();
			
			function preprocess(json) {
				var i, row, fileInfo;
				for (i = 0; i < json.length; i++) {
					row = json[i];
					fileInfo = splitPath(row.path);
					row.file = fileInfo.file;
					row.lfile = fileInfo.file.toLowerCase();
				}
				return json;
			}
			
			// check if html5 player is available and launch it
			services.media.html5(function (json) {
				
				HTML5PLAYER = preprocess(json.data);
				if (HTML5PLAYER === true) {
					var browser_extensions = '^.+\\.(mp4|webm|ogv|3gp)$';
					if( data.media.getRow(mediaid).file.match(browser_extensions) != null ){
						var myWindow = window.open("./play.html?" + mediaid, "", "width=655, height=375");
					}
				}
			});
			
			data.pagestate.lastPlayed = mediaid;
			return self;
		};

		// tells whether this media entry is selected
		self.selected = function () {
			return $('#' + self.id).find(':checked').length > 0;
		};

		//////////////////////////////
		// Overrides

		// builds control structure
		self.build = function () {
			self.clear();

			// adding rater control
			self.rater = controls.rater(mediaid)
				.appendTo(self);

			// adding tagger control to non-thumb views
			self.tagger = controls.tagger(mediaid)
				.appendTo(self);

			// adding keywords control
			self.keywords = controls.keywords(mediaid)
				.appendTo(self);

			return self;
		};

		self.html = function () {
			var parent, child,
					row = data.media.getRow(mediaid);

			return [
				'<div id="', self.id, '" class="',
				['medium']
					.concat(data.pagestate.lastPlayed === mediaid ? ['playing'] : [])
					.concat(VIEWS[expanded || view] || [])
					.join(' '), '">',

				// checkbox
				'<div class="check">',
				'<input type="checkbox" ', mediaid in controls.media.selected ? 'checked="checked" ' : '', '/>',
				'</div>',

				// file name
				'<div class="file">',
				'<span title="', row.file, '">', row.file, '</span>',
				'</div>',

				// thumbnail
				expanded || view === 'thumb' ? [
					'<div class="overlay"></div>',
					'<div class="play"><div class="image"></div></div>',
					'<div class="thumb">',
					row.hash.length ?
						['<img src="/cache/', row.hash, '.jpg?u=',
						   ( row.cache ) ? row.cache : '0' ,'">'].join('') :
						'<span class="spinner"></span>',
					'</div>'
				].join('') : '',

				// rater
				self.rater.html(),

				// keywords
				expanded ? self.keywords
					.compact(view !== 'compact')
					.html() : '',

				// tagger
				expanded || view === 'compact' ? self.tagger.html() : '',

				'</div>'
			].join('');
		};

		return self;
	};

	//////////////////////////////
	// Static methods

	// resets medium memory
	controls.medium.reset = function () {
		lastOpen = null;
	};

	//////////////////////////////
	// Static event handlers

	onClick = function () {
		var media = $(this).closest('.medium'),
				self = controls.lookup[media.attr('id')],
				expanded = self.expanded();

		if (expanded) {
			// starting playback
			self.play(media);
		} else {
			// closing last opened entry
			if (lastOpen) {
				lastOpen
					.expanded(false)
					.render();
				lastOpen = null;
			}

			// flipping full state and re-rendering control
			self
				.expanded(!expanded)
				.render();

			// saving reference to last opened entry
			lastOpen = self;
		}

		return false;
	};

	onChecked = function () {
		var $this = $(this),
				$medium = $this.closest('.medium'),
				self = controls.lookup[$medium.attr('id')];

		// registering (un)checked item
		if ($this.is(':checked')) {
			controls.media.selected[self.data.mediaid] = true;
		} else {
			delete controls.media.selected[self.data.mediaid];
		}

		// refreshing main checker control
		controls.checker.render();
	};

	//////////////////////////////
	// Event bindings

	$( document ).on('click', 'div.medium div.thumb, div.file, div.play', onClick);
	$( document ).on('click', 'div.check > :checkbox', onChecked);

	return controls;
}(app.controls || {},
	jQuery,
	app.services,
	app.data);


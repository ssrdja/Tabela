'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* Tabulator v4.0.0 (c) Oliver Folkerd */

(function () {

	'use strict';

	// https://tc39.github.io/ecma262/#sec-array.prototype.findIndex

	if (!Array.prototype.findIndex) {

		Object.defineProperty(Array.prototype, 'findIndex', {

			value: function value(predicate) {

				// 1. Let O be ? ToObject(this value).

				if (this == null) {

					throw new TypeError('"this" is null or not defined');
				}

				var o = Object(this);

				// 2. Let len be ? ToLength(? Get(O, "length")).

				var len = o.length >>> 0;

				// 3. If IsCallable(predicate) is false, throw a TypeError exception.

				if (typeof predicate !== 'function') {

					throw new TypeError('predicate must be a function');
				}

				// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.

				var thisArg = arguments[1];

				// 5. Let k be 0.

				var k = 0;

				// 6. Repeat, while k < len

				while (k < len) {

					// a. Let Pk be ! ToString(k).

					// b. Let kValue be ? Get(O, Pk).

					// c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).

					// d. If testResult is true, return k.

					var kValue = o[k];

					if (predicate.call(thisArg, kValue, k, o)) {

						return k;
					}

					// e. Increase k by 1.

					k++;
				}

				// 7. Return -1.

				return -1;
			}

		});
	}

	// https://tc39.github.io/ecma262/#sec-array.prototype.find

	if (!Array.prototype.find) {

		Object.defineProperty(Array.prototype, 'find', {

			value: function value(predicate) {

				// 1. Let O be ? ToObject(this value).

				if (this == null) {

					throw new TypeError('"this" is null or not defined');
				}

				var o = Object(this);

				// 2. Let len be ? ToLength(? Get(O, "length")).

				var len = o.length >>> 0;

				// 3. If IsCallable(predicate) is false, throw a TypeError exception.

				if (typeof predicate !== 'function') {

					throw new TypeError('predicate must be a function');
				}

				// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.

				var thisArg = arguments[1];

				// 5. Let k be 0.

				var k = 0;

				// 6. Repeat, while k < len

				while (k < len) {

					// a. Let Pk be ! ToString(k).

					// b. Let kValue be ? Get(O, Pk).

					// c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).

					// d. If testResult is true, return kValue.

					var kValue = o[k];

					if (predicate.call(thisArg, kValue, k, o)) {

						return kValue;
					}

					// e. Increase k by 1.

					k++;
				}

				// 7. Return undefined.

				return undefined;
			}

		});
	}

	var ColumnManager = function ColumnManager(table) {

		this.table = table; //hold parent table

		this.headersElement = $("<div class='tabulator-headers'></div>");

		this.element = $("<div class='tabulator-header'></div>"); //containing element

		this.rowManager = null; //hold row manager object

		this.columns = []; // column definition object

		this.columnsByIndex = []; //columns by index

		this.columnsByField = []; //columns by field

		this.scrollLeft = 0;

		this.element.prepend(this.headersElement);
	};

	////////////// Setup Functions /////////////////


	//link to row manager

	ColumnManager.prototype.setRowManager = function (manager) {

		this.rowManager = manager;
	};

	//return containing element

	ColumnManager.prototype.getElement = function () {

		return this.element;
	};

	//return header containing element

	ColumnManager.prototype.getHeadersElement = function () {

		return this.headersElement;
	};

	//scroll horizontally to match table body

	ColumnManager.prototype.scrollHorizontal = function (left) {

		var hozAdjust = 0,
		    scrollWidth = this.element[0].scrollWidth - this.table.element.innerWidth();

		this.element.scrollLeft(left);

		//adjust for vertical scrollbar moving table when present

		if (left > scrollWidth) {

			hozAdjust = left - scrollWidth;

			this.element.css("margin-left", -hozAdjust);
		} else {

			this.element.css("margin-left", 0);
		}

		//keep frozen columns fixed in position

		//this._calcFrozenColumnsPos(hozAdjust + 3);


		this.scrollLeft = left;

		if (this.table.extExists("frozenColumns")) {

			this.table.extensions.frozenColumns.layout();
		}
	};

	///////////// Column Setup Functions /////////////


	ColumnManager.prototype.setColumns = function (cols, row) {

		var self = this;

		self.headersElement.empty();

		self.columns = [];

		self.columnsByIndex = [];

		self.columnsByField = [];

		//reset frozen columns

		if (self.table.extExists("frozenColumns")) {

			self.table.extensions.frozenColumns.reset();
		}

		cols.forEach(function (def, i) {

			self._addColumn(def);
		});

		self._reIndexColumns();

		if (self.table.options.responsiveLayout && self.table.extExists("responsiveLayout", true)) {

			self.table.extensions.responsiveLayout.initialize();
		}

		self.redraw(true);
	};

	ColumnManager.prototype._addColumn = function (definition, before, nextToColumn) {

		var column = new Column(definition, this);

		var index = nextToColumn ? this.findColumnIndex(nextToColumn) : nextToColumn;

		if (nextToColumn && index > -1) {

			var parentIndex = this.columns.indexOf(nextToColumn.getTopColumn());

			if (before) {

				this.columns.splice(parentIndex, 0, column);

				nextToColumn.getElement().before(column.getElement());
			} else {

				this.columns.splice(parentIndex + 1, 0, column);

				nextToColumn.getElement().after(column.getElement());
			}
		} else {

			if (before) {

				this.columns.unshift(column);

				this.headersElement.prepend(column.getElement());
			} else {

				this.columns.push(column);

				this.headersElement.append(column.getElement());
			}
		}

		return column;
	};

	ColumnManager.prototype.registerColumnField = function (col) {

		if (col.definition.field) {

			this.columnsByField[col.definition.field] = col;
		}
	};

	ColumnManager.prototype.registerColumnPosition = function (col) {

		this.columnsByIndex.push(col);
	};

	ColumnManager.prototype._reIndexColumns = function () {

		this.columnsByIndex = [];

		this.columns.forEach(function (column) {

			column.reRegisterPosition();
		});
	};

	//ensure column headers take up the correct amount of space in column groups

	ColumnManager.prototype._verticalAlignHeaders = function () {

		var self = this;

		self.columns.forEach(function (column) {

			column.clearVerticalAlign();
		});

		self.columns.forEach(function (column) {

			column.verticalAlign(self.table.options.columnVertAlign);
		});

		self.rowManager.adjustTableSize();
	};

	//////////////// Column Details /////////////////


	ColumnManager.prototype.findColumn = function (subject) {

		var self = this;

		if ((typeof subject === 'undefined' ? 'undefined' : _typeof(subject)) == "object") {

			if (subject instanceof Column) {

				//subject is column element

				return subject;
			} else if (subject instanceof ColumnComponent) {

				//subject is public column component

				return subject._getSelf() || false;
			} else if (subject instanceof jQuery) {

				//subject is a jquery element of the column header

				var match = self.columns.find(function (column) {

					return column.element === subject;
				});

				return match || false;
			}
		} else {

			//subject should be treated as the field name of the column

			return this.columnsByField[subject] || false;
		}

		//catch all for any other type of input


		return false;
	};

	ColumnManager.prototype.getColumnByField = function (field) {

		return this.columnsByField[field];
	};

	ColumnManager.prototype.getColumnByIndex = function (index) {

		return this.columnsByIndex[index];
	};

	ColumnManager.prototype.getColumns = function () {

		return this.columns;
	};

	ColumnManager.prototype.findColumnIndex = function (column) {

		return this.columnsByIndex.findIndex(function (col) {

			return column === col;
		});
	};

	//return all columns that are not groups

	ColumnManager.prototype.getRealColumns = function () {

		return this.columnsByIndex;
	};

	//travers across columns and call action

	ColumnManager.prototype.traverse = function (callback) {

		var self = this;

		self.columnsByIndex.forEach(function (column, i) {

			callback(column, i);
		});
	};

	//get defintions of actual columns

	ColumnManager.prototype.getDefinitions = function (active) {

		var self = this,
		    output = [];

		self.columnsByIndex.forEach(function (column) {

			if (!active || active && column.visible) {

				output.push(column.getDefinition());
			}
		});

		return output;
	};

	//get full nested definition tree

	ColumnManager.prototype.getDefinitionTree = function () {

		var self = this,
		    output = [];

		self.columns.forEach(function (column) {

			output.push(column.getDefinition(true));
		});

		return output;
	};

	ColumnManager.prototype.getComponents = function (structured) {

		var self = this,
		    output = [],
		    columns = structured ? self.columns : self.columnsByIndex;

		columns.forEach(function (column) {

			output.push(column.getComponent());
		});

		return output;
	};

	ColumnManager.prototype.getWidth = function () {

		var width = 0;

		this.columnsByIndex.forEach(function (column) {

			if (column.visible) {

				width += column.getWidth();
			}
		});

		return width;
	};

	ColumnManager.prototype.moveColumn = function (from, to, after) {

		this._moveColumnInArray(this.columns, from, to, after);

		this._moveColumnInArray(this.columnsByIndex, from, to, after, true);

		if (this.table.options.responsiveLayout && this.table.extExists("responsiveLayout", true)) {

			this.table.extensions.responsiveLayout.initialize();
		}

		if (this.table.options.columnMoved) {

			this.table.options.columnMoved(from.getComponent(), this.table.columnManager.getComponents());
		}

		if (this.table.options.persistentLayout && this.table.extExists("persistence", true)) {

			this.table.extensions.persistence.save("columns");
		}
	};

	ColumnManager.prototype._moveColumnInArray = function (columns, from, to, after, updateRows) {

		var fromIndex = columns.indexOf(from),
		    toIndex;

		if (fromIndex > -1) {

			columns.splice(fromIndex, 1);

			toIndex = columns.indexOf(to);

			if (toIndex > -1) {

				if (after) {

					toIndex = toIndex + 1;
				}
			} else {

				toIndex = fromIndex;
			}

			columns.splice(toIndex, 0, from);

			if (updateRows) {

				this.table.rowManager.rows.forEach(function (row) {

					if (row.cells.length) {

						var cell = row.cells.splice(fromIndex, 1)[0];

						row.cells.splice(toIndex, 0, cell);
					}
				});
			}
		}
	};

	ColumnManager.prototype.scrollToColumn = function (column, position, ifVisible) {

		var left = 0,
		    offset = 0,
		    adjust = 0;

		if (typeof position === "undefined") {

			position = this.table.options.scrollToColumnPosition;
		}

		if (typeof ifVisible === "undefined") {

			ifVisible = this.table.options.scrollToColumnIfVisible;
		}

		if (column.visible) {

			//align to correct position

			switch (position) {

				case "middle":

				case "center":

					adjust = -this.element[0].clientWidth / 2;

					break;

				case "right":

					adjust = column.element.innerWidth() - this.headersElement.innerWidth();

					break;

			}

			//check column visibility

			if (!ifVisible) {

				offset = column.element.position().left;

				if (offset > 0 && offset + column.element.outerWidth() < this.element[0].clientWidth) {

					return false;
				}
			}

			//calculate scroll position

			left = column.element.position().left + this.element.scrollLeft() + adjust;

			left = Math.max(Math.min(left, this.table.rowManager.element[0].scrollWidth - this.table.rowManager.element[0].clientWidth), 0);

			this.table.rowManager.scrollHorizontal(left);

			this.scrollHorizontal(left);

			return true;
		} else {

			console.warn("Scroll Error - Column not visible");

			return false;
		}
	};

	//////////////// Cell Management /////////////////


	ColumnManager.prototype.generateCells = function (row) {

		var self = this;

		var cells = [];

		self.columnsByIndex.forEach(function (column) {

			cells.push(column.generateCell(row));
		});

		return cells;
	};

	//////////////// Column Management /////////////////


	ColumnManager.prototype.getFlexBaseWidth = function () {

		var self = this,
		    totalWidth = self.table.element.innerWidth(),
		    //table element width

		fixedWidth = 0;

		//adjust for vertical scrollbar if present

		if (self.rowManager.element[0].scrollHeight > self.rowManager.element.innerHeight()) {

			totalWidth -= self.rowManager.element[0].offsetWidth - self.rowManager.element[0].clientWidth;
		}

		this.columnsByIndex.forEach(function (column) {

			var width, minWidth, colWidth;

			if (column.visible) {

				width = column.definition.width || 0;

				minWidth = typeof column.minWidth == "undefined" ? self.table.options.columnMinWidth : parseInt(column.minWidth);

				if (typeof width == "string") {

					if (width.indexOf("%") > -1) {

						colWidth = totalWidth / 100 * parseInt(width);
					} else {

						colWidth = parseInt(width);
					}
				} else {

					colWidth = width;
				}

				fixedWidth += colWidth > minWidth ? colWidth : minWidth;
			}
		});

		return fixedWidth;
	};

	ColumnManager.prototype.addColumn = function (definition, before, nextToColumn) {

		var column = this._addColumn(definition, before, nextToColumn);

		this._reIndexColumns();

		if (this.table.options.responsiveLayout && this.table.extExists("responsiveLayout", true)) {

			this.table.extensions.responsiveLayout.initialize();
		}

		if (this.table.extExists("columnCalcs")) {

			this.table.extensions.columnCalcs.recalc(this.table.rowManager.activeRows);
		}

		this.redraw();

		if (this.table.extensions.layout.getMode() != "fitColumns") {

			column.reinitializeWidth();
		}

		this._verticalAlignHeaders();

		this.table.rowManager.reinitialize();
	};

	//remove column from system

	ColumnManager.prototype.deregisterColumn = function (column) {

		var field = column.getField(),
		    index;

		//remove from field list

		if (field) {

			delete this.columnsByField[field];
		}

		//remove from index list

		index = this.columnsByIndex.indexOf(column);

		if (index > -1) {

			this.columnsByIndex.splice(index, 1);
		}

		//remove from column list

		index = this.columns.indexOf(column);

		if (index > -1) {

			this.columns.splice(index, 1);
		}

		if (this.table.options.responsiveLayout && this.table.extExists("responsiveLayout", true)) {

			this.table.extensions.responsiveLayout.initialize();
		}

		this.redraw();
	};

	//redraw columns

	ColumnManager.prototype.redraw = function (force) {

		if (force) {

			if (this.element.is(":visible")) {

				this._verticalAlignHeaders();
			}

			this.table.rowManager.resetScroll();

			this.table.rowManager.reinitialize();
		}

		if (this.table.extensions.layout.getMode() == "fitColumns") {

			this.table.extensions.layout.layout();
		} else {

			if (force) {

				this.table.extensions.layout.layout();
			} else {

				if (this.table.options.responsiveLayout && this.table.extExists("responsiveLayout", true)) {

					this.table.extensions.responsiveLayout.update();
				}
			}
		}

		if (this.table.extExists("frozenColumns")) {

			this.table.extensions.frozenColumns.layout();
		}

		if (this.table.extExists("columnCalcs")) {

			this.table.extensions.columnCalcs.recalc(this.table.rowManager.activeRows);
		}

		if (force) {

			if (this.table.options.persistentLayout && this.table.extExists("persistence", true)) {

				this.table.extensions.persistence.save("columns");
			}

			if (this.table.extExists("columnCalcs")) {

				this.table.extensions.columnCalcs.redraw();
			}
		}

		this.table.footerManager.redraw();
	};

	//public column object
	var ColumnComponent = function ColumnComponent(column) {
		this.column = column;
		this.type = "ColumnComponent";
	};

	ColumnComponent.prototype.getElement = function () {
		return this.column.getElement();
	};

	ColumnComponent.prototype.getDefinition = function () {
		return this.column.getDefinition();
	};

	ColumnComponent.prototype.getField = function () {
		return this.column.getField();
	};

	ColumnComponent.prototype.getCells = function () {
		var cells = [];

		this.column.cells.forEach(function (cell) {
			cells.push(cell.getComponent());
		});

		return cells;
	};

	ColumnComponent.prototype.getVisibility = function () {
		return this.column.visible;
	};

	ColumnComponent.prototype.show = function () {
		if (this.column.isGroup) {
			this.column.columns.forEach(function (column) {
				column.show();
			});
		} else {
			this.column.show();
		}
	};

	ColumnComponent.prototype.hide = function () {
		if (this.column.isGroup) {
			this.column.columns.forEach(function (column) {
				column.hide();
			});
		} else {
			this.column.hide();
		}
	};

	ColumnComponent.prototype.toggle = function () {
		if (this.column.visible) {
			this.hide();
		} else {
			this.show();
		}
	};

	ColumnComponent.prototype.delete = function () {
		this.column.delete();
	};

	ColumnComponent.prototype.getSubColumns = function () {
		var output = [];

		if (this.column.columns.length) {
			this.column.columns.forEach(function (column) {
				output.push(column.getComponent());
			});
		}

		return output;
	};

	ColumnComponent.prototype.getParentColumn = function () {
		return this.column.parent instanceof Column ? this.column.parent.getComponent() : false;
	};

	ColumnComponent.prototype._getSelf = function () {
		return this.column;
	};

	ColumnComponent.prototype.scrollTo = function () {
		this.column.table.columManager.scrollToColumn(this.column);
	};

	var Column = function Column(def, parent) {
		var self = this;

		this.table = parent.table;
		this.definition = def; //column definition
		this.parent = parent; //hold parent object
		this.type = "column"; //type of element
		this.columns = []; //child columns
		this.cells = []; //cells bound to this column
		this.element = $("<div class='tabulator-col' role='columnheader' aria-sort='none'></div>"); //column header element
		this.contentElement = false;
		this.groupElement = $("<div class='tabulator-col-group-cols'></div>"); //column group holder element
		this.isGroup = false;
		this.tooltip = false; //hold column tooltip
		this.hozAlign = ""; //horizontal text alignment

		//multi dimentional filed handling
		this.field = "";
		this.fieldStructure = "";
		this.getFieldValue = "";
		this.setFieldValue = "";

		this.setField(this.definition.field);

		this.extensions = {}; //hold extension variables;

		this.cellEvents = {
			cellClick: false,
			cellDblClick: false,
			cellContext: false,
			cellTap: false,
			cellDblTap: false,
			cellTapHold: false
		};

		this.width = null; //column width
		this.minWidth = null; //column minimum width
		this.widthFixed = false; //user has specified a width for this column

		this.visible = true; //default visible state

		//initialize column
		if (def.columns) {

			this.isGroup = true;

			def.columns.forEach(function (def, i) {
				var newCol = new Column(def, self);
				self.attachColumn(newCol);
			});

			self.checkColumnVisibility();
		} else {
			parent.registerColumnField(this);
		}

		if (def.rowHandle && this.table.options.movableRows !== false && this.table.extExists("moveRow")) {
			this.table.extensions.moveRow.setHandle(true);
		}

		this._mapDepricatedFunctionality();

		this._buildHeader();
	};

	//////////////// Setup Functions /////////////////
	Column.prototype._mapDepricatedFunctionality = function (field) {
		if (this.definition.tooltipHeader) {
			console.warn("The%c tooltipHeader%c column definition property has been depricated and will be removed in version 4.0, use %c headerTooltip%c instead.", "font-weight:bold;", "font-weight:regular;", "font-weight:bold;", "font-weight:regular;");

			if (typeof this.definition.headerTooltip == "undefined") {
				this.definition.headerTooltip = this.definition.tooltipHeader;
			}
		}
	};

	Column.prototype.setField = function (field) {
		this.field = field;
		this.fieldStructure = field ? field.split(".") : [];
		this.getFieldValue = this.fieldStructure.length > 1 ? this._getNestedData : this._getFlatData;
		this.setFieldValue = this.fieldStructure.length > 1 ? this._setNesteData : this._setFlatData;
	};

	//register column position with column manager
	Column.prototype.registerColumnPosition = function (column) {
		this.parent.registerColumnPosition(column);
	};

	//register column position with column manager
	Column.prototype.registerColumnField = function (column) {
		this.parent.registerColumnField(column);
	};

	//trigger position registration
	Column.prototype.reRegisterPosition = function () {
		if (this.isGroup) {
			this.columns.forEach(function (column) {
				column.reRegisterPosition();
			});
		} else {
			this.registerColumnPosition(this);
		}
	};

	Column.prototype.setTooltip = function () {
		var self = this,
		    def = self.definition;

		//set header tooltips
		var tooltip = def.headerTooltip || def.tooltip === false ? def.headerTooltip : self.table.options.tooltipsHeader;

		if (tooltip) {
			if (tooltip === true) {
				if (def.field) {
					self.table.extensions.localize.bind("columns|" + def.field, function (value) {
						self.element.attr("title", value || def.title);
					});
				} else {
					self.element.attr("title", def.title);
				}
			} else {
				if (typeof tooltip == "function") {
					tooltip = tooltip(self.getComponent());

					if (tooltip === false) {
						tooltip = "";
					}
				}

				self.element.attr("title", tooltip);
			}
		} else {
			self.element.attr("title", "");
		}
	};

	//build header element
	Column.prototype._buildHeader = function () {
		var self = this,
		    def = self.definition,
		    dblTap,
		    tapHold,
		    tap;

		self.element.empty();

		self.contentElement = self._buildColumnHeaderContent();

		self.element.append(self.contentElement);

		if (self.isGroup) {
			self._buildGroupHeader();
		} else {
			self._buildColumnHeader();
		}

		self.setTooltip();

		//set resizable handles
		if (self.table.options.resizableColumns && self.table.extExists("resizeColumns")) {
			self.table.extensions.resizeColumns.initializeColumn("header", self, self.element);
		}

		//set resizable handles
		if (def.headerFilter && self.table.extExists("filter") && self.table.extExists("edit")) {
			if (typeof def.headerFilterPlaceholder !== "undefined" && def.field) {
				self.table.extensions.localize.setHeaderFilterColumnPlaceholder(def.field, def.headerFilterPlaceholder);
			}

			self.table.extensions.filter.initializeColumn(self);
		}

		//set resizable handles
		if (self.table.extExists("frozenColumns")) {
			self.table.extensions.frozenColumns.initializeColumn(self);
		}

		//set movable column
		if (self.table.options.movableColumns && !self.isGroup && self.table.extExists("moveColumn")) {
			self.table.extensions.moveColumn.initializeColumn(self);
		}

		//set calcs column
		if ((def.topCalc || def.bottomCalc) && self.table.extExists("columnCalcs")) {
			self.table.extensions.columnCalcs.initializeColumn(self);
		}

		//update header tooltip on mouse enter
		self.element.on("mouseenter", function (e) {
			self.setTooltip();
		});

		//setup header click event bindings
		if (typeof def.headerClick == "function") {
			self.element.on("click", function (e) {
				def.headerClick(e, self.getComponent());
			});
		}

		if (typeof def.headerDblClick == "function") {
			self.element.on("dblclick", function (e) {
				def.headerDblClick(e, self.getComponent());
			});
		}

		if (typeof def.headerContext == "function") {
			self.element.on("contextmenu", function (e) {
				def.headerContext(e, self.getComponent());
			});
		}

		//setup header tap event bindings
		if (typeof def.headerTap == "function") {
			tap = false;

			self.element.on("touchstart", function (e) {
				tap = true;
			});

			self.element.on("touchend", function (e) {
				if (tap) {
					def.headerTap(e, self.getComponent());
				}

				tap = false;
			});
		}

		if (typeof def.headerDblTap == "function") {
			dblTap = null;

			self.element.on("touchend", function (e) {

				if (dblTap) {
					clearTimeout(dblTap);
					dblTap = null;

					def.headerDblTap(e, self.getComponent());
				} else {

					dblTap = setTimeout(function () {
						clearTimeout(dblTap);
						dblTap = null;
					}, 300);
				}
			});
		}

		if (typeof def.headerTapHold == "function") {
			tapHold = null;

			self.element.on("touchstart", function (e) {
				clearTimeout(tapHold);

				tapHold = setTimeout(function () {
					clearTimeout(tapHold);
					tapHold = null;
					tap = false;
					def.headerTapHold(e, self.getComponent());
				}, 1000);
			});

			self.element.on("touchend", function (e) {
				clearTimeout(tapHold);
				tapHold = null;
			});
		}

		//store column cell click event bindings
		if (typeof def.cellClick == "function") {
			self.cellEvents.cellClick = def.cellClick;
		}

		if (typeof def.cellDblClick == "function") {
			self.cellEvents.cellDblClick = def.cellDblClick;
		}

		if (typeof def.cellContext == "function") {
			self.cellEvents.cellContext = def.cellContext;
		}

		//setup column cell tap event bindings
		if (typeof def.cellTap == "function") {
			self.cellEvents.cellTap = def.cellTap;
		}

		if (typeof def.cellDblTap == "function") {
			self.cellEvents.cellDblTap = def.cellDblTap;
		}

		if (typeof def.cellTapHold == "function") {
			self.cellEvents.cellTapHold = def.cellTapHold;
		}

		//setup column cell edit callbacks
		if (typeof def.cellEdited == "function") {
			self.cellEvents.cellEdited = def.cellEdited;
		}

		if (typeof def.cellEditing == "function") {
			self.cellEvents.cellEditing = def.cellEditing;
		}

		if (typeof def.cellEditCancelled == "function") {
			self.cellEvents.cellEditCancelled = def.cellEditCancelled;
		}
	};

	//build header element for header
	Column.prototype._buildColumnHeader = function () {
		var self = this,
		    def = self.definition,
		    table = self.table,
		    sortable;

		//set column sorter
		if (table.extExists("sort")) {
			table.extensions.sort.initializeColumn(self, self.contentElement);
		}

		//set column formatter
		if (table.extExists("format")) {
			table.extensions.format.initializeColumn(self);
		}

		//set column editor
		if (typeof def.editor != "undefined" && table.extExists("edit")) {
			table.extensions.edit.initializeColumn(self);
		}

		//set colum validator
		if (typeof def.validator != "undefined" && table.extExists("validate")) {
			table.extensions.validate.initializeColumn(self);
		}

		//set column mutator
		if (table.extExists("mutator")) {
			table.extensions.mutator.initializeColumn(self);
		}

		//set column accessor
		if (table.extExists("accessor")) {
			table.extensions.accessor.initializeColumn(self);
		}

		//set respoviveLayout
		if (_typeof(table.options.responsiveLayout) && table.extExists("responsiveLayout")) {
			table.extensions.responsiveLayout.initializeColumn(self);
		}

		//set column visibility
		if (typeof def.visible != "undefined") {
			if (def.visible) {
				self.show(true);
			} else {
				self.hide(true);
			}
		}

		//asign additional css classes to column header
		if (def.cssClass) {
			self.element.addClass(def.cssClass);
		}

		if (def.field) {
			this.element.attr("tabulator-field", def.field);
		}

		//set min width if present
		self.setMinWidth(typeof def.minWidth == "undefined" ? self.table.options.columnMinWidth : def.minWidth);

		self.reinitializeWidth();

		//set tooltip if present
		self.tooltip = self.definition.tooltip || self.definition.tooltip === false ? self.definition.tooltip : self.table.options.tooltips;

		//set orizontal text alignment
		self.hozAlign = typeof self.definition.align == "undefined" ? "" : self.definition.align;
	};

	Column.prototype._buildColumnHeaderContent = function () {
		var self = this,
		    def = self.definition,
		    table = self.table;

		var contentElement = $("<div class='tabulator-col-content'></div>");

		contentElement.append(self._buildColumnHeaderTitle());

		return contentElement;
	};

	//build title element of column
	Column.prototype._buildColumnHeaderTitle = function () {
		var self = this,
		    def = self.definition,
		    table = self.table,
		    title;

		var titleHolderElement = $("<div class='tabulator-col-title'></div>");

		if (def.editableTitle) {
			var titleElement = $("<input class='tabulator-title-editor'>");

			titleElement.on("click", function (e) {
				e.stopPropagation();
				$(this).focus();
			});

			titleElement.on("change", function () {
				var newTitle = $(this).val();
				def.title = newTitle;
				table.options.columnTitleChanged(self.getComponent());
			});

			titleHolderElement.append(titleElement);

			if (def.field) {
				table.extensions.localize.bind("columns|" + def.field, function (text) {
					titleElement.val(text || def.title || "&nbsp");
				});
			} else {
				titleElement.val(def.title || "&nbsp");
			}
		} else {
			if (def.field) {
				table.extensions.localize.bind("columns|" + def.field, function (text) {
					self._formatColumnHeaderTitle(titleHolderElement, text || def.title || "&nbsp");
				});
			} else {
				self._formatColumnHeaderTitle(titleHolderElement, def.title || "&nbsp");
			}
		}

		return titleHolderElement;
	};

	Column.prototype._formatColumnHeaderTitle = function (el, title) {
		var formatter, contents;

		if (this.definition.titleFormatter && this.table.extExists("format")) {

			formatter = this.table.extensions.format.getFormatter(this.definition.titleFormatter);

			contents = formatter.call(this.table.extensions.format, {
				getValue: function getValue() {
					return title;
				},
				getElement: function getElement() {
					return el;
				}
			}, this.definition.titleFormatterParams || {});

			el.append(contents);
		} else {
			el.html(title);
		}
	};

	//build header element for column group
	Column.prototype._buildGroupHeader = function () {
		var self = this,
		    def = self.definition,
		    table = self.table;

		self.element.addClass("tabulator-col-group").attr("role", "columngroup").attr("aria-title", def.title);

		self.element.append(self.groupElement);
	};

	//flat field lookup
	Column.prototype._getFlatData = function (data) {
		return data[this.field];
	};

	//nested field lookup
	Column.prototype._getNestedData = function (data) {
		var dataObj = data,
		    structure = this.fieldStructure,
		    length = structure.length,
		    output;

		for (var i = 0; i < length; i++) {

			dataObj = dataObj[structure[i]];

			output = dataObj;

			if (!dataObj) {
				break;
			}
		}

		return output;
	};

	//flat field set
	Column.prototype._setFlatData = function (data, value) {
		data[this.field] = value;
	};

	//nested field set
	Column.prototype._setNesteData = function (data, value) {
		var dataObj = data,
		    structure = this.fieldStructure,
		    length = structure.length;

		for (var i = 0; i < length; i++) {

			if (i == length - 1) {
				dataObj[structure[i]] = value;
			} else {
				if (!dataObj[structure[i]]) {
					dataObj[structure[i]] = {};
				}

				dataObj = dataObj[structure[i]];
			}
		}
	};

	//attach column to this group
	Column.prototype.attachColumn = function (column) {
		var self = this;

		if (self.groupElement) {
			self.columns.push(column);
			self.groupElement.append(column.getElement());
		} else {
			console.warn("Column Warning - Column being attached to another column instead of column group");
		}
	};

	//vertically align header in column
	Column.prototype.verticalAlign = function (alignment) {

		//calculate height of column header and group holder element
		var parentHeight = this.parent.isGroup ? this.parent.getGroupElement().innerHeight() : this.parent.getHeadersElement().innerHeight();

		this.element.css("height", parentHeight);

		if (this.isGroup) {
			this.groupElement.css("min-height", parentHeight - this.contentElement.outerHeight());
		}

		//vertically align cell contents
		if (!this.isGroup && alignment !== "top") {
			if (alignment === "bottom") {
				this.element.css({ "padding-top": this.element.innerHeight() - this.contentElement.outerHeight() });
			} else {
				this.element.css({ "padding-top": (this.element.innerHeight() - this.contentElement.outerHeight()) / 2 });
			}
		}

		this.columns.forEach(function (column) {
			column.verticalAlign(alignment);
		});
	};

	//clear vertical alignmenet
	Column.prototype.clearVerticalAlign = function () {
		this.element.css("padding-top", "");
		this.element.css("height", "");
		this.element.css("min-height", "");

		this.columns.forEach(function (column) {
			column.clearVerticalAlign();
		});
	};

	//// Retreive Column Information ////

	//return column header element
	Column.prototype.getElement = function () {
		return this.element;
	};

	//return colunm group element
	Column.prototype.getGroupElement = function () {
		return this.groupElement;
	};

	//return field name
	Column.prototype.getField = function () {
		return this.field;
	};

	//return the first column in a group
	Column.prototype.getFirstColumn = function () {
		if (!this.isGroup) {
			return this;
		} else {
			if (this.columns.length) {
				return this.columns[0].getFirstColumn();
			} else {
				return false;
			}
		}
	};

	//return the last column in a group
	Column.prototype.getLastColumn = function () {
		if (!this.isGroup) {
			return this;
		} else {
			if (this.columns.length) {
				return this.columns[this.columns.length - 1].getLastColumn();
			} else {
				return false;
			}
		}
	};

	//return all columns in a group
	Column.prototype.getColumns = function () {
		return this.columns;
	};

	//return all columns in a group
	Column.prototype.getCells = function () {
		return this.cells;
	};

	//retreive the top column in a group of columns
	Column.prototype.getTopColumn = function () {
		if (this.parent.isGroup) {
			return this.parent.getTopColumn();
		} else {
			return this;
		}
	};

	//return column definition object
	Column.prototype.getDefinition = function (updateBranches) {
		var colDefs = [];

		if (this.isGroup && updateBranches) {
			this.columns.forEach(function (column) {
				colDefs.push(column.getDefinition(true));
			});

			this.definition.columns = colDefs;
		}

		return this.definition;
	};

	//////////////////// Actions ////////////////////

	Column.prototype.checkColumnVisibility = function () {
		var visible = false;

		this.columns.forEach(function (column) {
			if (column.visible) {
				visible = true;
			}
		});

		if (visible) {
			this.show();
			this.parent.table.options.columnVisibilityChanged(this.getComponent(), false);
		} else {
			this.hide();
		}
	};

	//show column
	Column.prototype.show = function (silent, responsiveToggle) {
		if (!this.visible) {
			this.visible = true;

			this.element.css({
				"display": ""
			});
			this.table.columnManager._verticalAlignHeaders();

			if (this.parent.isGroup) {
				this.parent.checkColumnVisibility();
			}

			this.cells.forEach(function (cell) {
				cell.show();
			});

			if (this.table.options.persistentLayout && this.table.extExists("responsiveLayout", true)) {
				this.table.extensions.persistence.save("columns");
			}

			if (!responsiveToggle && this.table.options.responsiveLayout && this.table.extExists("responsiveLayout", true)) {
				this.table.extensions.responsiveLayout.updateColumnVisibility(this, this.visible);
			}

			if (!silent) {
				this.table.options.columnVisibilityChanged(this.getComponent(), true);
			}
		}
	};

	//hide column
	Column.prototype.hide = function (silent, responsiveToggle) {
		if (this.visible) {
			this.visible = false;

			this.element.css({
				"display": "none"
			});
			this.table.columnManager._verticalAlignHeaders();

			if (this.parent.isGroup) {
				this.parent.checkColumnVisibility();
			}

			this.cells.forEach(function (cell) {
				cell.hide();
			});

			if (this.table.options.persistentLayout && this.table.extExists("persistence", true)) {
				this.table.extensions.persistence.save("columns");
			}

			if (!responsiveToggle && this.table.options.responsiveLayout && this.table.extExists("responsiveLayout", true)) {
				this.table.extensions.responsiveLayout.updateColumnVisibility(this, this.visible);
			}

			if (!silent) {
				this.table.options.columnVisibilityChanged(this.getComponent(), false);
			}
		}
	};

	Column.prototype.matchChildWidths = function () {
		var childWidth = 0;

		if (this.contentElement && this.columns.length) {
			this.columns.forEach(function (column) {
				childWidth += column.getWidth();
			});

			this.contentElement.css("max-width", childWidth - 1);
		}
	};

	Column.prototype.setWidth = function (width) {
		this.widthFixed = true;
		this.setWidthActual(width);
	};

	Column.prototype.setWidthActual = function (width) {

		if (isNaN(width)) {
			width = Math.floor(this.table.element.innerWidth() / 100 * parseInt(width));
		}

		width = Math.max(this.minWidth, width);

		this.width = width;

		this.element.css("width", width || "");

		if (!this.isGroup) {
			this.cells.forEach(function (cell) {
				cell.setWidth(width);
			});
		}

		if (this.parent.isGroup) {
			this.parent.matchChildWidths();
		}

		//set resizable handles
		if (this.table.extExists("frozenColumns")) {
			this.table.extensions.frozenColumns.layout();
		}
	};

	Column.prototype.checkCellHeights = function () {
		var rows = [];

		this.cells.forEach(function (cell) {
			if (cell.row.heightInitialized) {
				if (cell.row.element[0].offsetParent !== null) {
					rows.push(cell.row);
					cell.row.clearCellHeight();
				} else {
					cell.row.heightInitialized = false;
				}
			}
		});

		rows.forEach(function (row) {
			row.calcHeight();
		});

		rows.forEach(function (row) {
			row.setCellHeight();
		});
	};

	Column.prototype.getWidth = function () {
		return this.element.outerWidth();
	};

	Column.prototype.getHeight = function () {
		return this.element.outerHeight();
	};

	Column.prototype.setMinWidth = function (minWidth) {
		this.minWidth = minWidth;

		this.element.css("min-width", minWidth || "");

		this.cells.forEach(function (cell) {
			cell.setMinWidth(minWidth);
		});
	};

	Column.prototype.delete = function () {
		if (this.isGroup) {
			this.columns.forEach(function (column) {
				column.delete();
			});
		}

		var cellCount = this.cells.length;

		for (var i = 0; i < cellCount; i++) {
			this.cells[0].delete();
		}

		this.element.detach();

		this.table.columnManager.deregisterColumn(this);
	};

	//////////////// Cell Management /////////////////

	//generate cell for this column
	Column.prototype.generateCell = function (row) {
		var self = this;

		var cell = new Cell(self, row);

		this.cells.push(cell);

		return cell;
	};

	Column.prototype.reinitializeWidth = function (force) {

		this.widthFixed = false;

		//set width if present
		if (typeof this.definition.width !== "undefined" && !force) {
			this.setWidth(this.definition.width);
		}

		//hide header filters to prevent them altering column width
		if (this.table.extExists("filter")) {
			this.table.extensions.filter.hideHeaderFilterElements();
		}

		this.fitToData();

		//show header filters again after layout is complete
		if (this.table.extExists("filter")) {
			this.table.extensions.filter.showHeaderFilterElements();
		}
	};

	//set column width to maximum cell width
	Column.prototype.fitToData = function () {
		var self = this;

		if (!this.widthFixed) {
			this.element.css("width", "");

			self.cells.forEach(function (cell) {
				cell.setWidth("");
			});
		}

		var maxWidth = this.element.outerWidth();

		if (!self.width || !this.widthFixed) {
			self.cells.forEach(function (cell) {
				var width = cell.getWidth();

				if (width > maxWidth) {
					maxWidth = width;
				}
			});

			if (maxWidth) {
				self.setWidthActual(maxWidth + 1);
			}
		}
	};

	Column.prototype.deleteCell = function (cell) {
		var index = this.cells.indexOf(cell);

		if (index > -1) {
			this.cells.splice(index, 1);
		}
	};

	//////////////// Event Bindings /////////////////

	//////////////// Object Generation /////////////////
	Column.prototype.getComponent = function () {
		return new ColumnComponent(this);
	};
	var RowManager = function RowManager(table) {

		this.table = table;
		this.element = $("<div class='tabulator-tableHolder' tabindex='0'></div>"); //containing element
		this.tableElement = $("<div class='tabulator-table'></div>"); //table element
		this.columnManager = null; //hold column manager object
		this.height = 0; //hold height of table element

		this.firstRender = false; //handle first render
		this.renderMode = "classic"; //current rendering mode

		this.rows = []; //hold row data objects
		this.activeRows = []; //rows currently available to on display in the table
		this.activeRowsCount = 0; //count of active rows

		this.displayRows = []; //rows currently on display in the table
		this.displayRowsCount = 0; //count of display rows

		this.scrollTop = 0;
		this.scrollLeft = 0;

		this.vDomRowHeight = 20; //approximation of row heights for padding

		this.vDomTop = 0; //hold position for first rendered row in the virtual DOM
		this.vDomBottom = 0; //hold possition for last rendered row in the virtual DOM

		this.vDomScrollPosTop = 0; //last scroll position of the vDom top;
		this.vDomScrollPosBottom = 0; //last scroll position of the vDom bottom;

		this.vDomTopPad = 0; //hold value of padding for top of virtual DOM
		this.vDomBottomPad = 0; //hold value of padding for bottom of virtual DOM

		this.vDomMaxRenderChain = 90; //the maximum number of dom elements that can be rendered in 1 go

		this.vDomWindowBuffer = 0; //window row buffer before removing elements, to smooth scrolling

		this.vDomWindowMinTotalRows = 20; //minimum number of rows to be generated in virtual dom (prevent buffering issues on tables with tall rows)
		this.vDomWindowMinMarginRows = 5; //minimum number of rows to be generated in virtual dom margin

		this.vDomTopNewRows = []; //rows to normalize after appending to optimize render speed
		this.vDomBottomNewRows = []; //rows to normalize after appending to optimize render speed
	};

	//////////////// Setup Functions /////////////////

	//return containing element
	RowManager.prototype.getElement = function () {
		return this.element;
	};

	//return table element
	RowManager.prototype.getTableElement = function () {
		return this.tableElement;
	};

	//return position of row in table
	RowManager.prototype.getRowPosition = function (row, active) {
		if (active) {
			return this.activeRows.indexOf(row);
		} else {
			return this.rows.indexOf(row);
		}
	};

	//link to column manager
	RowManager.prototype.setColumnManager = function (manager) {
		this.columnManager = manager;
	};

	RowManager.prototype.initialize = function () {
		var self = this;

		self.setRenderMode();

		//initialize manager
		self.element.append(self.tableElement);

		self.firstRender = true;

		//scroll header along with table body
		self.element.scroll(function () {
			var left = self.element[0].scrollLeft;

			//handle horizontal scrolling
			if (self.scrollLeft != left) {
				self.columnManager.scrollHorizontal(left);

				if (self.table.options.groupBy) {
					self.table.extensions.groupRows.scrollHeaders(left);
				}

				if (self.table.extExists("columnCalcs")) {
					self.table.extensions.columnCalcs.scrollHorizontal(left);
				}
			}

			self.scrollLeft = left;
		});

		//handle virtual dom scrolling
		if (this.renderMode === "virtual") {

			self.element.scroll(function () {
				var top = self.element[0].scrollTop;
				var dir = self.scrollTop > top;

				//handle verical scrolling
				if (self.scrollTop != top) {
					self.scrollTop = top;
					self.scrollVertical(dir);

					if (self.table.options.ajaxProgressiveLoad == "scroll") {
						self.table.extensions.ajax.nextPage(self.element[0].scrollHeight - self.element[0].clientHeight - top);
					}
				} else {
					self.scrollTop = top;
				}
			});
		}
	};

	////////////////// Row Manipulation //////////////////

	RowManager.prototype.findRow = function (subject) {
		var self = this;

		if ((typeof subject === 'undefined' ? 'undefined' : _typeof(subject)) == "object") {

			if (subject instanceof Row) {
				//subject is row element
				return subject;
			} else if (subject instanceof RowComponent) {
				//subject is public row component
				return subject._getSelf() || false;
			} else if (subject instanceof jQuery) {
				//subject is a jquery element of the row
				var match = self.rows.find(function (row) {
					return row.element === subject;
				});

				return match || false;
			}
		} else if (typeof subject == "undefined" || subject === null) {
			return false;
		} else {
			//subject should be treated as the index of the row
			var _match = self.rows.find(function (row) {
				return row.data[self.table.options.index] == subject;
			});

			return _match || false;
		}

		//catch all for any other type of input

		return false;
	};

	RowManager.prototype.getRowFromPosition = function (position, active) {
		if (active) {
			return this.activeRows[position];
		} else {
			return this.rows[position];
		}
	};

	RowManager.prototype.scrollToRow = function (row, position, ifVisible) {
		var rowIndex = this.getDisplayRows().indexOf(row),
		    offset = 0;

		if (rowIndex > -1) {

			if (typeof position === "undefined") {
				position = this.table.options.scrollToRowPosition;
			}

			if (typeof ifVisible === "undefined") {
				ifVisible = this.table.options.scrollToRowIfVisible;
			}

			if (position === "nearest") {
				switch (this.renderMode) {
					case "classic":
						position = Math.abs(this.element.scrollTop() - row.element.position().top) > Math.abs(this.element.scrollTop() + this.element[0].clientHeight - row.element.position().top) ? "bottom" : "top";
						break;
					case "virtual":
						position = Math.abs(this.vDomTop - rowIndex) > Math.abs(this.vDomBottom - rowIndex) ? "bottom" : "top";
						break;
				}
			}

			//check row visibility
			if (!ifVisible) {
				if (row.element.is(":visible")) {
					offset = row.element.offset().top - this.element.offset().top;

					if (offset > 0 && offset < this.element[0].clientHeight - row.element.outerHeight()) {
						return false;
					}
				}
			}

			//scroll to row
			switch (this.renderMode) {
				case "classic":
					this.element.scrollTop(row.element.offset().top - this.element.offset().top + this.element.scrollTop());
					break;
				case "virtual":
					this._virtualRenderFill(rowIndex, true);
					break;
			}

			//align to correct position
			switch (position) {
				case "middle":
				case "center":
					this.element.scrollTop(this.element.scrollTop() - this.element[0].clientHeight / 2);
					break;

				case "bottom":
					this.element.scrollTop(this.element.scrollTop() - this.element[0].clientHeight + row.getElement().outerHeight());
					break;
			}

			return true;
		} else {
			console.warn("Scroll Error - Row not visible");
			return false;
		}
	};

	////////////////// Data Handling //////////////////

	RowManager.prototype.setData = function (data, renderInPosition) {
		var self = this;
		if (renderInPosition && this.getDisplayRows().length) {
			if (self.table.options.pagination) {
				self._setDataActual(data, true);
			} else {
				this.reRenderInPosition(function () {
					self._setDataActual(data);
				});
			}
		} else {

			this.resetScroll();
			this._setDataActual(data);
		}
	};

	RowManager.prototype._setDataActual = function (data, renderInPosition) {
		var self = this;

		self.table.options.dataLoading(data);

		self.rows.forEach(function (row) {
			row.wipe();
		});

		self.rows = [];

		if (this.table.options.history && this.table.extExists("history")) {
			this.table.extensions.history.clear();
		}

		if (Array.isArray(data)) {

			if (this.table.extExists("selectRow")) {
				this.table.extensions.selectRow.clearSelectionData();
			}

			data.forEach(function (def, i) {
				if (def && (typeof def === 'undefined' ? 'undefined' : _typeof(def)) === "object") {
					var row = new Row(def, self);
					self.rows.push(row);
				} else {
					console.warn("Data Loading Warning - Invalid row data detected and ignored, expecting object but receved:", def);
				}
			});

			self.table.options.dataLoaded(data);

			self.refreshActiveData(false, false, renderInPosition);
		} else {
			console.error("Data Loading Error - Unable to process data due to invalid data type \nExpecting: array \nReceived: ", typeof data === 'undefined' ? 'undefined' : _typeof(data), "\nData:     ", data);
		}
	};

	RowManager.prototype.deleteRow = function (row) {
		var allIndex = this.rows.indexOf(row),
		    activeIndex = this.activeRows.indexOf(row);

		if (activeIndex > -1) {
			this.activeRows.splice(activeIndex, 1);
		}

		if (allIndex > -1) {
			this.rows.splice(allIndex, 1);
		}

		this.setActiveRows(this.activeRows);

		this.displayRowIterator(function (rows) {
			var displayIndex = rows.indexOf(row);

			if (displayIndex > -1) {
				rows.splice(displayIndex, 1);
			}
		});

		this.reRenderInPosition();

		this.table.options.rowDeleted(row.getComponent());

		this.table.options.dataEdited(this.getData());

		if (this.table.options.groupBy && this.table.extExists("groupRows")) {
			this.table.extensions.groupRows.updateGroupRows(true);
		} else if (this.table.options.pagination && this.table.extExists("page")) {
			this.refreshActiveData(false, false, true);
		} else {
			if (this.table.options.pagination && this.table.extExists("page")) {
				this.refreshActiveData("page");
			}
		}
	};

	RowManager.prototype.addRow = function (data, pos, index, blockRedraw) {

		var row = this.addRowActual(data, pos, index, blockRedraw);

		if (this.table.options.history && this.table.extExists("history")) {
			this.table.extensions.history.action("rowAdd", row, { data: data, pos: pos, index: index });
		};

		return row;
	};

	//add multiple rows
	RowManager.prototype.addRows = function (data, pos, index) {
		var self = this,
		    length = 0,
		    rows = [];

		pos = this.findAddRowPos(pos);

		if (!Array.isArray(data)) {
			data = [data];
		}

		length = data.length - 1;

		if (typeof index == "undefined" && pos || typeof index !== "undefined" && !pos) {
			data.reverse();
		}

		data.forEach(function (item, i) {
			var row = self.addRow(item, pos, index, true);
			rows.push(row);
		});

		if (this.table.options.groupBy && this.table.extExists("groupRows")) {
			this.table.extensions.groupRows.updateGroupRows(true);
		} else if (this.table.options.pagination && this.table.extExists("page")) {
			this.refreshActiveData(false, false, true);
		} else {
			this.reRenderInPosition();
		}

		//recalc column calculations if present
		if (this.table.extExists("columnCalcs")) {
			this.table.extensions.columnCalcs.recalc(this.table.rowManager.activeRows);
		}

		return rows;
	};

	RowManager.prototype.findAddRowPos = function (pos) {

		if (typeof pos === "undefined") {
			pos = this.table.options.addRowPos;
		}

		if (pos === "pos") {
			pos = true;
		}

		if (pos === "bottom") {
			pos = false;
		}

		return pos;
	};

	RowManager.prototype.addRowActual = function (data, pos, index, blockRedraw) {
		var row = new Row(data || {}, this),
		    top = this.findAddRowPos(pos),
		    dispRows;

		if (!index && this.table.options.pagination && this.table.options.paginationAddRow == "page") {
			dispRows = this.getDisplayRows();

			if (top) {
				if (dispRows.length) {
					index = dispRows[0];
				} else {
					if (this.activeRows.length) {
						index = this.activeRows[this.activeRows.length - 1];
						top = false;
					}
				}
			} else {
				if (dispRows.length) {
					index = dispRows[dispRows.length - 1];
					top = dispRows.length < this.table.extensions.page.getPageSize() ? false : true;
				}
			}
		}

		if (index) {
			index = this.findRow(index);
		}

		if (this.table.options.groupBy && this.table.extExists("groupRows")) {
			this.table.extensions.groupRows.assignRowToGroup(row);

			var groupRows = row.getGroup().rows;

			if (groupRows.length > 1) {

				if (!index || index && groupRows.indexOf(index) == -1) {
					if (top) {
						if (groupRows[0] !== row) {
							index = groupRows[0];
							this._moveRowInArray(row.getGroup().rows, row, index, top);
						}
					} else {
						if (groupRows[groupRows.length - 1] !== row) {
							index = groupRows[groupRows.length - 1];
							this._moveRowInArray(row.getGroup().rows, row, index, top);
						}
					}
				} else {
					this._moveRowInArray(row.getGroup().rows, row, index, top);
				}
			}
		};

		if (index) {
			var allIndex = this.rows.indexOf(index),
			    activeIndex = this.activeRows.indexOf(index);

			this.displayRowIterator(function (rows) {
				var displayIndex = rows.indexOf(index);

				if (displayIndex > -1) {
					rows.splice(top ? displayIndex : displayIndex + 1, 0, row);
				}
			});

			if (activeIndex > -1) {
				this.activeRows.splice(top ? activeIndex : activeIndex + 1, 0, row);
			}

			if (allIndex > -1) {
				this.rows.splice(top ? allIndex : allIndex + 1, 0, row);
			}
		} else {

			if (top) {

				this.displayRowIterator(function (rows) {
					rows.unshift(row);
				});

				this.activeRows.unshift(row);
				this.rows.unshift(row);
			} else {
				this.displayRowIterator(function (rows) {
					rows.push(row);
				});

				this.activeRows.push(row);
				this.rows.push(row);
			}
		}

		this.setActiveRows(this.activeRows);

		this.table.options.rowAdded(row.getComponent());

		this.table.options.dataEdited(this.getData());

		if (!blockRedraw) {
			this.reRenderInPosition();
		}

		return row;
	};

	RowManager.prototype.moveRow = function (from, to, after) {
		if (this.table.options.history && this.table.extExists("history")) {
			this.table.extensions.history.action("rowMove", from, { pos: this.getRowPosition(from), to: to, after: after });
		};

		this.moveRowActual(from, to, after);

		this.table.options.rowMoved(from.getComponent());
	};

	RowManager.prototype.moveRowActual = function (from, to, after) {
		var self = this;
		this._moveRowInArray(this.rows, from, to, after);
		this._moveRowInArray(this.activeRows, from, to, after);

		this.displayRowIterator(function (rows) {
			self._moveRowInArray(rows, from, to, after);
		});

		if (this.table.options.groupBy && this.table.extExists("groupRows")) {
			var toGroup = to.getGroup();
			var fromGroup = from.getGroup();

			if (toGroup === fromGroup) {
				this._moveRowInArray(toGroup.rows, from, to, after);
			} else {
				if (fromGroup) {
					fromGroup.removeRow(from);
				}

				toGroup.insertRow(from, to, after);
			}
		}
	};

	RowManager.prototype._moveRowInArray = function (rows, from, to, after) {
		var fromIndex, toIndex, start, end;

		if (from !== to) {

			fromIndex = rows.indexOf(from);

			if (fromIndex > -1) {

				rows.splice(fromIndex, 1);

				toIndex = rows.indexOf(to);

				if (toIndex > -1) {

					if (after) {
						rows.splice(toIndex + 1, 0, from);
					} else {
						rows.splice(toIndex, 0, from);
					}
				} else {
					rows.splice(fromIndex, 0, from);
				}
			}

			//restyle rows
			if (rows === this.getDisplayRows()) {

				start = fromIndex < toIndex ? fromIndex : toIndex;
				end = toIndex > fromIndex ? toIndex : fromIndex + 1;

				for (var i = start; i <= end; i++) {
					if (rows[i]) {
						this.styleRow(rows[i], i);
					}
				}
			}
		}
	};

	RowManager.prototype.clearData = function () {
		this.setData([]);
	};

	RowManager.prototype.getRowIndex = function (row) {
		return this.findRowIndex(row, this.rows);
	};

	RowManager.prototype.getDisplayRowIndex = function (row) {
		var index = this.getDisplayRows().indexOf(row);
		return index > -1 ? index : false;
	};

	RowManager.prototype.nextDisplayRow = function (row, rowOnly) {
		var index = this.getDisplayRowIndex(row),
		    nextRow = false;

		if (index !== false && index < this.displayRowsCount - 1) {
			nextRow = this.getDisplayRows()[index + 1];
		}

		if (nextRow && (!(nextRow instanceof Row) || nextRow.type != "row")) {
			return this.nextDisplayRow(nextRow, rowOnly);
		}

		return nextRow;
	};

	RowManager.prototype.prevDisplayRow = function (row, rowOnly) {
		var index = this.getDisplayRowIndex(row),
		    prevRow = false;

		if (index) {
			prevRow = this.getDisplayRows()[index - 1];
		}

		if (prevRow && (!(prevRow instanceof Row) || prevRow.type != "row")) {
			return this.prevDisplayRow(prevRow, rowOnly);
		}

		return prevRow;
	};

	RowManager.prototype.findRowIndex = function (row, list) {
		var rowIndex;

		row = this.findRow(row);

		if (row) {
			rowIndex = list.indexOf(row);

			if (rowIndex > -1) {
				return rowIndex;
			}
		}

		return false;
	};

	RowManager.prototype.getData = function (active, transform) {
		var self = this,
		    output = [];

		var rows = active ? self.activeRows : self.rows;

		rows.forEach(function (row) {
			output.push(row.getData(transform || "data"));
		});

		return output;
	};

	RowManager.prototype.getHtml = function (active) {
		var data = this.getData(active),
		    columns = [],
		    header = "",
		    body = "",
		    table = "";

		//build header row
		this.table.columnManager.getColumns().forEach(function (column) {
			var def = column.getDefinition();

			if (column.visible && !def.hideInHtml) {
				header += '<th>' + (def.title || "") + '</th>';
				columns.push(column);
			}
		});

		//build body rows
		data.forEach(function (rowData) {
			var row = "";

			columns.forEach(function (column) {
				var value = column.getFieldValue(rowData);

				if (typeof value === "undefined" || value === null) {
					value = ":";
				}

				row += '<td>' + value + '</td>';
			});

			body += '<tr>' + row + '</tr>';
		});

		//build table
		table = '<table>\n\t\t\t<thead>\n\t\t\t<tr>' + header + '</tr>\n\t\t\t</thead>\n\t\t\t<tbody>' + body + '</tbody>\n\t\t\t</table>';

		return table;
	};

	RowManager.prototype.getComponents = function (active) {
		var self = this,
		    output = [];

		var rows = active ? self.activeRows : self.rows;

		rows.forEach(function (row) {
			output.push(row.getComponent());
		});

		return output;
	};

	RowManager.prototype.getDataCount = function (active) {
		return active ? this.rows.length : this.activeRows.length;
	};

	RowManager.prototype._genRemoteRequest = function () {
		var self = this,
		    table = self.table,
		    options = table.options,
		    params = {};

		if (table.extExists("page")) {
			//set sort data if defined
			if (options.ajaxSorting) {
				var sorters = self.table.extensions.sort.getSort();

				sorters.forEach(function (item) {
					delete item.column;
				});

				params[self.table.extensions.page.paginationDataSentNames.sorters] = sorters;
			}

			//set filter data if defined
			if (options.ajaxFiltering) {
				var filters = self.table.extensions.filter.getFilters(true, true);

				params[self.table.extensions.page.paginationDataSentNames.filters] = filters;
			}

			self.table.extensions.ajax.setParams(params, true);
		}

		table.extensions.ajax.sendRequest(function (data) {
			self.setData(data);
		});
	};

	//choose the path to refresh data after a filter update
	RowManager.prototype.filterRefresh = function () {
		var table = this.table,
		    options = table.options,
		    left = this.scrollLeft;

		if (options.ajaxFiltering) {
			if (options.pagination == "remote" && table.extExists("page")) {
				table.extensions.page.reset(true);
				table.extensions.page.setPage(1);
			} else {
				//assume data is url, make ajax call to url to get data
				this._genRemoteRequest();
			}
		} else {
			this.refreshActiveData("filter");
		}

		this.scrollHorizontal(left);
	};

	//choose the path to refresh data after a sorter update
	RowManager.prototype.sorterRefresh = function () {
		var table = this.table,
		    options = this.table.options,
		    left = this.scrollLeft;

		if (options.ajaxSorting) {
			if (options.pagination == "remote" && table.extExists("page")) {
				table.extensions.page.reset(true);
				table.extensions.page.setPage(1);
			} else {
				//assume data is url, make ajax call to url to get data
				this._genRemoteRequest();
			}
		} else {
			this.refreshActiveData("sort");
		}

		this.scrollHorizontal(left);
	};

	RowManager.prototype.scrollHorizontal = function (left) {
		this.scrollLeft = left;
		this.element.scrollLeft(left);

		if (this.table.options.groupBy) {
			this.table.extensions.groupRows.scrollHeaders(left);
		}

		if (this.table.extExists("columnCalcs")) {
			this.table.extensions.columnCalcs.scrollHorizontal(left);
		}
	};

	//set active data set
	RowManager.prototype.refreshActiveData = function (stage, skipStage, renderInPosition) {
		var self = this,
		    table = this.table,
		    displayIndex;

		if (!stage) {
			stage = "all";
		}

		if (table.options.selectable && !table.options.selectablePersistence && table.extExists("selectRow")) {
			table.extensions.selectRow.deselectRows();
		}

		//cascade through data refresh stages
		switch (stage) {
			case "all":

			case "filter":
				if (!skipStage) {
					if (table.extExists("filter")) {
						self.setActiveRows(table.extensions.filter.filter(self.rows));
					} else {
						self.setActiveRows(self.rows.slice(0));
					}
				} else {
					skipStage = false;
				}

			case "sort":
				if (!skipStage) {
					if (table.extExists("sort")) {
						table.extensions.sort.sort();
					}
				} else {
					skipStage = false;
				}

			//generic stage to allow for pipeline trigger after the data manipulation stage
			case "display":
				this.resetDisplayRows();

			case "freeze":
				if (!skipStage) {
					if (this.table.extExists("frozenRows")) {
						if (table.extensions.frozenRows.isFrozen()) {
							if (!table.extensions.frozenRows.getDisplayIndex()) {
								table.extensions.frozenRows.setDisplayIndex(this.getNextDisplayIndex());
							}

							displayIndex = table.extensions.frozenRows.getDisplayIndex();

							displayIndex = self.setDisplayRows(table.extensions.frozenRows.getRows(this.getDisplayRows(displayIndex - 1)), displayIndex);

							if (displayIndex !== true) {
								table.extensions.frozenRows.setDisplayIndex(displayIndex);
							}
						}
					}
				} else {
					skipStage = false;
				}

			case "group":
				if (!skipStage) {
					if (table.options.groupBy && table.extExists("groupRows")) {

						if (!table.extensions.groupRows.getDisplayIndex()) {
							table.extensions.groupRows.setDisplayIndex(this.getNextDisplayIndex());
						}

						displayIndex = table.extensions.groupRows.getDisplayIndex();

						displayIndex = self.setDisplayRows(table.extensions.groupRows.getRows(this.getDisplayRows(displayIndex - 1)), displayIndex);

						if (displayIndex !== true) {
							table.extensions.groupRows.setDisplayIndex(displayIndex);
						}
					}
				} else {
					skipStage = false;
				}

				if (table.options.pagination && table.extExists("page") && !renderInPosition) {
					if (table.extensions.page.getMode() == "local") {
						table.extensions.page.reset();
					}
				}

			case "page":
				if (!skipStage) {
					if (table.options.pagination && table.extExists("page")) {

						if (!table.extensions.page.getDisplayIndex()) {
							table.extensions.page.setDisplayIndex(this.getNextDisplayIndex());
						}

						displayIndex = table.extensions.page.getDisplayIndex();

						if (table.extensions.page.getMode() == "local") {
							table.extensions.page.setMaxRows(this.getDisplayRows(displayIndex - 1).length);
						}

						displayIndex = self.setDisplayRows(table.extensions.page.getRows(this.getDisplayRows(displayIndex - 1)), displayIndex);

						if (displayIndex !== true) {
							table.extensions.page.setDisplayIndex(displayIndex);
						}
					}
				} else {
					skipStage = false;
				}
		}

		if (self.element.is(":visible")) {
			if (renderInPosition) {
				self.reRenderInPosition();
			} else {
				self.renderTable();
				if (table.options.layoutColumnsOnNewData) {
					self.table.columnManager.redraw(true);
				}
			}
		}

		if (table.extExists("columnCalcs")) {
			table.extensions.columnCalcs.recalc(this.activeRows);
		}
	};

	RowManager.prototype.setActiveRows = function (activeRows) {
		this.activeRows = activeRows;
		this.activeRowsCount = this.activeRows.length;
	};

	//reset display rows array
	RowManager.prototype.resetDisplayRows = function () {
		this.displayRows = [];

		this.displayRows.push(this.activeRows.slice(0));

		this.displayRowsCount = this.displayRows[0].length;

		if (this.table.extExists("frozenRows")) {
			this.table.extensions.frozenRows.setDisplayIndex(0);
		}

		if (this.table.options.groupBy && this.table.extExists("groupRows")) {
			this.table.extensions.groupRows.setDisplayIndex(0);
		}

		if (this.table.options.pagination && this.table.extExists("page")) {
			this.table.extensions.page.setDisplayIndex(0);
		}
	};

	RowManager.prototype.getNextDisplayIndex = function () {
		return this.displayRows.length;
	};

	//set display row pipeline data
	RowManager.prototype.setDisplayRows = function (displayRows, index) {

		var output = true;

		if (index && typeof this.displayRows[index] != "undefined") {
			this.displayRows[index] = displayRows;
			output = true;
		} else {
			this.displayRows.push(displayRows);
			output = index = this.displayRows.length - 1;
		}

		if (index == this.displayRows.length - 1) {
			this.displayRowsCount = this.displayRows[this.displayRows.length - 1].length;
		}

		return output;
	};

	RowManager.prototype.getDisplayRows = function (index) {
		if (typeof index == "undefined") {
			return this.displayRows.length ? this.displayRows[this.displayRows.length - 1] : [];
		} else {
			return this.displayRows[index] || [];
		}
	};

	//repeat action accross display rows
	RowManager.prototype.displayRowIterator = function (callback) {
		this.displayRows.forEach(callback);

		this.displayRowsCount = this.displayRows[this.displayRows.length - 1].length;
	};

	//return only actual rows (not group headers etc)
	RowManager.prototype.getRows = function () {
		return this.rows;
	};

	///////////////// Table Rendering /////////////////

	//trigger rerender of table in current position
	RowManager.prototype.reRenderInPosition = function (callback) {
		if (this.getRenderMode() == "virtual") {

			var scrollTop = this.element.scrollTop();
			var topRow = false;
			var topOffset = false;

			var left = this.scrollLeft;

			var rows = this.getDisplayRows();

			for (var i = this.vDomTop; i <= this.vDomBottom; i++) {

				if (rows[i]) {
					var diff = scrollTop - rows[i].getElement().position().top;

					if (topOffset === false || Math.abs(diff) < topOffset) {
						topOffset = diff;
						topRow = i;
					} else {
						break;
					}
				}
			}

			if (callback) {
				callback();
			}

			this._virtualRenderFill(topRow === false ? this.displayRowsCount - 1 : topRow, true, topOffset || 0);

			this.scrollHorizontal(left);
		} else {
			this.renderTable();
		}
	};

	RowManager.prototype.setRenderMode = function () {
		if ((this.table.element.innerHeight() || this.table.options.height) && this.table.options.virtualDom) {
			this.renderMode = "virtual";
		} else {
			this.renderMode = "classic";
		}
	};

	RowManager.prototype.getRenderMode = function () {
		return this.renderMode;
	};

	RowManager.prototype.renderTable = function () {
		var self = this;

		self.table.options.renderStarted();

		self.element.scrollTop(0);

		switch (self.renderMode) {
			case "classic":
				self._simpleRender();
				break;

			case "virtual":
				self._virtualRenderFill();
				break;
		}

		if (self.firstRender) {
			if (self.displayRowsCount) {
				self.firstRender = false;
				self.table.extensions.layout.layout();
			} else {
				self.renderEmptyScroll();
			}
		}

		if (self.table.extExists("frozenColumns")) {
			self.table.extensions.frozenColumns.layout();
		}

		if (!self.displayRowsCount) {
			if (self.table.options.placeholder) {

				if (this.renderMode) {
					self.table.options.placeholder.attr("tabulator-render-mode", this.renderMode);
				}

				self.getElement().append(self.table.options.placeholder);
			}
		}

		self.table.options.renderComplete();
	};

	//simple render on heightless table
	RowManager.prototype._simpleRender = function () {
		var self = this,
		    element = this.tableElement;

		self._clearVirtualDom();

		if (self.displayRowsCount) {

			var onlyGroupHeaders = true;

			self.getDisplayRows().forEach(function (row, index) {
				self.styleRow(row, index);
				element.append(row.getElement());
				row.initialize(true);

				if (row.type !== "group") {
					onlyGroupHeaders = false;
				}
			});

			if (onlyGroupHeaders) {
				self.tableElement.css({
					"min-width": self.table.columnManager.getWidth()
				});
			}
		} else {
			self.renderEmptyScroll();
		}
	};

	//show scrollbars on empty table div
	RowManager.prototype.renderEmptyScroll = function () {
		var self = this;

		self.tableElement.css({
			"min-width": self.table.columnManager.getWidth(),
			"min-height": "1px",
			"visibility": "hidden"
		});
	};

	RowManager.prototype._clearVirtualDom = function () {
		var element = this.tableElement;

		if (this.table.options.placeholder) {
			this.table.options.placeholder.detach();
		}

		element.children().detach();

		element.css({
			"padding-top": "",
			"padding-bottom": "",
			"min-width": "",
			"min-height": "",
			"visibility": ""
		});

		this.scrollTop = 0;
		this.scrollLeft = 0;
		this.vDomTop = 0;
		this.vDomBottom = 0;
		this.vDomTopPad = 0;
		this.vDomBottomPad = 0;
	};

	RowManager.prototype.styleRow = function (row, index) {
		if (index % 2) {
			row.element.addClass("tabulator-row-even").removeClass("tabulator-row-odd");
		} else {
			row.element.addClass("tabulator-row-odd").removeClass("tabulator-row-even");
		}
	};

	//full virtual render
	RowManager.prototype._virtualRenderFill = function (position, forceMove, offset) {
		var self = this,
		    element = self.tableElement,
		    holder = self.element,
		    topPad = 0,
		    rowsHeight = 0,
		    topPadHeight = 0,
		    i = 0,
		    rows = self.getDisplayRows();

		position = position || 0;

		offset = offset || 0;

		if (!position) {
			self._clearVirtualDom();
		} else {
			element.children().detach();

			//check if position is too close to bottom of table
			var heightOccpied = (self.displayRowsCount - position + 1) * self.vDomRowHeight;

			if (heightOccpied < self.height) {
				position -= Math.ceil((self.height - heightOccpied) / self.vDomRowHeight);

				if (position < 0) {
					position = 0;
				}
			}

			//calculate initial pad
			topPad = Math.min(Math.max(Math.floor(self.vDomWindowBuffer / self.vDomRowHeight), self.vDomWindowMinMarginRows), position);
			position -= topPad;
		}

		if (self.displayRowsCount && self.element.is(":visible")) {

			self.vDomTop = position;

			self.vDomBottom = position - 1;

			while ((rowsHeight <= self.height + self.vDomWindowBuffer || i < self.vDomWindowMinTotalRows) && self.vDomBottom < self.displayRowsCount - 1) {
				var index = self.vDomBottom + 1,
				    row = rows[index];

				self.styleRow(row, index);

				element.append(row.getElement());
				if (!row.initialized) {
					row.initialize(true);
				} else {
					if (!row.heightInitialized) {
						row.normalizeHeight(true);
					}
				}

				if (i < topPad) {
					topPadHeight += row.getHeight();
				} else {
					rowsHeight += row.getHeight();
				}

				self.vDomBottom++;
				i++;
			}

			if (!position) {
				this.vDomTopPad = 0;
				//adjust rowheight to match average of rendered elements
				self.vDomRowHeight = Math.floor((rowsHeight + topPadHeight) / i);
				self.vDomBottomPad = self.vDomRowHeight * (self.displayRowsCount - self.vDomBottom - 1);

				self.vDomScrollHeight = topPadHeight + rowsHeight + self.vDomBottomPad - self.height;
			} else {
				self.vDomTopPad = !forceMove ? self.scrollTop - topPadHeight : self.vDomRowHeight * this.vDomTop + offset;
				self.vDomBottomPad = self.vDomBottom == self.displayRowsCount - 1 ? 0 : Math.max(self.vDomScrollHeight - self.vDomTopPad - rowsHeight - topPadHeight, 0);
			}

			element[0].style.paddingTop = self.vDomTopPad + "px";
			element[0].style.paddingBottom = self.vDomBottomPad + "px";

			if (forceMove) {
				this.scrollTop = self.vDomTopPad + topPadHeight + offset;
			}

			this.scrollTop = Math.min(this.scrollTop, this.element[0].scrollHeight - this.height);

			//adjust for horizontal scrollbar if present
			if (this.element[0].scrollWidth > this.element[0].offsetWidt) {
				this.scrollTop += this.element[0].offsetHeight - this.element[0].clientHeight;
			}

			this.vDomScrollPosTop = this.scrollTop;
			this.vDomScrollPosBottom = this.scrollTop;

			holder.scrollTop(this.scrollTop);

			if (self.table.options.groupBy) {
				if (self.table.extensions.layout.getMode() != "fitDataFill" && self.displayRowsCount == self.table.extensions.groupRows.countGroups()) {

					self.tableElement.css({
						"min-width": self.table.columnManager.getWidth()
					});
				}
			}
		} else {
			this.renderEmptyScroll();
		}
	};

	//handle vertical scrolling
	RowManager.prototype.scrollVertical = function (dir) {
		var topDiff = this.scrollTop - this.vDomScrollPosTop;
		var bottomDiff = this.scrollTop - this.vDomScrollPosBottom;
		var margin = this.vDomWindowBuffer * 2;

		if (-topDiff > margin || bottomDiff > margin) {
			//if big scroll redraw table;
			var left = this.scrollLeft;
			this._virtualRenderFill(Math.floor(this.element[0].scrollTop / this.element[0].scrollHeight * this.displayRowsCount));
			this.scrollHorizontal(left);
		} else {

			if (dir) {
				//scrolling up
				if (topDiff < 0) {
					this._addTopRow(-topDiff);
				}

				if (topDiff < 0) {

					//hide bottom row if needed
					if (this.vDomScrollHeight - this.scrollTop > this.vDomWindowBuffer) {
						this._removeBottomRow(-bottomDiff);
					}
				}
			} else {
				//scrolling down
				if (topDiff >= 0) {

					//hide top row if needed
					if (this.scrollTop > this.vDomWindowBuffer) {
						this._removeTopRow(topDiff);
					}
				}

				if (bottomDiff >= 0) {
					this._addBottomRow(bottomDiff);
				}
			}
		}
	};

	RowManager.prototype._addTopRow = function (topDiff) {
		var i = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

		var table = this.tableElement,
		    rows = this.getDisplayRows();

		if (this.vDomTop) {
			var index = this.vDomTop - 1,
			    topRow = rows[index],
			    topRowHeight = topRow.getHeight() || this.vDomRowHeight;

			//hide top row if needed
			if (topDiff >= topRowHeight) {
				this.styleRow(topRow, index);
				table.prepend(topRow.getElement());
				if (!topRow.initialized || !topRow.heightInitialized) {
					this.vDomTopNewRows.push(topRow);

					if (!topRow.heightInitialized) {
						topRow.clearCellHeight();
					}
				}
				topRow.initialize();

				this.vDomTopPad -= topRowHeight;

				if (this.vDomTopPad < 0) {
					this.vDomTopPad = index * this.vDomRowHeight;
				}

				if (!index) {
					this.vDomTopPad = 0;
				}

				table[0].style.paddingTop = this.vDomTopPad + "px";
				this.vDomScrollPosTop -= topRowHeight;
				this.vDomTop--;
			}

			topDiff = -(this.scrollTop - this.vDomScrollPosTop);

			if (i < this.vDomMaxRenderChain && this.vDomTop && topDiff >= (rows[this.vDomTop - 1].getHeight() || this.vDomRowHeight)) {
				this._addTopRow(topDiff, i + 1);
			} else {
				this._quickNormalizeRowHeight(this.vDomTopNewRows);
			}
		}
	};

	RowManager.prototype._removeTopRow = function (topDiff) {
		var table = this.tableElement,
		    topRow = this.getDisplayRows()[this.vDomTop],
		    topRowHeight = topRow.getHeight() || this.vDomRowHeight;

		if (topDiff >= topRowHeight) {

			topRow.element.detach();

			this.vDomTopPad += topRowHeight;
			table[0].style.paddingTop = this.vDomTopPad + "px";
			this.vDomScrollPosTop += this.vDomTop ? topRowHeight : topRowHeight + this.vDomWindowBuffer;
			this.vDomTop++;

			topDiff = this.scrollTop - this.vDomScrollPosTop;

			this._removeTopRow(topDiff);
		}
	};

	RowManager.prototype._addBottomRow = function (bottomDiff) {
		var i = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

		var table = this.tableElement,
		    rows = this.getDisplayRows();

		if (this.vDomBottom < this.displayRowsCount - 1) {
			var index = this.vDomBottom + 1,
			    bottomRow = rows[index],
			    bottomRowHeight = bottomRow.getHeight() || this.vDomRowHeight;

			//hide bottom row if needed
			if (bottomDiff >= bottomRowHeight) {
				this.styleRow(bottomRow, index);
				table.append(bottomRow.getElement());

				if (!bottomRow.initialized || !bottomRow.heightInitialized) {
					this.vDomBottomNewRows.push(bottomRow);

					if (!bottomRow.heightInitialized) {
						bottomRow.clearCellHeight();
					}
				}

				bottomRow.initialize();

				this.vDomBottomPad -= bottomRowHeight;

				if (this.vDomBottomPad < 0 || index == this.displayRowsCount - 1) {
					this.vDomBottomPad = 0;
				}

				table[0].style.paddingBottom = this.vDomBottomPad + "px";
				this.vDomScrollPosBottom += bottomRowHeight;
				this.vDomBottom++;
			}

			bottomDiff = this.scrollTop - this.vDomScrollPosBottom;

			if (i < this.vDomMaxRenderChain && this.vDomBottom < this.displayRowsCount - 1 && bottomDiff >= (rows[this.vDomBottom + 1].getHeight() || this.vDomRowHeight)) {
				this._addBottomRow(bottomDiff, i + 1);
			} else {
				this._quickNormalizeRowHeight(this.vDomBottomNewRows);
			}
		}
	};

	RowManager.prototype._removeBottomRow = function (bottomDiff) {
		var table = this.tableElement,
		    bottomRow = this.getDisplayRows()[this.vDomBottom],
		    bottomRowHeight = bottomRow.getHeight() || this.vDomRowHeight;

		if (bottomDiff >= bottomRowHeight) {

			bottomRow.element.detach();

			this.vDomBottomPad += bottomRowHeight;

			if (this.vDomBottomPad < 0) {
				this.vDomBottomPad == 0;
			}

			table[0].style.paddingBottom = this.vDomBottomPad + "px";
			this.vDomScrollPosBottom -= bottomRowHeight;
			this.vDomBottom--;

			bottomDiff = -(this.scrollTop - this.vDomScrollPosBottom);

			this._removeBottomRow(bottomDiff);
		}
	};

	RowManager.prototype._quickNormalizeRowHeight = function (rows) {
		rows.forEach(function (row) {
			row.calcHeight();
		});

		rows.forEach(function (row) {
			row.setCellHeight();
		});

		rows.length = 0;
	};

	//normalize height of active rows
	RowManager.prototype.normalizeHeight = function () {
		var self = this;

		self.activeRows.forEach(function (row) {
			row.normalizeHeight();
		});
	};

	//adjust the height of the table holder to fit in the Tabulator element
	RowManager.prototype.adjustTableSize = function () {
		var self = this;

		if (this.renderMode === "virtual") {
			self.height = self.element.innerHeight();
			self.vDomWindowBuffer = self.table.options.virtualDomBuffer || self.height;

			var otherHeight = self.columnManager.getElement().outerHeight() + (self.table.footerManager ? self.table.footerManager.getElement().outerHeight() : 0);

			self.element.css({
				"min-height": "calc(100% - " + otherHeight + "px)",
				"height": "calc(100% - " + otherHeight + "px)",
				"max-height": "calc(100% - " + otherHeight + "px)"
			});
		}
	};

	//renitialize all rows
	RowManager.prototype.reinitialize = function () {
		this.rows.forEach(function (row) {
			row.reinitialize();
		});
	};

	//redraw table
	RowManager.prototype.redraw = function (force) {
		var pos = 0,
		    left = this.scrollLeft;

		this.adjustTableSize();

		if (!force) {

			if (self.renderMode == "classic") {

				if (self.table.options.groupBy) {
					self.refreshActiveData("group", false, false);
				} else {
					this._simpleRender();
				}
			} else {
				this.reRenderInPosition();
				this.scrollHorizontal(left);
			}

			if (!this.displayRowsCount) {
				if (this.table.options.placeholder) {
					this.getElement().append(this.table.options.placeholder);
				}
			}
		} else {
			this.renderTable();
		}
	};

	RowManager.prototype.resetScroll = function () {
		this.element.scrollLeft(0);
		this.element.scrollTop(0);
		this.element.scroll();
	};

	//public row object
	var RowComponent = function RowComponent(row) {
		this.row = row;
	};

	RowComponent.prototype.getData = function (transform) {
		return this.row.getData(transform);
	};

	RowComponent.prototype.getElement = function () {
		return this.row.getElement();
	};

	RowComponent.prototype.getCells = function () {
		var cells = [];

		this.row.getCells().forEach(function (cell) {
			cells.push(cell.getComponent());
		});

		return cells;
	};

	RowComponent.prototype.getCell = function (column) {
		return this.row.getCell(column).getComponent();
	};

	RowComponent.prototype.getIndex = function () {
		return this.row.getData("data")[this.row.table.options.index];
	};

	RowComponent.prototype.getPosition = function (active) {
		return this.row.table.rowManager.getRowPosition(this.row, active);
	};

	RowComponent.prototype.delete = function () {
		this.row.delete();
	};

	RowComponent.prototype.scrollTo = function () {
		this.row.table.rowManager.scrollToRow(this.row);
	};

	RowComponent.prototype.update = function (data) {
		this.row.updateData(data);
	};

	RowComponent.prototype.normalizeHeight = function () {
		this.row.normalizeHeight(true);
	};

	RowComponent.prototype.select = function () {
		this.row.table.extensions.selectRow.selectRows(this.row);
	};

	RowComponent.prototype.deselect = function () {
		this.row.table.extensions.selectRow.deselectRows(this.row);
	};

	RowComponent.prototype.toggleSelect = function () {
		this.row.table.extensions.selectRow.toggleRow(this.row);
	};

	RowComponent.prototype._getSelf = function () {
		return this.row;
	};

	RowComponent.prototype.freeze = function () {
		if (this.row.table.extExists("frozenRows", true)) {
			this.row.table.extensions.frozenRows.freezeRow(this.row);
		}
	};

	RowComponent.prototype.unfreeze = function () {
		if (this.row.table.extExists("frozenRows", true)) {
			this.row.table.extensions.frozenRows.unfreezeRow(this.row);
		}
	};

	RowComponent.prototype.reformat = function () {
		return this.row.reinitialize();
	};

	RowComponent.prototype.getGroup = function () {
		return this.row.getGroup().getComponent();
	};

	var Row = function Row(data, parent) {
		this.table = parent.table;
		this.parent = parent;
		this.data = {};
		this.type = "row"; //type of element
		this.element = $("<div class='tabulator-row' role='row'></div>");
		this.extensions = {}; //hold extension variables;
		this.cells = [];
		this.height = 0; //hold element height
		this.outerHeight = 0; //holde lements outer height
		this.initialized = false; //element has been rendered
		this.heightInitialized = false; //element has resized cells to fit

		this.setData(data);
		this.generateElement();
	};

	Row.prototype.getElement = function () {
		return this.element;
	};

	Row.prototype.generateElement = function () {
		var self = this,
		    dblTap,
		    tapHold,
		    tap;

		//set row selection characteristics
		if (self.table.options.selectable !== false && self.table.extExists("selectRow")) {
			self.table.extensions.selectRow.initializeRow(this);
		}

		//setup movable rows
		if (self.table.options.movableRows !== false && self.table.extExists("moveRow")) {
			self.table.extensions.moveRow.initializeRow(this);
		}

		//handle row click events
		if (self.table.options.rowClick) {
			self.element.on("click", function (e) {
				self.table.options.rowClick(e, self.getComponent());
			});
		}

		if (self.table.options.rowDblClick) {
			self.element.on("dblclick", function (e) {
				self.table.options.rowDblClick(e, self.getComponent());
			});
		}

		if (self.table.options.rowContext) {
			self.element.on("contextmenu", function (e) {
				self.table.options.rowContext(e, self.getComponent());
			});
		}

		if (self.table.options.rowTap) {

			tap = false;

			self.element.on("touchstart", function (e) {
				tap = true;
			});

			self.element.on("touchend", function (e) {
				if (tap) {
					self.table.options.rowTap(e, self.getComponent());
				}

				tap = false;
			});
		}

		if (self.table.options.rowDblTap) {

			dblTap = null;

			self.element.on("touchend", function (e) {

				if (dblTap) {
					clearTimeout(dblTap);
					dblTap = null;

					self.table.options.rowDblTap(e, self.getComponent());
				} else {

					dblTap = setTimeout(function () {
						clearTimeout(dblTap);
						dblTap = null;
					}, 300);
				}
			});
		}

		if (self.table.options.rowTapHold) {

			tapHold = null;

			self.element.on("touchstart", function (e) {
				clearTimeout(tapHold);

				tapHold = setTimeout(function () {
					clearTimeout(tapHold);
					tapHold = null;
					tap = false;
					self.table.options.rowTapHold(e, self.getComponent());
				}, 1000);
			});

			self.element.on("touchend", function (e) {
				clearTimeout(tapHold);
				tapHold = null;
			});
		}
	};

	Row.prototype.generateCells = function () {
		this.cells = this.table.columnManager.generateCells(this);
	};

	//functions to setup on first render
	Row.prototype.initialize = function (force) {
		var self = this;

		if (!self.initialized || force) {

			self.deleteCells();

			self.element.empty();

			//handle frozen cells
			if (this.table.extExists("frozenColumns")) {
				this.table.extensions.frozenColumns.layoutRow(this);
			}

			this.generateCells();

			self.cells.forEach(function (cell) {
				self.element.append(cell.getElement());
			});

			if (force) {
				self.normalizeHeight();
			}

			//setup movable rows
			if (self.table.options.responsiveLayout === "collapse" && self.table.extExists("responsiveLayout")) {
				self.table.extensions.responsiveLayout.layoutRow(this);
			}

			if (self.table.options.rowFormatter) {
				self.table.options.rowFormatter(self.getComponent());
			}

			//set resizable handles
			if (self.table.options.resizableRows && self.table.extExists("resizeRows")) {
				self.table.extensions.resizeRows.initializeRow(self);
			}

			self.initialized = true;
		}
	};

	Row.prototype.reinitializeHeight = function () {
		this.heightInitialized = false;

		if (this.element[0].offsetParent !== null) {
			this.normalizeHeight(true);
		}
	};

	Row.prototype.reinitialize = function () {
		this.initialized = false;
		this.heightInitialized = false;
		this.height = 0;

		if (this.element[0].offsetParent !== null) {
			this.initialize(true);
		}
	};

	//get heights when doing bulk row style calcs in virtual DOM
	Row.prototype.calcHeight = function () {

		var maxHeight = 0,
		    minHeight = this.element[0].clientHeight;

		this.cells.forEach(function (cell) {
			var height = cell.getHeight();
			if (height > maxHeight) {
				maxHeight = height;
			}
		});

		this.height = Math.max(maxHeight, minHeight);
		this.outerHeight = this.element[0].offsetHeight;
	};

	//set of cells
	Row.prototype.setCellHeight = function () {
		var height = this.height;

		this.cells.forEach(function (cell) {
			cell.setHeight(height);
		});

		this.heightInitialized = true;
	};

	Row.prototype.clearCellHeight = function () {
		this.cells.forEach(function (cell) {

			cell.clearHeight();
		});
	};

	//normalize the height of elements in the row
	Row.prototype.normalizeHeight = function (force) {

		if (force) {
			this.clearCellHeight();
		}

		this.calcHeight();

		this.setCellHeight();
	};

	Row.prototype.setHeight = function (height) {
		this.height = height;

		this.setCellHeight();
	};

	//set height of rows
	Row.prototype.setHeight = function (height, force) {
		if (this.height != height || force) {

			this.height = height;

			this.setCellHeight();

			// this.outerHeight = this.element.outerHeight();
			this.outerHeight = this.element[0].offsetHeight;
		}
	};

	//return rows outer height
	Row.prototype.getHeight = function () {
		return this.outerHeight;
	};

	//return rows outer Width
	Row.prototype.getWidth = function () {
		return this.element.outerWidth();
	};

	//////////////// Cell Management /////////////////

	Row.prototype.deleteCell = function (cell) {
		var index = this.cells.indexOf(cell);

		if (index > -1) {
			this.cells.splice(index, 1);
		}
	};

	//////////////// Data Management /////////////////

	Row.prototype.setData = function (data) {
		var self = this;

		if (self.table.extExists("mutator")) {
			self.data = self.table.extensions.mutator.transformRow(data, "data");
		} else {
			self.data = data;
		}
	};

	//update the rows data
	Row.prototype.updateData = function (data) {
		var self = this;

		if (typeof data === "string") {
			data = JSON.parse(data);
		}

		//mutate incomming data if needed
		if (self.table.extExists("mutator")) {
			data = self.table.extensions.mutator.transformRow(data, "data");
		}

		//set data
		for (var attrname in data) {
			self.data[attrname] = data[attrname];
		}

		//update affected cells only
		for (var attrname in data) {
			var cell = this.getCell(attrname);

			if (cell) {
				if (cell.getValue() != data[attrname]) {
					cell.setValueProcessData(data[attrname]);
				}
			}
		}

		//Partial reinitialization if visible
		if (this.element.is(":visible")) {
			self.normalizeHeight();

			if (self.table.options.rowFormatter) {
				self.table.options.rowFormatter(self.getComponent());
			}
		} else {
			this.initialized = false;
			this.height = 0;
		}

		//self.reinitialize();

		self.table.options.rowUpdated(self.getComponent());
	};

	Row.prototype.getData = function (transform) {
		var self = this;

		if (transform) {
			if (self.table.extExists("accessor")) {
				return self.table.extensions.accessor.transformRow(self.data, transform);
			}
		} else {
			return this.data;
		}
	};

	Row.prototype.getCell = function (column) {
		var match = false,
		    column = this.table.columnManager.findColumn(column);

		match = this.cells.find(function (cell) {
			return cell.column === column;
		});

		return match;
	}, Row.prototype.getCellIndex = function (findCell) {
		return this.cells.findIndex(function (cell) {
			return cell === findCell;
		});
	}, Row.prototype.findNextEditableCell = function (index) {

		var nextCell = false;

		if (index < this.cells.length - 1) {
			for (var i = index + 1; i < this.cells.length; i++) {
				var cell = this.cells[i];

				if (cell.column.extensions.edit && cell.getElement().is(":visible")) {
					var allowEdit = true;

					if (typeof cell.column.extensions.edit.check == "function") {
						allowEdit = cell.column.extensions.edit.check(cell.getComponent());
					}

					if (allowEdit) {
						nextCell = cell;
						break;
					}
				}
			}
		}

		return nextCell;
	}, Row.prototype.findPrevEditableCell = function (index) {
		var prevCell = false;

		if (index > 0) {
			for (var i = index - 1; i >= 0; i--) {
				var cell = this.cells[i],
				    allowEdit = true;

				if (cell.column.extensions.edit && cell.getElement().is(":visible")) {
					if (typeof cell.column.extensions.edit.check == "function") {
						allowEdit = cell.column.extensions.edit.check(cell.getComponent());
					}

					if (allowEdit) {
						prevCell = cell;
						break;
					}
				}
			}
		}

		return prevCell;
	}, Row.prototype.getCells = function () {
		return this.cells;
	},

	///////////////////// Actions  /////////////////////

	Row.prototype.delete = function () {
		var index = this.table.rowManager.getRowIndex(this);

		this.deleteActual();

		if (this.table.options.history && this.table.extExists("history")) {

			if (index) {
				index = this.table.rowManager.rows[index - 1];
			}

			this.table.extensions.history.action("rowDelete", this, { data: this.getData(), pos: !index, index: index });
		};
	};

	Row.prototype.deleteActual = function () {

		var index = this.table.rowManager.getRowIndex(this);

		//deselect row if it is selected
		if (this.table.extExists("selectRow")) {
			this.table.extensions.selectRow._deselectRow(this.row, true);
		}

		this.table.rowManager.deleteRow(this);

		this.deleteCells();

		//remove from group
		if (this.extensions.group) {
			this.extensions.group.removeRow(this);
		}

		//recalc column calculations if present
		if (this.table.extExists("columnCalcs")) {
			if (this.table.options.groupBy && this.table.extExists("groupRows")) {
				this.table.extensions.columnCalcs.recalcRowGroup(this);
			} else {
				this.table.extensions.columnCalcs.recalc(this.table.rowManager.activeRows);
			}
		}
	};

	Row.prototype.deleteCells = function () {
		var cellCount = this.cells.length;

		for (var i = 0; i < cellCount; i++) {
			this.cells[0].delete();
		}
	};

	Row.prototype.wipe = function () {
		this.deleteCells();

		this.element.children().each(function () {
			$(this).remove();
		});

		this.element.empty();
		this.element.remove();
	};

	Row.prototype.getGroup = function () {
		return this.extensions.group || false;
	};

	//////////////// Object Generation /////////////////
	Row.prototype.getComponent = function () {
		return new RowComponent(this);
	};

	//public row object
	var CellComponent = function CellComponent(cell) {
		this.cell = cell;
	};

	CellComponent.prototype.getValue = function () {
		return this.cell.getValue();
	};

	CellComponent.prototype.getOldValue = function () {
		return this.cell.getOldValue();
	};

	CellComponent.prototype.getElement = function () {
		return $(this.cell.getElement());
	};

	CellComponent.prototype.getRow = function () {
		return this.cell.row.getComponent();
	};

	CellComponent.prototype.getData = function () {
		return this.cell.row.getData();
	};

	CellComponent.prototype.getField = function () {
		return this.cell.column.getField();
	};

	CellComponent.prototype.getColumn = function () {
		return this.cell.column.getComponent();
	};

	CellComponent.prototype.setValue = function (value, mutate) {
		if (typeof mutate == "undefined") {
			mutate = true;
		}

		this.cell.setValue(value, mutate);
	};

	CellComponent.prototype.restoreOldValue = function () {
		this.cell.setValueActual(this.cell.getOldValue());
	};

	CellComponent.prototype.edit = function (force) {
		return this.cell.edit(force);
	};

	CellComponent.prototype.cancelEdit = function () {
		this.cell.cancelEdit(force);
	};

	CellComponent.prototype.nav = function () {
		return this.cell.nav();
	};

	CellComponent.prototype.checkHeight = function () {
		this.cell.checkHeight();
	};

	CellComponent.prototype._getSelf = function () {
		return this.cell;
	};

	var Cell = function Cell(column, row) {

		this.table = column.table;
		this.column = column;
		this.row = row;
		// this.element = $("<div class='tabulator-cell' role='gridcell'></div>");
		this.element = null;
		this.value = null;
		this.oldValue = null;

		this.height = null;
		this.width = null;
		this.minWidth = null;

		this.build();
	};

	//////////////// Setup Functions /////////////////

	//generate element
	Cell.prototype.build = function () {
		this.generateElement();

		this.setWidth(this.column.width);

		this._configureCell();

		this.setValueActual(this.column.getFieldValue(this.row.data));
	};

	Cell.prototype.generateElement = function () {
		this.element = document.createElement('div');
		this.element.className = "tabulator-cell";
		this.element.setAttribute("role", "gridcell");
		this.element = $(this.element);
	};

	Cell.prototype._configureCell = function () {
		var self = this,
		    cellEvents = self.column.cellEvents,
		    element = self.element,
		    field = this.column.getField(),
		    dblTap,
		    tapHold,
		    tap;

		//set text alignment
		element[0].style.textAlign = self.column.hozAlign;

		if (field) {
			element.attr("tabulator-field", field);
		}

		if (self.column.definition.cssClass) {
			element.addClass(self.column.definition.cssClass);
		}

		//set event bindings
		if (cellEvents.cellClick || self.table.options.cellClick) {
			self.element.on("click", function (e) {
				var component = self.getComponent();

				if (cellEvents.cellClick) {
					cellEvents.cellClick(e, component);
				}

				if (self.table.options.cellClick) {
					self.table.options.cellClick(e, component);
				}
			});
		}

		if (cellEvents.cellDblClick || this.table.options.cellDblClick) {
			self.element.on("dblclick", function (e) {
				var component = self.getComponent();

				if (cellEvents.cellDblClick) {
					cellEvents.cellDblClick(e, component);
				}

				if (self.table.options.cellDblClick) {
					self.table.options.cellDblClick(e, component);
				}
			});
		}

		if (cellEvents.cellContext || this.table.options.cellContext) {
			self.element.on("contextmenu", function (e) {
				var component = self.getComponent();

				if (cellEvents.cellContext) {
					cellEvents.cellContext(e, component);
				}

				if (self.table.options.cellContext) {
					self.table.options.cellContext(e, component);
				}
			});
		}

		if (this.table.options.tooltipGenerationMode === "hover") {
			//update tooltip on mouse enter
			self.element.on("mouseenter", function (e) {
				self._generateTooltip();
			});
		}

		if (cellEvents.cellTap || this.table.options.cellTap) {
			tap = false;

			self.element.on("touchstart", function (e) {
				tap = true;
			});

			self.element.on("touchend", function (e) {
				if (tap) {
					var component = self.getComponent();

					if (cellEvents.cellTap) {
						cellEvents.cellTap(e, component);
					}

					if (self.table.options.cellTap) {
						self.table.options.cellTap(e, component);
					}
				}

				tap = false;
			});
		}

		if (cellEvents.cellDblTap || this.table.options.cellDblTap) {
			dblTap = null;

			self.element.on("touchend", function (e) {

				if (dblTap) {
					clearTimeout(dblTap);
					dblTap = null;

					var component = self.getComponent();

					if (cellEvents.cellDblTap) {
						cellEvents.cellDblTap(e, component);
					}

					if (self.table.options.cellDblTap) {
						self.table.options.cellDblTap(e, component);
					}
				} else {

					dblTap = setTimeout(function () {
						clearTimeout(dblTap);
						dblTap = null;
					}, 300);
				}
			});
		}

		if (cellEvents.cellTapHold || this.table.options.cellTapHold) {
			tapHold = null;

			self.element.on("touchstart", function (e) {
				clearTimeout(tapHold);

				tapHold = setTimeout(function () {
					clearTimeout(tapHold);
					tapHold = null;
					tap = false;
					var component = self.getComponent();

					if (cellEvents.cellTapHold) {
						cellEvents.cellTapHold(e, component);
					}

					if (self.table.options.cellTapHold) {
						self.table.options.cellTapHold(e, component);
					}
				}, 1000);
			});

			self.element.on("touchend", function (e) {
				clearTimeout(tapHold);
				tapHold = null;
			});
		}

		if (self.column.extensions.edit) {
			self.table.extensions.edit.bindEditor(self);
		}

		if (self.column.definition.rowHandle && self.table.options.movableRows !== false && self.table.extExists("moveRow")) {
			self.table.extensions.moveRow.initializeCell(self);
		}

		//hide cell if not visible
		if (!self.column.visible) {
			self.hide();
		}
	};

	//generate cell contents
	Cell.prototype._generateContents = function () {
		var self = this;

		if (self.table.extExists("format")) {
			self.element.html(self.table.extensions.format.formatValue(self));
		} else {
			self.element.html(self.value);
		}
	};

	//generate tooltip text
	Cell.prototype._generateTooltip = function () {
		var self = this;

		var tooltip = self.column.tooltip;

		if (tooltip) {
			if (tooltip === true) {
				tooltip = self.value;
			} else if (typeof tooltip == "function") {
				tooltip = tooltip(self.getComponent());

				if (tooltip === false) {
					tooltip = "";
				}
			}

			self.element[0].setAttribute("title", tooltip);
		} else {
			self.element[0].setAttribute("title", "");
		}
	};

	//////////////////// Getters ////////////////////
	Cell.prototype.getElement = function () {
		return this.element;
	};

	Cell.prototype.getValue = function () {
		return this.value;
	};

	Cell.prototype.getOldValue = function () {
		return this.oldValue;
	};

	//////////////////// Actions ////////////////////

	Cell.prototype.setValue = function (value, mutate) {

		var changed = this.setValueProcessData(value, mutate),
		    component;

		if (changed) {
			if (this.table.options.history && this.table.extExists("history")) {
				this.table.extensions.history.action("cellEdit", this, { oldValue: this.oldValue, newValue: this.value });
			};

			component = this.getComponent();

			if (this.column.cellEvents.cellEdited) {
				this.column.cellEvents.cellEdited(component);
			}

			this.table.options.cellEdited(component);

			this.table.options.dataEdited(this.table.rowManager.getData());
		}

		if (this.table.extExists("columnCalcs")) {
			if (this.column.definition.topCalc || this.column.definition.bottomCalc) {
				if (this.table.options.groupBy && this.table.extExists("groupRows")) {
					this.table.extensions.columnCalcs.recalcRowGroup(this.row);
				} else {
					this.table.extensions.columnCalcs.recalc(this.table.rowManager.activeRows);
				}
			}
		}
	};

	Cell.prototype.setValueProcessData = function (value, mutate) {
		var changed = false;

		if (this.value != value) {

			changed = true;

			if (mutate) {
				if (this.column.extensions.mutate) {
					value = this.table.extensions.mutator.transformCell(this, value);
				}
			}
		}

		this.setValueActual(value);

		return changed;
	};

	Cell.prototype.setValueActual = function (value) {
		this.oldValue = this.value;

		this.value = value;

		this.column.setFieldValue(this.row.data, value);

		this._generateContents();
		this._generateTooltip();

		//set resizable handles
		if (this.table.options.resizableColumns && this.table.extExists("resizeColumns")) {
			this.table.extensions.resizeColumns.initializeColumn("cell", this.column, this.element);
		}

		//handle frozen cells
		if (this.table.extExists("frozenColumns")) {
			this.table.extensions.frozenColumns.layoutElement(this.element, this.column);
		}
	};

	Cell.prototype.setWidth = function (width) {
		this.width = width;
		// this.element.css("width", width || "");
		this.element[0].style.width = width ? width + "px" : "";
	};

	Cell.prototype.getWidth = function () {
		return this.width || this.element.outerWidth();
	};

	Cell.prototype.setMinWidth = function (minWidth) {
		this.minWidth = minWidth;
		this.element[0].style.minWidth = minWidth ? minWidth + "px" : "";
	};

	Cell.prototype.checkHeight = function () {
		var height = this.element.css("height");

		this.row.reinitializeHeight();
	};

	Cell.prototype.clearHeight = function () {
		this.element[0].style.height = "";
	};

	Cell.prototype.setHeight = function (height) {
		this.height = height;
		this.element[0].style.height = height ? height + "px" : "";
	};

	Cell.prototype.getHeight = function () {
		return this.height || this.element.outerHeight();
	};

	Cell.prototype.show = function () {
		this.element[0].style.display = "";
	};

	Cell.prototype.hide = function () {
		this.element[0].style.display = "none";
	};

	Cell.prototype.edit = function (force) {
		if (this.table.extExists("edit", true)) {
			return this.table.extensions.edit.editCell(this, false, force);
		}
	};

	Cell.prototype.cancelEdit = function () {
		if (this.table.extExists("edit", true)) {
			var editing = this.table.extensions.edit.getCurrentCell();

			if (editing && editing._getSelf() === this) {
				this.table.extensions.edit.cancelEdit();
			} else {
				console.warn("Cancel Editor Error - This cell is not currently being edited ");
			}
		}
	};

	Cell.prototype.delete = function () {
		this.element.detach();
		this.column.deleteCell(this);
		this.row.deleteCell(this);
	};

	//////////////// Navigation /////////////////

	Cell.prototype.nav = function () {

		var self = this,
		    nextCell = false,
		    index = this.row.getCellIndex(this);

		return {
			next: function next() {
				var nextCell = this.right(),
				    nextRow;

				if (!nextCell) {
					nextRow = self.table.rowManager.nextDisplayRow(self.row, true);

					if (nextRow) {
						nextCell = nextRow.findNextEditableCell(-1);

						if (nextCell) {
							nextCell.edit();
							return true;
						}
					}
				} else {
					return true;
				}

				return false;
			},
			prev: function prev() {
				var nextCell = this.left(),
				    prevRow;

				if (!nextCell) {
					prevRow = self.table.rowManager.prevDisplayRow(self.row, true);

					if (prevRow) {
						nextCell = prevRow.findPrevEditableCell(prevRow.cells.length);

						if (nextCell) {
							nextCell.edit();
							return true;
						}
					}
				} else {
					return true;
				}

				return false;
			},
			left: function left() {

				nextCell = self.row.findPrevEditableCell(index);

				if (nextCell) {
					nextCell.edit();
					return true;
				} else {
					return false;
				}
			},
			right: function right() {
				nextCell = self.row.findNextEditableCell(index);

				if (nextCell) {
					nextCell.edit();
					return true;
				} else {
					return false;
				}
			},
			up: function up() {
				var nextRow = self.table.rowManager.prevDisplayRow(self.row, true);

				if (nextRow) {
					nextRow.cells[index].edit();
				}
			},
			down: function down() {
				var nextRow = self.table.rowManager.nextDisplayRow(self.row, true);

				if (nextRow) {
					nextRow.cells[index].edit();
				}
			}

		};
	};

	Cell.prototype.getIndex = function () {
		this.row.getCellIndex(this);
	};

	//////////////// Object Generation /////////////////
	Cell.prototype.getComponent = function () {
		return new CellComponent(this);
	};
	var FooterManager = function FooterManager(table) {
		this.table = table;
		this.active = false;
		this.element = $("<div class='tabulator-footer'></div>"); //containing element
		this.links = [];

		this._initialize();
	};

	FooterManager.prototype._initialize = function (element) {
		if (this.table.options.footerElement) {
			this.element = this.table.options.footerElement;
		}
	};

	FooterManager.prototype.getElement = function () {
		return this.element;
	};

	FooterManager.prototype.append = function (element, parent) {
		this.activate(parent);

		this.element.append(element);
		this.table.rowManager.adjustTableSize();
	};

	FooterManager.prototype.prepend = function (element, parent) {
		this.activate(parent);

		this.element.prepend(element);
		this.table.rowManager.adjustTableSize();
	};

	FooterManager.prototype.remove = function (element) {
		element.remove();
		this.deactivate();
	};

	FooterManager.prototype.deactivate = function (force) {
		if (this.element.is(":empty") || force) {
			this.element.remove();
			this.active = false;
		}

		// this.table.rowManager.adjustTableSize();
	};

	FooterManager.prototype.activate = function (parent) {
		if (!this.active) {
			this.active = true;
			this.table.element.append(this.getElement());
			this.table.element.show();
		}

		if (parent) {
			this.links.push(parent);
		}
	};

	FooterManager.prototype.redraw = function () {
		this.links.forEach(function (link) {
			link.footerRedraw();
		});
	};

	window.Tabulator = {

		columnManager: null, // hold Column Manager
		rowManager: null, //hold Row Manager
		footerManager: null, //holder Footer Manager
		browser: "", //hold current browser type
		browserSlow: false, //handle reduced functionality for slower browsers

		//setup options
		options: {

			height: false, //height of tabulator

			layout: "fitData", ///layout type "fitColumns" | "fitData"
			layoutColumnsOnNewData: false, //update column widths on setData
			fitColumns: false, //DEPRICATED - fit colums to width of screen;

			columnMinWidth: 40, //minimum global width for a column
			columnVertAlign: "top", //vertical alignment of column headers

			resizableColumns: true, //resizable columns
			resizableRows: false, //resizable rows
			autoResize: true, //auto resize table

			columns: [], //store for colum header info

			data: [], //default starting data

			tooltips: false, //Tool tip value
			tooltipsHeader: false, //Tool tip for headers
			tooltipGenerationMode: "load", //when to generate tooltips

			initialSort: false, //initial sorting criteria

			footerElement: false, //hold footer element

			index: "id", //filed for row index

			keybindings: [], //array for keybindings

			clipboard: false, //enable clipboard
			clipboardCopySelector: "active", //method of chosing which data is coppied to the clipboard
			clipboardCopyFormatter: "table", //convert data to a clipboard string
			clipboardCopyHeader: true, //include table headers in copt
			clipboardPasteParser: "table", //convert pasted clipboard data to rows
			clipboardPasteAction: "insert", //how to insert pasted data into the table

			clipboardCopied: function clipboardCopied() {}, //data has been copied to the clipboard
			clipboardPasted: function clipboardPasted() {}, //data has been pasted into the table
			clipboardPasteError: function clipboardPasteError() {}, //data has not successfully been pasted into the table

			downloadDataFormatter: false, //function to manipulate table data before it is downloaded
			downloadReady: function downloadReady(data, blob) {
				return blob;
			}, //function to manipulate download data
			downloadComplete: false, //function to manipulate download data

			addRowPos: "bottom", //position to insert blank rows, top|bottom

			selectable: "highlight", //highlight rows on hover
			selectableRollingSelection: true, //roll selection once maximum number of selectable rows is reached
			selectablePersistence: true, // maintain selection when table view is updated
			selectableCheck: function selectableCheck(data, row) {
				return true;
			}, //check wheather row is selectable

			headerFilterPlaceholder: false, //placeholder text to display in header filters

			history: false, //enable edit history

			locale: false, //current system language
			langs: {},

			virtualDom: true, //enable DOM virtualization

			persistentLayout: false, //store column layout in memory
			persistentSort: false, //store sorting in memory
			persistentFilter: false, //store filters in memory
			persistenceID: "", //key for persistent storage
			persistenceMode: true, //mode for storing persistence information
			persistentLayoutID: "", //DEPRICATED - key for persistent storage;

			responsiveLayout: false, //responsive layout flags
			responsiveLayoutCollapseStartOpen: true, //start showing collapsed data
			responsiveLayoutCollapseUseFormatters: true, //responsive layout collapse formatter
			responsiveLayoutCollapseFormatter: false, //responsive layout collapse formatter

			pagination: false, //set pagination type
			paginationSize: false, //set number of rows to a page
			paginationButtonCount: 5, // set count of page button
			paginationElement: false, //element to hold pagination numbers
			paginationDataSent: {}, //pagination data sent to the server
			paginationDataReceived: {}, //pagination data received from the server
			paginator: false, //pagination url string builder
			paginationAddRow: "page", //add rows on table or page

			ajaxURL: false, //url for ajax loading
			ajaxParams: {}, //params for ajax loading
			ajaxConfig: "get", //ajax request type
			ajaxLoader: true, //show loader
			ajaxLoaderLoading: false, //loader element
			ajaxLoaderError: false, //loader element
			ajaxFiltering: false,
			ajaxSorting: false,
			ajaxProgressiveLoad: false, //progressive loading
			ajaxProgressiveLoadDelay: 0, //delay between requests
			ajaxProgressiveLoadScrollMargin: 0, //margin before scroll begins

			groupBy: false, //enable table grouping and set field to group by
			groupStartOpen: true, //starting state of group

			groupHeader: false, //header generation function

			movableColumns: false, //enable movable columns

			movableRows: false, //enable movable rows
			movableRowsConnectedTables: false, //tables for movable rows to be connected to
			movableRowsSender: false,
			movableRowsReceiver: "insert",
			movableRowsSendingStart: function movableRowsSendingStart() {},
			movableRowsSent: function movableRowsSent() {},
			movableRowsSentFailed: function movableRowsSentFailed() {},
			movableRowsSendingStop: function movableRowsSendingStop() {},
			movableRowsReceivingStart: function movableRowsReceivingStart() {},
			movableRowsReceived: function movableRowsReceived() {},
			movableRowsReceivedFailed: function movableRowsReceivedFailed() {},
			movableRowsReceivingStop: function movableRowsReceivingStop() {},

			scrollToRowPosition: "top",
			scrollToRowIfVisible: true,

			scrollToColumnPosition: "left",
			scrollToColumnIfVisible: true,

			rowFormatter: false,

			placeholder: false,

			//table building callbacks
			tableBuilding: function tableBuilding() {},
			tableBuilt: function tableBuilt() {},

			//render callbacks
			renderStarted: function renderStarted() {},
			renderComplete: function renderComplete() {},

			//row callbacks
			rowClick: false,
			rowDblClick: false,
			rowContext: false,
			rowTap: false,
			rowDblTap: false,
			rowTapHold: false,
			rowAdded: function rowAdded() {},
			rowDeleted: function rowDeleted() {},
			rowMoved: function rowMoved() {},
			rowUpdated: function rowUpdated() {},
			rowSelectionChanged: function rowSelectionChanged() {},
			rowSelected: function rowSelected() {},
			rowDeselected: function rowDeselected() {},
			rowResized: function rowResized() {},

			//cell callbacks
			//row callbacks
			cellClick: false,
			cellDblClick: false,
			cellContext: false,
			cellTap: false,
			cellDblTap: false,
			cellTapHold: false,
			cellEditing: function cellEditing() {},
			cellEdited: function cellEdited() {},
			cellEditCancelled: function cellEditCancelled() {},

			//column callbacks
			columnMoved: false,
			columnResized: function columnResized() {},
			columnTitleChanged: function columnTitleChanged() {},
			columnVisibilityChanged: function columnVisibilityChanged() {},

			//HTML iport callbacks
			htmlImporting: function htmlImporting() {},
			htmlImported: function htmlImported() {},

			//data callbacks
			dataLoading: function dataLoading() {},
			dataLoaded: function dataLoaded() {},
			dataEdited: function dataEdited() {},

			//ajax callbacks
			ajaxRequesting: function ajaxRequesting() {},
			ajaxResponse: false,
			ajaxError: function ajaxError() {},

			//filtering callbacks
			dataFiltering: false,
			dataFiltered: false,

			//sorting callbacks
			dataSorting: function dataSorting() {},
			dataSorted: function dataSorted() {},

			//grouping callbacks
			groupToggleElement: "arrow",
			groupClosedShowCalcs: false,
			dataGrouping: function dataGrouping() {},
			dataGrouped: false,
			groupVisibilityChanged: function groupVisibilityChanged() {},
			groupClick: false,
			groupDblClick: false,
			groupContext: false,
			groupTap: false,
			groupDblTap: false,
			groupTapHold: false,

			columnCalcs: true,

			//pagination callbacks
			pageLoaded: function pageLoaded() {},

			//localization callbacks
			localized: function localized() {},

			//validation has failed
			validationFailed: function validationFailed() {},

			//history callbacks
			historyUndo: function historyUndo() {},
			historyRedo: function historyRedo() {}

		},

		//convert depricated functionality to new functions
		_mapDepricatedFunctionality: function _mapDepricatedFunctionality() {

			if (this.options.fitColumns) {
				this.options.layout = "fitColumns";
				console.warn("The%c fitColumns:true%c option has been depricated and will be removed in version 4.0, use %c layout:'fitColumns'%c instead.", "font-weight:bold;", "font-weight:regular;", "font-weight:bold;", "font-weight:regular;");
			}

			if (this.options.persistentLayoutID) {
				this.options.persistenceID = this.options.persistentLayoutID;
				console.warn("The%c persistentLayoutID%c option has been depricated and will be removed in version 4.0, use %c persistenceID%c instead.", "font-weight:bold;", "font-weight:regular;", "font-weight:bold;", "font-weight:regular;");
			}

			if (this.options.persistentLayout === "cookie" || this.options.persistentLayout === "local") {
				this.options.persistenceMode = this.options.persistentLayout;
				this.options.persistentLayout = true;
				console.warn("Setting the persistent storage mode on the%c persistentLayout%c option has been depricated and will be removed in version 4.0, use %c persistenceMode%c instead.", "font-weight:bold;", "font-weight:regular;", "font-weight:bold;", "font-weight:regular;");
			}

			if (this.options.downloadDataMutator) {
				this.options.downloadDataFormatter = this.options.downloadDataMutator;
				console.warn("The%c downloadDataMutator%c option has been depricated and will be removed in version 4.0, use %cdownloadDataFormatter%c instead.", "font-weight:bold;", "font-weight:regular;", "font-weight:bold;", "font-weight:regular;");
			}
		},

		//constructor
		_create: function _create() {
			var self = this,
			    element = this.element;

			self._clearObjectPointers();

			self._mapDepricatedFunctionality();

			self.bindExtensions();

			if (element.is("table")) {
				if (this.extExists("htmlTableImport", true)) {
					self.extensions.htmlTableImport.parseTable();
				}
			} else {

				self.columnManager = new ColumnManager(self);
				self.rowManager = new RowManager(self);
				self.footerManager = new FooterManager(self);

				self.columnManager.setRowManager(self.rowManager);
				self.rowManager.setColumnManager(self.columnManager);

				self._buildElement();

				//load initial data set
				this._loadInitialData();
			}
		},

		//clear pointers to objects in default config object

		_clearObjectPointers: function _clearObjectPointers() {
			this.options.columns = this.options.columns.slice(0);
			this.options.data = this.options.data.slice(0);
		},

		//build tabulator element
		_buildElement: function _buildElement() {
			var element = this.element,
			    ext = this.extensions,
			    options = this.options;

			options.tableBuilding();

			element.addClass("tabulator").attr("role", "grid").empty();

			//set table height
			if (options.height) {
				options.height = isNaN(options.height) ? options.height : options.height + "px";
				this.element.css({ "height": options.height });
			}

			this.rowManager.initialize();

			this._detectBrowser();

			if (this.extExists("layout", true)) {
				ext.layout.initialize(options.layout);
			}

			//set localization
			if (options.headerFilterPlaceholder !== false) {
				ext.localize.setHeaderFilterPlaceholder(options.headerFilterPlaceholder);
			}

			for (var locale in options.langs) {
				ext.localize.installLang(locale, options.langs[locale]);
			}

			ext.localize.setLocale(options.locale);

			//configure placeholder element
			if (typeof options.placeholder == "string") {
				options.placeholder = $("<div class='tabulator-placeholder'><span>" + options.placeholder + "</span></div>");
			}

			//build table elements
			element.append(this.columnManager.getElement());
			element.append(this.rowManager.getElement());

			if (options.footerElement) {
				this.footerManager.activate();
			}

			if ((options.persistentLayout || options.persistentSort || options.persistentFilter) && this.extExists("persistence", true)) {
				ext.persistence.initialize(options.persistenceMode, options.persistenceID);
			}

			if (options.persistentLayout && this.extExists("persistence", true)) {
				options.columns = ext.persistence.load("columns", options.columns);
			}

			if (options.movableRows && this.extExists("moveRow")) {
				ext.moveRow.initialize();
			}

			if (this.extExists("columnCalcs")) {
				ext.columnCalcs.initialize();
			}

			this.columnManager.setColumns(options.columns);

			if (this.extExists("frozenRows")) {
				this.extensions.frozenRows.initialize();
			}

			if ((options.persistentSort || options.initialSort) && this.extExists("sort", true)) {
				var sorters = [];

				if (options.persistentSort && this.extExists("persistence", true)) {
					sorters = ext.persistence.load("sort");

					if (sorters === false && options.initialSort) {
						sorters = options.initialSort;
					}
				} else if (options.initialSort) {
					sorters = options.initialSort;
				}

				ext.sort.setSort(sorters);
			}

			if (options.persistentFilter && this.extExists("persistence", true)) {
				var filters = ext.persistence.load("filter");

				if (filters !== false) {
					this.setFilter(filters);
				}
			}

			if (this.extExists("ajax")) {
				ext.ajax.initialize();
			}

			if (options.pagination && this.extExists("page", true)) {
				ext.page.initialize();
			}

			if (options.groupBy && this.extExists("groupRows", true)) {
				ext.groupRows.initialize();
			}

			if (this.extExists("keybindings")) {
				ext.keybindings.initialize();
			}

			if (this.extExists("selectRow")) {
				ext.selectRow.clearSelectionData(true);
			}

			if (options.autoResize && this.extExists("resizeTable")) {
				ext.resizeTable.initialize();
			}

			if (this.extExists("clipboard")) {
				ext.clipboard.initialize();
			}

			options.tableBuilt();
		},

		_loadInitialData: function _loadInitialData() {
			var self = this;

			if (self.options.pagination && self.extExists("page")) {
				self.extensions.page.reset(true);

				if (self.options.pagination == "local") {
					if (self.options.data.length) {
						self.rowManager.setData(self.options.data);
					} else {
						if (self.options.ajaxURL && self.extExists("ajax")) {
							self.extensions.ajax.loadData();
						} else {
							self.rowManager.setData(self.options.data);
						}
					}
				} else {
					self.extensions.page.setPage(1);
				}
			} else {
				if (self.options.data.length) {
					self.rowManager.setData(self.options.data);
				} else {
					if (self.options.ajaxURL && self.extExists("ajax")) {
						self.extensions.ajax.loadData();
					} else {
						self.rowManager.setData(self.options.data);
					}
				}
			}
		},

		//set options
		_setOption: function _setOption(option, value) {
			console.error("Options Error - Tabulator does not allow options to be set after initialization unless there is a function defined for that purpose");
		},

		//deconstructor
		_destroy: function _destroy() {
			var element = this.element;

			//clear row data
			this.rowManager.rows.forEach(function (row) {
				row.wipe();
			});

			this.rowManager.rows = [];
			this.rowManager.activeRows = [];
			this.rowManager.displayRows = [];

			//clear event bindings
			if (this.options.autoResize && this.extExists("resizeTable")) {
				this.extensions.resizeTable.clearBindings();
			}

			if (this.extExists("keybindings")) {
				this.extensions.keybindings.clearBindings();
			}

			//clear DOM
			element.empty();
			element.removeClass("tabulator");
		},

		_detectBrowser: function _detectBrowser() {
			var ua = navigator.userAgent;

			if (ua.indexOf("Trident") > -1) {
				this.browser = "ie";
				this.browserSlow = true;
			} else if (ua.indexOf("Edge") > -1) {
				this.browser = "edge";
				this.browserSlow = true;
			} else if (ua.indexOf("Firefox") > -1) {
				this.browser = "firefox";
				this.browserSlow = false;
			} else {
				this.browser = "other";
				this.browserSlow = false;
			}
		},


		////////////////// Data Handling //////////////////


		//load data

		setData: function setData(data, params, config) {
			if (this.extExists("ajax")) {
				this.extensions.ajax.blockActiveRequest();
			}

			this._setData(data, params, config);
		},

		_setData: function _setData(data, params, config, inPosition) {
			var self = this;

			if (typeof data === "string") {
				if (data.indexOf("{") == 0 || data.indexOf("[") == 0) {
					//data is a json encoded string
					self.rowManager.setData(JSON.parse(data), inPosition);
				} else {

					if (self.extExists("ajax", true)) {
						if (params) {
							self.extensions.ajax.setParams(params);
						}

						if (config) {
							self.extensions.ajax.setConfig(config);
						}

						self.extensions.ajax.setUrl(data);

						if (self.options.pagination == "remote" && self.extExists("page", true)) {
							self.extensions.page.reset(true);
							self.extensions.page.setPage(1);
						} else {
							//assume data is url, make ajax call to url to get data
							self.extensions.ajax.loadData(inPosition);
						}
					}
				}
			} else {
				if (data) {
					//asume data is already an object
					self.rowManager.setData(data, inPosition);
				} else {

					//no data provided, check if ajaxURL is present;
					if (self.extExists("ajax") && self.extensions.ajax.getUrl) {

						if (self.options.pagination == "remote" && self.extExists("page", true)) {
							self.extensions.page.reset(true);
							self.extensions.page.setPage(1);
						} else {
							self.extensions.ajax.loadData(inPosition);
						}
					} else {
						//empty data
						self.rowManager.setData([], inPosition);
					}
				}
			}
		},

		//clear data
		clearData: function clearData() {
			if (this.extExists("ajax")) {
				this.extensions.ajax.blockActiveRequest();
			}

			this.rowManager.clearData();
		},

		//get table data array
		getData: function getData(active) {
			return this.rowManager.getData(active);
		},

		//get table data array count
		getDataCount: function getDataCount(active) {
			return this.rowManager.getDataCount(active);
		},

		//get table html
		getHtml: function getHtml(active) {
			return this.rowManager.getHtml(active);
		},

		//retrieve Ajax URL
		getAjaxUrl: function getAjaxUrl() {
			if (this.extExists("ajax", true)) {
				return this.extensions.ajax.getUrl();
			}
		},

		//replace data, keeping table in position with same sort
		replaceData: function replaceData(data, params, config) {
			if (this.extExists("ajax")) {
				this.extensions.ajax.blockActiveRequest();
			}

			this._setData(data, params, config, true);
		},

		//update table data
		updateData: function updateData(data) {
			var self = this;

			if (this.extExists("ajax")) {
				this.extensions.ajax.blockActiveRequest();
			}

			if (typeof data === "string") {
				data = JSON.parse(data);
			}

			if (data) {
				data.forEach(function (item) {
					var row = self.rowManager.findRow(item[self.options.index]);

					if (row) {
						row.updateData(item);
					}
				});
			} else {
				console.warn("Update Error - No data provided");
			}
		},

		addData: function addData(data, pos, index) {
			var rows = [],
			    output = [];

			if (this.extExists("ajax")) {
				this.extensions.ajax.blockActiveRequest();
			}

			if (typeof data === "string") {
				data = JSON.parse(data);
			}

			if (data) {
				rows = this.rowManager.addRows(data, pos, index);

				rows.forEach(function (row) {
					output.push(row.getComponent());
				});

				return output;
			} else {
				console.warn("Update Error - No data provided");
			}
		},

		//update table data
		updateOrAddData: function updateOrAddData(data) {
			var self = this;
			var rows = [];

			if (this.extExists("ajax")) {
				this.extensions.ajax.blockActiveRequest();
			}

			if (typeof data === "string") {
				data = JSON.parse(data);
			}

			if (data) {
				data.forEach(function (item) {
					var row = self.rowManager.findRow(item[self.options.index]);

					if (row) {
						row.updateData(item);
						rows.push(row.getComponent());
					} else {
						rows.push(self.rowManager.addRows(item)[0].getComponent());
					}
				});

				return rows;
			} else {
				console.warn("Update Error - No data provided");
			}
		},

		//get row object
		getRow: function getRow(index) {
			var row = this.rowManager.findRow(index);

			if (row) {
				return row.getComponent();
			} else {
				console.warn("Find Error - No matching row found:", index);
				return false;
			}
		},

		//get row object
		getRowFromPosition: function getRowFromPosition(position, active) {
			var row = this.rowManager.getRowFromPosition(position, active);

			if (row) {
				return row.getComponent();
			} else {
				console.warn("Find Error - No matching row found:", position);
				return false;
			}
		},

		//delete row from table
		deleteRow: function deleteRow(index) {
			var row = this.rowManager.findRow(index);

			if (row) {
				row.delete();
				return true;
			} else {
				console.warn("Delete Error - No matching row found:", index);
				return false;
			}
		},

		//add row to table
		addRow: function addRow(data, pos, index) {

			var row;

			if (typeof data === "string") {
				data = JSON.parse(data);
			}

			row = this.rowManager.addRows(data, pos, index)[0];

			//recalc column calculations if present
			if (this.extExists("columnCalcs")) {
				this.extensions.columnCalcs.recalc(this.rowManager.activeRows);
			}

			return row.getComponent();
		},

		//update a row if it exitsts otherwise create it
		updateOrAddRow: function updateOrAddRow(index, data) {
			var row = this.rowManager.findRow(index);

			if (typeof data === "string") {
				data = JSON.parse(data);
			}

			if (row) {
				row.updateData(data);
			} else {
				row = this.rowManager.addRows(data)[0];

				//recalc column calculations if present
				if (this.extExists("columnCalcs")) {
					this.extensions.columnCalcs.recalc(this.rowManager.activeRows);
				}
			}
			return row.getComponent();
		},

		//update row data
		updateRow: function updateRow(index, data) {
			var row = this.rowManager.findRow(index);

			if (typeof data === "string") {
				data = JSON.parse(data);
			}

			if (row) {
				row.updateData(data);
				return row.getComponent();
			} else {
				console.warn("Update Error - No matching row found:", index);
				return false;
			}
		},

		//scroll to row in DOM
		scrollToRow: function scrollToRow(index, position, ifVisible) {
			var row = this.rowManager.findRow(index);

			if (row) {
				return this.rowManager.scrollToRow(row, position, ifVisible);
			} else {
				console.warn("Scroll Error - No matching row found:", index);
				return false;
			}
		},

		getRows: function getRows(active) {
			return this.rowManager.getComponents(active);
		},

		//get position of row in table
		getRowPosition: function getRowPosition(index, active) {
			var row = this.rowManager.findRow(index);

			if (row) {
				return this.rowManager.getRowPosition(row, active);
			} else {
				console.warn("Position Error - No matching row found:", index);
				return false;
			}
		},

		//copy table data to clipboard
		copyToClipboard: function copyToClipboard(selector, selectorParams, formatter, formatterParams) {
			if (this.extExists("clipboard", true)) {
				this.extensions.clipboard.copy(selector, selectorParams, formatter, formatterParams);
			}
		},

		/////////////// Column Functions  ///////////////

		setColumns: function setColumns(definition) {
			this.columnManager.setColumns(definition);
		},

		getColumns: function getColumns(structured) {
			return this.columnManager.getComponents(structured);
		},

		getColumnDefinitions: function getColumnDefinitions() {
			return this.columnManager.getDefinitionTree();
		},

		getColumnLayout: function getColumnLayout() {
			if (this.extExists("persistence", true)) {
				return this.extensions.persistence.parseColumns(this.columnManager.getColumns());
			}
		},

		setColumnLayout: function setColumnLayout(layout) {
			if (this.extExists("persistence", true)) {
				this.columnManager.setColumns(this.extensions.persistence.mergeDefinition(this.options.columns, layout));
				return true;
			}
			return false;
		},

		showColumn: function showColumn(field) {
			var column = this.columnManager.findColumn(field);

			if (column) {
				column.show();

				if (this.options.responsiveLayout && this.extExists("responsiveLayout", true)) {
					this.extensions.responsiveLayout.update();
				}
			} else {
				console.warn("Column Show Error - No matching column found:", field);
				return false;
			}
		},

		hideColumn: function hideColumn(field) {
			var column = this.columnManager.findColumn(field);

			if (column) {
				column.hide();

				if (this.options.responsiveLayout && this.extExists("responsiveLayout", true)) {
					this.extensions.responsiveLayout.update();
				}
			} else {
				console.warn("Column Hide Error - No matching column found:", field);
				return false;
			}
		},

		toggleColumn: function toggleColumn(field) {
			var column = this.columnManager.findColumn(field);

			if (column) {
				if (column.visible) {
					column.hide();
				} else {
					column.show();
				}
			} else {
				console.warn("Column Visibility Toggle Error - No matching column found:", field);
				return false;
			}
		},

		addColumn: function addColumn(definition, before, field) {
			var column = this.columnManager.findColumn(field);

			this.columnManager.addColumn(definition, before, column);
		},

		deleteColumn: function deleteColumn(field) {
			var column = this.columnManager.findColumn(field);

			if (column) {
				column.delete();
			} else {
				console.warn("Column Delete Error - No matching column found:", field);
				return false;
			}
		},

		//scroll to column in DOM
		scrollToColumn: function scrollToColumn(field, position, ifVisible) {
			var column = this.columnManager.findColumn(field);

			if (column) {
				return this.columnManager.scrollToColumn(column, position, ifVisible);
			} else {
				console.warn("Scroll Error - No matching column found:", field);
				return false;
			}
		},

		//////////// Localization Functions  ////////////
		setLocale: function setLocale(locale) {
			this.extensions.localize.setLocale(locale);
		},

		getLocale: function getLocale() {
			return this.extensions.localize.getLocale();
		},

		getLang: function getLang(locale) {
			return this.extensions.localize.getLang(locale);
		},

		//////////// General Public Functions ////////////

		//redraw list without updating data
		redraw: function redraw(force) {
			this.columnManager.redraw(force);
			this.rowManager.redraw(force);
		},

		setHeight: function setHeight(height) {
			this.options.height = isNaN(height) ? height : height + "px";
			this.element.css({ "height": this.options.height });
			this.rowManager.redraw();
		},

		///////////////////// Sorting ////////////////////

		//trigger sort
		setSort: function setSort(sortList, dir) {
			if (this.extExists("sort", true)) {
				this.extensions.sort.setSort(sortList, dir);
				this.rowManager.sorterRefresh();
			}
		},

		getSort: function getSort() {
			if (this.extExists("sort", true)) {
				console.warn("The%c getSort%c function has been depricated and will be removed in version 4.0, use %c getSorters%c instead.", "font-weight:bold;", "font-weight:regular;", "font-weight:bold;", "font-weight:regular;");
				return this.getSorters();
			}
		},

		getSorters: function getSorters() {
			if (this.extExists("sort", true)) {
				return this.extensions.sort.getSort();
			}
		},

		clearSort: function clearSort() {
			if (this.extExists("sort", true)) {
				this.extensions.sort.clear();
				this.rowManager.sorterRefresh();
			}
		},

		///////////////////// Filtering ////////////////////

		//set standard filters
		setFilter: function setFilter(field, type, value) {
			if (this.extExists("filter", true)) {
				this.extensions.filter.setFilter(field, type, value);
				this.rowManager.filterRefresh();
			}
		},

		//add filter to array
		addFilter: function addFilter(field, type, value) {
			if (this.extExists("filter", true)) {
				this.extensions.filter.addFilter(field, type, value);
				this.rowManager.filterRefresh();
			}
		},

		//get all filters
		getFilter: function getFilter(all) {
			console.warn("The%c getFilter%c function has been depricated and will be removed in version 4.0, use %c getFilters%c instead.", "font-weight:bold;", "font-weight:regular;", "font-weight:bold;", "font-weight:regular;");
			this.getFilters(all);
		},

		getFilters: function getFilters(all) {
			if (this.extExists("filter", true)) {
				return this.extensions.filter.getFilters(all);
			}
		},

		setHeaderFilterFocus: function setHeaderFilterFocus(field) {
			if (this.extExists("filter", true)) {
				var column = this.columnManager.findColumn(field);

				if (column) {
					this.extensions.filter.setHeaderFilterFocus(column);
				} else {
					console.warn("Column Filter Focus Error - No matching column found:", field);
					return false;
				}
			}
		},

		setHeaderFilterValue: function setHeaderFilterValue(field, value) {
			if (this.extExists("filter", true)) {
				var column = this.columnManager.findColumn(field);

				if (column) {
					this.extensions.filter.setHeaderFilterValue(column, value);
				} else {
					console.warn("Column Filter Error - No matching column found:", field);
					return false;
				}
			}
		},

		getHeaderFilters: function getHeaderFilters() {
			if (this.extExists("filter", true)) {
				return this.extensions.filter.getHeaderFilters();
			}
		},

		//remove filter from array
		removeFilter: function removeFilter(field, type, value) {
			if (this.extExists("filter", true)) {
				this.extensions.filter.removeFilter(field, type, value);
				this.rowManager.filterRefresh();
			}
		},

		//clear filters
		clearFilter: function clearFilter(all) {
			if (this.extExists("filter", true)) {
				this.extensions.filter.clearFilter(all);
				this.rowManager.filterRefresh();
			}
		},

		//clear header filters
		clearHeaderFilter: function clearHeaderFilter() {
			if (this.extExists("filter", true)) {
				this.extensions.filter.clearHeaderFilter();
				this.rowManager.filterRefresh();
			}
		},

		///////////////////// Filtering ////////////////////
		selectRow: function selectRow(rows) {
			if (this.extExists("selectRow", true)) {
				this.extensions.selectRow.selectRows(rows);
			}
		},

		deselectRow: function deselectRow(rows) {
			if (this.extExists("selectRow", true)) {
				this.extensions.selectRow.deselectRows(rows);
			}
		},

		toggleSelectRow: function toggleSelectRow(row) {
			if (this.extExists("selectRow", true)) {
				this.extensions.selectRow.toggleRow(row);
			}
		},

		getSelectedRows: function getSelectedRows() {
			if (this.extExists("selectRow", true)) {
				return this.extensions.selectRow.getSelectedRows();
			}
		},

		getSelectedData: function getSelectedData() {
			if (this.extExists("selectRow", true)) {
				return this.extensions.selectRow.getSelectedData();
			}
		},

		//////////// Pagination Functions  ////////////

		setMaxPage: function setMaxPage(max) {
			if (this.options.pagination && this.extExists("page")) {
				this.extensions.page.setMaxPage(max);
			} else {
				return false;
			}
		},

		setPage: function setPage(page) {
			if (this.options.pagination && this.extExists("page")) {
				this.extensions.page.setPage(page);
			} else {
				return false;
			}
		},

		setPageSize: function setPageSize(size) {
			if (this.options.pagination && this.extExists("page")) {
				this.extensions.page.setPageSize(size);
				this.extensions.page.setPage(1);
			} else {
				return false;
			}
		},

		getPageSize: function getPageSize() {
			if (this.options.pagination && this.extExists("page", true)) {
				return this.extensions.page.getPageSize();
			}
		},

		previousPage: function previousPage() {
			if (this.options.pagination && this.extExists("page")) {
				this.extensions.page.previousPage();
			} else {
				return false;
			}
		},

		nextPage: function nextPage() {
			if (this.options.pagination && this.extExists("page")) {
				this.extensions.page.nextPage();
			} else {
				return false;
			}
		},

		getPage: function getPage() {
			if (this.options.pagination && this.extExists("page")) {
				return this.extensions.page.getPage();
			} else {
				return false;
			}
		},

		getPageMax: function getPageMax() {
			if (this.options.pagination && this.extExists("page")) {
				return this.extensions.page.getPageMax();
			} else {
				return false;
			}
		},

		///////////////// Grouping Functions ///////////////

		setGroupBy: function setGroupBy(groups) {
			if (this.extExists("groupRows", true)) {
				this.options.groupBy = groups;
				this.extensions.groupRows.initialize();
				this.rowManager.refreshActiveData("display");
			} else {
				return false;
			}
		},

		setGroupStartOpen: function setGroupStartOpen(values) {
			if (this.extExists("groupRows", true)) {
				this.options.groupStartOpen = values;
				this.extensions.groupRows.initialize();
				if (this.options.groupBy) {
					this.rowManager.refreshActiveData("group");
				} else {
					console.warn("Grouping Update - cant refresh view, no groups have been set");
				}
			} else {
				return false;
			}
		},

		setGroupHeader: function setGroupHeader(values) {
			if (this.extExists("groupRows", true)) {
				this.options.groupHeader = values;
				this.extensions.groupRows.initialize();
				if (this.options.groupBy) {
					this.rowManager.refreshActiveData("group");
				} else {
					console.warn("Grouping Update - cant refresh view, no groups have been set");
				}
			} else {
				return false;
			}
		},

		getGroups: function getGroups(values) {
			if (this.extExists("groupRows", true)) {
				return this.extensions.groupRows.getGroups();
			} else {
				return false;
			}
		},

		///////////////// Column Calculation Functions ///////////////
		getCalcResults: function getCalcResults() {
			if (this.extExists("columnCalcs", true)) {
				return this.extensions.columnCalcs.getResults();
			} else {
				return false;
			}
		},

		/////////////// Navigation Management //////////////

		navigatePrev: function navigatePrev() {
			var cell = false;

			if (this.extExists("edit", true)) {
				cell = this.extensions.edit.currentCell;

				if (cell) {
					e.preventDefault();
					return cell.nav().prev();
				}
			}

			return false;
		},

		navigateNext: function navigateNext() {
			var cell = false;

			if (this.extExists("edit", true)) {
				cell = this.extensions.edit.currentCell;

				if (cell) {
					e.preventDefault();
					return cell.nav().next();
				}
			}

			return false;
		},

		navigateLeft: function navigateLeft() {
			var cell = false;

			if (this.extExists("edit", true)) {
				cell = this.extensions.edit.currentCell;

				if (cell) {
					e.preventDefault();
					return cell.nav().left();
				}
			}

			return false;
		},

		navigateRight: function navigateRight() {
			var cell = false;

			if (this.extExists("edit", true)) {
				cell = this.extensions.edit.currentCell;

				if (cell) {
					e.preventDefault();
					return cell.nav().right();
				}
			}

			return false;
		},

		navigateUp: function navigateUp() {
			var cell = false;

			if (this.extExists("edit", true)) {
				cell = this.extensions.edit.currentCell;

				if (cell) {
					e.preventDefault();
					return cell.nav().up();
				}
			}

			return false;
		},

		navigateDown: function navigateDown() {
			var cell = false;

			if (this.extExists("edit", true)) {
				cell = this.extensions.edit.currentCell;

				if (cell) {
					e.preventDefault();
					return cell.nav().dpwn();
				}
			}

			return false;
		},

		/////////////// History Management //////////////
		undo: function undo() {
			if (this.options.history && this.extExists("history", true)) {
				return this.extensions.history.undo();
			} else {
				return false;
			}
		},

		redo: function redo() {
			if (this.options.history && this.extExists("history", true)) {
				return this.extensions.history.redo();
			} else {
				return false;
			}
		},

		/////////////// Download Management //////////////

		download: function download(type, filename, options) {
			if (this.extExists("download", true)) {
				this.extensions.download.download(type, filename, options);
			}
		},

		/////////// Inter Table Communications ///////////

		tableComms: function tableComms(table, extension, action, data) {
			this.extensions.comms.receive(table, extension, action, data);
		},

		////////////// Extension Management //////////////

		//object to hold extensions
		extensions: {},
		extensionBindings: {},

		//extend extension
		extendExtension: function extendExtension(name, property, values) {

			if (this.extensionBindings[name]) {
				var source = this.extensionBindings[name].prototype[property];

				if (source) {
					if ((typeof values === 'undefined' ? 'undefined' : _typeof(values)) == "object") {
						for (var key in values) {
							source[key] = values[key];
						}
					} else {
						console.warn("Extension Error - Invalid value type, it must be an object");
					}
				} else {
					console.warn("Extension Error - property does not exist:", property);
				}
			} else {
				console.warn("Extension Error - extension does not exist:", name);
			}
		},

		//add extension to tabulator
		registerExtension: function registerExtension(name, extension) {
			var self = this;
			this.extensionBindings[name] = extension;
		},

		//ensure that extensions are bound to instantiated function
		bindExtensions: function bindExtensions() {
			var self = this;

			this.extensions = {};

			for (var name in self.extensionBindings) {
				self.extensions[name] = new self.extensionBindings[name](self);
			}
		},

		//Check for plugin
		extExists: function extExists(plugin, required) {
			if (this.extensions[plugin]) {
				return true;
			} else {
				if (required) {
					console.error("Tabulator Plugin Not Installed: " + plugin);
				}
				return false;
			}
		}

	};

	var Layout = function Layout(table) {

		this.table = table;

		this.mode = null;
	};

	//initialize layout system

	Layout.prototype.initialize = function (layout) {

		if (this.modes[layout]) {

			this.mode = layout;
		} else {

			console.warn("Layout Error - invalid mode set, defaulting to 'fitData' : " + layout);

			this.mode = 'fitData';
		}

		this.table.element.attr("tabulator-layout", this.mode);
	};

	Layout.prototype.getMode = function () {

		return this.mode;
	};

	//trigger table layout

	Layout.prototype.layout = function () {

		this.modes[this.mode].call(this, this.table.columnManager.columnsByIndex);
	};

	//layout render functions

	Layout.prototype.modes = {

		//resize columns to fit data the contain

		"fitData": function fitData(columns) {

			columns.forEach(function (column) {

				column.reinitializeWidth();
			});

			if (this.table.options.responsiveLayout && this.table.extExists("responsiveLayout", true)) {

				this.table.extensions.responsiveLayout.update();
			}
		},

		//resize columns to fit data the contain

		"fitDataFill": function fitDataFill(columns) {

			columns.forEach(function (column) {

				column.reinitializeWidth();
			});

			if (this.table.options.responsiveLayout && this.table.extExists("responsiveLayout", true)) {

				this.table.extensions.responsiveLayout.update();
			}
		},

		//resize columns to fit

		"fitColumns": function fitColumns(columns) {

			var self = this;

			var totalWidth = self.table.element.innerWidth(); //table element width

			var fixedWidth = 0; //total width of columns with a defined width

			var flexWidth = 0; //total width available to flexible columns

			var flexGrowUnits = 0; //total number of widthGrow blocks accross all columns

			var flexColWidth = 0; //desired width of flexible columns

			var flexColumns = []; //array of flexible width columns

			var fixedShrinkColumns = []; //array of fixed width columns that can shrink

			var flexShrinkUnits = 0; //total number of widthShrink blocks accross all columns

			var overflowWidth = 0; //horizontal overflow width

			var gapFill = 0; //number of pixels to be added to final column to close and half pixel gaps


			function calcWidth(width) {

				var colWidth;

				if (typeof width == "string") {

					if (width.indexOf("%") > -1) {

						colWidth = totalWidth / 100 * parseInt(width);
					} else {

						colWidth = parseInt(width);
					}
				} else {

					colWidth = width;
				}

				return colWidth;
			}

			//ensure columns resize to take up the correct amount of space

			function scaleColumns(columns, freeSpace, colWidth, shrinkCols) {

				var oversizeCols = [],
				    oversizeSpace = 0,
				    remainingSpace = 0,
				    nextColWidth = 0,
				    gap = 0,
				    changeUnits = 0,
				    undersizeCols = [];

				function calcGrow(col) {

					return colWidth * (col.column.definition.widthGrow || 1);
				}

				function calcShrink(col) {

					return calcWidth(col.width) - colWidth * (col.column.definition.widthShrink || 0);
				}

				columns.forEach(function (col, i) {

					var width = shrinkCols ? calcShrink(col) : calcGrow(col);

					if (col.column.minWidth >= width) {

						oversizeCols.push(col);
					} else {

						undersizeCols.push(col);

						changeUnits += shrinkCols ? col.column.definition.widthShrink || 1 : col.column.definition.widthGrow || 1;
					}
				});

				if (oversizeCols.length) {

					oversizeCols.forEach(function (col) {

						oversizeSpace += shrinkCols ? col.width - col.column.minWidth : col.column.minWidth;

						col.width = col.column.minWidth;
					});

					remainingSpace = freeSpace - oversizeSpace;

					nextColWidth = changeUnits ? Math.floor(remainingSpace / changeUnits) : remainingSpace;

					gap = remainingSpace - nextColWidth * changeUnits;

					gap += scaleColumns(undersizeCols, remainingSpace, nextColWidth, shrinkCols);
				} else {

					gap = changeUnits ? freeSpace - Math.floor(freeSpace / changeUnits) * changeUnits : freeSpace;

					undersizeCols.forEach(function (column) {

						column.width = shrinkCols ? calcShrink(column) : calcGrow(column);
					});
				}

				return gap;
			}

			if (this.table.options.responsiveLayout && this.table.extExists("responsiveLayout", true)) {

				this.table.extensions.responsiveLayout.update();
			}

			//adjust for vertical scrollbar if present

			if (this.table.rowManager.element[0].scrollHeight > this.table.rowManager.element.innerHeight()) {

				totalWidth -= this.table.rowManager.element[0].offsetWidth - this.table.rowManager.element[0].clientWidth;
			}

			columns.forEach(function (column) {

				var width, minWidth, colWidth;

				if (column.visible) {

					width = column.definition.width;

					minWidth = parseInt(column.minWidth);

					if (width) {

						colWidth = calcWidth(width);

						fixedWidth += colWidth > minWidth ? colWidth : minWidth;

						if (column.definition.widthShrink) {

							fixedShrinkColumns.push({

								column: column,

								width: colWidth > minWidth ? colWidth : minWidth

							});

							flexShrinkUnits += column.definition.widthShrink;
						}
					} else {

						flexColumns.push({

							column: column,

							width: 0

						});

						flexGrowUnits += column.definition.widthGrow || 1;
					}
				}
			});

			//calculate available space

			flexWidth = totalWidth - fixedWidth;

			//calculate correct column size

			flexColWidth = Math.floor(flexWidth / flexGrowUnits);

			//generate column widths

			var gapFill = scaleColumns(flexColumns, flexWidth, flexColWidth, false);

			//increase width of last column to account for rounding errors

			if (flexColumns.length && gapFill > 0) {

				flexColumns[flexColumns.length - 1].width += +gapFill;
			}

			//caculate space for columns to be shrunk into

			flexColumns.forEach(function (col) {

				flexWidth -= col.width;
			});

			overflowWidth = Math.abs(gapFill) + flexWidth;

			//shrink oversize columns if there is no available space

			if (overflowWidth > 0 && flexShrinkUnits) {

				gapFill = scaleColumns(fixedShrinkColumns, overflowWidth, Math.floor(overflowWidth / flexShrinkUnits), true);
			}

			//decrease width of last column to account for rounding errors

			if (fixedShrinkColumns.length) {

				fixedShrinkColumns[fixedShrinkColumns.length - 1].width -= gapFill;
			}

			flexColumns.forEach(function (col) {

				col.column.setWidth(col.width);
			});

			fixedShrinkColumns.forEach(function (col) {

				col.column.setWidth(col.width);
			});
		}

	};

	Tabulator.registerExtension("layout", Layout);
	var Localize = function Localize(table) {
		this.table = table; //hold Tabulator object
		this.locale = "default"; //current locale
		this.lang = false; //current language
		this.bindings = {}; //update events to call when locale is changed
	};

	//set header placehoder
	Localize.prototype.setHeaderFilterPlaceholder = function (placeholder) {
		this.langs.default.headerFilters.default = placeholder;
	};

	//set header filter placeholder by column
	Localize.prototype.setHeaderFilterColumnPlaceholder = function (column, placeholder) {
		this.langs.default.headerFilters.columns[column] = placeholder;

		if (this.lang && !this.lang.headerFilters.columns[column]) {
			this.lang.headerFilters.columns[column] = placeholder;
		}
	};

	//setup a lang description object
	Localize.prototype.installLang = function (locale, lang) {
		if (this.langs[locale]) {
			this._setLangProp(this.langs[locale], lang);
		} else {
			this.langs[locale] = lang;
		}
	};

	Localize.prototype._setLangProp = function (lang, values) {
		for (var key in values) {
			if (lang[key] && _typeof(lang[key]) == "object") {
				this._setLangProp(lang[key], values[key]);
			} else {
				lang[key] = values[key];
			}
		}
	};

	//set current locale
	Localize.prototype.setLocale = function (desiredLocale) {
		var self = this;

		desiredLocale = desiredLocale || "default";

		//fill in any matching languge values
		function traverseLang(trans, path) {
			for (var prop in trans) {

				if (_typeof(trans[prop]) == "object") {
					if (!path[prop]) {
						path[prop] = {};
					}
					traverseLang(trans[prop], path[prop]);
				} else {
					path[prop] = trans[prop];
				}
			}
		}

		//determing correct locale to load
		if (desiredLocale === true && navigator.language) {
			//get local from system
			desiredLocale = navigator.language.toLowerCase();
		}

		if (desiredLocale) {

			//if locale is not set, check for matching top level locale else use default
			if (!self.langs[desiredLocale]) {
				var prefix = desiredLocale.split("-")[0];

				if (self.langs[prefix]) {
					console.warn("Localization Error - Exact matching locale not found, using closest match: ", desiredLocale, prefix);
					desiredLocale = prefix;
				} else {
					console.warn("Localization Error - Matching locale not found, using default: ", desiredLocale);
					desiredLocale = "default";
				}
			}
		}

		self.locale = desiredLocale;

		//load default lang template
		self.lang = $.extend(true, {}, self.langs.default);

		if (desiredLocale != "default") {
			traverseLang(self.langs[desiredLocale], self.lang);
		}

		self.table.options.localized(self.locale, self.lang);

		self._executeBindings();
	};

	//get current locale
	Localize.prototype.getLocale = function (locale) {
		return self.locale;
	};

	//get lang object for given local or current if none provided
	Localize.prototype.getLang = function (locale) {
		return locale ? this.langs[locale] : this.lang;
	};

	//get text for current locale
	Localize.prototype.getText = function (path, value) {
		var path = value ? path + "|" + value : path,
		    pathArray = path.split("|"),
		    text = this._getLangElement(pathArray, this.locale);

		// if(text === false){
		// 	console.warn("Localization Error - Matching localized text not found for given path: ", path);
		// }

		return text || "";
	};

	//traverse langs object and find localized copy
	Localize.prototype._getLangElement = function (path, locale) {
		var self = this;
		var root = self.lang;

		path.forEach(function (level) {
			var rootPath;

			if (root) {
				rootPath = root[level];

				if (typeof rootPath != "undefined") {
					root = rootPath;
				} else {
					root = false;
				}
			}
		});

		return root;
	};

	//set update binding
	Localize.prototype.bind = function (path, callback) {
		if (!this.bindings[path]) {
			this.bindings[path] = [];
		}

		this.bindings[path].push(callback);

		callback(this.getText(path), this.lang);
	};

	//itterate through bindings and trigger updates
	Localize.prototype._executeBindings = function () {
		var self = this;

		var _loop = function _loop(path) {
			self.bindings[path].forEach(function (binding) {
				binding(self.getText(path), self.lang);
			});
		};

		for (var path in self.bindings) {
			_loop(path);
		}
	};

	//Localized text listings
	Localize.prototype.langs = {
		"default": { //hold default locale text
			"groups": {
				"item": "item",
				"items": "items"
			},
			"columns": {},
			"ajax": {
				"loading": "Loading",
				"error": "Error"
			},
			"pagination": {
				"first": "First",
				"first_title": "First Page",
				"last": "Last",
				"last_title": "Last Page",
				"prev": "Prev",
				"prev_title": "Prev Page",
				"next": "Next",
				"next_title": "Next Page"
			},
			"headerFilters": {
				"default": "filter column...",
				"columns": {}
			}
		}
	};

	Tabulator.registerExtension("localize", Localize);
	var Comms = function Comms(table) {
		this.table = table;
	};

	Comms.prototype.getConnections = function (selectors) {
		var self = this,
		    connections = [],
		    connection;

		if (Array.isArray(selectors)) {
			connections = selectors;
		} else {
			connection = typeof selectors == "string" ? $(selectors) : selectors;

			connection.each(function () {
				if (self.table.element[0] !== this) {
					connections.push($(this));
				}
			});
		}

		return connections;
	};

	Comms.prototype.send = function (selectors, extension, action, data) {
		var self = this,
		    connections = this.getConnections(selectors);

		connections.forEach(function (connection) {
			connection.tabulator("tableComms", self.table.element, extension, action, data);
		});

		if (!connections.length && selectors) {
			console.warn("Table Connection Error - No tables matching selector found", selectors);
		}
	};

	Comms.prototype.receive = function (table, extension, action, data) {
		if (this.table.extExists(extension)) {
			return this.table.extensions[extension].commsReceived(table, action, data);
		} else {
			console.warn("Inter-table Comms Error - no such extension:", extension);
		}
	};

	Tabulator.registerExtension("comms", Comms);
})();
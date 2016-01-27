var ibmSpendChart = {
	tipData: null,
	stackedbar: null,
	charDivName: 'stackedbar',
	data: null,
	show: function(data) {
		this.data = data;
		this.tipData = this.getTipData(data);
		this.initD3StackedBar();
		this.stackedbar.show();
	},
	initD3StackedBar: function() {
		var that = this;
		this.stackedbar = new D3StackedBar({
			container: '#' + this.charDivName,
			data: that.data,
			margin: {top: 20, left: 150, bottom: 50, right: 20},
			displayTable: true,
			yFormat: that.commafy,
			verticalText: '$K',
			tipEventType: 'click', //mouse_over_out, click, click_timeout
			tooltipText: function(d, element) {
				var _tipData = that.tipData,
					obj = _tipData[d.x],
					currentKey = $(element).parent('g').attr('original-key');
				return that.packageHtml(obj, currentKey);
			}
		});
	},
	getTipData: function(arr) {
		var obj,
			tipData = {},
			tipSubObj = {},
			subObjtemp,
			values = [];
		for (var i = 0; i < arr.length; i++) {
			obj = arr[i];
			values = obj.values;
			values.forEach(function(element, index) {
				subObjtemp = tipData[element.x];
				if (subObjtemp) {
					subObjtemp[obj.key] = element.y;
					tipData[element.x] = subObjtemp;
				} else {
					tipSubObj = new Object();
					tipSubObj[obj.key] = element.y;
					tipData[element.x] = tipSubObj;
				}

			});
		};
		return this.getIBMTotal(tipData);
	},
	getIBMTotal: function(tipData) {
		var yearObj,
			total;
		for (var i in tipData) {
			total = 0;
			yearObj = tipData[i];
			for (var j in yearObj) {
				total += yearObj[j];
				yearObj[j] = this.commafy(yearObj[j]);
			};
			yearObj['IBM Total'] = this.commafy(total);
		};
		return tipData;
	},
	packageHtml: function(tipSubObj, currentKey) {
		var contentHtml = '',
			template, name, money, rowStyle;
		for (var i in tipSubObj) {
			name = i;
			money = tipSubObj[i];
			rowStyle = 'row';
			if (name == currentKey) {
				rowStyle = 'row selected';
			}
			if (name == 'IBM Total') {
				name = '<b>' + name + '</b>';
			}
			template = "<span class=\"" + rowStyle + "\"><span class=\"category\">" + name + "</span><span class=\"money\"><b>" + money + "</b> $K</span></span>";
			contentHtml += template;
		}
		return "<div class=\"atuoScroll\"><span class=\"table\">" + contentHtml + "</span></div>";
	},
	commafy: function(num) {
		var d = arguments[1] || 1,
			re = /(-?\d+)(\d{3})/;
		num = num.toFixed(d) + "";
		while (re.test(num)) {
			num = num.replace(re, "$1,$2");
		}
		return num.replace(/[0]+$|[.][0]+$/g, "");
	}

};
/**
 * Created by wuh on 9/8/2015.
 */
var kpiChart = {
    kpiDivName: 'kpiChartDiv',
    summaryDivName:'kpiChartSummaryDiv',
    width: 760,//720
    height: 410,//400
    svg:null,
    padding: {left: 150, right: 30, top: 50, bottom: 20},
    dataset: [60, 60, 60],
    yDomainMax:60,
    xScale:null,
    yScale:null,
    xTickNameArr:['ROA (%)', 'FAU', 'GMROI'],
    yTickNameArr:['Underperformer', 'Median', 'Outperformer'],
    rectPadding:140,//140,100,90,
    rect_relative_h:5,
    rect_width:0,
    rect_translate:'',
    companyNameArr:[],
    checkedList:new List(),
    tabData:new HashMap(),
    initKpi: function () {
        this.destroyKpi();
        var contentDiv = d3.select('#'+this.kpiDivName);
        this.svg = contentDiv.append("svg")
            .attr("width", this.width)
            .attr("height", this.height);
        this.initAxis();
        this.initLinearGradient();
        this.initRect();
        this.createSummaryDiv();
        this.initBrokenLine();
    },
    initAxis: function () {
        var that=this;
        //x?????
        this.xScale = d3.scale.ordinal()
            .domain(d3.range(this.dataset.length))
            .rangeRoundBands([0, this.width - this.padding.left - this.padding.right]);

        //y?????
        this.yScale = d3.scale.linear()
            .domain([0, d3.max(this.dataset)])
            .range([this.height - this.padding.top - this.padding.bottom, 0]);

        //??x?
        var xAxis = d3.svg.axis()
            .scale(this.xScale)
            .orient("bottom")
            .tickFormat('');

        //??y?
        var yAxis = d3.svg.axis()
            .scale(this.yScale)
            .orient("left")
            .tickFormat('')
            .ticks(7)
            .tickSize(4, 0);

        //??z?
        var zAxis = d3.svg.axis()
            .scale(this.xScale)
            .orient("bottom")
            .tickFormat('');

        //??x?
        var xBar = this.svg.append("g")
            .attr('id', 'axis_x')
            .attr("class", "axis")
            .attr("transform", "translate(" + this.padding.left + "," + (this.height - this.padding.bottom) + ")")
            .call(xAxis);

        //??y?
        var yBar = this.svg.append("g")
            .attr('id', 'axis_y')
            .attr("class", "axis")
            .attr("transform", "translate(" + this.padding.left + "," + this.padding.top + ")")
            .call(yAxis);

        //??z?
        var zBar = this.svg.append("g")
            .attr('id', 'axis_z')
            .attr("class", "axis")
            .attr("transform", "translate(" + this.padding.left + "," + this.padding.top + ")")
            .call(zAxis);

        //??z???
        var dArr = zBar.select('path').attr('d').split(',');
        var d_2 = dArr[1];
        dArr[1] = d_2.substring(0, d_2.length - 1) + '-' + d_2.substring(d_2.length - 1);
        zBar.select('path').attr('d', dArr.join(','));
        zBar.selectAll('line')
            .attr('y2', '-' + zBar.select("line").attr('y2'));

        //??x,y,z????
        xBar.selectAll("text")
            .text(function (d, i) {
                return that.xTickNameArr[i];
            });
        yBar.selectAll("text")
            .text(function (d, i) {
                switch (i) {
                    case 1:
                        return that.yTickNameArr[0];
                    case 3:
                        return that.yTickNameArr[1];
                    case 5:
                        return that.yTickNameArr[2];
                    default:
                        return '';
                }
                return '';
            });
        zBar.selectAll("text")
            .attr('dy', '0em')
            .attr('y', '-' + zBar.select("text").attr('y'))
            .text(function (d, i) {
                return that.xTickNameArr[i];
            });

        //??????
        yBar.selectAll('.tick')
            .append("line")
            .attr('x1', this.width - this.padding.left - this.padding.right)
            .attr('style', function (d, i) {
                if (i == 2 || i == 4) {
                    return 'fill: none; stroke: rgb(187, 187, 187); shape-rendering: crispEdges;';
                }
                return 'fill: none; stroke: rgb(0, 0, 0); shape-rendering: crispEdges;';
            });
    },
    //???????
    initLinearGradient:function(){
        var stopArr = [{offset: '0%', stopColor: '#222'}, {offset: '5%', stopColor: '#222'}, {offset: '7%', stopColor: '#FF0000'}, {offset: '50%', stopColor: '#FFFF00'}, {offset: '95%', stopColor: '#00FF00'}];
        var defs = this.svg.append("defs");
        var linearGradient = defs.append("linearGradient")
            .attr("id","svg_gradient_num72")
            .attr("x1","0%")
            .attr("y1","100%")
            .attr("x2","0%")
            .attr("y2","0%");
        linearGradient.selectAll('stop')
            .data(stopArr)
            .enter()
            .append("stop")
            .attr("offset", function (d, i) {
                return d.offset;
            })
            .style('stop-color', function (d, i) {
                return d.stopColor;
            });
    },
    initRect:function(){
        var that=this;
        this.rect_width=this.xScale.rangeBand() - this.rectPadding;
        this.rect_translate='translate(' + this.padding.left + ',' + (this.padding.top+this.rect_relative_h)+ ')';
        //??????
        var rects = this.svg.selectAll(".kpiRect")
            .data(this.dataset)
            .enter()
            .append("rect")
            .attr("class", "kpiRect")
            .attr("transform", this.rect_translate)
            .attr("x", function (d, i) {
                return that.xScale(i) + that.rectPadding / 2;
            })
            .attr("y", function (d) {
                return that.yScale(d);
            })
            .attr("width", this.rect_width)
            .attr("height", function (d) {
                return that.height - that.padding.top - that.padding.bottom - that.yScale(d)-that.rect_relative_h;
            });
    },
    //broken line
    initBrokenLine:function(){
        var compare=function(str1,str2){
            return parseInt(str1.substring(str1.length-1))-parseInt(str2.substring(str2.length-1));
        };
        this.checkedList.sort(compare);
        var checkedArr=this.checkedList.show();
        var compyKey;
        for(var i in checkedArr){
            compyKey=checkedArr[i];
            this.drawBrokenLine(this.tabData.get(compyKey),i,compyKey.substring(compyKey.length-1));
        }
    },
    drawBrokenLine:function(yArr,num,compyNum){
        var that=this;
        var fillArr=['rgb(238, 61, 150)','rgb(0, 65, 102)','rgb(254, 184, 19)','rgb(217, 24, 46)','rgb(131, 131, 41)','rgb(14, 129, 202)','rgb(221, 115, 28)','rgb(0, 81, 42)','rgb(186, 0, 109)','rgb(184, 71, 27)','rgb(60, 57, 0)','rgb(23, 175, 75)'];
        var circleCss='fill: '+fillArr[num]+';stroke: rgb(0, 0, 0);stroke-width: 2px;fill-opacity: 1;';
        var pathCss='stroke: '+fillArr[num]+';stroke-width: 4px;fill: none;';
        var line = d3.svg.line()
            .x(function (d, i) {
                return that.xScale(i) + that.rectPadding / 2+that.rect_width/2;
            })
            .y(function (d) {
                return that.yScale(d);
            });
        var brokenLineG=this.svg.append('g');
        var path = brokenLineG.append("path")
            .attr("d", line(yArr))
            .attr("transform", this.rect_translate)
            .attr("style",pathCss);
        //????
        brokenLineG.selectAll("circle")
            .data(yArr)
            .enter()
            .append("circle")
            .attr("transform", this.rect_translate)
            .attr("cx", function (d, i) {
                return that.xScale(i) + that.rectPadding / 2+that.rect_width/2;
            })
            .attr("cy", function (d) {
                return that.yScale(d);
            })
            .attr("r", 8)
            .attr("style",circleCss);

        this.appendSummary(fillArr[num],compyNum);
    },
    init:function(obj){
        var showSize=obj.showSize;
        var yArrStore=obj.yArrStore;

        if(showSize==5){
            this.rectPadding=90;
        }else if(showSize==4){
            this.rectPadding=100;
        }else{
            this.rectPadding=140;
        }

        this.xTickNameArr=obj.xTickNameArr;

        this.companyNameArr=obj.companyNameArr;

        this.dataset=[];
        for(var i=0;i<showSize;i++){
            this.dataset.push(this.yDomainMax);
        }

        this.tabData.clear();
        for(var i=0;i<yArrStore.length;i++){
            this.tabData.put('companyCheck'+i,yArrStore[i]);
        }
        this.initKpi();
    },
    addCompy:function(id){
        this.checkedList.add(id);
        this.initKpi();
    },
    removeCompy:function(id){
        this.checkedList.remove(id);
        this.initKpi();
    },
    destroyKpi:function(){
        $("#"+this.kpiDivName).empty();
        $("#kpiSummaryCenter").remove();
    },
    createSummaryDiv:function(){
        var html="<center id=\"kpiSummaryCenter\"> <div id=\"kpiChartLegendDiv\" style=\"height: 40px;\"> <div id=\"MyLegend\" width=\"100%\" height=\"100%\"> <div style=\"text-align: center; width: 100%;\"> <div id=\""+this.summaryDivName+"\" width=\"99%\" height=\"99%\" style=\"margin: 0px auto;padding-top: 26px;\"> </div> </div> </div> </div> </center>";
        $('#'+this.kpiDivName).after(html);
    },
    appendSummary:function(color,compyNum){
        var companyName=this.companyNameArr[compyNum];
        var subLength=16;
        var endStr=companyName.substring(subLength);
        companyName=companyName.substring(0,subLength);
        if(endStr){
            companyName+=endStr.replace(/.*/,'...');
        }
        var html="<span style=\"margin: 10px;\"> <div width=\"50\" style=\"border: 2px solid black; padding: 5px; display:inline-block; width:8px; height:8px; background-color: "+color+";\"></div> <div width=\"70%\" style=\"padding: 5px; display:inline-block; height:12px;\"> <div style=\"display: table-cell; vertical-align: middle; height:100%;\"> <p style=\"height:99%; font-size:12px;\"> <span> <span class=\"pdf-v-legend\" data-pdf-v-legend-color=\"#ee3d96\">"+companyName+"</span> </span> </p> </div> </div> </span>";
        $('#'+this.summaryDivName).append(html);
    }

};

function HashMap() {
    var length = 0;
    var obj = new Object();

    this.isEmpty = function () {
        return length == 0;
    };

    this.containsKey = function (key) {
        return (key in obj);
    };

    this.containsValue = function (value) {
        for (var key in obj) {
            if (obj[key] == value) {
                return true;
            }
        }
        return false;
    };

    this.put = function (key, value) {
        if (!this.containsKey(key)) {
            length++;
        }
        obj[key] = value;
    };

    this.get = function (key) {
        return this.containsKey(key) ? obj[key] : null;
    };

    this.remove = function (key) {
        if (this.containsKey(key) && (delete obj[key])) {
            length--;
        }
    };

    this.values = function () {
        var _values = new Array();
        for (var key in obj) {
            _values.push(obj[key]);
        }
        return _values;
    };

    this.keySet = function () {
        var _keys = new Array();
        for (var key in obj) {
            _keys.push(key);
        }
        return _keys;
    };

    this.size = function () {
        return length;
    };

    this.clear = function () {
        length = 0;
        obj = new Object();
    };
}

function List() {
    var dataStore = [];
    this.add = function (data) {
        if (dataStore.indexOf(data) < 0) {
            dataStore.push(data);
            return true;
        }
        else {
            return false;
        }
    };
    this.remove = function (data) {
        var pos = dataStore.indexOf(data);
        if (pos > -1) {
            dataStore.splice(pos, 1);
            return true;
        }
        else {
            return false;
        }
    };
    this.sort = function(fun){
        dataStore.sort(fun);
    };
    this.show = function () {
        return dataStore;
    }
}

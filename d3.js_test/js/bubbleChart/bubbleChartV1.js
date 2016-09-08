/**
 * Created by wuh on 1/28/2016.
 */
function BubbleChart(options){
    var defaultOptions = {
        container: "#chart",
        padding: {left: 110, right: 30, top: 60, bottom: 70},
    };
    this.beforedDomStore=[];
    this.lineMaxLength = 26;
    if (typeof options == 'object') this.options = $.extend(defaultOptions, options);
    else this.options = defaultOptions;
    this.prepare();
}
BubbleChart.prototype={
    constructor:BubbleChart,
    prepare : function() {
        this.padding = this.options.padding;
        var width = $(this.options.container).width(),
            height = $(this.options.container).height();
        this.realWidth =width - this.padding.left - this.padding.right;
        this.realHeight = height - this.padding.top - this.padding.bottom;


        this.svg = d3.select(this.options.container).append("svg:svg")
            .attr("width", width)
            .attr("height", height)
            .append("svg:g").attr("transform", "translate("+this.padding.left+","+this.padding.top+")");
    },
    renderAxes : function(){
        //Prepare Scales
        this.xScale = d3.scale.linear()
            .domain([0, 110])
            .range([0,this.realWidth]);

        this.yScale = d3.scale.linear()
            .domain([110, 0])
            .range([this.realHeight,0]);

        this._yScale = d3.scale.linear()
            .domain([110, 0])
            .range([0,this.realHeight]);

        var arr=[121212,232323,343434,434343,12345,565656];
        this.Scale_circle = d3.scale.linear()
            .domain([0,1])
            .range([d3.min(arr),d3.max(arr)]);

        //this.xScale = d3.scale.ordinal()
        //    .domain(d3.range(11))
        //    .rangeRoundBands([0,this.realWidth],0.7);
        //
        //this.yScale = d3.scale.linear()
        //    .domain([1,0])
        //    .range([0,this.realHeight]);

        //this.xScale = d3.scale.linear()
        //    .domain([0, 1])
        //    .range([0,400]);
        //
        //this.yScale = d3.scale.linear()
        //    .domain([1, 0])
        //    .range([0, 200]);




        //Init Axes
        var xAxis = d3.svg.axis()
            .scale(this.xScale)
            .orient("bottom");
        var gxAxis = this.svg.append("g")
            .attr("class", "axis_x axis")
            .attr("transform", "translate(0," + this.realHeight + ")")
            .call(xAxis);

        var yAxis = d3.svg.axis()
            .scale(this.yScale)
            .orient("left");
        var gyAxis = this.svg.append("g")
            .attr("class", "axis_y axis")
            .attr("transform", "translate(0,0)")
            .call(yAxis);


        //Change axis style
        var blackLineStyle="fill: none;stroke: black;shape-rendering: crispEdges;";
        this.svg.selectAll('text').text('');

        gxAxis.selectAll('.tick')
            .append("line")
            .attr('y2',-(this.realHeight))
            .attr('style',function(d,i){
                if(i==5){
                    return blackLineStyle;
                }else if(i==10){
                    return blackLineStyle;
                }
                return "fill: none;stroke: rgb(187, 187, 187);shape-rendering: crispEdges;";
            });

        gyAxis.selectAll('.tick')
            .append("line")
            .attr('x1',this.realWidth)
            .attr('style',function(d,i){
                if(i==1){
                    return blackLineStyle;
                }else if(i==6){
                    return blackLineStyle;
                }else if(i==11){
                    return blackLineStyle;
                }
                return "fill: none;stroke: rgb(187, 187, 187);shape-rendering: crispEdges;";
            });

        gxAxis.selectAll('text').text(function(d,i){
            if(i==0){
                return "Underperformer";
            }else if(i==5){
                return "Median";
            }else if(i==10){
                return "Outperformer";
            }
        });

        gyAxis.selectAll('text').text(function(d,i){
            if(i==1){
                return "Outperformer";
            }else if(i==6){
                return "Median";
            }
        });

    },
    drawCircle:function(dataset){
        var that=this;
        //remove circle and tip
        d3.select("#tip").remove();
        d3.select(".circle-g").remove();

        this.circleG=this.svg.append("g").attr("class","circle-g").attr("transform", "translate(0,0)");
        //draw circle
        this.circleG.selectAll(".singleCircle")
            .data(dataset)
            .enter()
            .append("circle")
            .attr("class",function(d){return d.chooseFlg?"selectedCircle":"singleCircle";})
            .attr("flag-data","0")
            .attr("boxTile-data",function(d){return d.boxTitle})
            .attr("size-data",function(d){return d.size})
            .attr("r", function(d){ return d.r; })
            .attr("cx", function(d){ return that.xScale(d.x/(1/100)); })
            .attr("cy", function(d){ return that._yScale(d.y/(1/100));});

        this.bindEvent();
    },
    bindEvent:function(){
        var that=this;
        this.svg.selectAll("circle").on('click', function () {
            that.showContentBox(this);
        });

        d3.select(this.options.container).on('click', function () {
            if (d3.event.srcElement.nodeName == 'circle') {
                return;
            }
            d3.select("#tip").remove();
            that.restoreBeforeCircle();
        });
    },
    restoreBeforeCircle:function(){
        if (this.beforedDomStore.length > 0) {
            var d3Dom = d3.select(this.beforedDomStore[0]);
            var className = d3Dom.attr('class');
            if (className.indexOf('selectedCircleHover')>-1) {
                d3Dom.attr('class', 'selectedCircle');
            } else {
                d3Dom.attr('class', 'singleCircle');
            }
            d3Dom.attr('flag-data', '0');
            this.beforedDomStore = [];
        }
    },
    showContentBox:function(currentDom){
        if (this.setBoxShowOrHide(currentDom)) {
            return;
        }
        var d3Dom = d3.select(currentDom);
        var cx = parseFloat(d3Dom.attr('cx'));
        var cy = parseFloat(d3Dom.attr('cy'));
        var r = parseFloat(d3Dom.attr('r'));

        var transform_str = $('.axis_x.axis').find("g:eq(5)").attr('transform');
        var middle = transform_str.substring(transform_str.indexOf('(') + 1, transform_str.indexOf(','));

        var stroke_width_range = 4;
        var box_padding = 10;
        var box_border = 1;
        box_width = 200 + box_padding * 2 + box_border * 2;
        box_height = 50 + box_padding * 2 + box_border * 2;
        var ratio = 0.1;

        var strArr = this.getBoxContentData(d3Dom);
        //Floating high box for 3 rows can be shown by default, if the content is more than 3 lines, increase processing
        var lineHeight=23;
        var lineSum=strArr.length;
        if(lineSum>3){
            box_height+=(lineSum-3)*lineHeight;
        }

        var xTipRect_start=cx-r;
        var yTipRect_start=cy - box_height;
        var xTipRect_end = cx - r + r * ratio;
        var yTipRect_end = cy - box_height - r - stroke_width_range;
        if (cx > middle) {
            xTipRect_start=cx - box_width + r-r*ratio;
            yTipRect_start=yTipRect_end +r;
            xTipRect_end = cx - box_width + r-r*ratio;
        }

        var tip = this.svg.append("g")
            .attr("id", "tip");

        var tipRect = tip.append("rect")
            .attr("x", xTipRect_start)
            .attr("y", yTipRect_start)
            .attr("width", box_width)
            .attr("height", box_height)
            .attr("class", "tipRect")
            .attr("transform", "translate(0,0)")
            .transition()
            .duration(100)
            .ease("linear")
            .attr("x",xTipRect_end)
            .attr("y",yTipRect_end);

        var tipText = tip.append("text")
            .attr("x", xTipRect_start + 11)
            .attr("y", yTipRect_start + 7)
            .attr("class", "tipText")
            .attr("transform", "translate(0,0)");


        tipText.selectAll("tspan")
            .data(strArr)
            .enter()
            .append("tspan")
            .attr("x", xTipRect_end + 11)
            .attr("dy", function (d, i) {
                if (i == 0) {
                    return '1em';
                }
                return '1.23em';
            })
            .attr('style', function (d, i) {
                if (i == strArr.length - 1) {
                    return '';
                }
                return 'font-weight: bold;';
            })
            .text(function (d) {
                return d;
            });

        tipText.transition()
            .duration(100)
            .ease("linear")
            .attr("x", xTipRect_end + 11)
            .attr("y", yTipRect_end + 7);
    },
    setBoxShowOrHide : function (currentDom) {
        d3.select("#tip").remove();
        var returnFlag = false;
        var currentCircle = d3.select(currentDom);
        var flag = currentCircle.attr('flag-data');
        var className = currentCircle.attr('class');

        this.restoreBeforeCircle();
        if (flag == '0') {
            currentCircle.attr('flag-data', '1');
            if (className.indexOf('selectedCircle')>-1 ) {
                currentCircle.attr('class', 'selectedCircleHover');
            } else {
                currentCircle.attr('class', 'singleCircleHover');
            }

            this.beforedDomStore.push(currentDom);
            returnFlag = false;
        } else {
            currentCircle.attr('flag-data', '0');
            returnFlag = true;
        }
        return returnFlag;
    },
    getBoxContentData : function (d3Dom) {
        var titleArr = d3Dom.attr('boxTile-data').split(' ');
        var size = d3Dom.attr('size-data');
        var tspanArr = [];

        //Line feed processing
        var str, lastIndexOf, lastLineStr;
        for (var i = 0; i < titleArr.length; i++) {
            str = titleArr[i];
            lastIndexOf = tspanArr.length - 1;
            lastLineStr = tspanArr[lastIndexOf];
            if (typeof lastLineStr != 'undefined') {
                var newLineStr = lastLineStr + ' ' + str;
                if (newLineStr.length <= this.lineMaxLength) {
                    tspanArr[lastIndexOf] = newLineStr;
                } else {
                    this.createNewLine(str, tspanArr);
                }
                continue;
            }
            //Handle the first word
            this.createNewLine(str, tspanArr);
        }
        tspanArr.push('Size: ' + size + ' M$');
        return tspanArr;
    },
    createNewLine :function (str, tspanArr) {
        if (str.length <= this.lineMaxLength) {
            tspanArr.push(str);
        } else {
            tspanArr = this.longWordHandle(str, tspanArr);
        }
    },
    longWordHandle : function (str, tspanArr) {
        var newMaxLength = this.lineMaxLength - 1;
        var strLength = str.length;
        if (strLength > newMaxLength) {
            str = str.substring(0, newMaxLength);
            tspanArr.push(str);
            return this.longWordHandle(str, tspanArr, this.lineMaxLength);
        }
        tspanArr.push(str);
        return tspanArr;
    }


}
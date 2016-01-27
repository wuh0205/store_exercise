/**
 * Created by wuh on 12/16/2015.
 */
/**
 * Created by wuh on 12/11/2015.
 */
function BarAndLineChart(options){
    var defaultOptions = {
        container: "#chart",
        margin: {top: 20, left: 50, bottom: 50, right: 20},
        spacing: 0.5,
        yFormat: function(d) { return d; },
        xTickSize: function(base) { return 6; },
        yTickSize: function(base) { return 6; },
        xTicks: 5,
        yTicks: 5,
        xTickPadding: 5,
        yTickPadding: 5,
        yAxisTranslate: function(base) { return "translate(0,0)"; },
        xAxisTranslate: function(base) { return "translate(0,"+base.height+")"; },
        xTickFormat: function(d) { return d; },
        yTickFormat: function(d) { return d; },
        showBrokenLine:true,
        showTooltip:true,
        beforeDomStore:[],
        tooltipHtmlText:function(d, element,base){
            var title="",
                contentText="",
                val,
                eventNodeName=d3.event.srcElement.nodeName,
                tipDataType=base.options.tipDataType;
            if(eventNodeName == 'circle'){
                title="Benchmarked median";
                val= d.yDot;
            }else{
                title=base.options.tipTitle;
                val= d.y;
            }
            contentText=base.options.tipContent;
            if(tipDataType==="x"){
                val=val.toString()+"x";
            }else{
                val=23
                //val=appFunc.commafy(val*100,1);
            }

            return "<div> <b>"+title+"</b> <br>"+contentText+": "+val+" </div>";
        },
        tooltipOnClick:function(d, element, base){
            base.restoreBeforeElementStyle();
            base.options.beforeDomStore.push(element);
            var xElement,
                yElement,
                eventNodeName=d3.event.srcElement.nodeName;
            if(eventNodeName == 'circle'){
                xElement=parseInt($(element).attr("cx"));
                yElement=parseInt($(element).attr("cy"));
                d3.select(element).attr('class','dotHover');
            }else{
                xElement=parseInt($(element).attr("x"));
                yElement=parseInt($(element).attr("y"));

                d3.select(element).attr('class','barHover');
            }
            var xPosition=xElement+base.options.margin.left+3;
            var yPosition = base.yScale.range()[0]-yElement+base.options.margin.bottom+2;

            d3.select(base.options.container+" .tooltip")
                .style("left", xPosition + "px")
                .style("bottom", yPosition + "px")
                .html(base.options.tooltipHtmlText(d, element,base));
            $(base.options.container+" .tooltip").show();
        },
        spaceClickHandle:function(base){
            base.restoreBeforeElementStyle();
        }
    };
    if (typeof options == 'object') this.options = $.extend(defaultOptions, options);
    else this.options = defaultOptions;
}

BarAndLineChart.prototype={
    constructor: BarAndLineChart,
    prepare: function() {
        this.margin = this.options.margin;
        this.width = $(this.options.container).width() - this.margin.left - this.margin.right;
        this.height = $(this.options.container).height() - this.margin.top - this.margin.bottom;

        if (this.options.showTooltip) {
            $(this.options.container).append("<div class='tooltip' style='display: none;' />");
            this.tooltipWidth = $(this.options.container+" .tooltip").outerWidth();
        }

        this.svg = d3.select(this.options.container)
            .append("svg:svg")
            .attr("width", this.width+this.margin.left+this.margin.right)
            .attr("height", this.height+this.margin.top+this.margin.bottom)
            .append("svg:g").attr("transform", "translate("+this.margin.left+","+this.margin.top+")");
    },
    prepareScales: function() {
        var base = this;
        this.xScale = d3.scale.ordinal().rangePoints([0, this.width], this.options.spacing);
        this.yScale = d3.scale.linear().range([this.height, 0]);
        //if (this.options.showRuler) this.prepareAxes();

        this.yRangArr=base.dataset.map(function(item){
            return item.y;
        });
        if(this.options.showBrokenLine){
            this.yRangArr=this.yRangArr.concat(base.dataset.map(function(item){
                return item.yDot;
            }));
        }
        //base.xScale.domain(base.dataset.map(function(d){return d.x}));
        //base.xScale.domain(d3.range(this.dataset.length));
        ////base.yScale.domain(d3.extent(this.yRangArr)).nice();
        //base.yScale.domain([0,d3.max(this.yRangArr)]);

        base.xScale.domain(base.dataset.map(function(d){return d.x}));
        var minValues = [
            d3.min(base.dataset, function (d) { return d.y})*1.2, // 20% padding bottom
            d3.max(base.dataset, function (d) { return d.y})*1.2 // 20% padding top
        ];
        var multiplicator = (minValues[1]-minValues[0])*0.05;
        base.yScale.domain([minValues[0]-multiplicator,minValues[1]+multiplicator]);

    },
    prepareAxes: function() {
        var base = this;
        this.xAxis = d3.svg.axis().scale(this.xScale).ticks(this.options.xTicks).tickSize(this.options.xTickSize(base)).tickPadding(this.options.xTickPadding).tickFormat(this.options.xTickFormat).orient("bottom");
        this.yAxis = d3.svg.axis().scale(this.yScale).ticks(this.options.yTicks).tickSize(this.options.yTickSize(base)).tickPadding(this.options.yTickPadding).tickFormat(this.options.yTickFormat).orient("left");
    },
    renderAxes:function(){
        var base = this;
        var xG=base.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", base.options.xAxisTranslate(base))
            .call(base.xAxis);

        var yG=base.svg.append("g")
            .attr("class", "y axis")
            .attr("transform", base.options.yAxisTranslate(base))
            .call(base.yAxis);

        xG.selectAll('text').data(base.dataset).text(function(d){
            return d.x;
        });

        yG.selectAll('.tick')
            .append("line")
            .attr('x1',base.width)
            .attr('style',function(d,i){
                if(i==0) return "fill: none;stroke: black;shape-rendering: crispEdges;";
                else return "fill: none;stroke: rgb(187, 187, 187);shape-rendering: crispEdges;";
            });
    },
    prepareRectItem:function(){
        var base=this;
        var rectG=base.svg.append("g")
            .attr("class","g_bar");
        this.itemRect = rectG.selectAll("rect")
            .data(base.dataset);
    },
    itemRectEnter:function(){
        var base=this;
        base.itemRect
            .enter().append("rect")
            .attr("class", "bar")
            //.attr("x", function(d,i) {return base.xScale(d.x); })
            .attr("x", function(d,i) {return base.xScale(d.x); })
            .attr("width", base.xScale.rangeBand())
            .attr("y", function(d) { return  base.yScale(d.y); })
            .attr("height", function(d) { return Math.abs(base.yScale(0)-base.yScale(d.y)); })
            .attr("rx",function(d) { return 2; })
            .attr("ry",function(d){return 2;});

        //var base = this;
        //base.item
        //    .enter().append("rect")
        //    .attr("x", function(d) { return base.xScale(d.x); })
        //    .attr("original-x", function(d) { return d.x; })
        //    .attr("original-y", function(d) { return d.y; })
        //    .attr("y", function(d) { return base.height; })
        //    .attr("width", base.x.rangeBand())
        //    .attr("height", 0)
        //    .attr("class", "rect")
        //    .transition().delay(300).duration(500).ease("cubic-in-out")
        //    .attr("height", function(d) { return base.y(0)-base.y(d.size); })
        //    .attr("y", function(d) { return base.y(d.y0); });
    },
    drawBrokenLine:function(){
        var base=this;
        base.rectWidth=base.xScale.rangeBand();
        base.basicTranslate='translate(' + base.margin.left + ',' + (base.margin.top)+ ')';

        //var circleCss='fill: rgb(0, 63, 105);stroke: black;stroke-width: 2px;';
        //var pathCss='stroke: rgb(0, 25, 52);stroke-width: 4px;fill: none;';

        var line = d3.svg.line()
            .x(function (d, i) {
                return base.xScale(i)+base.rectWidth/2;
            })
            .y(function (d) {
                return base.yScale(d.yDot);
            });
        var brokenLineG=this.svg.append('g')
            .attr("class","g_brokenLine");

        brokenLineG.append("path")
            .attr("d", line(base.dataset))
            //.attr("style",pathCss);
            .attr("class","linePath");

        base.itemCircle=brokenLineG.selectAll("circle")
            .data(base.dataset)
            .enter()
            .append("circle")
            .attr("cx", function (d, i) {
                return base.xScale(i)+base.rectWidth/2;
            })
            .attr("cy", function (d) {
                return base.yScale(d.yDot);
            })
            .attr("r", 8)
            //.attr("style",circleCss);
            .attr("class","dot");

    },
    tooltipRender:function(element,base){
        var base = this,
            type=base.options.tipEventType || 'click';
        switch (type){
            case "click":
                d3.select(base.options.container).on('click', function(){
                    var eventNodeName=d3.event.srcElement.nodeName;
                    if(eventNodeName=='rect'||eventNodeName=="circle"){
                        return;
                    }
                    if(typeof base.options.spaceClickHandle !='undefined' && base.options.spaceClickHandle instanceof Function){
                        base.options.spaceClickHandle(base);
                    }
                    $(base.options.container+" .tooltip").hide();
                });
                base.itemRect.on("click",function(d){
                    base.options.tooltipOnClick(d, this, base);
                });
                if(base.options.showBrokenLine){
                    base.itemCircle.on("click",function(d){
                        base.options.tooltipOnClick(d, this, base);
                    });
                }
                break ;
        }

    },
    restoreBeforeElementStyle:function(){
        var beforeDomStore=this.options.beforeDomStore;
        if (beforeDomStore.length > 0) {
            var d3Dom = d3.select(beforeDomStore[0]);
            var className = d3Dom.attr('class');
            var reg=/(.*)Hover/g;
            if (reg.test(className)) {
                d3Dom.attr('class', RegExp['$1']);
            } else {
                d3Dom.attr('class',className+"Hover");
            }
            this.options.beforeDomStore = [];
        }
    },
    render:function(){
        this.dataset=this.options.data;
        this.prepare();
        this.prepareScales();
        this.prepareAxes();
        this.renderAxes();

        this.prepareRectItem();
        this.itemRectEnter();
        if(this.options.showBrokenLine)this.drawBrokenLine();
        if(this.options.showTooltip)this.tooltipRender();

    }

};
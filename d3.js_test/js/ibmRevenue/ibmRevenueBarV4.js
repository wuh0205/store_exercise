/**
 * Created by wuh on 10/28/2015.
 */
function IBMRevenueBar(options) {
    if (!(this instanceof IBMRevenueBar)) throw new TypeError("D3StackedBar constructor cannot be called as a function.");
    var defaultOptions = {
        container: "#stackedbar",
        spacing: 0.2,
        verticalText: '$M',
        data:[],
        dataStore:[],
        beforeDomStore:[],
        showGroup:false,
        showLegend:false,
        showRuler: true,
        showHorizontalGrid: true,
        displayTable: false,
        colors:['rgb(127, 148, 182)','rgb(45, 71, 112)','rgb(168, 196, 240)','rgb(65, 103, 163)','rgb(96, 152, 240)'],
        tipEventType:"click",//mouse_over_out, click, click_timeout
        tooltipText:function(d, element,base) {
            var year,subObj,currentKey;
            if(base.options.showGroup){
                year=$(element).parent('g').attr('original-key');
                currentKey=d.x;
            }else{
                year=d.x;
                currentKey=$(element).parent('g').attr('original-key');
            }
            subObj=base.options.tipData[year];
            return base.options.tipHtmlPackage(subObj,currentKey);
        },
        tipHtmlPackage:function(tipSubObj,currentKey){
            var contentHtml = '',template,name,money,selectStyle="color: #0000BB";
            for(var i in tipSubObj){
                name = i;
                money = tipSubObj[i];
                if(name=='IBMtotal'||parseFloat(money)==0){
                    continue;
                }
                name = i;
                money = tipSubObj[i];
                template="<tr> <td>"+name+":</td> <td style=\"text-align:right;\" align=\"right\">"+money+"  $M</td> </tr>";
                if(currentKey==name){
                    template="<tr> <td> <span style=\""+selectStyle+"\"> <b><i>"+name+":</i></b> </span> </td> <td style=\"text-align:right;\" align=\"right\"> <span style=\""+selectStyle+"\"> <b><i>"+money+"  $M</i></b> </span> </td> </tr>";
                }
                contentHtml+=template;
            }
            return "<div class=\"atuoScroll\"><table style=\"min-width:140px;border-collapse: collapse;\"> <tbody></tbody> <thead> <tr> <th colspan=\"2\" style=\"text-align:left;\" align=\"left\"> <u>IBM Revenue</u> </th> </tr> </thead> <tfoot> <tr style=\"border-top: 1px solid silver;\"> <td style=\"border-top:solid 1px black;\">IBM Total:</td> <td style=\"text-align:right; border-top:solid 1px black;\" align=\"right\">"+tipSubObj['IBMtotal']+"  $M</td> </tr> </tfoot> <tbody> "+contentHtml+" </tbody> </table></div>";
        },
        tooltipOnClick: function (d, element, base) {
            var xPosition,yPosition;
            if(base.options.showGroup){
                var transform,xTranslate;
                transform=$(element).parent('g').attr('transform');
                xTranslate=transform.substring(transform.indexOf('(')+1,transform.indexOf(','));
                xPosition=parseInt($(element).attr("x"))+parseInt(xTranslate)+base.options.margin.left-base.tooltipWidth/2+parseInt($(element).attr("width"))/2;
            }else{
                xPosition = parseInt($(element).attr("x"))+base.options.margin.left+parseInt($(element).attr("width"))/2-base.tooltipWidth/2;
            }
            yPosition = base.y.range()[0]-parseInt($(element).attr("y"))+base.options.margin.bottom+5;
            d3.select(base.options.container+" .tooltip")
                .style("left", xPosition + "px")
                .style("bottom", yPosition + "px")
                .html(base.options.tooltipText(d, element,base));


            base.restoreBeforeRect();
            d3.select(element).attr('class','rectHover');
            base.options.beforeDomStore.push(element);
            $(base.options.container+" .tooltip").show();
        },
        spaceClickHandle:function(base){
            base.restoreBeforeRect();
        }
    };

    if (typeof options == 'object') this.options = $.extend(defaultOptions, options);
    else this.options = defaultOptions;
    D3Core.call(this, this.options);

    this.initData();
    this.color = d3.scale.ordinal().range(this.options.colors);
}

inheritPrototype(IBMRevenueBar, D3Core);

IBMRevenueBar.prototype.show=function(){
    this.destroy();
    //this.initData();
    if(arguments.length>0&&arguments[0]=='group'){
        this.options.showGroup=true;
        this.options.data=this.options.groupData;
    }else{
        this.options.showGroup=false;
        this.options.data=this.options.normalData;
    }

    D3Core.prototype.show.apply(this);
}

IBMRevenueBar.prototype.render = function() {
    D3Core.prototype.render.apply(this);
    if (this.options.verticalText!=null && this.options.data.length>0) this.showVerticalText();
}


IBMRevenueBar.prototype.prepareScales = function() {
    var base = this;

    this.x = d3.scale.ordinal().rangeRoundBands([0, this.width], this.options.spacing);
    this.y = d3.scale.linear().range([this.height, 0]);

    if (this.options.showRuler) this.prepareAxes();

    if(base.options.showGroup){
        var x_1 = d3.scale.ordinal();
        base.x_1=x_1;

        base.x.domain(base.dataset.map(function(d) { return d.key; }));
        base.y.domain([0, d3.max(base.dataset, function(d) { return d3.max(d.values, function(d) { return d.y; }); })]);

        var ageNames=base.options.normalData.map(function(element,index){
            return element.key;
        });
        base.x_1.domain(ageNames).rangeRoundBands([0, base.x.rangeBand()]);
        return;
    }

    this.barStack = function(data) {
        var i = base.x.domain().length;
        while (i--) {
            var posBase = 0, negBase = 0;
            data.forEach(function(category) {
                var item = category.values[i]
                item.size = Math.abs(item.y);
                if (item.y < 0) {
                    item.y0 = negBase;
                    negBase -= item.size;
                } else {
                    posBase += item.size;
                    item.y0 = posBase;
                }
            });
        }
        data.extent = d3.extent(d3.merge(d3.merge(data.map(function(category) {
            return category.values.map(function(item) {
                return [item.y0, item.y0 - item.size]
            })
        }))));
        return data;
    };
    base.x.domain(base.dataset[0].values.map(function(d) { return d.x; }));
    base.categories = base.barStack(base.dataset);
    base.y.domain(base.dataset.extent);
};

IBMRevenueBar.prototype.categoryEnter=function() {
    var base = this;
    var category=base.category
        .enter().append("g")
        .attr("class", "category")
        .attr("original-key", function(d, i) { return d.key; });
    if(base.options.showGroup)category.attr("transform", function(d) {return "translate(" + base.x(d.key) + ",0)"; })
};

IBMRevenueBar.prototype.prepareItem = function() {
    this.item = this.category.selectAll("rect")
        .data(function(d) { return d.values; });
};


IBMRevenueBar.prototype.itemEnter = function() {
    var base = this;
    if(base.options.showGroup){
        base.item
            .enter().append("rect")
            .attr("x", function(d) {return base.x_1(d.x); })
            .attr("original-x", function(d) { return d.x; })
            .attr("original-y", function(d) { return d.y; })
            .attr("y", function(d) { return base.height; })
            .attr("width", base.x_1.rangeBand())
            .attr("height", 0)
            .attr("class", "rect")
            .transition().delay(300).duration(500).ease("cubic-in-out")
            .attr("height", function(d) { return base.y(0) - base.y(d.y); })
            .attr("y", function(d) { return base.y(d.y); })
            .attr("rx",function(d) { return 2; })
            .attr("ry",function(d){return 2;})
            .attr("style",function(d, i) {
                var color=base.color(d.x);
                return "fill:"+color+";stroke:"+color+";stroke-width: 1px;";
            });
        return;
    }
    base.item
        .enter().append("rect")
        .attr("x", function(d) { return base.x(d.x); })
        .attr("original-x", function(d) { return d.x; })
        .attr("original-y", function(d) { return d.y; })
        .attr("y", function(d) { return base.height; })
        .attr("width", base.x.rangeBand())
        .attr("height", 0)
        .attr("class", "rect")
        .transition().delay(300).duration(500).ease("cubic-in-out")
        .attr("height", function(d) { return base.y(0)-base.y(d.size); })
        .attr("y", function(d) { return base.y(d.y0); })
        .attr("rx",function(d) { return 2; })
        .attr("ry",function(d){return 2;})
        .attr("style",function(d, i) {
            var color=base.color($(this).parent('g').attr('original-key'));
            return "fill:"+color+";stroke:"+color+";stroke-width: 1px;";
        });

};

IBMRevenueBar.prototype.showVerticalText = function() {
    this.svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(this.options.verticalText)
};

IBMRevenueBar.prototype.itemUpdate=function(){

};
/*
 * Generate 'normalData', 'groupData', 'tipData' three kinds of data formats
 *   normalData : For normal bar chart
 *   groupData  : For group bar chart
 *   tipData    : For tip
 * */
IBMRevenueBar.prototype.initData=function(){
    var base=this;
    this.options.dataStore.sort(function(num1,num2){
        return parseInt(num1.year)-parseInt(num2.year);
    });
    var data=this.options.dataStore.filter(function(e){
            return e;
        });

    if(!(data instanceof Array)||data.length<=0) throw new TypeError("Initialization data can not be empty.");
    var data_group_arr=[],data_normal_arr=[],tipData={},data_normal={},
        groupObj,groupValues,
        normalObj,normalValues,
        groupTemp,normalTemp;
    var year,elementVal;
    data.forEach(function(element,index){
        //init
        year=element.year;
        groupObj={};
        groupValues=[];
        groupObj['key']=year;
        tipData[year]={};

        for(var i in element){
            //init
            elementVal=element[i];
            groupTemp={};
            normalTemp={};
            normalObj={};
            normalValues=[];

            //filter
            if(i=='year'){
                continue;
            }else if(i=='IBMtotal'){
                tipData[year][i]=base.thousandSeparator(elementVal);
                continue;
            }
            //dispose group
            groupTemp['x']=i;
            groupTemp['y']=elementVal;
            groupValues.push(groupTemp);

            //dispose normal
            normalObj['key']=i;
            normalTemp['x']=year;
            normalTemp['y']=elementVal;
            if(data_normal[i]){
                var arr=data_normal[i]['values'];
                arr.push(normalTemp);
            }else{
                normalValues.push(normalTemp);
                normalObj['values']=normalValues;
                data_normal[i]=normalObj;
            }

            //dispose tip
            tipData[year][i]=base.thousandSeparator(elementVal);
        }
        groupObj['values']=groupValues;
        data_group_arr.push(groupObj);

    });
    for(var j in data_normal){
        data_normal_arr.push(data_normal[j]);
    }
    this.options.normalData=data_normal_arr;
    this.options.groupData=data_group_arr;
    this.options.tipData=tipData;
    console.log(data_normal_arr);

};

IBMRevenueBar.prototype.destroy=function(){
    if(this.dataset){
        delete this.dataset;
    }
    $(this.options.container).empty();
};

IBMRevenueBar.prototype.thousandSeparator=function(num) {
    var d=arguments[1]||3,
        re = /(-?\d+)(\d{3})/;
    num = num.toFixed(d) + "";
    while (re.test(num)) {
        num = num.replace(re, "$1,$2");
    }
    return parseFloat(num.replace(/[0]+$/g, ""));
};
/*
 *  Rect restore has been clicked
 * */
IBMRevenueBar.prototype.restoreBeforeRect=function(){
    var beforeDomStore=this.options.beforeDomStore;
    if (beforeDomStore.length > 0) {
        var d3Dom = d3.select(beforeDomStore[0]);
        var className = d3Dom.attr('class');
        if (className.indexOf('rectHover')>-1) {
            d3Dom.attr('class', 'rect');
        } else {
            d3Dom.attr('class', 'rectHover');
        }
        this.options.beforeDomStore = [];
    }
};




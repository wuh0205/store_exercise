/**
 * Created by wuh on 9/10/2015.
 */
function RectTipBox(setting) {
    var box_padding = 10,
        box_border = 1;
    var _box_width =  268 + box_padding * 2 + box_border * 2,
        _box_height = 50 + box_padding * 2 + box_border * 2;
    var beforedDomStore = [];
    var lineMaxLength=36;
    var gTipId=setting['tipId']?setting['tipId']:'tip';
    var svg=setting['svg'];
    var rect_translate=setting['rectTranslate'];
    var xMidline=setting['xMidline']?setting['xMidline']:0;
    var yMidline=setting['yMidline']?setting['yMidline']:0;
    var companyNameArr =setting['companyNameArr']?setting['companyNameArr']:[];
    var tipDetailStore =setting['tipDetailStore']?setting['tipDetailStore']:[];
    var tipValueStore =setting['tipValueStore']?setting['tipValueStore']:[];

    var tipRectStyle="fill: rgba(255, 255, 255, 0.85098);stroke-width: 1px;stroke: silver;";

    svg.selectAll("circle").attr("flag-data", "0");

    var restoreBeforeCircle = function () {
        if (beforedDomStore.length > 0) {
            var d3Dom = d3.select(beforedDomStore[0]);
            //var className = d3Dom.attr('class');
            //if (className.indexOf('selectedCircleHover') > -1) {
            //    d3Dom.attr('class', 'selectedCircle');
            //} else {
            //    d3Dom.attr('class', 'singleCircle');
            //}
            d3Dom.attr('flag-data', '0');
            beforedDomStore = [];
        }
    };

    var setBoxShowOrHide = function (currentDom) {
        d3.select("#"+gTipId).remove();
        var returnFlag = false;
        var currentCircle = d3.select(currentDom);
        var flag = currentCircle.attr('flag-data');
        //var className = currentCircle.attr('class');

        restoreBeforeCircle();
        if (flag == '0') {
            currentCircle.attr('flag-data', '1');
            //if (className.indexOf('selectedCircle') > -1) {
            //    currentCircle.attr('class', 'selectedCircleHover');
            //} else {
            //    currentCircle.attr('class', 'singleCircleHover');
            //}
            beforedDomStore.push(currentDom);
            returnFlag = false;
        } else {
            currentCircle.attr('flag-data', '0');
            returnFlag = true;
        }
        return returnFlag;
    };

    var showContentBox = function (currentDom) {
        if (setBoxShowOrHide(currentDom)) {
            return;
        }
        var d3Dom = d3.select(currentDom);
        var cx = parseFloat(d3Dom.attr('cx'));
        var cy = parseFloat(d3Dom.attr('cy'));
        var r = parseFloat(d3Dom.attr('r'));
        var rectIndex=d3Dom.attr('data-rectIndex');

        var box_height=_box_height;
        var box_width=_box_width;
        var stroke_width_range = 4;
        var ratio = 0.1;

        var box=getBoxContentData(d3Dom);
        if(!box['checkFlag']){
            return;
        }
        var strArr =box['tspanArr'];
        var addWidthSum=box['addWidthSum'];
        box_width+=addWidthSum;

        //???????????3????,??????3?,?????
        var lineHeight = 23;
        var lineSum = strArr.length;
        if (lineSum > 3) {
            box_height += (lineSum - 3) * lineHeight;
        }

        //Calculate the coordinate
        var xTipRect_start = cx - r;
        var yTipRect_start = cy - box_height;
        var xTipRect_end = cx - r + r * ratio;
        var yTipRect_end = cy - box_height - r - stroke_width_range;
        if (cx > xMidline) {
            xTipRect_start = cx - box_width + r - r * ratio;
            yTipRect_start = yTipRect_end + r;
            xTipRect_end = cx - box_width + r - r * ratio;
        }

        if(cy<yMidline){
            yTipRect_start=yTipRect_end+r+box_height+stroke_width_range;
            yTipRect_end=yTipRect_end+r*2+box_height+stroke_width_range;
        }

        var tip = svg.append("g")
            .attr("id", gTipId);

        var tipRect = tip.append("rect")
            .attr("x", xTipRect_start)
            .attr("y", yTipRect_start)
            .attr("width", box_width)
            .attr("height", box_height)
            .attr("style", tipRectStyle)
            .attr("transform", rect_translate)
            .transition()
            .duration(100)
            .ease("linear")
            .attr("x", xTipRect_end)
            .attr("y", yTipRect_end);

        var xTipTextOffset=11;
        var yTipTextOffset=7;
        var tipText = tip.append("text")
            .attr("x", xTipRect_start + xTipTextOffset)
            .attr("y", yTipRect_start + yTipTextOffset)
            .attr("class", "tipText")
            .attr("transform", rect_translate);

        tipText.selectAll("tspan")
            .data(strArr)
            .enter()
            .append("tspan")
            .attr("x", xTipRect_end + xTipTextOffset)
            .attr("dy", function (d, i) {
                if (i == 0) {
                    return '1em';
                }else if(i==1){
                    return '1.4em';
                }
                return '1.23em';
            })
            .attr('style', function (d, i) {
                if (i == 0) {
                    return 'font-weight: bold;';
                }
                if(i-1==rectIndex){//bule font
                    return 'fill: #0000BB;font-weight: bold;';
                }
                return '';
            })
            .text(function (d) {
                return d;
            });

        tipText.transition()
            .duration(100)
            .ease("linear")
            .attr("x", xTipRect_end + xTipTextOffset)
            .attr("y", yTipRect_end + yTipTextOffset);

        //Dividing line handle
        var yLineOffset=22;
        var lineWidthOffset=20;
        var xRectTranslate=rect_translate.substring(rect_translate.indexOf('(')+1,rect_translate.indexOf(','));
        var yRectTranslate=rect_translate.substring(rect_translate.indexOf(',')+1,rect_translate.indexOf(')'));
        var xLineTslt=parseInt(xRectTranslate)+(xTipRect_end + xTipTextOffset);
        var yLineTslt=parseInt(yRectTranslate)+(yTipRect_end + yTipTextOffset)+yLineOffset;
        tip.append('line')
            .attr('x2',box_width-lineWidthOffset)
            .attr("transform", "translate("+xLineTslt+","+yLineTslt+")")
            .attr('style','fill: none;stroke: rgb(77, 72, 72);shape-rendering:crispEdges;');

    };

    var getBoxContentData = function (d3Dom) {

        var compyIndex=d3Dom.attr('data-compyIndex');
        var tspanArr = [];
        var companyName=companyNameArr[compyIndex];
        var tipDetailArr=tipDetailStore;
        var tipValueArr=tipValueStore[compyIndex];
        if(typeof tipDetailArr=='undefined'&&!tipDetailArr){
            return {checkFlag:false};
        }
        tspanArr.push(companyName);

        var lineStr,currentLength,currentMaxLength=0,addWidth=9,addWidthSum=0;

        for(var i=0;i<tipDetailArr.length;i++){
            lineStr=tipDetailArr[i]+':  '+tipValueArr[i];
            currentLength=lineStr.length;
            if(currentLength>currentMaxLength){
                currentMaxLength=currentLength;
            }
            tspanArr.push(lineStr);
        }
        if(currentMaxLength>lineMaxLength){
            addWidthSum=(currentMaxLength-lineMaxLength)*addWidth;
        }
        return {addWidthSum:addWidthSum,tspanArr:tspanArr,checkFlag:true};
    };

    this.listening = function () {
        svg.selectAll("circle").on('click', function () {
            showContentBox(this);
        });

        svg.on('click', function () {
            if (d3.event.srcElement.nodeName == 'circle') {
                return;
            }
            d3.select("#"+gTipId).remove();
            restoreBeforeCircle();
        });
    }

}
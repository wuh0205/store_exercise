/**
 * Created by wuh on 9/10/2015.
 */
function RectTipBox(setting) {
    var box_padding = 10,
        box_border = 1;
    var _box_width =  268 + box_padding * 2 + box_border * 2,
        _box_height = 50 + box_padding * 2 + box_border * 2;
    var beforedDomStore = [];
    var gTipId=setting['tipId']?setting['tipId']:'tip';
    var svg=setting['svg'];
    var rect_translate=setting['rectTranslate'];
    var xMidline=setting['xMidline']?setting['xMidline']:0;
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

        var strArr = getBoxContentData(d3Dom);
        //???????????3????,??????3?,?????
        var lineHeight = 23;
        var lineSum = strArr.length;
        if (lineSum > 3) {
            box_height += (lineSum - 3) * lineHeight;
        }

        //var strArr=['Test','Test','Test'];

        var xTipRect_start = cx - r;
        var yTipRect_start = cy - box_height;
        var xTipRect_end = cx - r + r * ratio;
        var yTipRect_end = cy - box_height - r - stroke_width_range;
        if (cx > xMidline) {
            xTipRect_start = cx - box_width + r - r * ratio;
            yTipRect_start = yTipRect_end + r;
            xTipRect_end = cx - box_width + r - r * ratio;
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

        var tipText = tip.append("text")
            .attr("x", xTipRect_start + 11)
            .attr("y", yTipRect_start + 7)
            .attr("class", "tipText")
            .attr("transform", rect_translate);

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
            .attr("x", xTipRect_end + 11)
            .attr("y", yTipRect_end + 7);

    };

    var getBoxContentData = function (d3Dom) {
        //var titleArr = d3Dom.attr('boxTile-data').split(' ');
        //var size = d3Dom.attr('size-data');

        var compyIndex=d3Dom.attr('data-compyIndex');
        var tspanArr = [];
        var companyName=companyNameArr[compyIndex];
        var tipDetailArr=tipDetailStore[compyIndex];
        var tipValueArr=tipValueStore[compyIndex];

        tspanArr.push(companyName);
        var lineStr;
        for(var i=0;i<tipDetailArr.length;i++){
            lineStr=tipDetailArr[i]+':  '+tipValueArr[i];
            tspanArr.push(lineStr);
        }


        return tspanArr;
    };

    var createNewLine = function (str, tspanArr) {
        if (str.length <= lineMaxLength) {
            tspanArr.push(str);
        } else {
            tspanArr = longWordHandle(str, tspanArr);
        }
    }

    /*
     * ????????
     * */
    var longWordHandle = function (str, tspanArr) {
        var newMaxLength = lineMaxLength - 1;
        var strLength = str.length;
        if (strLength > newMaxLength) {
            str = str.substring(0, newMaxLength);
            tspanArr.push(str);
            return longWordHandle(str, tspanArr, lineMaxLength);
        }
        tspanArr.push(str);
        return tspanArr;
    }

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
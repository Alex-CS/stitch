/**
 * Created by alex on 4/7/15.
 */

(function(){
    var elem = document.getElementById('canvas'),
        params = {width: 800, height: 800},
        two = new Two(params).appendTo(elem),
        pi = Math.PI,
        defaults = {
            resolution: 2,
            layers: 1,
            width: two.width,
            height: two.height
        };
    window.curve = two.makeGroup();

    function test(){
        drawRectCurve(24, 4, two.width/2, two.height/2)
    }

    window.drawRectCurve = function(resolution, layerCount, width, height) {
        // TODO: explain
        // TODO: figure out an API for color properties
        resolution = resolution || defaults.resolution;
        layerCount = layerCount || defaults.layers;
        width = width || defaults.width;
        height = height || defaults.height;

        var spine1 = two.makeLine(0, 0, width, 0),
            spine2 = two.makeLine(0, 0, 0, height),
            spine3 = two.makeLine(width, height, 0, height),
            spine4 = two.makeLine(width, height, width, 0),
            box = [spine1, spine2, spine3, spine4];
        curve.add(spine1, spine2, spine3, spine4);

        for (var i = 0; i < layerCount; i++) {
            var layer = stitchContinuous(box, resolution, resolution + i * layerCount);
            layer.stroke = rgba(0, 127 + i * 16, 255 - i * 32, 1.0 - i / 8);
            layer.addTo(curve);
        }
        two.render();
    };

    function Color(red, green, blue, alpha){
        this.red = red;
        this.grn = green;
        this.blu = blue;
        this.alph = alpha;
        this.rgbaStr = function(){
            return rgba(this.red, this.grn, this.blu, this.alph)
        };
    }

    function rgba(r, g, b, a){
        return "rgba("+ r + "," + g + "," + b + "," + a + ")"
    }

    function pointStr(vector){
        return "("+vector.x+","+vector.y+")";
    }

    function drawLine(v1, v2){
        // wrapper function to make a line between a pair
        // of Two.Vector points (or anything else with x, y properties)
        // TODO: extend Two with this
        return two.makeLine(v1.x, v1.y, v2.x, v2.y);
    }

    function decenter(point, trans){
        // Take a Two.Vector positioned relative to center,
        // and change it to be relative to top-left corner
        // TODO: extend Two.Vector with this
        return point.clone().set(trans.x - point.x, trans.y + point.y);
    }

    function getPoints(line, resolution){
        // Returns an array of `resolution` points
        // evenly spaced along `line`.
        // if `reverse`, get the points in reverse order.
        // TODO: test with polygons
        // TODO: extend Two.Polygon with this
        var vertices = line.vertices,
            translation = line.translation,
            points = [];
        for(var i=0; i<vertices.length; i++){
            var vertexA = vertices[i],
                vertexB = vertices[(i+1) % vertices.length],
                rangeX = vertexB.x - vertexA.x,
                rangeY = vertexB.y - vertexA.y,
                stepX = rangeX / resolution,
                stepY = rangeY / resolution;
            // hack to avoid repetition
            if (vertexB === vertices[0] && vertices.length <= 2){
                continue;
            }

            for(var stepNum=0; stepNum <= resolution; stepNum++){
                var curX = vertexA.x + stepNum * stepX,
                    curY = vertexA.y + stepNum * stepY,
                    curPoint = decenter(new Two.Anchor(curX, curY), translation);
                points.push(curPoint);
            }
        }
        return points;

    }

    function _connectDots(arr1, arr2) {
        // Given 2 equal-sized arrays of points,
        // connect them (draw lines) in order.
        var group = new Two.Group(),
            len = arr1.length;
        if (arr1.length != arr2.length) {
            return group;
        }
        for(var i=0; i<len; i++){
            var line = drawLine(arr1[i], arr2[i]);
            line.addTo(group);
        }
        return group;
    }

    function stitch(line1, line2, resolution){
        // "Stitch" a curve between the two lines given,
        // with `resolution` lines in the curve.
        var line1Points = getPoints(line1, resolution),
            line2Points = getPoints(line2, resolution),
            stitches = _followCurve(line1Points.concat(line2Points), resolution+2);//_connectDots(line1Points, line2Points);

        return stitches;
    }

    function _followCurve(points, separation){
        // Takes an array of points and connects each to
        // the one `separation` ahead of it.
        var group = new Two.Group(),
            len = points.length;
        for(var i=0; i+separation<len; i++){
            var pointA = points[i],
                pointB = points[i+separation],
                line = drawLine(pointA, pointB);
            line.addTo(group);
        }
        return group;
    }

    function stitchContinuous(lines, resolution, separation){
        // "Stitch" a continuous curve between the list of lines given,
        // with `resolution` points per line, and a given number of
        // points of separation
        var points = getPoints(lines[0], resolution),
            stitches;
            for(var i = 0; i<lines.length; i++){
                var newPoints = getPoints(lines[(i+1)%lines.length], resolution);
                if (points.length && points[points.length-1].equals(newPoints[0])){
                    newPoints.shift();
                }
                points = points.concat(newPoints);
            }
        separation = separation || resolution + 1;
        stitches = _followCurve(points, separation);//_connectDots(line1Points, line2Points);

        return stitches;
    }

    test();
})();
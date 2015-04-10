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
            layerCount: 1,
            layerSepFactor: 1,
            width: two.width,
            height: two.height,
            center: {
                x: two.width/2,
                y: two.height/2
            }
        };
    window.curve = two.makeGroup();

    function test(){
        drawRectCurve(64, 1, 32);
        //drawStarCurve(4, 32);
        two.render();
    }

    function p(x, y){
        return {
            x: x,
            y: y
        }
    }

    window.drawRectCurve = function(resolution, layerCount, layerSepFactor, width, height) {
        // TODO: explain
        // TODO: figure out an API for color properties
        // TODO: add initialAngle property
        resolution = resolution || defaults.resolution;
        layerCount = layerCount || defaults.layerCount;
        layerSepFactor = layerSepFactor || defaults.layerSepFactor;
        width = width || defaults.width;
        height = height || defaults.height;
        // TODO: add center

        var c = [
            p(0,0),
            p(width,0),
            p(width, height),
            p(0, height)
        ];

        var spines = [
            drawLine(c[0], c[1]),
            drawLine(c[2], c[1]),
            drawLine(c[2], c[3]),
            drawLine(c[0], c[3])
        ];

        doStitching(spines, resolution, layerCount, layerSepFactor)

    };

    window.drawStarCurve = function(starPointNum, resolution, layerCount, layerSepFactor, width, height, center){
        // TODO Do it...
        resolution = resolution || defaults.resolution;
        layerCount = layerCount || defaults.layerCount;
        layerSepFactor = layerSepFactor || defaults.layerSepFactor;
        width = width || defaults.width;
        height = height || defaults.height;
        center = center || defaults.center;

        var radius = Math.min(width, height) / 2; // FIXME this only works for rotationally symmetric stars

        var spines = [],
            startAngle = 0;
        // rotate through all the angles drawing a spine for each
        for(var i=0;i<starPointNum;i++){
            var tipPoint = getPositions(i/starPointNum + startAngle, radius, center);

            // Have to alternate to get pretty curves
            var p1 = (i % 2 == 0) ? center : tipPoint,
                p2 = (i % 2 == 0) ? tipPoint : center;

            var line = drawLine(p1, p2);

            spines.push(line);
            two.render();
        }

        doStitching(spines, resolution, layerCount, layerSepFactor);
    };

    function doStitching(spines, resolution, layerCount, layerSepFactor/*,something about color*/){
        // TODO: explain inputs
        layerSepFactor = layerSepFactor || defaults.layerSepFactor;

        curve.add(spines);

        for (var i = 0; i < layerCount; i++) {
            var layer = stitchContinuous(spines, resolution, (i + 1) * layerSepFactor);
            layer.stroke = rgba(0, 183 - i * 16, 0 - i * 32, 1.0 - i / 8);
            layer.addTo(curve);
        }
    }

    function revToRad(rev){
        // Converts a number of revolutions (1 rev = 2pi radians)
        return 2 * pi * rev;
    }

    var getPositions = function(angle, radius, center) {
        // Get x,y coordinates for a point `radius`
        // from `center` at the given `angle`.
        return {
            x: Math.cos(revToRad(angle)) * radius + (center.x || 0),
            y: Math.sin(revToRad(angle)) * radius + (center.y || 0)
        };
    };

    var rotateAbout = function(cen, poly, angle){
        // Rotates a Two.Polygon about a point, "orbiting" that point.
        // TODO: extend Two.Polygon with this
        // Derived from this example: http://code.tutsplus.com/tutorials/drawing-with-twojs--net-32024
        console.log("OLD: angle=" + (poly.rotation/pi) + ", trans=" + poly.translation);
        poly.rotation = (poly.rotation + angle) % (2*pi);
        var pos = getPositions(poly.rotation, poly.length);
        poly.translation.x = cen.x + pos.x/2;
        poly.translation.y = cen.y + pos.y/2;
        console.log("NEW: angle=" + (poly.rotation/pi) + ", trans=" + poly.translation + "\n");
    };

    function Color(red, green, blue, alpha){
        this.r = red;
        this.g = green;
        this.b = blue;
        this.a = alpha;
        this.rgbaStr = function(){
            return rgba(this.r, this.g, this.b, this.a)
        };
    }

    // TODO: Color profile
    // startColor,
    // endColor,
    // pattern(?) alternate or transition

    function rgba(r, g, b, a){
        return "rgba("+ r + "," + g + "," + b + "," + a + ")"
    }

    function pointStr(vector){
        // TODO: extend Two.Vector with this
        return "("+vector.x+","+vector.y+")";
    }

    function drawLine(v1, v2){
        // wrapper function to make a line between a pair
        // of Two.Vector points (or anything else with x, y properties)
        // TODO: extend Two.prototype with this
        var line = two.makeLine(v1.x, v1.y, v2.x, v2.y);
        two.render();
        return line;
    }

    function decenter(point, trans){
        // Take a Two.Vector positioned relative to center,
        // and change it to be relative to top-left corner
        // TODO: extend Two.Vector with this
        return point.clone().set(trans.x - point.x, trans.y + point.y);
    }

    function plot(point, radius, color){
        var dot = two.makeCircle(point.x, point.y, radius || 1);
        dot.stroke = color || "red";
        dot.fill = color || "red";
        two.render();
    }

    function getPoints(line, resolution){
        // Returns an array of `resolution` points
        // evenly spaced along `line`.
        // TODO: test with polygons
        // TODO: extend Two.Polygon with this
        var vertices = line.vertices,
            translation = line.translation,
            points = [];

        for(var i=0; i<vertices.length; i++){
            // INFO: for some wacky behavior, try not decentering the vertices
            var vertexA = decenter(vertices[i], translation),
                vertexB = decenter(vertices[(i+1) % vertices.length], translation),
                rangeX = vertexB.x - vertexA.x,
                rangeY = vertexB.y - vertexA.y,
                stepX = rangeX / resolution,
                stepY = rangeY / resolution;

            for(var stepNum=0; stepNum <= resolution; stepNum++){
                // vertices aren't actual end points for lines..
                var curX = vertexA.x + stepNum * stepX,
                    curY = vertexA.y + stepNum * stepY,
                    curPoint = new Two.Anchor(curX, curY);
                //plot(curPoint);
                points.push(curPoint);
            }

            // hack to avoid repetition
            if (vertices.length <= 2){
                break;
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
            stitches = _connectDots(line1Points, line2Points);

        return stitches;
    }

    function _followCurve(points, separation){
        // Takes an array of points and draws a line from
        // each point to the one `separation` ahead of it.
        var group = new Two.Group(),
            len = points.length;
        for(var i=0; i+separation<len; i++){
            var pointA = points[i],
                pointB = points[i+separation],
                line = drawLine(pointA, pointB);
            //console.log(pointStr(pointA) + "~>" + pointStr(pointB));
            line.addTo(group);
        }
        return group;
    }

    function stitchContinuous(lines, resolution, separation){
        // "Stitch" a continuous curve between the list of lines given,
        // with `resolution` points per line, and a given number of
        // points of `separation`
        var points = getPoints(lines[0], resolution),
            stitches;
            for(var i = 0; i<lines.length; i++){
                var newPoints = getPoints(lines[(i+1) % lines.length], resolution);
                if (points.length && points[points.length-1].equals(newPoints[0])){
                    newPoints.shift();
                }
                points = points.concat(newPoints);
            }
        separation = separation || 1;
        stitches = _followCurve(points, (resolution + separation) % resolution);

        return stitches;
    }

    test();
    two.render();
})();
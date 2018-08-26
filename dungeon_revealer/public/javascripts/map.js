var indicatorFlag = false;
define(['settings', 'jquery', 'fow_brush','ind_brush'], function (settings, jquery, fow_brush,ind_brush) {
    console.log('map module loaded');
    return function () {
        var $ = jquery,
            cursorContext,
            cursorCanvas,
            fowContext,
            fowCanvas,
			fowCanvasStack = [],
			indCanvas,
			indCanvasStack = [],
			labelMap = new Object(),
			indContext,
            mapImageContext,
            mapImageCanvas,
			currContext,
            fowBrush,
			updateMsg,
			indBrush,
            mapImage,
            width,
            height,
            isDrawing = false,
			currBrush,
            points = [],
            //lineWidth = settings.defaultLineWidth,
            brushShape = settings.defaultBrushShape,
            fogOpacity = settings.fogOpacity,
            fogRGB = settings.fogRGB,
			playerRGB= settings.playerRGB,
			enemyRGB = settings.enemyRGB,
			targetRGB = settings.targetRGB;
			
			function getLineWidth(){
				var slider = document.getElementById("size_input");
				
				return slider.value;
			}
        function extend(obj1, obj2) {
            obj1 = obj1 || {};
            obj2 = obj2 || {};
            for (var attrname in obj2) {
                obj1[attrname] = obj2[attrname];
            }
            return obj1;
        }

        function nop() {
        }

        function create(parentElem, opts) {
            opts = extend(opts, settings);

            var imgUrl = opts.imgUrl || opts.mapImage,
                callback = opts.callback || nop,
                error = opts.error || nop;

            mapImage = new Image();
            mapImage.onerror = error;
            mapImage.onload = function () {
                var container,
                    canvases,
                    dimensions;

                console.log('mapImage loaded');

                // TODO: make this more readable
                dimensions = getOptimalDimensions(mapImage.width, mapImage.height, opts.maxWidth, opts.maxHeight);
                width = dimensions.width;
                height = dimensions.height;
                console.log('width: ' + width + ', height: ' + height);
                container = getContainer();
                canvases = createCanvases();
                parentElem.appendChild(container);
                mapImageCanvas = canvases.mapImageCanvas;
                fowCanvas = canvases.fowCanvas;
                cursorCanvas = canvases.cursorCanvas;
				indCanvas = canvases.indCanvas;
				gridCanvas = canvases.gridCanvas;
                container.appendChild(mapImageCanvas);
                container.appendChild(fowCanvas);
				container.appendChild(indCanvas);
				container.appendChild(gridCanvas);
                container.appendChild(cursorCanvas);
                mapImageContext = mapImageCanvas.getContext('2d');
                fowContext = fowCanvas.getContext('2d');
				indContext = indCanvas.getContext('2d');
				gridContext = gridCanvas.getContext('2d');
				gridContext.save();
                cursorContext = cursorCanvas.getContext('2d');
                copyCanvas(mapImageContext, createImageCanvas(mapImage));
                fowBrush = fow_brush(fowContext, opts);
				indBrush = ind_brush(indContext, opts);
                fowContext.strokeStyle = fowBrush.getCurrent();
				indContext.strokeStyle = indBrush.getCurrent();
				currBrush=fowBrush;
				currContext=fowContext;
                fogMap();
                createRender();
                setUpDrawingEvents();
                setupCursorTracking();
                callback();
            };
            mapImage.crossOrigin = 'Anonymous'; // to prevent tainted canvas errors
            mapImage.src = imgUrl;
        }

        // TODO: account for multiple containers
        function getContainer() {
            var container = document.getElementById('canvasContainer') || document.createElement('div');

            container.id = 'canvasContainer'; //TODO: wont work for multiple containers
            container.style.position = 'relative';
            container.style.top = '0';
            container.style.left = '0';
            container.style.margin = 'auto';
            //container.style.width = width + 'px';
            //container.style.height = height + 'px';

            return container;
        }

        function createCanvases() {

            function createCanvas(type, zIndex) {
                var canvas = document.createElement('canvas');

                console.log('creating canvas ' + type);
                canvas.width = width;
                canvas.height = height;
                canvas.id = type + Math.floor(Math.random() * 100000);
                canvas.className = type + ' map-canvas';
                canvas.style.position = 'absolute';
                canvas.style.left = '0';
                canvas.style.top = '0';
                canvas.style.zIndex = zIndex;
                zIndex++;

                return canvas;
            }

            return {
                mapImageCanvas: createCanvas('map-image-canvas', 1),
                fowCanvas: createCanvas('fow-canvas', 2),
                indCanvas: createCanvas('indicator-canvas', 3),
				gridCanvas: createCanvas('grid-canvas', 4),
				cursorCanvas: createCanvas('cursor-canvas', 5)
				
				
            };

        }

        function getMouseCoordinates(e) {
            var viewportOffset = fowCanvas.getBoundingClientRect(),
                borderTop = parseInt($(fowCanvas).css('border-top-width')),
                borderLeft = parseInt($(fowCanvas).css('border-left-width'));

            return {
                x: (e.clientX - viewportOffset.left - borderLeft) / getMapDisplayRatio(),
                y: (e.clientY - viewportOffset.top - borderTop) / getMapDisplayRatio()
            };
        }

        function midPointBtw(p1, p2) {
            //console.log(p1)
            //console.log(p2)

            return {
                x: p1.x + (p2.x - p1.x) / 2,
                y: p1.y + (p2.y - p1.y) / 2
            }

        }

        function getOptimalDimensions(idealWidth, idealHeight, maxWidth, maxHeight) {
            var ratio = Math.min(maxWidth / idealWidth, maxHeight / idealHeight);

            return {
                ratio: ratio,
                width: idealWidth * ratio,
                height: idealHeight * ratio
            };
        }

        function convertCanvasToImage(canvas) {
            var image = new Image();

            image.src = canvas.toDataURL('image/png');

            return image;
        }

        function copyCanvas(context, canvasToCopy) {
            context.drawImage(canvasToCopy, 0, 0, width, height);
        }

        function mergeCanvas(bottomCanvas, topCanvas) {
            var mergedCanvas = document.createElement('canvas'),
                mergedContext = mergedCanvas.getContext('2d');

            mergedCanvas.width = width;
            mergedCanvas.height = height;
            copyCanvas(mergedContext, bottomCanvas);
            copyCanvas(mergedContext, topCanvas);

            return mergedCanvas;
        }

        // Creates a canvas from an image
        function createImageCanvas(img) {
            var imageCanvas = document.createElement('canvas'),
                imageContext = imageCanvas.getContext('2d'),
                width = settings.maxWidth,
                height = settings.maxHeight;

            imageCanvas.width = width;
            imageCanvas.height = height;
            imageContext.drawImage(img, 0, 0, width, height);

            return imageCanvas;
        }

        function resetMap(context, brushType, brush) {
            context.save();
            context.fillStyle = brush.getPattern(brushType);
            context.fillRect(0, 0, width, height);
            context.restore();
        }

        function fogMap() {
            resetMap(fowContext, 'fog', fowBrush);
        }

		// need a control z to undo the stack stuff, and also everytime do send, or some other action, save stacte
		
		function pushCanvasStack(){
			var savePlayers = document.getElementById('label_sel').innerHTML;
			var saveOthers = document.getElementById('label_sel2').innerHTML;
				
			var jsonLabelMap = JSON.stringify(labelMap);
			var stack;
			var canvas;
			var undoObj = new Object();
			if(currBrush == fowBrush){
				stack = fowCanvasStack;
				canvas = fowCanvas;
				
			}else if(currBrush == indBrush){
				stack = indCanvasStack;
				canvas = indCanvas;
				
				undoObj.savePlayers = savePlayers;
				undoObj.saveOthers = saveOthers;
				undoObj.jsonLabelMap = jsonLabelMap;
			}else{
				//unknown canvas 
				return;
			}
			
			//save max of 8 strokes
			if(stack.length >= 8){
					stack.shift();
			}
		//	var tmpCanvas = document.createElement("CANVAS");
		//grab the context from your destination canvas
			//var tmpCtx = tmpCanvas.getContext('2d');

			//call its drawImage() function passing it the source canvas directly
			//tmpCtx.drawImage(canvas, 0, 0);
			var imgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
			
			//save the canvas
			//stack.push(tmpCanvas);
			
			undoObj.imgData = imgData;
				
			//stack.push(imgData);
			stack.push(undoObj);

		}
        function clearMap(currBrush) {
			if(currBrush == fowBrush){
				
				resetMap(fowContext, 'clear', fowBrush);
			}else if(currBrush == indBrush){
				
				if(confirm('Are you sure you want to clear away the map labels?')){
				
					//resetMap(indContext, 'player', indBrush);
					indContext.clearRect(0, 0, indCanvas.width, indCanvas.height);
					//resetMap(context, 'clear');
				}
			}
        }

        function resize(displayWidth, displayHeight) {
            fowCanvas.style.width = displayWidth + 'px';
            fowCanvas.style.height = displayHeight + 'px';
			indCanvas.style.width = displayWidth + 'px';
			indCanvas.style.height = displayHeight + 'px';
            mapImageCanvas.style.width = displayWidth + 'px';
            mapImageCanvas.style.height = displayHeight + 'px';
        }

        // Maybe having this here violates cohesion
        function fitMapToWindow() {
            var oldWidth = parseInt(mapImageCanvas.style.width || mapImageCanvas.width, 10),
                oldHeight = parseInt(mapImageCanvas.style.height || mapImageCanvas.height, 10),
                newDims = getOptimalDimensions(oldWidth, oldHeight, window.innerWidth, Infinity);

            resize(newDims.width, newDims.height);
        }

        function toImage() {
            //return convertCanvasToImage(mergeCanvas(mapImageCanvas, fowCanvas));
			return convertCanvasToImage(mergeCanvas(mapImageCanvas, mergeCanvas(fowCanvas,indCanvas)));
        }

        function remove() {
            // won't work in IE
            mapImageCanvas.remove();
            fowCanvas.remove();
			indCanvas.remove();
        }

        function getMapDisplayRatio() {
            return parseFloat(mapImageCanvas.style.width, 10) / mapImageCanvas.width;
        }

        function constructMask(cords) {
			var lineWidth= getLineWidth();
            var maskDimensions = {
                x: cords.x,
                y: cords.y,
                lineWidth: 2,
                line: 'aqua',
                fill: 'transparent'
            };

            if (brushShape == 'round') {
                maskDimensions.r = lineWidth / 2;
                maskDimensions.startingAngle = 0;
                maskDimensions.endingAngle = Math.PI * 2
            }
            else if (brushShape == 'square') {

                maskDimensions.centerX = maskDimensions.x - lineWidth / 2;
                maskDimensions.centerY = maskDimensions.y - lineWidth / 2;
                maskDimensions.height = lineWidth;
                maskDimensions.width = lineWidth;
            }
            else {
                throw new Error('brush shape not found')
            }

            return maskDimensions

        }
		
		function constructIndMask(cords) {
			var lineWidth = getLineWidth();
            var maskDimensions = {
                x: cords.x,
                y: cords.y,
                lineWidth: 2,
                line: '',
                fill: ''
            };

            if (brushShape == 'round') {
                maskDimensions.r = lineWidth / 2;
                maskDimensions.startingAngle = 0;
                maskDimensions.endingAngle = Math.PI * 2
            }
            else if (brushShape == 'square') {

                maskDimensions.centerX = maskDimensions.x - lineWidth / 2;
                maskDimensions.centerY = maskDimensions.y - lineWidth / 2;
                maskDimensions.height = lineWidth;
                maskDimensions.width = lineWidth;
            }
            else {
                throw new Error('brush shape not found')
            }

            return maskDimensions

        }

        // Constructs the corner coordinates of a square given its central cord and the global lineWidth. The square is
        // described in a clockwise fashion
        function constructCoordinates(cords) {
            // Corners
            // 1 - bottom left
            // 2 - top left
            // 3 - top right
            // 4 - bottom right

            // Note: 0,0 starts in top left. Remember this when doing calculations for corners, the y axis calculations
            // need to be flipped vs bottom left orientation
			var lineWidth = getLineWidth();
            var r = lineWidth / 2;
            return {
                1: {
                    x: cords.x - r,
                    y: cords.y + r
                },
                2: {
                    x: cords.x - r,
                    y: cords.y - r
                },
                3: {
                    x: cords.x + r,
                    y: cords.y - r
                },
                4: {
                    x: cords.x + r,
                    y: cords.y + r
                }
            }
        }

        // Pythagorean theorem for distance between two cords
        function distanceBetweenCords(cords1, cords2) {
            var a = cords1.x - cords2.x
            var b = cords1.y - cords2.y

            var distance = Math.sqrt(a * a + b * b);

            return distance
        }

        // Stolen function for multi attribute sort
        function orderByProperty(prop) {
            var args = Array.prototype.slice.call(arguments, 1);
            return function (a, b) {
                var equality = a[prop] - b[prop];
                if (equality === 0 && arguments.length > 1) {
                    return orderByProperty.apply(null, args)(a, b);
                }
                return equality;
            };
        }

        // Finds the optimal rhombus to act as a connecting path between two square masks
        // This function takes the coordinates of the current and previous square masks and compares the distances to the
        // midpoint between the two squares to find the correct rhombus that describes a smooth fill between the two.
        // You could achieve the same thing by constructing four walls around each set of
        // squares, but you would end up with 4x as many "connecting" objects -> poor performance
        // Note: I'm pretty sure I've just recreated some standard geometry algorithm and this whole section
        // could be swapped out with a function.
        function findOptimalRhombus(pointCurrent, pointPrevious) {
            // Find midpoint between two points
            var midPoint = midPointBtw(pointPrevious, pointCurrent)

            // Exten d points to coordinates
            var pointCurrentCoordinates = constructCoordinates(pointCurrent),
                pointPreviousCoordinates = constructCoordinates(pointPrevious)

            // Arrays and Objects
            var allPoints = [], // All points are placed into this array
                counts = {}, // count distinct of distances
                limitedPoints // subset of correct points

            // Load the points into allpoints with a field documenting their origin and corner
            for (var key in pointCurrentCoordinates) {
                pointCurrentCoordinates[key].corner = key;
                pointCurrentCoordinates[key].version = 2;
                allPoints.push(pointCurrentCoordinates[key])
            }
            for (var key in pointPreviousCoordinates) {
                pointPreviousCoordinates[key].corner = key;
                pointPreviousCoordinates[key].version = 1;
                allPoints.push(pointPreviousCoordinates[key])
            }

            // For each point find the distance between the cord and the midpoint
            for (var j = 0, allPointsLength = allPoints.length; j < allPointsLength; j++) {
                allPoints[j].distance = distanceBetweenCords(midPoint, allPoints[j]).toFixed(10)
            }

            // count distinct distances into counts object
            allPoints.forEach(function (x) {
                var distance = x.distance;
                counts[distance] = (counts[distance] || 0) + 1;
            });

            // Sort allPoints by distance
            allPoints.sort(function (a, b) {
                return a.distance - b.distance;
            });

            // There are three scenarios
            // 1. the squares are perfectly vertically or horizontally aligned:
            ////  In this case, there will be two distinct lengths between the mid point, In this case, we want to take
            ////  the coordinates with the shortest distance to the midpoint
            // 2. The squares are offset vertically and horizontally. In this case, there will be 3 or 4 distinct lengths between
            ////  the coordinates, 2 that are the shortest, 4 that are in the middle, and 2 that are the longest. We want
            ////  the middle 4

            // Determine the number of distances
            var numberOfDistances = Object.keys(counts).length;

            if (numberOfDistances == 2) {
                limitedPoints = allPoints.slice(0, 4)
            }

            else if (numberOfDistances == 3 || numberOfDistances == 4) {
                limitedPoints = allPoints.slice(2, 6)
            }
            else {
                // if the distance is all the same, the square masks haven't moved, so just return
                return
            }

            // error checking
            if (limitedPoints.length != 4) {
                throw new Error('unexpected number of points')
            }

            var limitedPointsSorted = limitedPoints.sort(orderByProperty('corner', 'version'));
            if (numberOfDistances > 2) {
                // for horizontally and verically shifted, the sort order needs a small hack so the drawing of the
                // rectangle works correctly
                var temp = limitedPointsSorted[2];
                limitedPointsSorted[2] = limitedPointsSorted[3];
                limitedPointsSorted[3] = temp
            }
            return limitedPointsSorted
        }

        function setupCursorTracking() {
			var lineWidth = getLineWidth();
            // Mouse Click
            cursorCanvas.onmousedown = function (e) {
				pushCanvasStack();
                // Start drawing
                isDrawing = true;

                // Get correct cords from mouse click
                var cords = getMouseCoordinates(e);
				console.log("current conext: "+currContext);
				if(currContext===fowContext){
					console.log("fow resolved");
					//handleCustomClick(fowContext,cords);
					fowCanvas.drawInitial(cords);
				}else if(currContext===indContext){
				console.log("ind resolved");
					// Draw initial Shape
					// set lineWidth to 0 for initial drawing of shape to prevent screwing up of size/placement
					indCanvas.drawInitial(cords);
				}
				
            };

            // Mouse Move
            cursorCanvas.onmousemove = function (e) {
                //get cords and points
                var cords = getMouseCoordinates(e);
                if (isDrawing) {
                    points.push(cords)
                }

                // Draw cursor and fow
                cursorCanvas.drawCursor(cords);
				
				if(currContext==fowContext){
				
					 fowCanvas.draw(points)
				}else if(currContext==indContext){
				
					indCanvas.draw(points);
				}
               
            };

            cursorCanvas.drawCursor = function (cords) {
				var lineWidth= getLineWidth();
                // Cleanup
                cursorContext.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

                // Construct circle dimensions
                var cursorMask = constructMask(cords);

                cursorContext.strokeStyle = cursorMask.line;
                cursorContext.fillStyle = cursorMask.fill;
                cursorContext.lineWidth = cursorMask.lineWidth;

                cursorContext.beginPath();
                if (brushShape == 'round') {
                    cursorContext.arc(
                        cursorMask.x,
                        cursorMask.y,
                        cursorMask.r,
                        cursorMask.startingAngle,
                        cursorMask.endingAngle,
                        true
                    );
                }
                else if (brushShape == 'square') {
                    cursorContext.rect(
                        cursorMask.centerX,
                        cursorMask.centerY,
                        cursorMask.height,
                        cursorMask.width);
                }

                cursorContext.fill();
                cursorContext.stroke();
                requestAnimationFrame(setupCursorTracking)
            }

        }

        function setUpDrawingEvents() {
			
            fowCanvas.drawInitial = function (coords) {
				var lineWidth= getLineWidth();
                // Construct mask dimensions
                var fowMask = constructMask(coords);
                fowContext.lineWidth = fowMask.lineWidth;

                fowContext.beginPath();
                if (brushShape == 'round') {
                    fowContext.arc(
                        fowMask.x,
                        fowMask.y,
                        fowMask.r,
                        fowMask.startingAngle,
                        fowMask.endingAngle,
                        true
                    );
                }
                else if (brushShape == 'square') {
                    fowContext.rect(
                        fowMask.centerX,
                        fowMask.centerY,
                        fowMask.height,
                        fowMask.width);
                }

                fowContext.fill();
                fowContext.stroke();
            };

            fowCanvas.draw = function (points) {
				var lineWidth= getLineWidth();
                if (!isDrawing) return;

                var pointPrevious, // the previous point
                    pointCurrent = points[0]; //  the current point

                // For each point create a quadraticCurve btweeen each point
                if (brushShape == 'round') {

                    // Start Path
                    fowContext.lineWidth = lineWidth;
                    fowContext.lineJoin = fowContext.lineCap = 'round';
                    fowContext.beginPath();

                    fowContext.moveTo(pointCurrent.x, pointCurrent.y);
                    for (var i = 1, len = points.length; i < len; i++) {
                        // Setup points
                        pointCurrent = points[i];
                        pointPrevious = points[i - 1];

                        // Coordinates
                        var midPoint = midPointBtw(pointPrevious, pointCurrent);
                        fowContext.quadraticCurveTo(pointPrevious.x, pointPrevious.y, midPoint.x, midPoint.y);
                        fowContext.lineTo(pointCurrent.x, pointCurrent.y);
                        fowContext.stroke();
                    }
                }
                else if (brushShape == 'square') {
                    // The goal of this area is to draw lines with a square mask

                    // The fundamental issue is that not every position of the mouse is recorded when it is moved
                    // around the canvas (particularly when it is moved fast). If it were, we could simply draw a
                    // square at every single coordinate

                    // a simple approach is to draw an initial square then connect a line to a series of
                    // central cords with a square lineCap. Unfortunately, this has undesirable behavior. When moving in
                    // a diagonal, the square linecap rotates into a diamond, and "draws" outside of the square mask.

                    // Using 'butt' lineCap lines to connect between squares drawn at each set of cords has unexpected behavior.
                    // When moving in a diagonal fashion. The width does not correspond to the "face" of the cursor, which
                    // maybe longer then the length / width (think hypotenuse) which results in weird drawing.

                    // The current solution is two fold
                    // 1. Draw a rectangle at every available cord
                    // 2. Find and draw the optimal rhombus to connect each square

                    fowContext.lineWidth = 1
                    fowContext.beginPath();

                    // The initial square mask is drawn by drawInitial, so we doing need to start at points[0].
                    // Therefore we start point[1].
                    for (var i = 1, len = points.length; i < len; i++) {
                        // Setup points
                        pointCurrent = points[i];
                        pointPrevious = points[i - 1];

                        if (!pointCurrent || !pointPrevious) {
                            throw new Error('points are incorrect')
                        }

                        // draw rectangle at current point
                        var fowMask = constructMask(pointCurrent);
                        fowContext.fillRect(
                            fowMask.centerX,
                            fowMask.centerY,
                            fowMask.height,
                            fowMask.width);

                        // optimal polygon to draw to connect two square
                        var optimalPoints = findOptimalRhombus(pointCurrent, pointPrevious);
                        if (optimalPoints) {
                            fowContext.moveTo(optimalPoints[0].x, optimalPoints[0].y);
                            fowContext.lineTo(optimalPoints[1].x, optimalPoints[1].y);
                            fowContext.lineTo(optimalPoints[2].x, optimalPoints[2].y);
                            fowContext.lineTo(optimalPoints[3].x, optimalPoints[3].y);
                            fowContext.fill();
                        }
                    }
                }
            };
	
			indCanvas.drawInitial = function (coords) {
				setTimeout(enableLoadingScreen,0);
				var labelValue = document.getElementById('labelTextInput').value;
				//only erase the label if already on map 
				if(!(labelMap[labelValue] === undefined)){
					eraseMapLabel(labelValue);
					restoreLabelState(labelValue);
				}
				
				drawLabel(coords);
				setTimeout(disableLoadingScreen,0);
            };
			
			//draws text to top right corner of shape
			indCanvas.drawText = function (x,y,l) {
				var lineWidth= getLineWidth();
				var newX = x + l;
				var newY = y - l;
				if(newX<0){
					newX=0;
				}else if(newX>indCanvas.width){
					newX=indCanvas.width;
				}
				if(newY<0){
					newY=0;
				}else if(newY>indCanvas.height){
					newY=indCanvas.height;
				}
				var label = document.getElementById('labelTextInput').value;
				indContext.save();
				indContext.shadowColor = "black";
				indContext.shadowOffsetX = 3; 
				indContext.shadowOffsetY = 3; 
				indContext.shadowBlur = 1;
				indContext.fillStyle="white"
				indContext.font = "20px Arial";
				indContext.fillText(label,newX,newY);
				indContext.restore();
			}
            indCanvas.draw = function (points) {
				/*var lineWidth= getLineWidth();
                if (!isDrawing) return;

                var pointPrevious, // the previous point
                    pointCurrent = points[0]; //  the current point

                // For each point create a quadraticCurve btweeen each point
                if (brushShape == 'round') {

                    // Start Path
                    indContext.lineWidth = lineWidth;
                    indContext.lineJoin = indContext.lineCap = 'round';
                    indContext.beginPath();

                    indContext.moveTo(pointCurrent.x, pointCurrent.y);
                    for (var i = 1, len = points.length; i < len; i++) {
                        // Setup points
                        pointCurrent = points[i];
                        pointPrevious = points[i - 1];

                        // Coordinates
                        var midPoint = midPointBtw(pointPrevious, pointCurrent);
                        indContext.quadraticCurveTo(pointPrevious.x, pointPrevious.y, midPoint.x, midPoint.y);
                        indContext.lineTo(pointCurrent.x, pointCurrent.y);
                        indContext.stroke();
                    }
                }
                else if (brushShape == 'square') {
                    // The goal of this area is to draw lines with a square mask

                    // The fundamental issue is that not every position of the mouse is recorded when it is moved
                    // around the canvas (particularly when it is moved fast). If it were, we could simply draw a
                    // square at every single coordinate

                    // a simple approach is to draw an initial square then connect a line to a series of
                    // central cords with a square lineCap. Unfortunately, this has undesirable behavior. When moving in
                    // a diagonal, the square linecap rotates into a diamond, and "draws" outside of the square mask.

                    // Using 'butt' lineCap lines to connect between squares drawn at each set of cords has unexpected behavior.
                    // When moving in a diagonal fashion. The width does not correspond to the "face" of the cursor, which
                    // maybe longer then the length / width (think hypotenuse) which results in weird drawing.

                    // The current solution is two fold
                    // 1. Draw a rectangle at every available cord
                    // 2. Find and draw the optimal rhombus to connect each square

                    indContext.lineWidth = 1
                    indContext.beginPath();

                    // The initial square mask is drawn by drawInitial, so we doing need to start at points[0].
                    // Therefore we start point[1].
                    for (var i = 1, len = points.length; i < len; i++) {
                        // Setup points
                        pointCurrent = points[i];
                        pointPrevious = points[i - 1];

                        if (!pointCurrent || !pointPrevious) {
                            throw new Error('points are incorrect')
                        }

                        // draw rectangle at current point
                        var fowMask = constructMask(pointCurrent);
                        indContext.fillRect(
                            fowMask.centerX,
                            fowMask.centerY,
                            fowMask.height,
                            fowMask.width);

                        // optimal polygon to draw to connect two square
                        var optimalPoints = findOptimalRhombus(pointCurrent, pointPrevious);
                        if (optimalPoints) {
                            indContext.moveTo(optimalPoints[0].x, optimalPoints[0].y);
                            indContext.lineTo(optimalPoints[1].x, optimalPoints[1].y);
                            indContext.lineTo(optimalPoints[2].x, optimalPoints[2].y);
                            indContext.lineTo(optimalPoints[3].x, optimalPoints[3].y);
                            indContext.fill();
                        }
                    }
                }*/
            };
			updateMsg = function (){
				var msgdom = document.getElementById('messages');
				//var msgdom = this;
				if(currBrush == fowBrush){
					var currBrushStr = fowBrush.getCurrentBrush();
					console.log("curr brush: "+fowBrush.toString());
					var output = "<li>Current Canvas: <b>Fog of War</b></li><li>Current Brush: <b>"+currBrushStr+"</b></li>";
					msgdom.innerHTML=output;
				}else if (currBrush == indBrush){
					var currBrushStr = indBrush.getCurrentBrush();
					console.log("curr brush: "+currBrushStr);
					var output = "<li>Current Canvas: <b>Indications Canvas</b></li><li>Current Brush: <span style='background:#000000;color:";
					
					if(currBrushStr === 'player'){
						output+="#42f445;";	
					}else if(currBrushStr === 'enemy'){
						output+="red;";
					}else if(currBrushStr === 'target'){
						output+="yellow;";
					}else{
						output+="white;";
					}						
					output+="'><b>"+currBrushStr+"</b></span></li>";
					msgdom.innerHTML=output;
				}
				
			};
			updateMsg();
            //TODO: move all of this jquery stuff somewhere else

            $('#btn-toggle-fow-brush').click(function () {
				var toggleButton = this;
				//fog of war canvas?
				if(currBrush == fowBrush){
			/*			 
					if (toggleButton.innerHTML === 'Clear Brush') {
						toggleButton.innerHTML = 'Shadow Brush';
					} else {
						toggleButton.innerHTML = 'Clear Brush';
					}*/
					fowBrush.toggle();
				}else if(currBrush == indBrush){//indica
					/*if (toggleButton.innerHTML === 'Player Brush') {
						toggleButton.innerHTML = 'Enemy Brush';
					} else if (toggleButton.innerHTML === 'Enemy Brush') {
						toggleButton.innerHTML = 'Target Brush';
					}else if (toggleButton.innerHTML === 'Target Brush') {
						toggleButton.innerHTML = 'Eraser Brush';
					}else{
						toggleButton.innerHTML = 'Player Brush';
					}*/
					indBrush.toggle();
				}
               updateMsg();
            });
			/*
			$('#btn-toggle-ind-brush').click(function () {
                var toggleButton = this;
                if (toggleButton.innerHTML === 'Player Brush') {
                    toggleButton.innerHTML = 'Enemy Brush';
                } else if (toggleButton.innerHTML === 'Enemy Brush') {
                    toggleButton.innerHTML = 'Target Brush';
                }else if (toggleButton.innerHTML === 'Target Brush') {
                    toggleButton.innerHTML = 'Eraser Brush';
                }else{
                    toggleButton.innerHTML = 'Player Brush';
                }
                indBrush.toggle();
				
            });*/
			
			$('#btn-toggle-canvas').click(function() {
				
				//fog of war canvas?
				if(currBrush == fowBrush){
					
					//indBrush.updateSliderSize();
					//swap to indicator canvas
					currBrush = indBrush;
					currContext = indContext;
					var dom = document.getElementById('btn-shroud-all');
					dom.style='display: none';
					dom = document.getElementById('labelText');
					dom.style='display: inline-block !important;';
					dom = document.getElementById('labelTextInput');
					dom.style='display: inline-block !important;';
					dom = document.getElementById('label_mng_container');
					dom.style='display: block !important;';
					//var dom = $("btn-toggle-ind-brush"); 
					//dom.css("display", dom.css("display") === 'none' ? '' : 'none');
					console.log("context: indicator brush");
					//this.innerHTML = "Toggle Canvas (Currently Indicator Canvas)";
					
					 //document.getElementById('btn-toggle-fow-brush').innerHTML = 'Player Brush';				
					 indBrush.currentBrushType=indBrush.brushTypes[0];
					
					 
				//	toggleButton.innerHTML = 'indicator Canvas';
				}else if(currBrush == indBrush){
					//save the current size of brush
					//indBrush.saveLabelSize();
					
					currBrush = fowBrush;
					currContext=fowContext;
					var dom = document.getElementById('btn-shroud-all');
					dom.style='';
					dom = document.getElementById('labelText');
					dom.style='display: none !important;';
					dom = document.getElementById('labelTextInput');
					dom.style='display: none !important;';
					dom = document.getElementById('label_mng_container');
					dom.style='display: none !important;';
					
					//var dom = $("btn-toggle-fow-brush"); 
					//dom.css("display", dom.css("display") === 'none' ? '' : 'none');
					console.log("context: fow brush");
					//this.innerHTML = "Toggle Canvas (Currently FOW Canvas)";
					//toggleButton.innerHTML = 'fow Canvas';
					//document.getElementById('btn-toggle-fow-brush').innerHTML = 'Shadow Brush';
					 fowBrush.currentBrushType=fowBrush.brushTypes[0];
					 
				}
				updateMsg();
			});
			
			
			//set up ctrl z undo
			window.onkeyup = function(e) {
			   var key = e.keyCode ? e.keyCode : e.which;
				//alert('keyup');
			   if (e.keyCode == 90 && e.ctrlKey) undo();
			}
			
			
			function undo(){
				if(currBrush == fowBrush){
	
					if(fowCanvasStack.length >=1){
						var ctx = fowCanvas.getContext('2d');

						//call its drawImage() function passing it the source canvas directly
						//tmpCtx.drawImage(fowCanvasStack.pop(), 0, 0);
			
						ctx.putImageData(fowCanvasStack.pop().imgData, 0, 0);
						createRender();
					}
				}else if(currBrush == indBrush){
					if(indCanvasStack.length >=1){
						var ctx = indCanvas.getContext('2d');

						//call its drawImage() function passing it the source canvas directly
						//tmpCtx.drawImage(fowCanvasStack.pop(), 0, 0);
						var undoObj = indCanvasStack.pop();
						document.getElementById('label_sel').innerHTML = undoObj.savePlayers;						
						document.getElementById('label_sel2').innerHTML = undoObj.saveOthers;
					
						labelMap = JSON.parse(undoObj.jsonLabelMap);
						ctx.putImageData(undoObj.imgData, 0, 0);
						createRender();
					}
				}
			}
			
            $('#btn-shroud-all').click(function () {
                pushCanvasStack();
				fogMap(fowContext);
                createRender();
            });

            $('#btn-clear-all').click(function () {
				
				pushCanvasStack();
				
				clearMap(currBrush);
                
				
                createRender();
				//document.body.style.cursor='default';
            });
			$('#btn-undo').click(function () {
				
				undo();
				
            });

			
            $('#size_input').click(function () {
                // If the new width would be over 200, set it to 200
                //lineWidth = (lineWidth * 2 > 200) ? 200 : lineWidth * 2;
				var slider = document.getElementById("size_input");
				//slider.value = slider.value+1;
				lineWidth = slider.value;
            });
			
            $('#btn-enlarge-brush').click(function () {
                // If the new width would be over 200, set it to 200
                //lineWidth = (lineWidth * 2 > 200) ? 200 : lineWidth * 2;
				var slider = document.getElementById("size_input");
				console.log("size slider value: "+slider.value);
				slider.value = parseInt(slider.value)+10;
				lineWidth = slider.value;
            });
			
			function drawLabel(coords){
				//save the state o
				var lineWidth= getLineWidth();
                // Construct mask dimensions
                var fowMask = constructIndMask(coords);
                indContext.lineWidth = fowMask.lineWidth;
				var l =0;
                indContext.beginPath();
                if (brushShape == 'round') {
                    indContext.arc(
                        fowMask.x,
                        fowMask.y,
                        fowMask.r,
                        fowMask.startingAngle,
                        fowMask.endingAngle,
                        true
                    );
					l=fowMask.r;
					//indCanvas.drawText(fowMask.x,fowMask.y,fowMask.r);
                }
                else if (brushShape == 'square') {
                    indContext.rect(
                        fowMask.centerX,
                        fowMask.centerY,
                        fowMask.height,
                        fowMask.width);
					l=fowMask.height/2;
						//indCanvas.drawText(fowMask.x,fowMask.y,fowMask.height);
                }
				
				
				//indContext.font = "12px Arial";
				//indContext.fillText("Hello World",fowMask.x,fowMask.y);
				
                //indContext.fill();
				var currBrushStr = indBrush.getCurrentBrush();
				if(currBrushStr === 'player'){
					addLabelToList('label_sel',coords);
				}else{
					addLabelToList('label_sel2',coords);
				}
				 
                indContext.stroke();
				indCanvas.drawText(fowMask.x,fowMask.y,l);
			}
			function eraseMapLabel(label){
				if(label === undefined){
					return;
				}
				pushCanvasStack();
				
				indContext.clearRect(0, 0, indCanvas.width, indCanvas.height);
				
				labelMap[label].coords = undefined;
				//repaint all but removed label
				repaintLabels(label);
				createRender();	
				
			}
			
			function eraseAllMapLabels(){
				
				pushCanvasStack();
				
				indContext.clearRect(0, 0, indCanvas.width, indCanvas.height);
				for (var label in labelMap){
					if (labelMap.hasOwnProperty(label)) {					
						if(!(labelMap[label] === undefined)){
							labelMap[label].coords = undefined;												
						}
					}
				}			
				createRender();	
				
			}
			
			//repaints a label except...
			function repaintLabels(exception){
				for (var label in labelMap){
					if (labelMap.hasOwnProperty(label)) {
						//not label to erase?
						if(!(labelMap[label] === undefined)){
							if(!(label === exception)){
							//only if wasn't erased
								if(!(labelMap[label].coords === undefined)){
									restoreLabelState(label);
									drawLabel(labelMap[label].coords);
								}else{
									
									labelMap[label].coords = undefined;
									
								}// end ifmake sure the label hasn't already been erase
							}//end if ignore label to erase
						}//end if make sure it hasn't been delete
					}
				}			
			}
			
			//repaints a label except...
			function repaintAllLabels(){
				repaintLabels(undefined);		
			}
			function addLabelToList(dom_id,coords){
				var e = document.getElementById('label_sel');
				var options = e.options;
				var label = document.getElementById('labelTextInput').value;
				
				//iterate options, don't add duplicate
				for (var i = 0; i < options.length; i++) {
					
					//already in list?
					if(options[i].text === label){
						//update new coordinates
						labelMap[label].coords = coords;
						return;
					}
				}

				
				e = document.getElementById('label_sel2');
				options = e.options;
				
				
				//iterate options, don't add duplicate
				for (var i = 0; i < options.length; i++) {
					
					//already in list?
					if(options[i].text === label){
						//update new coordinates
						labelMap[label].coords = coords;
						return;
					}
				}
				
				var e = document.getElementById(dom_id);
				var options = e.options;				
                //var label = e.options[e.selectedIndex].value;
				
				var option = document.createElement("option");
				option.text = label;
				if(indBrush.getCurrentBrush() === 'player'){
					option.style = "color:#42f445;";	
				}else if(indBrush.getCurrentBrush() === 'enemy'){
					option.style = "color:red;";
				}else if(indBrush.getCurrentBrush() === 'target'){
					option.style = "color:yellow;";
				}else{
					option.style = "color:white;";
				}
				
				//add nubmer of clicks, 0 initially
				option.data=0;
				e.add(option);
				
				//add options to keep size and the brush so when click on it, it loads the buddy
				saveLabelState(label,coords);
			}
			
			function saveLabelState(label,coords){
				
				console.log("saving state");
				var slider = document.getElementById("size_input");
				var size = slider.value;
				
				var token = new Object();
				token.size = size;
				token.label = label;
				token.brushType = indBrush.getCurrentBrush();
				token.brushShape = brushShape;
				token.coords = coords;
				labelMap[label] = token;
			}
			
			function sortSelect(selElem) {
				console.log("sorting");
				var tmpAry = new Array();
				var cpyAry = new Array();
				for (var i=0;i<selElem.options.length;i++) {
					//tmpAry[i] = new Array();
					//tmpAry[i][0] = i;
					tmpAry[i] = selElem.options[i];
					
					cpyAry[i] = new Array();
					cpyAry[i][0] = selElem.options[i].text;
					cpyAry[i][1] = selElem.options[i].data;
					cpyAry[i][2] = selElem.options[i].style;
					cpyAry[i][3] = i;
					console.log('cpy: '+cpyAry[i]);
				}
				cpyAry.sort(function(a, b){
					
					// Compare the 2 dates
					if(a[1] > b[1]) return -1;
					if(a[1] < b[1]) return 1;
					return 0;
				});
				/*while (selElem.options.length > 0) {
					selElem.options[0] = null;
				}*/
				for (var i=0;i<cpyAry.length;i++) {
					//var op = new Option(cpyAry[i][0], cpyAry[i][1]);
					//selElem.options[i].text = cpyAry[i][0];
					//selElem.options[i].data = cpyAry[i][1];
					///selElem.options[i].style = cpyAry[i][2];
					selElem.options[i] = tmpAry[cpyAry[i][3]];
				}
				
				console.log("done sorting");
				return;
			}

			function restoreLabelState(label){
				
					var token = labelMap[label];
					
					var newsize = token.size;
					var newbrushType = token.brushType;
					var newbrushShape = token.brushShape;
					
					//make sure brushshape is round or square
					if((token.brushShape === 'round') || (token.brushShape === 'square')){
						brushShape = token.brushShape;
					}else{
						//error brush type
						console.log("error brush shape lookup");
						return;
					}
					
					//var clicks = parseInt(e.options[e.selectedIndex].data);
					//e.options[e.selectedIndex].data =  (clicks + 1);
					//update number of clicks
					
					
					//update the size
					var slider = document.getElementById("size_input");
					slider.value = newsize;
					
					//update brush type
					brushShape = newbrushShape;
					
					indBrush.setBrushType(newbrushType);
					
					//update label
					document.getElementById('labelTextInput').value = label;
					updateMsg();
					
							
					if (brushShape === 'square') {
						document.getElementById('btn-shape-brush').innerHTML = 'Circle Brush';
					} else {
						document.getElementById('btn-shape-brush').innerHTML = 'Square Brush';
					}
			}
			
			$('#label_sel').click(function () {
				//var e = document.getElementById('label_sel');
                //var label = e.options[e.selectedIndex].value;
				//document.getElementById('labelTextInput').value = label;
				
				var e = document.getElementById('label_sel');
				if(e.options[e.selectedIndex] === undefined){
					return;
				}
				var label = e.options[e.selectedIndex].value;
				restoreLabelState(label);
				
				//sort the list
				//sortSelect(document.getElementById('label_sel'));
				
            });
			
			$('#label_sel2').click(function () {
				//var e = document.getElementById('label_sel');
                //var label = e.options[e.selectedIndex].value;
				//document.getElementById('labelTextInput').value = label;
				
				
				var e = document.getElementById('label_sel2');
				if(e.options[e.selectedIndex] === undefined){
					return;
				}
				var label = e.options[e.selectedIndex].value;
				restoreLabelState(label);
				
				//sort the list
				//sortSelect(document.getElementById('label_sel'));
				
            });
			
			$('#label_sel').dblclick(function () {
				//var e = document.getElementById('label_sel');
                //var label = e.options[e.selectedIndex].value;
				//document.getElementById('labelTextInput').value = label;
				
				
				var e = document.getElementById('label_sel');
				if(e.options[e.selectedIndex] === undefined){
					return;
				}
				var label = e.options[e.selectedIndex].value;
				eraseMapLabel(label);
				restoreLabelState(label);
				
				//sort the list
				//sortSelect(document.getElementById('label_sel'));
				
            });
			
			$('#label_sel2').dblclick(function () {
				//var e = document.getElementById('label_sel');
                //var label = e.options[e.selectedIndex].value;
				//document.getElementById('labelTextInput').value = label;
				
				
				var e = document.getElementById('label_sel2');
				if(e.options[e.selectedIndex] === undefined){
					return;
				}
				var label = e.options[e.selectedIndex].value;
				eraseMapLabel(label);
				restoreLabelState(label);
				//sort the list
				//sortSelect(document.getElementById('label_sel'));
				
            });
			
			function findLabelIndex(label,dom_id){
				
			var targetIndex = -1;
				
				var selection = document.getElementById(dom_id);
				var options = selection.options;
				
				//iterate options, don't add duplicate
				for (var i = 0; i < options.length; i++) {
					
					//found?
					if(options[i].text === label){
						targetIndex = i;
					}
				}	
				
				return targetIndex;
			}
			
			function removeLabelFromSelect(label,dom_id){
				if(!confirm('Are you sure you want to delete the label "'+label+'" from the list?')){
					return;
				}
				/*
				*sel.removeChild( sel.options[1] ); 
				*/
				var targetIndex = findLabelIndex(label,dom_id);		
				
				var selection = document.getElementById(dom_id);
				var options = selection.options;
				
				selection.removeChild(options[targetIndex]);
				labelMap[label] = undefined;
                //var label = e.options[e.selectedIndex].value;
				
				//var option = document.createElement("option")
				//option.text = label;
				//e.add(option);
				
				
				return false;
				
			}
				
			$('#label_sel').contextmenu(function(e,h) {
				removeLabelFromSelect(e.target.value,'label_sel');
				return false;
			});
			
			$('#label_sel2').contextmenu(function(e,h) {
				removeLabelFromSelect(e.target.value,'label_sel2');
				return false;
			});

            $('#btn-shrink-brush').click(function () {
                // If the new width would be less than 1, set it to 1
                //lineWidth = (lineWidth / 2 < 1) ? 1 : lineWidth / 2;
				var slider = document.getElementById("size_input");
				console.log("size slider value: "+slider.value);
				slider.value = parseInt(slider.value)-10;
				lineWidth = slider.value;
            });
			
			$('#btn-smaller-grid').click(function () {
                // If the new width would be less than 1, set it to 1
                //lineWidth = (lineWidth / 2 < 1) ? 1 : lineWidth / 2;
				var slider = document.getElementById("grid_size_input");
				//console.log("size slider value: "+slider.value);
				slider.value = parseInt(slider.value)-10;
            });
			
			$('#btn-bigger-grid').click(function () {
				var slider = document.getElementById("grid_size_input");
				slider.value = parseInt(slider.value)+10;
            });
			$('#btn-add-grid').click(function () {
            
				var slider = document.getElementById("grid_size_input");
				
				squareSize = slider.value
				addGrid(squareSize,'black')
            });
			$('#btn-rm-grid').click(function () {
				
				gridContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
				gridCanvas.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
				//gridContext = gridCanvas.getContext('2d');
            });
			
            $('#btn-shape-brush').click(function () {
                var toggleButton = this;
                if (toggleButton.innerHTML === 'Square Brush') {
                    toggleButton.innerHTML = 'Circle Brush';
                    brushShape = 'square'
                } else {
                    toggleButton.innerHTML = 'Square Brush';
                    brushShape = 'round'
                }

            });

            $('#btn-render').click(function () {
                createRender();
            });
			
			function clearLabelSelections(dom_id){
				if(confirm('Are you sure you want to clear away a selection pane labels?')){
				
					var selection = document.getElementById(dom_id);

					
					while (selection.firstChild) {
						
						console.log("selection: "+selection.firstChild.innerHTML);
						//get label value and remove from map
						labelMap[selection.firstChild.innerHTML] = undefined;
						
						
						selection.removeChild(selection.firstChild);
					}
				}
				
			}
			
			function addGrid(squareSize,color){
				
				var numCols = gridCanvas.width/squareSize;
				var numRows = gridCanvas.height/squareSize;
				console.log("numRows: " + numRows);
				console.log("numCols: " + numCols);
				gridContext.beginPath();
				gridContext.strokeStyle = color;
				
				var row = 0;
				var col = 0;
				
				//context.fillRect(row*squareSize, col*squareSize, squareSize, squareSize);
				
				while (row < numRows){
					col=0;
					while (col < numCols){
						//context.fillRect(row*squareSize, col*squareSize, squareSize, squareSize);
						col++;
						gridContext.rect(row*squareSize, col*squareSize, squareSize, squareSize);
						//context.fillStyle = 'rgba(0,255,0,1)';
						
					}
					row++;
				}
				gridContext.stroke();
			} 
			function enableLoadingScreen(){
				console.log("hello world");
				document.getElementById("loading_screen").setAttribute('class',"modal");
			}
			function disableLoadingScreen(){
				document.getElementById("loading_screen").removeAttribute('class');
				console.log("hello world");
			}
			
			$('#btn-clear-other-labels').click(function () {
				enableLoadingScreen();
				document.body.style.cursor='wait';
				pushCanvasStack();
                clearLabelSelections('label_sel2');
				indContext.clearRect(0, 0, indCanvas.width, indCanvas.height);
				repaintAllLabels();
				createRender();
				document.body.style.cursor='default';
				disableLoadingScreen();
            });

			$('#btn-clear-player-labels').click(function () {
				document.body.style.cursor='wait';
				pushCanvasStack();
                clearLabelSelections('label_sel');				
				indContext.clearRect(0, 0, indCanvas.width, indCanvas.height);
				repaintAllLabels();
				createRender();
				document.body.style.cursor='default';
            });
			
			$('#btn-save-labels').click(function () {
                var savePlayers = document.getElementById('label_sel').innerHTML;
				var saveOthers = document.getElementById('label_sel2').innerHTML;
				console.log('saving: '+ savePlayers);
				setCookie("pLabels",savePlayers,7);//save for 7 days
				
				setCookie("oLabels",saveOthers,7);//save for 7 days
				
				setCookie("labelMap",JSON.stringify(labelMap),7);//save for 7 days
            });
			
			$('#btn-restore-labels').click(function () {
				if(confirm('Are you sure you want to relaod the selection pane labels (all current labels will be lost)?')){
					pushCanvasStack();
					//document.body.style.cursor='wait';
					var savePlayers = getCookie("pLabels");
					console.log('restoring: '+ savePlayers);
					 document.getElementById('label_sel').innerHTML = savePlayers;
					var saveOthers = getCookie("oLabels");
					document.getElementById('label_sel2').innerHTML = saveOthers;
					
					labelMap = JSON.parse(getCookie("labelMap"));
					//don't keep the old location of labels
					eraseAllMapLabels();
					//repaintLabels(undefined);
					//document.body.style.cursor='default';
				}
				
            });
			
			function setCookie(name,value,days) {
				value = btoa(value);
				var expires = "";
				if (days) {
					var date = new Date();
					date.setTime(date.getTime() + (days*24*60*60*1000));
					expires = "; expires=" + date.toUTCString();
				}
				document.cookie = name + "=" + (value || "")  + expires + "; path=/";
			}
			function getCookie(name) {
				var nameEQ = name + "=";
				var ca = document.cookie.split(';');
				for(var i=0;i < ca.length;i++) {
					var c = ca[i];
					while (c.charAt(0)==' ') c = c.substring(1,c.length);
					if (c.indexOf(nameEQ) == 0) return atob(c.substring(nameEQ.length,c.length));
				}
				return null;
			}
			function eraseCookie(name) {   
				document.cookie = name+'=; Max-Age=-99999999;';  
			}

            document.addEventListener('mouseup', function () {
                stopDrawing();	
	if(currBrush == indBrush){		
		indBrush.restoreBrush();
		//updateMsg();		
	}
            });
		document.addEventListener('contextmenu', function(ev) {
if(currBrush == indBrush){		    
			ev.preventDefault();

		   indBrush.saveBrush();
		   indBrush.setEraser();
		   //updateMsg();
}
		    return false;
		}, false);

        }

        function stopDrawing() {
			
			if (isDrawing) {
                createRender();
            }
            isDrawing = false;
            points = []
            points.length = 0;
        }

        //todo: move this functionality elsewher
        function createRender() {
            removeRender();
            createPlayerMapImage(mapImageCanvas, fowCanvas);
        }

        function removeRender() {
            $('#render').remove();
        }

        function createPlayerMapImage(bottomCanvas, topCanvas) {
            //var mergedCanvas = mergeCanvas(bottomCanvas, topCanvas),
              //  mergedImage = convertCanvasToImage(mergedCanvas);
			  var mergedImage = toImage();

            mergedImage.id = 'render';

            //todo: refactor this functionality outside
            document.querySelector('#map-wrapper').appendChild(mergedImage);
        }
		/*
		*******Flag*******************************************************************************
		*/
		function handleCustomClick(fowContext, cords){
			//console.log("mouse click, write circle");
			//fowContext.globalCompositeOperation = '';
				//	fowContext.fillStyle="red";
					//fowContext.fillRect(cords.x, cords.y, 100, 100);
					//fowContext.fill();
				//http://jsfiddle.net/bnwpS/15/	
				/*
			var canvas = document.createElement('canvas');
			canvas.id     = "CursorLayer";
			canvas.width  = 1224;
			canvas.height = 768;
			canvas.style.zIndex   = 8;
			canvas.style.position = "absolute";
			canvas.style.border   = "1px solid";*/
			var ctx = dmPointCanvas.getContext("2d");
			ctx.fillStyle ="red";
			ctx.fillRect(cords.x, cords.y, 100, 100);
		}
        return {
            create: create,
            toImage: toImage,
            resize: resize,
            remove: remove,
            fitMapToWindow: fitMapToWindow
        };
    }

})
;
	

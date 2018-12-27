var indicatorFlag = false;
define(['settings', 'jquery', 'fow_brush','ind_brush','canvas_zoom','grid'], function (settings, jquery, fow_brush,ind_brush,canvas_zoom,grid) {
    console.log('map module loaded');
    return function () {
        var $ = jquery,
            cursorContext,
            cursorCanvas,
            fowContext,
            fowCanvas,
			fowCanvasStack = [],
			indCanvas,
			dimCanvas,
			dimContext,
			indCanvasStack = [],
			labelMap = new Object(),
			indContext,
            mapImageContext,
			zoomer,
            mapImageCanvas,
			currContext,
            fowBrush,
			gridBrush,
			updateMsg,
			indBrush,
            mapImage,
            width,
            height,
            isDrawing = false,
			currBrush,
            points = [],
			imgUrl,
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

            imgUrl = opts.imgUrl || opts.mapImage;
            var callback = opts.callback || nop;
            var error = opts.error || nop;

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
                container = getContainer();
                canvases = createCanvases();
                parentElem.appendChild(container);
                mapImageCanvas = canvases.mapImageCanvas;
                fowCanvas = canvases.fowCanvas;
                cursorCanvas = canvases.cursorCanvas;
				indCanvas = canvases.indCanvas;
				gridCanvas = canvases.gridCanvas;
				dimCanvas = canvases.dimCanvas;
				zoomer = canvas_zoom(mapImageCanvas,mapImage);
				zoomer.init(cursorCanvas);
                container.appendChild(mapImageCanvas);
                container.appendChild(gridCanvas);
				container.appendChild(indCanvas);
				container.appendChild(fowCanvas);
				container.appendChild(dimCanvas);
                container.appendChild(cursorCanvas);
                mapImageContext = mapImageCanvas.getContext('2d');
				playerDimCanvasOpacity = opts.playerDimCanvasOpacity;
                fowContext = fowCanvas.getContext('2d');
				indContext = indCanvas.getContext('2d');
				gridContext = gridCanvas.getContext('2d');
				dimContext = dimCanvas.getContext('2d');
				gridContext.save();
				gridSlider = document.getElementById("grid_size_input");
                cursorContext = cursorCanvas.getContext('2d');
                copyCanvas(mapImageContext, createImageCanvas(mapImage));
                fowBrush = fow_brush(fowContext,dimContext, opts);
				indBrush = ind_brush(indContext, opts);
				gridBrush = grid();
                fowContext.strokeStyle = fowBrush.getCurrent().dark;
				dimContext.strokeStyle = fowBrush.getCurrent().dim;
				indContext.strokeStyle = indBrush.getCurrent();
				currBrush=fowBrush;
				currContext=fowContext;
                
                createRender();
                setUpDrawingEvents();
                setupCursorTracking();
				zoomer.resetMapImage();
                callback();
            };
            mapImage.crossOrigin = 'Anonymous'; // to prevent tainted canvas errors
            mapImage.src = imgUrl;
        }

		function labelVisibilityChange(){
			
		}
		
		function loadImage(){
			//mapImage = new Image();
			mapImage.onload = function(){
				//mapImageContext.clearRect(0, 0, mapImageCanvas.width, mapImageCanvas.height);
				copyCanvas(mapImageContext, createImageCanvas(mapImage));
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

            return container;
        }

		function saveAllLabels(){
			var savePlayers = document.getElementById('label_sel').innerHTML;
			var saveOthers = document.getElementById('label_sel2').innerHTML;
			setCookie("pLabels",savePlayers,365);//save for 365 days
			
			setCookie("oLabels",saveOthers,365);//save for 365 days
			
			setCookie("labelMap",JSON.stringify(labelMap),365);//save for 7 days
		}
			
		function JSONToLabelMap(json){
			if (json === undefined){
				return new Object();
			}else{
				var tmp = JSON.parse(json); 
				if (tmp != undefined){
					return tmp;
				}else{
					return new Object();
				}
			}
		}
			
		function loadAllLabels(){
			var savePlayers = getCookie("pLabels");
			 document.getElementById('label_sel').innerHTML = savePlayers;
			var saveOthers = getCookie("oLabels");
			document.getElementById('label_sel2').innerHTML = saveOthers;
			labelMap = JSONToLabelMap(getCookie("labelMap"));
			//don't keep the old location of labels
			eraseAllMapLabels();
		}
			
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
		
        function createCanvases() {

            function createCanvas(type, zIndex) {
                var canvas = document.createElement('canvas');

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
                gridCanvas: createCanvas('grid-canvas', 2),
				dimCanvas: createCanvas('dim-canvas', 3),
				indCanvas: createCanvas('indicator-canvas', 4),
				fowCanvas: createCanvas('fow-canvas', 5),
				cursorCanvas: createCanvas('cursor-canvas', 6)
				
				
            };

        }

		function enableLoadingScreen(){
			document.getElementById("loading_screen").setAttribute('class',"modal");
		}
			
		function disableLoadingScreen(){
			document.getElementById("loading_screen").removeAttribute('class');
		}
		
		function setSendIconYellow(){
			document.getElementById("icon-send-state").setAttribute('class',"yellow_dot");
		}
		
		function renderGrid(){
			//enableLoadingScreen();
			//give chance for loading screen to pop up
			//setTimeout(function() {
				squareSize = gridSlider.value
				gridBrush.addGrid(gridCanvas,squareSize,'black');
				gridBrush.setGridAdded(true);
				cursorContext.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
				var rmBtn = document.getElementById('btn-rm-grid');
				rmBtn.style='display: inline-block !important;';
				this.style='display: none';
				createRender();
				//disableLoadingScreen();
			//},0);
		}
		
		
		
        function getMouseCoordinates(e) {
            var viewportOffset = cursorCanvas.getBoundingClientRect(),
                borderTop = parseInt($(cursorCanvas).css('border-top-width')),
                borderLeft = parseInt($(cursorCanvas).css('border-left-width'));

            return {
                x: (e.clientX - viewportOffset.left - borderLeft) / getMapDisplayRatio(),
                y: (e.clientY - viewportOffset.top - borderTop) / getMapDisplayRatio()
            };
        }

        function midPointBtw(p1, p2) {

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
           // context.fillStyle = fillStyle;
            context.fillRect(0, 0, width, height);
            context.restore();
        }
	
		//push state of app onto undo/ctrl-z stack
		function pushCanvasStack(){
			var savePlayers = document.getElementById('label_sel').innerHTML;
			var saveOthers = document.getElementById('label_sel2').innerHTML;
				
			var jsonLabelMap = JSON.stringify(labelMap);
			var stack;
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
			
			//save max of 8 states
			if(stack.length >= 4){
					var objToDelete = stack.shift();
					delete objToDelete.imgData;
					delete objToDelete.jsonLabelMap;
					delete objToDelete;
			}
		
			var imgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
			var dimCanvasImgData = dimContext.getImageData(0, 0, dimCanvas.width, dimCanvas.height);
			
			undoObj.imgData = imgData;
			undoObj.dimImgData = dimCanvasImgData;	
			stack.push(undoObj);
		}
		
        function clearMap(currBrush) {
			if(currBrush == fowBrush){
				
				fowBrush.clearMap(width,height);
			}else if(currBrush == indBrush){
				if(confirm('Are you sure you want to clear away the map labels?')){			
					//erase all labels
					eraseAllMapLabels();
				}
			}
        }

        function resize(displayWidth, displayHeight) {
          /*  fowCanvas.style.width = displayWidth + 'px';
            fowCanvas.style.height = displayHeight + 'px';
			indCanvas.style.width = displayWidth + 'px';
			indCanvas.style.height = displayHeight + 'px';
			gridCanvas.style.width = displayWidth + 'px';
			gridCanvas.style.height = displayHeight + 'px';
            mapImageCanvas.style.width = displayWidth + 'px';
            mapImageCanvas.style.height = displayHeight + 'px';*/
        }

        // Maybe having this here violates cohesion
        function fitMapToWindow() {
            var oldWidth = parseInt(mapImageCanvas.style.width || mapImageCanvas.width, 10),
                oldHeight = parseInt(mapImageCanvas.style.height || mapImageCanvas.height, 10),
                newDims = getOptimalDimensions(oldWidth, oldHeight, window.innerWidth, Infinity);

            resize(newDims.width, newDims.height);
        }

		//merges all canvases into an image
        function toImage() {
			//make sure to take the dim canvas and make it transparent for player (dm side transparent only with css)
			var playerDimCanvas = document.createElement('canvas');
			var pcontext = playerDimCanvas.getContext('2d');
			
			//convert dim pixels to black
			var imageData = dimContext.getImageData(0,0,dimCanvas.width, dimCanvas.height);
			
			//0 is tranparent, 255 is opaque
			var tranparentPixel = playerDimCanvasOpacity  * 255;
			
			for (j=0; j<imageData.data.length; j+=4)
			{
				//blacken the player's pixel only if it exists on canvas
				imageData.data[j]=0;
				imageData.data[j+1]=0;
				imageData.data[j+2]=0;
				
				//only make tranparent if exists
				if(imageData.data[j+3] > 0){
					imageData.data[j+3]=tranparentPixel;
				}
				//imageData.data[j+3]=200;//tranparancy
				
			}

			//set dimensions
			playerDimCanvas.width = dimCanvas.width;
			playerDimCanvas.height = dimCanvas.height;

			//draw dim canvas transparantly for players
			pcontext.putImageData(imageData, 0, 0);
			pcontext.globalAlpha = playerDimCanvasOpacity;
			
			return convertCanvasToImage(mergeCanvas(mapImageCanvas, mergeCanvas(gridCanvas,mergeCanvas(playerDimCanvas,mergeCanvas(indCanvas,fowCanvas)))));
        }

        function remove() {
            // won't work in IE
            mapImageCanvas.remove();
            fowCanvas.remove();
			dimCanvas.remove();
			indCanvas.remove();
			gridCanvas.remove();
        }

        function getMapDisplayRatio() {
         //   return parseFloat(mapImageCanvas.style.width, 10) / mapImageCanvas.width;
		 return 1;
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
		
		function constructIndMask(label) {
			var lineWidth = label.size;
            var maskDimensions = {
                x: label.coords.x,
                y: label.coords.y,
                lineWidth: 2,
                line: '',
                fill: ''
            };

            if (label.brushShape == 'round') {
                maskDimensions.r = lineWidth / 2;
                maskDimensions.startingAngle = 0;
                maskDimensions.endingAngle = Math.PI * 2
            }
            else if (label.brushShape == 'square') {

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
		function handleGridDistance(x,y){

			var squareSize = gridSlider.value;
			gridBrush.handleGridDistance(x,y,cursorCanvas,squareSize);
		}
        function setupCursorTracking() {
			var lineWidth = getLineWidth();
            // Mouse Click
            cursorCanvas.onmousedown = function (e) {
				
				//don't hadnle right clicks
				if(e.which == 3){
					event.preventDefault();
					return false;
				}
				
				pushCanvasStack();
                // Start drawing
                isDrawing = true;

                // Get correct cords from mouse click
                var cords = getMouseCoordinates(e);
				if(currContext===fowContext){
					fowCanvas.drawInitial(cords);
					dimCanvas.drawInitial(cords);
				}else if(currContext===indContext){
					
					//on grid brush?
					if((currBrush == indBrush) && (indBrush.getCurrentBrush() === indBrush.brushTypes[3])){
					//	renderGrid();
						handleGridDistance(cords.x,cords.y);
						//var pt = gridBrush.findCellClicked(cords.x,cords.y,gridSlider.value);
						//console.log("["+pt.row+","+pt.col+"]");
					}else{
						//draw labels
						indCanvas.drawInitial(cords);
					}
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
				
					 fowCanvas.draw(points);
					 dimCanvas.draw(points);
				}else if(currContext==indContext){
				
					indCanvas.draw(points);
				}
               
            };

            cursorCanvas.drawCursor = function (cords) {
				
				//only draw the cursor if not in grid brush
				//are we on grid brush?
				//fog of war canvas?
				if((currBrush == indBrush) && (indBrush.getCurrentBrush() === indBrush.brushTypes[3])){
					return;
				}
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

		function drawInitial (ctx,coords) {
				var lineWidth= getLineWidth();
                // Construct mask dimensions
                var fowMask = constructMask(coords);
                ctx.lineWidth = fowMask.lineWidth;

                ctx.beginPath();
                if (brushShape == 'round') {
                    ctx.arc(
                        fowMask.x,
                        fowMask.y,
                        fowMask.r,
                        fowMask.startingAngle,
                        fowMask.endingAngle,
                        true
                    );
                }
                else if (brushShape == 'square') {
                    ctx.rect(
                        fowMask.centerX,
                        fowMask.centerY,
                        fowMask.height,
                        fowMask.width);
                }

                ctx.fill();
                ctx.stroke();
            }
			
		 function drawPointsOnCanvas(ctx,points) {
				var lineWidth= getLineWidth();
                if (!isDrawing) return;

                var pointPrevious, // the previous point
                    pointCurrent = points[0]; //  the current point

                // For each point create a quadraticCurve btweeen each point
                if (brushShape == 'round') {

                    // Start Path
                    ctx.lineWidth = lineWidth;
                    ctx.lineJoin = ctx.lineCap = 'round';
                    ctx.beginPath();

                    ctx.moveTo(pointCurrent.x, pointCurrent.y);
                    for (var i = 1, len = points.length; i < len; i++) {
                        // Setup points
                        pointCurrent = points[i];
                        pointPrevious = points[i - 1];
                        // Coordinates
                        var midPoint = midPointBtw(pointPrevious, pointCurrent);
                        ctx.quadraticCurveTo(pointPrevious.x, pointPrevious.y, midPoint.x, midPoint.y);
                        ctx.lineTo(pointCurrent.x, pointCurrent.y);
                        ctx.stroke();
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

                    ctx.lineWidth = 1
                    ctx.beginPath();

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
                        ctx.fillRect(
                            fowMask.centerX,
                            fowMask.centerY,
                            fowMask.height,
                            fowMask.width);

                        // optimal polygon to draw to connect two square
                        var optimalPoints = findOptimalRhombus(pointCurrent, pointPrevious);
                        if (optimalPoints) {
                            ctx.moveTo(optimalPoints[0].x, optimalPoints[0].y);
                            ctx.lineTo(optimalPoints[1].x, optimalPoints[1].y);
                            ctx.lineTo(optimalPoints[2].x, optimalPoints[2].y);
                            ctx.lineTo(optimalPoints[3].x, optimalPoints[3].y);
                            ctx.fill();
                        }
                    }
                }
            }

        function setUpDrawingEvents() {
			
            fowCanvas.drawInitial = function (coords) {
				drawInitial(fowContext,coords);
            };

			dimCanvas.drawInitial = function (coords) {
				drawInitial(dimContext,coords);
            };
			
            fowCanvas.draw = function (points) {
				drawPointsOnCanvas(fowContext,points);
            };
	
			dimCanvas.draw = function (points) {
				drawPointsOnCanvas(dimContext,points);
            };
			
			indCanvas.drawInitial = function (coords) {
				//enableLoadingScreen();
				//give chance for loading screen to pop up
				//setTimeout(function() {
					var labelValue = document.getElementById('labelTextInput').value;
					
					var label = labelMap[labelValue]
					
					//label exists?
					if(!(label === undefined)){
						//change the size and shape if dm changed it before drawing
				
						
						if (!(label.coords === undefined)){
							//only erase the label if already on map 
							eraseMapLabel(labelValue);
						}
							
					}else{
						//add the label to map
						saveLabelState(labelValue,coords);	
					}
					
					label = labelMap[labelValue]
					
					var slider = document.getElementById("size_input"); 
					label.size =  slider.value;
					label.brushShape = brushShape;
					
					
					label.coords = coords;
					//label.coords = coords;
					drawLabel(label);
					
					//choose which select pane to add label reference to
					if(label.brushType === 'player'){
						addLabelToList('label_sel',label.coords);
					}else{
						addLabelToList('label_sel2',label.coords);
					}
					
					restoreLabelState(labelValue);
					
            };
			
			//draws text to top right corner of shape
			indCanvas.drawText = function (label,l) {
				var x = label.coords.x;
				var y = label.coords.y;
				var lineWidth= label.size;
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
	
				indContext.save();
				indContext.shadowColor = "black";
				indContext.shadowOffsetX = 3; 
				indContext.shadowOffsetY = 3; 
				indContext.shadowBlur = 1;
				indContext.fillStyle="white"
				indContext.font = (20 + (lineWidth/10))+"px Arial";
				indContext.fillText(label.label,newX,newY);
				indContext.restore();
			}
            indCanvas.draw = function (points) {
            };
			updateMsg = function (){
				var msgdom = document.getElementById('messages');
				if(currBrush == fowBrush){
					var currBrushStr = fowBrush.getCurrentBrush();
					var output = "<li>Current Canvas: <b>Fog of War</b></li><li>Current Brush: <b>"+currBrushStr+"</b></li>";
					msgdom.innerHTML=output;
				}else if (currBrush == indBrush){
					var currBrushStr = indBrush.getCurrentBrush();
					var output = "<li>Current Canvas: <b>Labels</b></li><li>Current Brush: <span style='background:#000000;color:";
					
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
					fowBrush.toggle();
				}else if(currBrush == indBrush){//label canvas?
					indBrush.toggle();
					//are we on grid brush?
					if(indBrush.getCurrentBrush() === indBrush.brushTypes[3]){
						displayTempGrid();
					}else{//remove the grid display 
						cursorContext.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
					}
				}
               updateMsg();
            });
			
			$('#btn-visibility-brush').click(function (){
				
				var labelValue = document.getElementById('labelTextInput').value;
					
				var label = labelMap[labelValue]
				if (document.getElementById('btn-visibility-brush').innerHTML == 'Hide'){
					document.getElementById('btn-visibility-brush').innerHTML = "Reveal";
					label.invisible = true
				}else{
					document.getElementById('btn-visibility-brush').innerHTML = "Hide";
					label.invisible = false
				}
				//update the map with reavealer/hidden label
				indContext.clearRect(0, 0, indCanvas.width, indCanvas.height);
				repaintAllLabels();
			});
			$('#btn-toggle-canvas').click(function() {
				
				//swapping to label/indicator canvas?
				if(currBrush == fowBrush){
					
					//we on grid brush?
					if(indBrush.getCurrentBrush() === indBrush.brushTypes[3]){
						
						var btns = document.getElementById('grid-btns');
						btns.style='display: inline-block !important;';
						btns = document.getElementById('label-btns');
						btns.style='display: none';
						displayTempGrid();
					}else{
						btns = document.getElementById('label-btns');
						btns.style='display: inline-block !important;';
					}
					
					//swap to indicator canvas
					currBrush = indBrush;
					currContext = indContext;
					
					//show the label canvas inputs
					var dom = document.getElementById('btn-dark-all');
					dom.style='display: none';
					dom = document.getElementById('btn-dim-all');
					dom.style='display: none';
					dom = document.getElementById('labelText');
					dom.style='display: inline-block !important;';
					dom = document.getElementById('labelTextInput');
					dom.style='display: inline-block !important;';
					dom = document.getElementById('label_mng_container');
					dom.style='display: block !important;';
					
					indBrush.currentBrushType=indBrush.brushTypes[0];
					
				}else if(currBrush == indBrush){ //swappin got fog of war canvas?

					//hide the grid inputs
					var btns = document.getElementById('grid-btns');
					btns.style='display: none';
					btns = document.getElementById('label-btns');
					btns.style='display: inline-block !important;';
					
					currBrush = fowBrush;
					currContext=fowContext;
					
					//hide the label inputs
					var dom = document.getElementById('btn-dark-all');
					dom.style='';
					dom = document.getElementById('btn-dim-all');
					dom.style='';
					dom = document.getElementById('labelText');
					dom.style='display: none !important;';
					dom = document.getElementById('labelTextInput');
					dom.style='display: none !important;';
					dom = document.getElementById('label_mng_container');
					dom.style='display: none !important;';
					
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
						var undoItem = fowCanvasStack.pop();
						ctx.putImageData(undoItem.imgData, 0, 0);
						dimContext.putImageData(undoItem.dimImgData, 0, 0);
						createRender();
					}
				}else if(currBrush == indBrush){
					if(indCanvasStack.length >=1){
						var ctx = indCanvas.getContext('2d');

						var undoObj = indCanvasStack.pop();
						document.getElementById('label_sel').innerHTML = undoObj.savePlayers;						
						document.getElementById('label_sel2').innerHTML = undoObj.saveOthers;
						labelMap = JSONToLabelMap(undoObj.jsonLabelMap);
						
						ctx.putImageData(undoObj.imgData, 0, 0);
						createRender();
					}
				}
			}

				
		function dimMap(){
			//fowContext.save();
			dimContext.save();
			fowBrush.clearMap(width,height);
			var dimIx = fowBrush.getDimIx();
			var fillStyle = fowBrush.getPattern(dimIx);

			
			dimContext.fillStyle = fillStyle.dim;
			//fowContext.fillStyle = fillStyle.dark;
           // context.fillStyle = fillStyle;
            dimContext.fillRect(0, 0, width, height);
            dimContext.restore();
			
			
			//fowContext.fillStyle = fillStyle.dark;
			//fowContext.fillRect(0, 0, width, height);
            //fowContext.restore();
		}
		
		function fogMap(){
			dimContext.save();
			fowContext.save();
			//fowBrush.clearMap(width,height);
			var darkIx = fowBrush.getDarkIx();
			var fillStyle = fowBrush.getPattern(darkIx);
			
			dimContext.fillStyle = fillStyle.dim;
			fowContext.fillStyle = fillStyle.dark;
            
            dimContext.fillRect(0, 0, width, height);
            fowContext.fillRect(0, 0, width, height);
            dimContext.restore();
            fowContext.restore();
		}
		
            $('#btn-dark-all').click(function () {
                pushCanvasStack();
				fogMap();
            });
			
			
			$('#btn-dim-all').click(function () {
                pushCanvasStack();
				dimMap();
            });

			//clear map
            $('#btn-clear-all').click(function () {			
				pushCanvasStack();			
				clearMap(currBrush);              				
                createRender();
            });
			
			$('#btn-undo').click(function () {				
				undo();			
            });

			//update the width of cursor when slide bar size changed
            $('#size_input').click(function () {
				var slider = document.getElementById("size_input");
				lineWidth = slider.value;
            });
			
            $('#btn-enlarge-brush').click(function () {
                // If the new width would be over 200, set it to 200
				var slider = document.getElementById("size_input");
				slider.value = parseInt(slider.value)+10;
				lineWidth = slider.value;
            });
			
			
			//erase label from label canvas
			function eraseMapLabel(label){
					
				if((label === undefined) || (labelMap[label] === undefined)){
					return;
				}
				var labelObj = labelMap[label];				
				pushCanvasStack();
				
				indContext.clearRect(0, 0, indCanvas.width, indCanvas.height);
					
				
				
			/*	if (labelObj.coords === undefined){
					return;
				}*/
				labelObj.coords = undefined;
				//repaint all but removed label
				repaintAllLabels();
				
				//restoreLabelState(label);	
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
				
				//choose label color
				if(indBrush.getCurrentBrush() === 'player'){
					option.style = "color:#42f445;";	
				}else if(indBrush.getCurrentBrush() === 'enemy'){
					option.style = "color:red;";
				}else if(indBrush.getCurrentBrush() === 'target'){
					option.style = "color:yellow;";
				}else{
					console.log("error, indicator brush has invalid drawing brush");
					option.style = "color:white;";
				}
				
				//add nubmer of clicks, 0 initially
				option.data=0;
				e.add(option);
				
				//add options to keep size and the brush so when click on it, it loads the buddy
				saveLabelState(label,coords);
			}
			
			//saves the labels as cookie
			function saveLabelState(label,coords){
				
				var slider = document.getElementById("size_input");
				var size = slider.value;
				var invisible = false;	
				
				if (document.getElementById('btn-visibility-brush').innerHTML == 'Reveal'){
					invisible=true;
				}
				
				var token = new Object();
				token.size = size;
				token.label = label;
				token.brushType = indBrush.getCurrentBrush();
				token.brushShape = brushShape;
				token.coords = coords;
				token.invisible = invisible;
				labelMap[label] = token;
			}
			
			//sets the ui elements given a label (size, squre/circle brush, type...)
			function restoreLabelState(label){
				
					var token = labelMap[label];
					
					if(token === undefined){
						return;
					}
					
					var newsize = token.size;
					var newbrushType = token.brushType;
					var newbrushShape = token.brushShape;
					
					if (token.invisible == true){
						document.getElementById('btn-visibility-brush').innerHTML = 'Reveal';
					}else{
						document.getElementById('btn-visibility-brush').innerHTML = 'Hide';
					}
					//make sure brushshape is round or square
					if((token.brushShape === 'round') || (token.brushShape === 'square')){
						brushShape = token.brushShape;
					}else{
						//error brush type
						console.log("error brush shape lookup");
						return;
					}

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
			
			//gets name of selected label given selection pane id
			function getSelectedLabel(selectId){
				var e = document.getElementById(selectId);
				if(e.options[e.selectedIndex] === undefined){
					return;
				}
				return e.options[e.selectedIndex].value;
			}
			
			$('#label_sel').click(function () {
				
				var label = getSelectedLabel('label_sel');
				if(label !== undefined){
					restoreLabelState(label);
				}	
            });
			
			$('#label_sel2').click(function () {
				
				var label = getSelectedLabel('label_sel2');
				if(label !== undefined){
					restoreLabelState(label);
				}
            });
			
			$('#label_sel').dblclick(function () {
				//enableLoadingScreen();			
				//give chance for loading screen to pop up
				//setTimeout(function() {
					var label = getSelectedLabel('label_sel');
					if(label !== undefined){
						eraseMapLabel(label);
					}
					//disableLoadingScreen();
				//},0);
            });
			
			$('#label_sel2').dblclick(function () {
				//enableLoadingScreen();			
				//give chance for loading screen to pop up
				//setTimeout(function() {
					var label = getSelectedLabel('label_sel2');
					if(label !== undefined){
						eraseMapLabel(label);
					}
					//disableLoadingScreen();
				//},0);
            });
			
			$('#btn-fix-map').click(function() {
				console.log("reload map.")
				loadImage();
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
				if((label === undefined) || (dom_id === undefined)){
					return false;
				}
				
				if(!confirm('Are you sure you want to delete the label "'+label+'" from the list?')){
					return;
				}
				//enableLoadingScreen();
				//give chance for loading screen to pop up
				//setTimeout(function() {
					var targetIndex = findLabelIndex(label,dom_id);		
					
					var selection = document.getElementById(dom_id);
					var options = selection.options;
					
					selection.removeChild(options[targetIndex]);
					//erase the label first
					eraseMapLabel(label);
					labelMap[label] = undefined;			
					//disableLoadingScreen();
				//},0);
				return false;	
			}
				
			$('#label_sel').contextmenu(function(e,h) {
				//erase the label first
				var label = e.target.value;
				removeLabelFromSelect(e.target.value,'label_sel');
			
				return false;
			});
			
			$('#label_sel2').contextmenu(function(e,h) {
				//erase the label first
				var label = e.target.value;
				removeLabelFromSelect(e.target.value,'label_sel2');
				return false;
			});
			
			function displayTempGrid(){
				//only display blue grid that will be painted if added if no grid on map
				if(!gridBrush.hasGrid()){
					squareSize = gridSlider.value;
					gridBrush.addGrid(cursorCanvas,squareSize,undefined);

				}
			}
			
            $('#btn-shrink-brush').click(function () {
				var slider = document.getElementById("size_input");
				slider.value = parseInt(slider.value)-10;
				lineWidth = slider.value;
            });
			
			$('#btn-smaller-grid').click(function () {
				var slider = document.getElementById("grid_size_input");
				slider.value = parseInt(slider.value)-1;
				displayTempGrid();
            });
			
			$('#btn-bigger-grid').click(function () {
				var slider = document.getElementById("grid_size_input");
				slider.value = parseInt(slider.value)+1;
				displayTempGrid();
            });
			
			$('#btn-add-grid').click(function () {	
				renderGrid();
            });
			
			$('#btn-rm-grid').click(function () {
				
				gridBrush.setGridAdded(false);
				gridContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
				var addBtn = document.getElementById('btn-add-grid');
				addBtn.style='display: inline-block !important;';
				this.style='display: none';
				createRender();
				displayTempGrid();
            });
					
			//size of grid changed, display the light blue candidate grid?
			gridSlider.onchange = function(e){		
				displayTempGrid();
			}
			
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
						//get label value and remove from map
						labelMap[selection.firstChild.innerHTML] = undefined;						
						selection.removeChild(selection.firstChild);
					}
				}
			}
			
			$('#btn-clear-other-labels').click(function () {
				pushCanvasStack();
                clearLabelSelections('label_sel2');
				indContext.clearRect(0, 0, indCanvas.width, indCanvas.height);
				repaintAllLabels();
            });

			$('#btn-clear-player-labels').click(function () {
				pushCanvasStack();
                clearLabelSelections('label_sel');				
				indContext.clearRect(0, 0, indCanvas.width, indCanvas.height);
				repaintAllLabels();
            });
			document.addEventListener('contextmenu', event => event.preventDefault());
            document.addEventListener('mouseup', function (e) {
			    stopDrawing();	
            });
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
			setSendIconYellow();
        }
		
			//repaints all the labels
			function repaintAllLabels(){
				//enableLoadingScreen();
				//give chance for loading screen to pop up
				//setTimeout(function() {
					repaintLabels(undefined);	
					//disableLoadingScreen();
				//},0);
			}
			
				//repaints a label except...
			function repaintLabels(exception){
				for (var label in labelMap){				
					if (labelMap.hasOwnProperty(label)) {						
						var labelObj = labelMap[label];
						//not label to erase?
						if(!(labelObj === undefined)){
							if(!(label === exception)){
							//only if wasn't erased
								if(!(labelObj.coords === undefined)){
									drawLabel(labelObj);								
								}else{
									
									labelObj.coords = undefined;
									
								}// end ifmake sure the label hasn't already been erase
							}//end if ignore label to erase
						}//end if make sure it hasn't been delete
					}
				}
				createRender();
			}
			
			
		function drawLabel(label){

				//save the state o
				if (label.coords === undefined){
					return;
				}
				var lineWidth = label.size;
                // Construct mask dimensions
                var fowMask = constructIndMask(label);
                indContext.lineWidth = fowMask.lineWidth;
				var l =0;
                indContext.beginPath();
                if (label.brushShape == 'round') {
                    indContext.arc(
                        fowMask.x,
                        fowMask.y,
                        fowMask.r,
                        fowMask.startingAngle,
                        fowMask.endingAngle,
                        true
                    );
					l=fowMask.r;
                }
                else if (label.brushShape == 'square') {
                    indContext.rect(
                        fowMask.centerX,
                        fowMask.centerY,
                        fowMask.height,
                        fowMask.width);
					l=fowMask.height/2;
                }
				
				//var currBrushStr = indBrush.getCurrentBrush();
				
				
				var strokeStyle = indBrush.getPattern(label.brushType);
				if (label.invisible == true){
					indContext.setLineDash([5]);
				}else{
					indContext.setLineDash([]);
				}
				indContext.strokeStyle = strokeStyle
                indContext.stroke();
				indCanvas.drawText(label,l);
			}
			
			function createRender2() {
				removeRender();
				indContext.clearRect(0, 0, indCanvas.width, indCanvas.height);
				for (var label in labelMap){				
					if (labelMap.hasOwnProperty(label)) {						
						var labelObj = labelMap[label];
						//not label to erase?
						if(!(labelObj === undefined)){
							if(labelObj.invisible === false){
							//only if wasn't erased
								if(!(labelObj.coords === undefined)){
									drawLabel(labelObj);								
								}else{
									
									labelObj.coords = undefined;
									
								}// end ifmake sure the label hasn't already been erase
							}//end if ignore label to erase
						}//end if make sure it hasn't been delete
					}
				}
					createRender();
				createPlayerMapImage(mapImageCanvas, fowCanvas);
			}
			
			
			
			
		function repaintAllHiddenLabels(){
			indContext.clearRect(0, 0, indCanvas.width, indCanvas.height);
			repaintAllLabels();
		}
        function removeRender() {
            $('#render').remove();
        }

        function createPlayerMapImage(bottomCanvas, topCanvas) {
			var mergedImage = toImage();

            mergedImage.id = 'render';

            //todo: refactor this functionality outside
            document.querySelector('#map-wrapper').appendChild(mergedImage);
        }
		
		function getZoomer(){
			return zoomer;
		}

        return {
            create: create,
			createRender2: createRender2,
            toImage: toImage,
            resize: resize,
            remove: remove,
			repaintAllHiddenLabels: repaintAllHiddenLabels,
            fitMapToWindow: fitMapToWindow,
			loadAllLabels: loadAllLabels,
			saveAllLabels: saveAllLabels,
			getZoomer: getZoomer
        };
    }

})
;
	

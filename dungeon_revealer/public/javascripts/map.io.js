define(function () {
    console.log('map.io.js starting');

    return function () {
        console.log('creating map io object');

		var objectOutputFile = 'dungeon-revealer.map',
			fow_brush,
			indCanvasIndex = 'indCanvas',
			labelMapIndex = 'labelMap',
			fowCanvasIndex = 'fowCanvas',
			dimCanvasIndex = 'dimCanvas',
			gridCanvasIndex = 'gridCanvas',
			mapImageCanvasIndex = 'mapImageCanvas',
			mapImageIndex = 'mapImage',
			gridIndex = 'grid',
			zoomerIndex = 'zoomer',
			selectionPanePlayersId = 'label_sel',
			selectionPaneOthersId = 'label_sel2',
			width,
			height,
			fowCanvas,
			dimCanvas,
			indCanvas,
			gridCanvas,
			mapImageCanvas,
			zoomer,
			labelMap,
			fow_brush,
			grid,
			mapImage,
		init = function(_width,_height,_fowCanvas,_dimCanvas,_indCanvas,_gridCanvas,_mapImageCanvas, _zoomer, _fow_brush,_grid,_mapImage,_labelMap){
			width=_width;
			height=_height;
			fowCanvas=_fowCanvas;
			dimCanvas=_dimCanvas;
			indCanvas=_indCanvas;
			gridCanvas=_gridCanvas;
			mapImageCanvas=_mapImageCanvas;
			zoomer=_zoomer;
			fow_brush = _fow_brush;
			grid = _grid;
			mapImage=_mapImage;
			labelMap=_labelMap;
		},
		
		createFOWCallbackObject = function(canvas,canvasIndex,brushType){
			 
			var obj = new Object();
			obj.canvas = canvas;
			obj.index = canvasIndex;
			obj.globalCompositeOperation = 'source-out';
			var ctx  = canvas.getContext('2d');
			ctx.save();
			//set up the fog of war brush so its ready to draw when loadin fow image
			//var type = fow_brush.getCurrentBrushTypeEnum();
			//fow_brush.setBrushType(fow_brush.getDarkIx());
			
			var strokeStyle = fow_brush.getPattern(brushType);
			if(brushType == fow_brush.getDarkIx()){
				ctx.strokeStyle = strokeStyle.dark;
				ctx.fillStyle = strokeStyle.dark;
			}else if(brushType == fow_brush.getDimIx()){
				ctx.strokeStyle = strokeStyle.dim;
				ctx.fillStyle = strokeStyle.dim;
			}else{
				console.log("illegal brush type in create fow callback object")
			}
			
			return obj;
		}
		loadAll = function(file){
			readObjectFromFile(file,onFileRead);
		},
		saveAll = function(){
			var obj = new Object();
			obj[indCanvasIndex] = indCanvas.toDataURL('image/png');
			obj[mapImageCanvasIndex] = mapImageCanvas.toDataURL('image/png');
			obj[fowCanvasIndex] = fowCanvas.toDataURL('image/png');
			obj[dimCanvasIndex] = dimCanvas.toDataURL('image/png');
			obj[gridCanvasIndex] = gridCanvas.toDataURL('image/png');
			obj[mapImageIndex] = mapImage.src;
			obj[labelMapIndex] = labelMap;
			obj[zoomerIndex] = zoomer.getAttributes();
			obj[gridIndex] = grid.getAttributes();		
			writeObjectToFile(objectOutputFile,obj);
		},
		loadGrid = function(inputData){
		//	debugger;
			//load the grid object
			var newGridAttributes = inputData[gridIndex];
			
			var hasGrid = newGridAttributes.addedGrid;
			
			grid.removeGridNoRender();
			
			if(hasGrid){
				grid.setSliderSize(newGridAttributes.currentSquareSize);
				grid.addGridNoRender();
				//gridSlider.disabled = true;
				//squareSize = gridSlider.value;
				//setCurrentSquareSize(squareSize);
				//addGrid(gridCanvas,squareSize,'black');
				//setGridAdded(true);
				//cursorContext.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
				//hideAddButton();
				//revealRemoveButton();
			}
			//grid.renderGrid();
		},
		loadMapImage = function(file, callback){
			
			readObjectFromFile(file, function(inputData){
				
				var imageURLData = inputData[mapImageIndex];
				callback(imageURLData);
			});
		},
		onFileRead = function(inputData){//called when file loaded
			
			console.log('loading map');
			var ctx;
			//map image
			var obj = new Object();
			
			
			//label map
		
			obj.labelMap =labelMap;
			obj.index = labelMapIndex;
			loadLabelMap(inputData,obj);
			
			loadGrid(inputData);
			
			obj = new Object();
			obj.canvas = mapImageCanvas;
			obj.index = mapImageCanvasIndex;
			obj.globalCompositeOperation = 'copy';
			
			canvasCallback(inputData,obj, function (){//call back when done loading will call the below
				 ctx = mapImageCanvas.getContext('2d');
				 ctx.restore();
				//fog of war (dark-light)
				obj = createFOWCallbackObject(fowCanvas,fowCanvasIndex,fow_brush.getDarkIx());
				canvasCallback(inputData,obj, function(){
					ctx = fowCanvas.getContext('2d');
					ctx.restore();
					//fog of war (dim-light)
					obj = createFOWCallbackObject(dimCanvas,dimCanvasIndex,fow_brush.getDimIx());
					canvasCallback(inputData,obj,function (){
						ctx = dimCanvas.getContext('2d');
						ctx.restore();
							
						
							
						//label canvas
						obj = new Object();
						obj.canvas = indCanvas;
						obj.index = indCanvasIndex;
						obj.globalCompositeOperation = 'copy';
						canvasCallback(inputData,obj, function(){
							ctx.restore();
							obj = new Object();
							obj.canvas = gridCanvas;
							obj.index = gridCanvasIndex;
							obj.globalCompositeOperation = 'copy';
							canvasCallback(inputData,obj, function(){
								ctx.restore();

								//zoomer
								ctx.save()
									obj = new Object();
									obj.index = zoomerIndex;
									console.log("calling zoomer callback");
									
									zoomerCallback(inputData,obj);
									ctx.restore();
									//disable loading screen
									document.getElementById("loading_screen").removeAttribute('class');
							});
						});//end label canvas callback
					});//end of dim brush
				});//end dark fog of war canvas callback
			});//end mpa image canvas call back
		},
		writeObjectToFile = function(outputFilePath,obj){
			saveByteArray([new Blob([JSON.stringify(obj)])],outputFilePath);
		},
		readObjectFromFile = function(inputFilePath,callback){
			var reader = new FileReader();
			
			  reader.onload = function(e) {
				  //the json string
				var contents = e.target.result;
				callback(JSON.parse(contents));
				
			  };
			  reader.readAsText(inputFilePath);				  		
		},
		canvasCallback = function(inputData,userObject, callback){
				
			var canvas = userObject.canvas;
			var index = userObject.index;
			var dataUrl = inputData[index];

			var ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			//save ctx
			ctx.save()
			
			//now change the drawing type to 'copy' so new image replaces old canvas
			//see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
			ctx.globalCompostieOperation = userObject.globalCompositeOperation;
			var img = new Image();
			img.onload = function() {
				
				ctx.drawImage(img,0,0,width,height);
				callback();
				
			};
			img.src = dataUrl;						
		},
		
		zoomerCallback = function(inputData,userObject){

			var index = userObject.index;
			
			var newZoomerAttributes = inputData[index];
			
			//copy all attributes of zoomer in file to the current map zoomer
			zoomer.setAttributes(newZoomerAttributes);
			
			zoomer.redrawHistory();

		},
		loadLabelMap = function(inputData,userObject){
			var labelMap = userObject.labelMap;
			var index = userObject.index;
			
			//clear the label map
			for (var label in labelMap){
				
				if(label !== undefined){
					labelMap[label] = undefined;
				}
			}
			
			var newLabelMap = inputData[index];
			
			//delete the ui entries of label
			var selection = document.getElementById(selectionPanePlayersId);

				while (selection.firstChild) {
					//get label value and remove from map				
					selection.removeChild(selection.firstChild);
				}
			//delete the ui entries of label
			var selection = document.getElementById(selectionPaneOthersId);

				while (selection.firstChild) {
					//get label value and remove from map					
					selection.removeChild(selection.firstChild);
				}
				
			for (var label in newLabelMap){
				
				
				if(label !== undefined){
					
					var token = newLabelMap[label];
					var dom_id = (token.brushType === "player") ? selectionPanePlayersId : selectionPaneOthersId;//choose dom based on label type
					var e = document.getElementById(dom_id);
					var options = e.options;				
					
					var option = document.createElement("option");
					option.text = label;
					
					//choose label color
					if(token.brushType === 'player'){
						option.style = "color:#42f445;";	
					}else if(token.brushType === 'enemy'){
						option.style = "color:red;";
					}else if(token.brushType === 'target'){
						option.style = "color:yellow;";
					}else{
						console.log("error, indicator brush has invalid drawing brush");
						option.style = "color:white;";
					}
					
					
					e.add(option);
					
					labelMap[label] = token;
				}
			}			
		},
		
		saveByteArray = (function () {
			
			var a = document.createElement("a");
			document.body.appendChild(a);
			a.style = "display: none";
			return function (data, name) {
				console.log("saving "+data+" to by array");
				var blob = new Blob(data, {type: "octet/stream"}),
					url = window.URL.createObjectURL(blob);
				a.href = url;
				a.download = name;
				a.click();
				window.URL.revokeObjectURL(url);
			};
		}()),
		base64ToArrayBuffer = function (base64) {
			console.log("base64 to arrya buffer...");
			var binaryString =  window.atob(base64);
			var binaryLen = binaryString.length;
			var bytes = new Uint8Array(binaryLen);
			for (var i = 0; i < binaryLen; i++)        {
				var ascii = binaryString.charCodeAt(i);
				bytes[i] = ascii;
			}
			return bytes;
		}
				
				
		return {
				loadAll: loadAll,
				saveAll: saveAll,
				init: init,
				loadMapImage: loadMapImage
		}
    };
});


	
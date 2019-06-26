define(function () {
    console.log('map.io.js starting');

    return function () {
        console.log('creating map io object');

		var objectOutputFile = 'dungeon-revealer.json',
			fow_brush,
			indCanvasIndex = 'indCanvas',
			labelMapIndex = 'labelMap',
			fowCanvasIndex = 'fowCanvas',
			dimCanvasIndex = 'dimCanvas',
			gridCanvasIndex = 'gridCanvas',
			mapImageCanvasIndex = 'mapImageCanvas',
			zoomerIndex = 'zoomer',
			selectionPanePlayersId = 'label_sel',
			selectionPaneOthersId = 'label_sel2',
		setFowBrush = function(_fow_brush){
			fow_brush = _fow_brush;
		},
		loadAll = function(file,width,height,fowCanvas,dimCanvas,indCanvas,gridCanvas,mapImageCanvas,labelMap, zoomer){
			
			console.log('loading map');
			
			//map image
			var obj = new Object();
			obj.canvas = mapImageCanvas;
			obj.index = mapImageCanvasIndex;
			obj.height = height;
			obj.width = width;
			obj.globalCompositeOperation = 'copy';
			readObjectFromFile(file,canvasCallback,obj);
			 
			//fog of war (dark-light)
			obj = new Object();
			obj.canvas = fowCanvas;
			obj.index = fowCanvasIndex;
			obj.height = height;
			obj.width = width;
			obj.globalCompositeOperation = 'source-out';
			var darkCanvasContext  = fowCanvas.getContext('2d');
			darkCanvasContext.save();
			obj.onImageDraw = function(){
				darkCanvasContext.restore()
			}
			//set up the fog of war brush so its ready to draw when loadin fow image
			//var type = fow_brush.getCurrentBrushTypeEnum();
			//fow_brush.setBrushType(fow_brush.getDarkIx());
			
			var strokeStyle = fow_brush.getPattern(fow_brush.getDarkIx());
			
			darkCanvasContext.strokeStyle = strokeStyle.dark;
			darkCanvasContext.fillStyle = strokeStyle.dark;
			readObjectFromFile(file,canvasCallback,obj);
			
			//put the brush back to normal
			//fow_brush.setBrushType(type);
			
			//label map
			obj = new Object();
			obj.labelMap =labelMap;
			obj.index = labelMapIndex;
			readObjectFromFile(file,labelsCallback,obj);
			
			//zoomer
			obj = new Object();
			obj.zoomer =zoomer;
			obj.index = zoomerIndex;
			obj.mapImageCanvas = mapImageCanvas;
			readObjectFromFile(file,zoomerCallback,obj);
			
			//label canvas
			obj = new Object();
			obj.canvas = indCanvas;
			obj.index = indCanvasIndex;
			obj.height = height;
			obj.width = width;
			obj.globalCompositeOperation = 'copy';
			readObjectFromFile(file,canvasCallback,obj);
			
			
			window.alert("Map Successfully loaded");
		},
		saveAll = function(width,height,fowCanvas,dimCanvas,indCanvas,gridCanvas,mapImageCanvas,labelMap,zoomer){
			console.log('saving dungeon revealer states');
			var obj = new Object();
			obj[indCanvasIndex] = indCanvas.toDataURL('image/png');
			obj[mapImageCanvasIndex] = mapImageCanvas.toDataURL('image/png');
			obj[fowCanvasIndex] = fowCanvas.toDataURL('image/png');
			obj[labelMapIndex] = labelMap;
			obj[zoomerIndex] = zoomer;
			writeObjectToFile(objectOutputFile,obj);
		},
		writeObjectToFile = function(outputFilePath,obj){
			saveByteArray([new Blob([JSON.stringify(obj)])],outputFilePath);
		},
		readObjectFromFile = function(inputFilePath,callback,userObj){//userObj is given as argument to callback
			console.log('reading '+inputFilePath);
			var reader = new FileReader();
			
			  reader.onload = function(e) {
				  //the json string
				var contents = e.target.result;
				callback(JSON.parse(contents),userObj);
				
			  };
			  reader.readAsText(inputFilePath);				  		
		},
		canvasCallback = function(inputData,userObject){
				
			var canvas = userObject.canvas;
			var index = userObject.index;
			var width = userObject.width;
			var height = userObject.height;
			var onImageDraw = userObject.onImageDraw;
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
				if(onImageDraw !== undefined){
					onImageDraw();
				}
			};
			img.src = dataUrl;						
		
			ctx.restore();
		},
		
		zoomerCallback = function(inputData,userObject){
			
			var zoomer = userObject.zoomer;
		//	var mapImageCanvas = userObject.mapImageCanvas;
			var index = userObject.index;
			
			var newZoomer = inputData[index];
			
			//copy all attributes of zoomer in file to the current map zoomer
			zoomer.copy(newZoomer);
			
		},
		labelsCallback = function(inputData,userObject){
			
			var labelMap = userObject.labelMap;
			var index = userObject.index;
			
			//clear the label map
			for (var label in labelMap){
				if(label !== undefined){
					labelMap[label] = undefined;
				}
			}
			
			var newLabelMap = inputData[index];
		//	newLabelMap = JSON.parse(newLabelMap);
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
				
				
				//add nubmer of clicks, 0 initially
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
				setFowBrush: setFowBrush
		}
    };
});


	
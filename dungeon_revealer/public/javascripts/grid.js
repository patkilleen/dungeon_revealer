define(function () {
    console.log('grid.js starting');

    return function ($,opts, _cursorCanvas,_gridCanvas, _createRender) {
        console.log('creating grid object');

		
			
            
        var x1,y1,
			addedGrid=false,
			currentSquareSize,
			cursorCanvas = _cursorCanvas,
			cursorContext = cursorCanvas.getContext('2d'),
			gridSlider = document.getElementById("grid_size_input"),
			gridCanvas = _gridCanvas,
			gridContext = gridCanvas.getContext('2d'),
			createRender = _createRender,
			addGrid = function (canvas,squareSize,color){
				var numCols = canvas.width/squareSize;
				var numRows = canvas.height/squareSize;
				var context = canvas.getContext('2d');

				context.save();
				context.beginPath();
				if(color != undefined){
					context.strokeStyle = color;
				}		
				var row = 0;
				var col = 0;
				context.clearRect(0, 0, canvas.width, canvas.height);
				while (row < numRows){
					col=0;
					while (col < numCols){
						context.rect(col*squareSize, row*squareSize, squareSize, squareSize);
						col++;
					}
					row++;
				}
				context.stroke();
				context.restore();
			},
			getAttributes=function(){
				return{addedGrid:addedGrid,
						currentSquareSize,currentSquareSize
					};
			},
			displayTempGridFromSliderSize = function(){
				displayTempGrid(gridSlider.value,cursorCanvas)
			},
			displayTempGrid = function(squareSize,_cursorCanvas){
				//only display blue grid that will be painted if added if no grid on map
				if(!hasGrid()){
					addGrid(_cursorCanvas,squareSize,undefined);
				}
			},
			setCurrentSquareSize = function(squareSize){
				currentSquareSize = squareSize;
			},
			setSliderSize = function(squareSize){
				gridSlider.value = squareSize;
			},
			getSliderSize = function(){
				return gridSlider.value;
			},
			getCurrentSquareSize = function(){
				return currentSquareSize;
			},
			handleGridDistance = function(x,y){
				
				var squareSize;
				if(hasGrid()){
					squareSize = currentSquareSize;
				}else{
					squareSize = gridSlider.value;
				}
				
				
				
				var dist = distanceFromLastClick(x,y,squareSize);
				if(dist == -1){
					addPointClicked(x,y);
					if(hasGrid()){
						cursorCanvas.getContext('2d').clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
						highlightCell(cursorCanvas,x,y,squareSize);
					}else{
						displayTempGrid(squareSize,cursorCanvas);
						//only color with specifide color if not added grid
						var color = 'rgba(' + opts.gridSelectedRGB + ',' + opts.gridSelectedOpacity + ')';
						highlightCell(cursorCanvas,x,y,squareSize,color);
					}
				}else{
					alert("Distance between these cells is  "+(Math.ceil(dist/5)*5)+" ft (5ft squares).");
					clearPointClicked();
					
					//do we have a grid?
					if(hasGrid()){
						highlightCell(cursorCanvas,x,y,squareSize);
					}else{
						//only color with specifide color if not added grid
						var color = 'rgba(' + opts.gridSelectedRGB + ',' + opts.gridSelectedOpacity + ')';
						highlightCell(cursorCanvas,x,y,squareSize,color);
					}
				}
			},
			highlightCell = function(canvas,x,y,squareSize,color){
				
				var cell = findCellClicked(x,y,squareSize);
				var context = canvas.getContext('2d');
				
				context.save();
				context.beginPath();
				if(color != undefined){
					context.strokeStyle = color;
				}				
				context.rect(cell.col*squareSize, cell.row*squareSize, squareSize, squareSize);
				
				context.stroke();
				context.restore();
			},
			//identifies row and column clicked
			findCellClicked = function (x,y, squareSize){
				return{
					row: Math.floor(y/squareSize),
					col: Math.floor(x/squareSize)
				}
			},
			addPointClicked = function(x,y){
				x1 = x;
				y1 = y;
			},
			distanceFromLastClick = function(x,y,squareSize){
				if(!x1){
					return -1;
				}
				
				var pt1 = findCellClicked(x1,y1,squareSize);
				var pt2 = findCellClicked(x,y,squareSize);
				
				var a = pt1.row - pt2.row;
				var b = pt1.col - pt2.col;

				//assuming 5ft squares
				a=a*5;
				b=b*5;
				//clear the last clicked point
				
				return Math.sqrt(a*a + b*b);
			},
			clearPointClicked = function(){
				x1 = undefined;
				y1 = undefined;
			},
			getPointClicked = function(){
				var pt = new Object();
				pt.x = x1;
				pt.y = y1;
				return pt;
			},
			setGridAdded = function(flag){
				addedGrid=flag
			},
			hasGrid = function(){
				return addedGrid;
			},
			renderGrid = function (){
				addGridNoRender();
				addGrid(gridCanvas,squareSize,'black');
				cursorContext.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
				createRender();
			},
			addGridNoRender = function(){
				gridSlider.disabled = true;
				squareSize = gridSlider.value;
				setCurrentSquareSize(squareSize);		
				setGridAdded(true);
				hideAddButton();
				revealRemoveButton();	
			},
		hideRemoveButton = function(){
			var rmBtn = document.getElementById('btn-rm-grid');
			rmBtn.style='display: none';
		},
		revealRemoveButton = function(){
			var rmBtn = document.getElementById('btn-rm-grid');
			rmBtn.style='display: inline-block !important;';
		},
		revealAddButton = function(){
			var b= document.getElementById('btn-add-grid');
			b.style='display: inline-block !important;';
		},
		hideAddButton = function(){
			var b = document.getElementById('btn-add-grid');
			b.style='display: none';
		},
		removeGridNoRender = function(){
			setGridAdded(false);
			gridSlider.disabled = false;
			gridContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
			hideRemoveButton();
			revealAddButton();
		}
		removeGrid = function(){
			removeGridNoRender();
			createRender();
			displayTempGridFromSliderSize();
		},
		
		hideGridButtons = function(){
			var btns = document.getElementById('grid-btns');
					btns.style='display: none';
		},
		
		displayGridButtons = function(){
			var btns = document.getElementById('grid-btns');
						btns.style='display: inline-block !important;';				
		},


			
			$('#brush_size_ft').change(function () {
				
				//if(addedGrid == false){
					//	window.alert("Grid must be added");
					//return;
				//}
				
				var slider = document.getElementById("size_input");
				
				var brushFtInput =  document.getElementById("brush_size_ft");
				var numSquares = brushFtInput.value/5;//convert 5fts to number of squares
				
				var gridCellSize = document.getElementById("grid_size_input").value;
					
				//convert to pixels
				var pixels = gridCellSize * numSquares;
				
				slider.value = pixels;
				alert("Brush size changed to "+brushFtInput.value+" ft.");
				//var slider = document.getElementById("size_input");
				//slider.value = parseInt(slider.value)-1;
				
				//displayTempGridFromSliderSize();
            });
			$('#btn-smaller-grid').click(function () {
				var slider = document.getElementById("grid_size_input");
				slider.value = parseInt(slider.value)-1;
				displayTempGridFromSliderSize();
            });
			
			$('#btn-bigger-grid').click(function () {
				var slider = document.getElementById("grid_size_input");
				slider.value = parseInt(slider.value)+1;
				displayTempGridFromSliderSize();
            });
			
			$('#btn-add-grid').click(function () {	
				renderGrid();
            });
			
			$('#btn-rm-grid').click(function () {
				
				removeGrid();
            });
					
			//size of grid changed, display the light blue candidate grid?
			gridSlider.onchange = function(e){		
				displayTempGridFromSliderSize();
			}
			
        return {
           findCellClicked: findCellClicked,
		   addGrid: addGrid,
		   highlightCell:highlightCell,
		   distanceFromLastClick: distanceFromLastClick,
		   clearPointClicked: clearPointClicked,
		   getPointClicked:getPointClicked,
		   addPointClicked:addPointClicked,
		   hasGrid:hasGrid,
		   setGridAdded:setGridAdded,
		   displayTempGrid:displayTempGridFromSliderSize,
		   handleGridDistance:handleGridDistance,
		   setCurrentSquareSize:setCurrentSquareSize,
		   getCurrentSquareSize:getCurrentSquareSize,
		   setSliderSize: setSliderSize,
		   renderGrid:renderGrid,
		   getAttributes:getAttributes,
		   addGridNoRender:addGridNoRender,
		   removeGridNoRender: removeGridNoRender,
		   hideGridButtons: hideGridButtons,
		   displayGridButtons: displayGridButtons
        }

			
			
    };
});
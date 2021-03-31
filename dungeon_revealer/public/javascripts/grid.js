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
						var xPos = col*squareSize;
						var yPos = row*squareSize;
						var xSize = squareSize
						var ySize = squareSize
						context.rect(xPos, yPos, xSize, ySize);//draw next cell
						
						
						//do we add a cell (first row or first column) label/index to this cell?
						if(row == 0){
							var label = ""+col;
							drawCellIndex(context,xPos,yPos,xSize,ySize,""+col);
						}else if(col == 0){
							var label = ""+row;
							drawCellIndex(context,xPos,yPos,xSize,ySize,""+row);
						}
						
						col++;
						
						
					}
					row++;
				}
				context.stroke();
				context.restore();
			},
			
			drawCellIndex=function(context,xPos,yPos,xSize,ySize,label){//draw the cell's index to grid
				context.save();//save the context  used to draw cells
				
				//font is half size of cell's width
				var fontSize = (1.0/2.0)* xSize;
				
				//center of cell print label
				var x = xPos + (xSize * (1/2)) - (xSize * (1/4)); //offset left, since large number will take up more space to the right
				var y = yPos + (ySize * (1/2))
				
				//size of font (minimum 12) and sacales with size of brush
				context.font = fontSize+"px Arial";
				
				//add black outline to label
				context.strokeStyle="black"
				context.lineWidth=fontSize * 0.15; //15% of font size is line width to scale with brush size
				//create outline
				context.strokeText(label,x,y);

				//now filll the outline
				context.fillStyle="white"
				context.fillText(label,x,y);
				
				context.restore();//restor context used to draw cell
				
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
					
					var playerHeightTxt = window.prompt("Please enter the player's height.","0");
					//do some error checking, make sure it's an int
					var playerHeightInt = parseInt(playerHeightTxt);
					console.log("playe rheigh 3d input: "+playerHeightInt)
					if(Number.isInteger(playerHeightInt) == false){
						playerHeightInt=0;
					}
					
					//compute the 3d distance given height (it's 2d if height = 0)
					var dist3D = Math.sqrt(dist*dist + playerHeightInt*playerHeightInt)
					
					//alert("Distance between these cells is  "+(Math.ceil(dist/5)*5)+" ft (5ft squares).");
					alert("Distance (2D): "+(Math.ceil(dist/5)*5)+" ("+dist.toFixed(2)+") ft \n"+
					"Distance (3D) with height "+playerHeightInt+" ft: "+(Math.ceil(dist3D/5)*5)+" ("+dist3D.toFixed(2)+") ft");
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
				
				var movingRowIx = pt1.row;
				var movingColIx = pt1.col;
				var distance = 0;
				var diagonalsTravelled = 0;
				//must consider D&D diagnal distances, where diagnal once is 5ft, twice is 10ft, third is 5ft, etc
				//slowly inch toward destination diagonally until we align vertically or horizontally
				while(movingRowIx != pt2.row && movingColIx != pt2.col){
					diagonalsTravelled++;
					
					//we doing a 2nd diagnoal to take extra movement?
					if(diagonalsTravelled % 2 ==0){
						distance = distance + 10;
					}else{
						distance = distance + 5;
					}
					
					//move row/col indices diagonally toward distination
					if(pt2.row < movingRowIx){
						//move up
						movingRowIx = movingRowIx -1
					}else{
						//move down
						movingRowIx = movingRowIx +1
					}
					
					if(pt2.col < movingColIx){
						//move left
						movingColIx = movingColIx -1
					}else{
						//move right
						movingColIx = movingColIx +1
					}
					
				}
				
				//at this point we reach a horizontal or vertical alignment
				//travel directly to destination and count normally
				while(movingRowIx != pt2.row ){
					distance = distance + 5;
					if(pt2.row < movingRowIx){
						//move up
						movingRowIx = movingRowIx -1
					}else{
						//move down
						movingRowIx = movingRowIx +1
					}
					
				}
				while(movingColIx != pt2.col){
					distance = distance + 5;
					if(pt2.col < movingColIx){
						//move left
						movingColIx = movingColIx -1
					}else{
						//move right
						movingColIx = movingColIx +1
					}
				}
			/*	var a = pt1.row - pt2.row;
				var b = pt1.col - pt2.col;

				//assuming 5ft squares
				a=a*5;
				b=b*5;
				//clear the last clicked point
				
				return Math.sqrt(a*a + b*b);*/
				return distance;
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
				disableResizeButtons();
			},
		disableResizeButtons = function(){
			var smallerBtn = document.getElementById('btn-smaller-grid');
			var largerBtn = document.getElementById('btn-bigger-grid');
			
			//rmBtn.disabled = true;
			//addBtn.disabled = true;
			smallerBtn.classList.add("disabled");
			largerBtn.classList.add("disabled");
		},
		enableResizeButtons = function(){
			var smallerBtn = document.getElementById('btn-smaller-grid');
			var largerBtn = document.getElementById('btn-bigger-grid');
			
			//rmBtn.disabled = false;
			//addBtn.disabled = false;
			smallerBtn.classList.remove("disabled");
			largerBtn.classList.remove("disabled");
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
			enableResizeButtons();
		}
		removeGrid = function(){
			removeGridNoRender();
			createRender();
			displayTempGridFromSliderSize();
		},
		
		feetToBrushSizePixels = function(feet, gridCellSize){
			if(isNaN(feet) || isNaN(gridCellSize)){
				console.log("cannot convert feet to pixels for feet: "+feet+" and grid cell size: "+gridCellSize);	
				return 0;
			}
			var numSquares = feet/5;
			return gridCellSize * numSquares;
		},
		hideGridButtons = function(){
			var btns = document.getElementById('grid-btns');
					btns.style='display: none';
		},
		
		displayGridButtons = function(){
			var btns = document.getElementById('grid-btns');
						btns.style='display: inline-block !important;';				
		},


		applyFeetToPixels = function(){
			
			var brushFtInput =  document.getElementById("brush_size_ft");
			var gridCellSize;
			
			//choose grid cell size from temporary grid size (blue grid) when no grid exists
			//otherwise, when grid exists choose cell size of the grid
			if(hasGrid()){
				//choose from added grid
				gridCellSize	= currentSquareSize;
			}else{
				//choose from tmp grid
				gridCellSize	= document.getElementById("grid_size_input").value;
			}
			
				
			//convert to pixels
			var pixels = feetToBrushSizePixels(brushFtInput.value,gridCellSize);
			
			//update brush size
			var slider = document.getElementById("size_input");
			slider.value = pixels;
			
			//hide the apply button
			var btns = document.getElementById('btn-grid-apply-feet-brush-size');
			btns.style='display: none';	
			
			//reset to placeholder text (erase entry)
			brushFtInput.value = '';
			
		},
		$('#btn-grid-apply-feet-brush-size').click(function () {
			applyFeetToPixels();
		});
			
			$('#brush_size_ft').change(function () {
				applyFeetToPixels();		
            });
			
			$('#brush_size_ft').focus(function () {
				//show the apply button
				var btns = document.getElementById('btn-grid-apply-feet-brush-size');
				btns.style='display: inline-block !important;';		
				
            });
			$('#btn-smaller-grid').click(function () {
				
				//don't change grid size slide when already added grid
				if(hasGrid()){
					return;
				}
				
				var slider = document.getElementById("grid_size_input");
				slider.value = parseInt(slider.value)-1;
				displayTempGridFromSliderSize();
            });
			
			$('#btn-bigger-grid').click(function () {
				//don't change grid size slide when already added grid
				if(hasGrid()){
					return;
				}
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
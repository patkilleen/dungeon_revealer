define(function () {
    console.log('brush.js starting');

    return function (context, settings) {
        console.log('creating indicator brush');

        if (!context || !settings) {
            throw new Error('Invalid args');
        }

        var brushTypes = ["player", "enemy", "target", "eraser"],
            currentBrushType = brushTypes[0],
			labelTexts = ["","","",""],
			labelSizes = [settings.defaultLineWidth,settings.defaultLineWidth,settings.defaultLineWidth,settings.defaultLineWidth],
			savedBrush = undefined,
			savedStrokeStyle =undefined,
			erasing = false,
            currentPattern = null,
            setBrushType = function (tmp) {
                currentBrushType = tmp;
				context.strokeStyle = getCurrent();
            },
            toggle = function () {
                if (currentBrushType === brushTypes[0]) {
                    console.log("enemy brush set");
                    currentBrushType = brushTypes[1];
					//document.getElementById('labelTextInput').value = labelTexts[1];
					//document.getElementById('size_input').value = labelSizes[1]; 
                } else if (currentBrushType === brushTypes[1]) {

                    console.log("target brush set");
                    currentBrushType = brushTypes[2];
					//document.getElementById('labelTextInput').value = labelTexts[2];
					//document.getElementById('size_input').value = labelSizes[2]; 
				} else if (currentBrushType === brushTypes[2]) {

                    console.log("eraser brush set");
                    currentBrushType = brushTypes[3];
					//document.getElementById('labelTextInput').value = labelTexts[3];
					//document.getElementById('size_input').value = labelSizes[3]; 
                } else if (currentBrushType === brushTypes[3]) {

                    console.log("player brush set");
                    currentBrushType = brushTypes[0];
					//document.getElementById('labelTextInput').value = labelTexts[0];
					//document.getElementById('size_input').value = labelSizes[0]; 
                } else {
                    console.log("nothing: ");
                    console.log(currentBrushType);
                }
                context.strokeStyle = getCurrent();
            },
			findIndexCurrentBrush = function(){
			var i = -1;
				
				//labelTexts
				if (currentBrushType === brushTypes[0]) {
					   i=0;
				} else if (currentBrushType === brushTypes[1]) {

				   i=1;
				} else if (currentBrushType === brushTypes[2]) {

					i=2;
				} else if (currentBrushType === brushTypes[3]) {

					i=3;
				} else {
				   //do nothing
				   
				}
				return i;
			},
			saveBrush = function (){
				if(!erasing){
					savedBrush = currentBrushType;
					//savedStrokeStyle = getCurrent();
					erasing=true;
				}
            },
			restoreBrush = function (){
				if(erasing){	    	
					currentBrushType = (savedBrush == undefined) ? currentBrushType : savedBrush;
					//context.strokeStyle = (savedStrokeStyle == undefined) ? context.strokeStyle : savedStrokeStyle;
					context.strokeStyle = getCurrent();
					erasing=false;
				}
            },
     	    setEraser = function () {
           
				console.log("eraser brush set");
				currentBrushType = brushTypes[3];
				context.strokeStyle = getCurrent();	
			},
            getPattern = function (brushType) {
                if (brushType === brushTypes[0]) {
                    context.globalCompositeOperation = 'source-over';
                    return 'rgba(' + settings.playerRGB + ',' + settings.indOpacity + ')';
                } else if (brushType === brushTypes[1]) {
                    context.globalCompositeOperation = 'source-over';
                    return 'rgba(' + settings.enemyRGB + ',' + settings.indOpacity + ')';
                }else if (brushType === brushTypes[2]) {
                    context.globalCompositeOperation = 'source-over';
                    return 'rgba(' + settings.targetRGB + ',' + settings.indOpacity + ')';
                }else if (brushType === brushTypes[3]) {
                    context.globalCompositeOperation = 'destination-out';
                    return 'rgba(' + settings.targetRGB + ',' + settings.indOpacity + ')';
                }
            },
            getCurrent = function () {
                return getPattern(currentBrushType);
            }
			getCurrentBrush = function () {
                return currentBrushType;
            }

        return {
            brushTypes: brushTypes,
            currentBrushType: currentBrushType,
            setBrushType: setBrushType,
			setEraser: setEraser,
			saveBrush: saveBrush,
			restoreBrush: restoreBrush,
            toggle: toggle,
            getCurrent: getCurrent,
            getPattern: getPattern,
			getCurrentBrush: getCurrentBrush
        }
    };
});

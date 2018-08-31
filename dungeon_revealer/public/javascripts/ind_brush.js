define(function () {
    console.log('brush.js starting');

    return function (context, settings) {
        console.log('creating indicator brush');

        if (!context || !settings) {
            throw new Error('Invalid args');
        }

        var brushTypes = ["player", "enemy", "target", "grid"],
            currentBrushType = brushTypes[0],
			labelTexts = ["","","",""],
			labelSizes = [settings.defaultLineWidth,settings.defaultLineWidth,settings.defaultLineWidth,settings.defaultLineWidth],
            currentPattern = null,
            setBrushType = function (newBrushName) {
				if(newBrushName === undefined){
					console.log("setBrush: invalid brush type, null.");
					return;
				}			
				if (newBrushName === "grid"){
					showGridButtons();
					hideLabelButtons();
				}else{
					hideGridButtons();
					showLabelButtons();
				}
				currentBrushType = newBrushName;
				context.strokeStyle = getCurrent();
				
            },
            toggle = function () {
				var i = 0;
				//find brush index, iterate each brush
				while(i < brushTypes.length){
					//found brush?
					if (currentBrushType == brushTypes[i]){
						break;
					}
					i++;
				}
				var nextBrush = (i+1) % brushTypes.length;
				 setBrushType(brushTypes[nextBrush]);
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
			hideGridButtons = function(){
				var btns = document.getElementById('grid-btns');
				btns.style='display: none';
			},
			showGridButtons = function(){
				var btns = document.getElementById('grid-btns');
				btns.style='display: inline-block !important;';
			},
			hideLabelButtons = function(){
				var btns = document.getElementById('label-btns');
				btns.style='display: none';
			},
			showLabelButtons = function(){
				var btns = document.getElementById('label-btns');
				btns.style='display: inline-block !important;';
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
            toggle: toggle,
            getCurrent: getCurrent,
            getPattern: getPattern,
			getCurrentBrush: getCurrentBrush
        }
    };
});
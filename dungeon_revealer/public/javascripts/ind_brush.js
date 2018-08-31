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
            setBrushType = function (tmp) {
                currentBrushType = tmp;
				context.strokeStyle = getCurrent();
            },
            toggle = function () {
                if (currentBrushType === brushTypes[0]) {
                    currentBrushType = brushTypes[1];
					hideGridButtons();
					showLabelButtons();
                } else if (currentBrushType === brushTypes[1]) {
                    currentBrushType = brushTypes[2];
					hideGridButtons();
					showLabelButtons();
				} else if (currentBrushType === brushTypes[2]) {
                    currentBrushType = brushTypes[3];			
					showGridButtons();
					hideLabelButtons();
                } else if (currentBrushType === brushTypes[3]) {

                    currentBrushType = brushTypes[0];
					hideGridButtons();
					showLabelButtons();
                } else {
                    console.log("error toggling brush");
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
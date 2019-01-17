define(function () {
    console.log('labelHandler.js starting');

    return function () {
        console.log('creating labelHandler');

        var multiLabelCounter = 0,
            baseLabelText = "",
			enabled = false,
            reset = function () {
				multiLabelCounter=0;
				baseLabelText = "";
			},
			
			enable = function () {
				enabled = true;
			},
			
			disable = function () {
				enabled = false;
			},
			
			isEnabled = function () {
				return enabled;
			},
			
			parseLabel = function () {
				return baseLabelText + "." +multiLabelCounter;
			},
			
			nextLabel = function () {
				multiLabelCounter ++;
			},
			
			setBaseLabel = function (bLabel) {
				baseLabelText = bLabel;
			},
			
			multiLabelToggle = function (){
				console.log("multilabel clicked");
				reset();
				var btnDOM = document.getElementById('btn-toggle-multi-label');
				var labelTxtBoxDOM = document.getElementById('labelTextInput');
				//we enabling?
				if(!isEnabled()){
					//enabling
					
					baseLabelText = labelTxtBoxDOM.value;
					labelTxtBoxDOM.value = parseLabel();
					nextLabel();
					btnDOM.text = "Cancel"
				}else{
					btnDOM.text = "Add Multiple Labels"
				}
				
				enabled = ! enabled;
			}
        return {
            enable:enable,
            disable:disable,
			isEnabled:isEnabled,
			parseLabel: parseLabel,
			nextLabel: nextLabel,
			setBaseLabel: setBaseLabel,
			multiLabelToggle: multiLabelToggle
        }
    };
});
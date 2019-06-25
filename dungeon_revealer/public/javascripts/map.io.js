define(function () {
    console.log('map.io.js starting');

    return function () {
        console.log('creating map io object');

		var encoding = 'utf-8',
		save = function(outputFilePath,canvas,width,height){
		
		
		//var ctx = canvas.getContext('2d');
			var data = canvas.toDataURL('image/png');
			//var data = ctx.getImageData(0,0,width,height);
			saveByteArray([new Blob([JSON.stringify(data)])],outputFilePath);
			//saveByteArray(outputFilePath,ctx.getImageData(),outputFilePath);
			/*var blob = canvas.toBlob(function(blob) {
			  var newImg = document.createElement('img'),
				  url = URL.createObjectURL(blob);

			  newImg.onload = function() {
				// no longer need to read the blob so it's revoked
				URL.revokeObjectURL(url);
			  };

			  newImg.src = url;
			  saveByteArray(url,outputFilePath);
			});*/

		},

		load = function(inputFilePath,canvas,width,height){

      
		
			//var canvaData = freadFileSync(inputFilePath,encoding);
			var ctx = canvas.getContext('2d');
			
			//save ctx
			ctx.save()
			
			//now change the drawing type to 'copy' so new image replaces old canvas
			//see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
			//for globalCompostieOperation  types
			//ctx.globalCompostieOperation = 'destination-out';
			//ctx.globalCompostieOperation = 'copy';
			//ctx.globalCompostieOperation = 'source-over';
			ctx.globalCompostieOperation = 'copy';
			//ctx.putImageData(canvaData,0,0);
			
			var reader = new FileReader();
			
			  reader.onload = function(e) {
				  //the json string
				var contents = e.target.result;
				var dataUrl = JSON.parse(contents);
				//var urlCreator = window.URL || window.webkitURL;
				//var imageUrl = urlCreator.createObjectURL(contents);
				var img = new Image();
				img.onload = function() {
					ctx.drawImage(img,0,0,width,height);
				};
				img.src = dataUrl;						
			  };
			  reader.readAsText(inputFilePath);			
			  
			window.alert("Map Successfully loaded");
			ctx.restore();
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
				load: load,
				save: save
		}
    };
});


	
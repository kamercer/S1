$(function(){
    
    function init(){
        $("#file").change(function(){
            createImg();
        });   
    }
    
    function createImg(){
        var d = document.getElementById("file").files[0];
            
        var img = new Image();
           
        img.onload = function(e) {
            resize(img);
            decode();
        }
        img.src = window.URL.createObjectURL(d);
    }
        
    function resize(img){
        var canvas = document.getElementById("myCanvas");  
            
        var MAX_WIDTH = 800;
        var MAX_HEIGHT = 600;
        var width = img.width;
        var height = img.height;
            
        if (width > height) {
            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
        } else {
            if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
            }
        }
        canvas.width = width;
        canvas.height = height;
                
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
    }
        
    function decode(){
        var canvas = document.getElementById("myCanvas");
            
        var dataURL = canvas.toDataURL();
            
        qrcode.callback = function(value){
            console.log(value);
                
            var data = {};
            data.data = value;
                
            ajaxCall('log', 'POST', JSON.stringify(data), 'application/json', null);
        };
            
        qrcode.decode(dataURL);
    }
        
    var ajaxCall = function(url, type, data, cType,callbackSuccess){
        $.ajax({
            url: url,
            type: type,
            data : data,
            cache: false,
            contentType : cType,
            success: function(result){
                console.log(url + ' success');
                console.log(result);
                if (callbackSuccess != null){
                    callbackSuccess(result);
                }
            },
            error: function(data){
                console.log(url + " err: " + data);
            }
        });
    }
});
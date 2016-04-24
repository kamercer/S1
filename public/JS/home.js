$(function(){
    init();
    
    function init(){
        $("#uploadPic").click(function(){
            submitPic();
        });
    }
    
    function submitPic(){
        var data = new FormData();
        
        data.append('image', $("#profilePic")[0].files[0]);
        
        ajaxCall(window.location.href + ((window.location.href.endsWith('/')) ? 'changeProfilePic' : '/changeProfilePic'), 'POST', data, false, null); 
    }
    
    var ajaxCall = function(url, type, data, cType,callbackSuccess){
        $.ajax({
            url: url,
            type: type,
            data : data,
            contentType : cType,
            processData: false,
            success: function(result){
                console.log(url + ' success');
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
$(function(){
    
    init();
    
    function init(){
        $("#join").click(function(){
            var callback = function(result){
                location.reload();
            }
            
            ajaxCall(window.location.href + ((window.location.href.endsWith('/')) ? 'join' : '/join')  , 'Post', null, null, callback);
        });
        
        $("#submitEvent").click(function(){
           submitEvent();
        });
        
        $(".Events").click(function(){
            submitRSVP(this); 
        });
        
        $(".editEvent").click(function(){
           editEvent(this); 
        });
    }
    
    var submitEvent = function(){
        var data = {};
        data.name = $("#name").val();
        data.sDate = $("#sDate").val();
        data.eDate = $("#eDate").val();
        data.public = $("#public").prop("checked")
        
        ajaxCall(window.location.href + ((window.location.href.endsWith('/')) ? 'createEvent' : '/createEvent'), 'Post', JSON.stringify(data), 'application/json', null); 
    };
    
    var submitRSVP = function(event){
        var data = {};
        data.id = event.parentNode.id;
        
        ajaxCall(window.location.href + ((window.location.href.endsWith('/')) ? 'submitRSVP' : '/submitRSVP'), 'POST', JSON.stringify(data), 'application/json', null);
    }
    
    function editEvent(event){
        window.location.href = window.location.href + '/editEvent/' + event.parentNode.id;
    }
    
    var ajaxCall = function(url, type, data, cType,callbackSuccess){
        $.ajax({
            url: url,
            type: type,
            data : data,
            contentType : cType,
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
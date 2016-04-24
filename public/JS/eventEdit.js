$(function(){
    
    init();
    
    function init(){
        new QRCode(document.getElementById("qrcode"), $("#qrcode").attr("data-code"));
        
        $("#addUserRow").click(function(){
            addRow();
        });
        
        $(".editUser").click(function(event){
            editUser(event.target.parentElement.parentElement);
        });
    }
    
    function addRow(){
        
        var count = $("table tr").length;    
        
        $("table tr:last").after('<tr class="addedUser"><td>' + count + '</td><td><input></td><td><input class="DateInput"</td><td><input class="DateInput"</td><td><input placeholder="email"></td><td><button class="upload">upload</button></td></tr>');
        
                
        $(".upload").click(function(event){
            checkInputAndUpload(event);    
        });
    }
    
    function checkInputAndUpload(event){
        
        var data = {};
        data.inputs = [];
        
        for(var i = 0; i < event.target.parentElement.parentElement.getElementsByTagName("input").length; i++){
            data.inputs.push(event.target.parentElement.parentElement.getElementsByTagName("input")[i].value);
        }
        
        ajaxCall(window.location.href + (window.location.href.endsWith('/') ? 'submitUnregisteredUser' : '/submitUnregisteredUser'), 'Post', JSON.stringify(data), 'application/json', finalizeRow, event.target.parentElement.parentElement);
    }
    
    function finalizeRow(result, row){
        
        $(row)[0].setAttribute("id", result[4]);
        
        for(var i = 1; i < row.getElementsByTagName("td").length-1; i++){
            row.getElementsByTagName("td")[i].innerHTML = result[i-1];
        }
        
        row.removeChild(row.children[row.children.length-1]);
        
        
        $(row).children("td:last")[0].innerHTML = '<button class="editUser">Edit User</button>';
        
        $(".editUser").click(function(event){
            editUser(event.target.parentElement.parentElement);
        });
    }
    
    function editUser(row){
        //start at 2 to skip # and name
        for(var i = 2; i < row.getElementsByTagName("td").length-1; i++){
            row.getElementsByTagName("td")[i].innerHTML = '<input value="' + row.getElementsByTagName("td")[i].innerHTML + '">';
        }
        
        $(row).children("td:last")[0].innerHTML = '<button class="editInProgress">Update</button>';
        
        $(".editInProgress").click(function(event){
            var data = {};
            
            data.id = event.target.parentElement.parentElement.attributes.id.value;
            data.inputs = [];
            
            for(var i = 0; i < event.target.parentElement.parentElement.getElementsByTagName("input").length; i++){
                data.inputs.push(event.target.parentElement.parentElement.getElementsByTagName("input")[i].value);
            }
            
            ajaxCall(window.location.href + (window.location.href.endsWith('/') ? 'updateUser' : '/updateUser'), 'POST', JSON.stringify(data), 'application/json', finalizeEditRow, row);
        });
    }
    
    function finalizeEditRow(result, row){
        
        for(var i = 2; i < row.getElementsByTagName("td").length-1; i++){
            row.getElementsByTagName("td")[i].innerHTML = result[i-2];
        }
        
        $(row).children("td:last")[0].innerHTML = '<button class="editUser">Edit User</button>';
        
        $(".editUser").click(function(event){
            editUser(event.target.parentElement.parentElement);
        });
    }
    
    function ajaxCall(url, type, data, cType,callbackSuccess, addData){
        $.ajax({
            url: url,
            type: type,
            data : data,
            cache: false,
            contentType : cType,
            success: function(result){
                console.log(url + ' success');
                if (callbackSuccess != null){
                    callbackSuccess(result, addData);
                }
            },
            error: function(data){
                console.log(url + " err: " + data);
            }
        });
    }
});
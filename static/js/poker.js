var socket = io.connect('/');
const Especial = {
    Infinito : 101,
    Question : 102,
    Time : 103
};
  
socket.on('connect',function(){
    updateFooter('Conexão OK');
      
}).on('wrong', function(){
    $('#modalLogin .modal-header h4').html("Falha");
    $('#modalLogin .modal-body p').html("Sala já existe com senha diferente!");
    $('#modalLogin .modal-footer').removeClass('hidden');
      
}).on('welcome', function(data){
    $('#modalLogin .modal-header h4').html("Bem vindo!");
    $('#modalLogin .modal-body p').html("Sala criada");
      
}).on('user-in', function(data){
    $('#modalLogin').modal('hide');
    toast(data.user + ' entrou na sala');
    updateFooter('Usuários: ' + data.size);
    $("#login").addClass('hidden');
    $("#cards").removeClass('hidden');
      
}).on('user-out', function(data){
    toast(data.user + ' saiu da sala');
    updateFooter('Usuários: ' + data.size);
    
    if(data.size == 1){
        $('#modalLogin').modal('show');
        $('#modalLogin modal-body p').html('Você está sozinho aqui');
    }
      
}).on('finish', function(data){
    var min = 100, 
        max = -1, 
        soma = 0, 
        itens = 0, 
        valores = {};
    
    for(var user in data){
        itens++;
        var valor = parseFloat(data[user]);
        console.log(user+" escolheu "+valor);
        if(valor <= 100){
            min = Math.min(min, valor);
            max = Math.max(max, valor);
            soma += valor;
        }
        
        if(!valores[valor]){
            valores[valor] = [];
        }
        valores[valor].push(user);
    }

    var html = "";
    if(valores[Especial.Time]){
        html = '<span class="btn btn-primary glyphicon glyphicon-time"></span> '+valores[Especial.Time].join(", ")+"<br />";
        
    } else if(valores[Especial.Question]){
        html = '<span class="btn btn-primary">?</span> '+valores[Especial.Question].join(", ")+"<br />";
        
    } else if(valores[Especial.Infinito]){
        html = '<span class="btn btn-primary">&#x221e</span> '+valores[Especial.Infinito].join(", ")+"<br />";
        
    } else if(max == min){
        html = 'Todos iguais: <span class="btn btn-success">'+max+'</span>';
        
    } else {
        console.log(valores);
        var strMin = (min == 0.5) ? '&#0189' : min;
        var strMax = (max == 0.5) ? '&#0189' : max;
        
        html += '<span class="glyphicon glyphicon-hand-up"></span> <span class="btn btn-primary">'+strMax+"</span> "+valores[max].join(", ")+"<br />";
        html += '<span class="glyphicon glyphicon-hand-right"></span> <span class="btn btn-primary">'+(soma/itens).toFixed(2)+'</span><br />';
        html += '<span class="glyphicon glyphicon-hand-down"></span> <span class="btn btn-primary">'+strMin+"</span> "+valores[min].join(", ");
    }
      
    $('#wait .modal-header h4').html("Resultado");
    $('#wait .modal-body p').html( html );
    $('#wait .modal-footer button').addClass('btn-success').html('Ok');
      
});
  
  
$(function(){
    $("#login form").on('submit', function(e){
        e.preventDefault();
        
        if($("#user").val() == ""){
            return false;
        }
     
        socket.emit('room', {
            room: $("#room").val(), 
            pass: $("#pass").val(),
            user:$("#user").val()
        });
    
        if('localStorage' in window){
            localStorage.setItem('user', $("#user").val());
            localStorage.setItem('room', $("#room").val());
        }
        
        $("#modalLogin").modal('show');
    
    }).find("[type=submit]").removeAttr('disabled');
    
    $("#cards .row button").on('click', function(){
        var valor = $(this).data('value');
        socket.emit('card', {
            value: valor
        });
        
        $('#wait').modal('show');
        $('#wait .modal-header h4').html("Aguardando outros");
        
        if(valor == 0.5){ valor = '&#0189'; }
        if(valor == Especial.Infinito){ valor = '&#x221e'; }
        if(valor == Especial.Question){ valor = '?'; }
        if(valor == Especial.Time){ valor = '<span class="glyphicon glyphicon-time"></span>'; }
        
        $('#wait .modal-body p').html( 'Você escolheu: <span class="btn btn-primary">'+valor+'</span>' );
        $('#wait .modal-footer button').removeClass('btn-success').html('Trocar');
        
    });
    
    $("#wait").on('hide.bs.modal', function(){
        socket.emit('remove-card');
    });
    
    if('localStorage' in window){
        $("#user").val( localStorage.getItem('user') );
        $("#room").val( localStorage.getItem('room') );
    }
  
});

function toast(){}

function updateFooter(msg){
    $("#footer p").removeClass("hidden").html(msg);
}

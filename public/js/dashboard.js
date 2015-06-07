$(document).ready(function(){

	$('button[name="b2c"]').click(function(event){
		getBalance();
	})

	$('button[name="c2c"]').click(function(event){
		sendMoney();
	})

	function getBalance(){
		var data = {};
		data.amount = $('input[name="amount"]').val();
		data.details = $('input[name="details"]').val();
		
		$('.error').addClass('hidden');
		$('.error').text('');

		$.post("/get/b2c",data,function( data ) {
			if(data.err){
				$('.error').removeClass('hidden');
				$('.error').text(data.msg);
			}else{
				window.location = "";
			}
		},'json');
	}					

	function sendMoney(){
		var data = {};
		data.amount = $('input[name="amount"]').val();
		data.recieverUid = $('input[name="uid"]').val();
		data.recieverName = $('input[name="username"]').val();
		
		$('.error').addClass('hidden');
		$('.error').text('');

		$.post("/send/c2c",data,function( data ) {
			if(data.err){
				$('.error').removeClass('hidden');
				$('.error').text(data.msg);
			}else{
				window.location = "";
			}
		},'json');
	}					



});
$(document).ready(function(){

$('button[name="create"]').click(function(event){
	sendAuthRequest();
})

$('button[name="login"]').click(function(event){
	sendLoginRequest();
})


function sendLoginRequest(){
	var data = {};
	data.uid = $('input[name="uid"]').val();
	data.username = $('input[name="username"]').val();
	data.password = $('input[name="password"]').val();
	
	$('.error').addClass('hidden');
	$('.error').text('');

	$.post( "login",data,function( data ) {
		if(data.err){
			$('.error').removeClass('hidden');
			$('.error').text(data.msg);
		}else{
			window.location = "dashboard";
		}
	},'json');





}






function completeProfile(){
	var data = {};
	data.uid = $('input[name="uid"]').val();
	data.username = $('input[name="username"]').val();
	data.password = $('input[name="password"]').val();
	data.name = $('input[name="name"]').val();
	data.email = $('input[name="email"]').val();
	data.tel = $('input[name="tel"]').val();
	data.uid = $('input[name="uid"]').val();

	$('.error').addClass('hidden');
	$('.error').text('');

	$.post( "completeProfile",data,function( data ) {
		if(data.err){
			$('.error').removeClass('hidden');
			$('.error').text(data.msg);
		}else{
			window.location = "login";
		}
	},'json');


}

function sendAuthRequest(){
	var data = {};
	data.uid = $('input[name="uid"]').val();
	data.otp = $('input[name="otp"]').val();

	$('.error').addClass('hidden');
	$('.error').text('');
	
	$.post( "auth",data,function( data ) {
		if(data.err){
			$('.error').removeClass('hidden');
			$('.error').text(data.msg);
		}else{
			if($('#otp-group').hasClass('hidden')){
				$('#otp-group').removeClass('hidden');
			}else{
				$('#otp-group').addClass('hidden');
				$('#username-group').removeClass('hidden');
				$('#password-group').removeClass('hidden');
				$('#name-group').removeClass('hidden');
				$('#email-group').removeClass('hidden');
				$('#tel-group').removeClass('hidden');

				$('button[name="create"]').text('Complete your profile');
				$('button[name="create"]').attr('name','profile');
				$('button[name="profile"]').click(function(){
					completeProfile();
				})
			}
		}
	},'json');

}

})


var request = require('request'); 
var urls = {
    'otp'   :   'https://ac.khoslalabs.com/hackgate/hackathon/otp',
    'auth'  :   'https://ac.khoslalabs.com/hackgate/hackathon/auth/raw',
}


function sendRequest(uidcode,otpcode,cb){
    var uid = uidcode ;
    var otp = otpcode || '';
    var url = urls.auth;
    var returnData = {};
    var requestBody = {'aadhaar-id':uid,
                        'location':{
                            'type':'pincode',
                            'pincode':'201304'
                        }
                    } ;

    if(otp === ''){
        url = urls.otp;
        requestBody.channel = 'EMAIL_AND_SMS';
    }else{
        requestBody['modality'] = 'otp';
        requestBody['otp'] = otp;
        requestBody['device-id'] = 'public';
        requestBody['certificate-type'] = 'preprod';
    }
    request.post({
        uri: url,
        headers :{
           'Content-Type': 'text/json' 
        },
        body: JSON.stringify(requestBody)},
        function (err,res,body){
            if(err){
                returnData.err = true;
            }
            else{    
                var bodyJSON = JSON.parse(body);
                returnData.err = false;
                returnData.status = bodyJSON.success;
                returnData.statusCode = bodyJSON['aadhaar-status-code'];
                console.log(bodyJSON);
            }
            console.log(returnData);
            cb(returnData);
        });
}

module.exports = sendRequest;

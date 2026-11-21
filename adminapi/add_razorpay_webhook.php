<?php
include("../../connect.php");
date_default_timezone_set('Asia/Calcutta');

$clientIP = $_SERVER['REMOTE_ADDR'];
$apiUrl = "http://ipinfo.io/{$clientIP}/json";
$response = file_get_contents($apiUrl);
$details = json_decode($response, true);
if($details['country']=='AE')
	date_default_timezone_set('Asia/Dubai');


$cdate  = date("Y-m-d");
$cdatetime  = date("Y-m-d")." ".date("H:i:s");
$json = file_get_contents('php://input');
$arr = json_decode($json);

 	$payId = $arr->payload->payment->entity->id;
 	$orderId = $arr->payload->payment->entity->order_id;
 	$status = $arr->payload->payment->entity->status;
 	$amount = $arr->payload->payment->entity->amount;
 	$failure_reason = $arr->payload->payment->entity->error_reason;

 	if($status == 'failed'){
 		$status = 'Failed';
 	}else if($status == 'captured'){
 		$status = 'Successful';
 	}else{
 		$status = 'Pending';
 	}

 	$dataa = mysqli_query($con,"SELECT * from tbl_webhook_razorpay_txn where order_id = '$orderId' and status = 'Pending'");
 	$mysql =  mysqli_fetch_assoc($dataa);
 	$amntt = $mysql['amount'];
 	$amntt = doubleval($amntt)*100;

 	if(mysqli_num_rows($dataa)>0){

 		if(doubleval($amount) == $amntt){
			
 			$dataa = mysqli_query($con,"UPDATE tbl_webhook_razorpay_txn set status = '$status', txn_id = '$payId',failure_reason= '$failure_reason' where order_id = '$orderId' and status = 'Pending'");

 		}
	}
http_response_code(200);
?>
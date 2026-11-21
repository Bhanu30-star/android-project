<?php
$response = array();
include("../../connect.php");
if(isset($_POST['key_uid']) && isset($_POST['total_order']) && isset($_POST['distributor_id']))
{  
	$dis_id = $_POST['distributor_id'];
	$client1 = $_POST['key_uid'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$toder = $_POST['total_order'];
	$json_a=json_decode($toder, true);     
	foreach ($json_a as $person_a)
	{
		$msgid=$person_a['message_id'];
		$txn_date=$person_a['txn_date'];
		$txn_time=$person_a['txn_time'];
		$ordquantiy=$person_a['quantity'];
		$amount=$person_a['amount'];
		$partyphone=$person_a['retailer_phone'];	
		$price_p=round($amount/$ordquantiy,5);
		$insert = mysqli_query($con, "INSERT INTO `tbl_autofill_retailer_message_detail`(`distributor_id`, `user_id`, `operator_detail`, `transaction_id`, `amount`, `product_price_val`, `party_phone`, `quantity`, `message_date`, `message_time`, `insert_date`, `insert_time`, `status`, `txn_status`, `upload_by`) VALUES ('$dis_id','$client1', 'Digital Transfer','$msgid','$amount','$price_p','$partyphone','$ordquantiy','$txn_date','$txn_time', '$da','$scro','Pending','Pending','Admin App')");				
	}
	$response['success']=1;
	$response['details']="Message transaction detail successfully upload for sale process!!";
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 
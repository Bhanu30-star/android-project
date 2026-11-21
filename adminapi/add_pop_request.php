<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['totalamt']) && isset($_POST['payment_mode']) && isset($_POST['bank_wallet_name']) && isset($_POST['payment_txn_id']) && isset($_POST['cheque_txn_date']) && isset($_POST['payment_type']) && isset($_POST['total_order']))
{
	$temp_id=1;
	$ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$pp_id1=$_POST['party_id'];
	$pp_totalamt=$_POST['totalamt'];
	$pay_mode=$_POST['payment_mode'];
	$wallet_nam=$_POST['bank_wallet_name'];
	$pay_txn_id=$_POST['payment_txn_id'];
	$chk_txn_date=$_POST['cheque_txn_date'];
	$pay_type=$_POST['payment_type'];
	$toder = $_POST['total_order'];
	$po_id="PO-".strtoupper(uniqid());
		
	$query = mysqli_query($con,"INSERT INTO `tbl_distributor_pop_request`(`distributor_id`, `party_id`, `po_orderid`, `transaction_date`, `transaction_time`, `total_amount`, `payment_mode`, `bank_wallet_name`, `payment_txn_id`, `cheque_txn_date`, `payment_type`, `order_status`) VALUES	('$ver','$pp_id1','$po_id','$cdate','$scri','$pp_totalamt', '$pay_mode', '$wallet_nam', '$pay_txn_id', '$chk_txn_date', '$pay_type', 'Pending')");

	$re = mysqli_insert_id($con);
	$json_a=json_decode($toder, true);     
	foreach ($json_a as $person_a)
	{
		$proid=$person_a['pid'];
		$pquanity=$person_a['quantity'];
		$proprice=$person_a['pro_price'];
		$query2=mysqli_query($con,"INSERT INTO `tbl_distributor_pop_request_detail`(`request_id`, `product_id`, `request_qty`, `request_price`) VALUES ('$re','$proid','$pquanity','$proprice')");
	}
				
	if($query2)
	{
		$response['success']='1';
		$response['details']="Request successfully sent!";
	}
	else
	{
		$response['success']=0;
		$response['details']="Insertion Error...!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>